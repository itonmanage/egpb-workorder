import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

// PostgreSQL binary path (detected from service config)
const PG_BIN = process.env.PG_BIN_PATH || 'D:\\postgres\\bin';
const PG_RESTORE = join(PG_BIN, 'pg_restore.exe');

/**
 * Detect if buffer is a PostgreSQL custom-format dump (starts with PGDMP magic bytes)
 */
function isPgCustomFormat(buffer: Buffer): boolean {
    // Custom format dumps start with "PGDMP" magic string
    return buffer.length > 5 && buffer.slice(0, 5).toString('ascii') === 'PGDMP';
}

/**
 * Parse DATABASE_URL into connection params
 * Format: postgresql://user:password@host:port/dbname
 */
function parseDbUrl(url: string) {
    try {
        const u = new URL(url);
        return {
            host: u.hostname || 'localhost',
            port: u.port || '5432',
            user: u.username,
            password: decodeURIComponent(u.password),
            dbname: u.pathname.replace(/^\//, '').split('?')[0],
        };
    } catch {
        return null;
    }
}

/**
 * Restore a pg_dump custom-format file using pg_restore
 */
async function restoreWithPgRestore(
    filePath: string,
    mode: 'full' | 'data-only'
): Promise<{ success: boolean; output: string; error: string }> {
    const dbUrl = process.env.DATABASE_URL || '';
    const conn = parseDbUrl(dbUrl);

    if (!conn) {
        return { success: false, output: '', error: 'Cannot parse DATABASE_URL' };
    }

    const args = [
        `"${PG_RESTORE}"`,
        `-h ${conn.host}`,
        `-p ${conn.port}`,
        `-U ${conn.user}`,
        `-d ${conn.dbname}`,
        '--no-owner',
        '--no-privileges',
        '--no-acl',
        '--no-comments',
        mode === 'data-only' ? '--data-only' : '--clean --if-exists',
        '-v',
        `"${filePath}"`,
    ];

    const cmd = args.join(' ');

    try {
        const { stdout, stderr } = await execAsync(cmd, {
            env: {
                ...process.env,
                PGPASSWORD: conn.password,
            },
            maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        });
        return { success: true, output: stdout || stderr, error: '' };
    } catch (err) {
        // pg_restore exits non-zero on warnings too, check if it's just warnings
        const execErr = err as { stdout?: string; stderr?: string; code?: number };
        const stderr = execErr.stderr || '';
        const stdout = execErr.stdout || '';

        // pg_restore warnings are not fatal errors
        if (stderr.includes('WARNING') && !stderr.includes('ERROR')) {
            return { success: true, output: stdout + '\n' + stderr, error: '' };
        }

        return {
            success: false,
            output: stdout,
            error: stderr || String(err),
        };
    }
}

/**
 * Parse a plain-text SQL dump into individual executable statements.
 */
function parseSqlStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = '';
    let i = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inDollarQuote = false;
    let dollarTag = '';
    let inLineComment = false;
    let inBlockComment = false;

    while (i < sql.length) {
        const ch = sql[i];
        const next = sql[i + 1] ?? '';

        if (!inSingleQuote && !inDoubleQuote && !inDollarQuote && !inBlockComment && ch === '-' && next === '-') {
            inLineComment = true; i++; continue;
        }
        if (inLineComment) {
            if (ch === '\n') inLineComment = false;
            i++; continue;
        }
        if (!inSingleQuote && !inDoubleQuote && !inDollarQuote && ch === '/' && next === '*') {
            inBlockComment = true; i += 2; continue;
        }
        if (inBlockComment) {
            if (ch === '*' && next === '/') { inBlockComment = false; i += 2; } else i++;
            continue;
        }
        if (!inSingleQuote && !inDoubleQuote && ch === '$') {
            if (inDollarQuote) {
                if (sql.startsWith(dollarTag, i)) {
                    current += sql.slice(i, i + dollarTag.length);
                    i += dollarTag.length; inDollarQuote = false; dollarTag = ''; continue;
                }
            } else {
                const match = sql.slice(i).match(/^\$([A-Za-z_0-9]*)\$/);
                if (match) {
                    inDollarQuote = true; dollarTag = match[0];
                    current += match[0]; i += match[0].length; continue;
                }
            }
        }
        if (!inDoubleQuote && !inDollarQuote && ch === "'") {
            inSingleQuote = !inSingleQuote; current += ch; i++; continue;
        }
        if (!inSingleQuote && !inDollarQuote && ch === '"') {
            inDoubleQuote = !inDoubleQuote; current += ch; i++; continue;
        }
        if (!inSingleQuote && !inDoubleQuote && !inDollarQuote && ch === ';') {
            const stmt = current.trim();
            if (stmt.length > 0) statements.push(stmt);
            current = ''; i++; continue;
        }
        current += ch; i++;
    }
    const last = current.trim();
    if (last.length > 0) statements.push(last);
    return statements;
}

const ALLOWED_PREFIXES = [
    'insert', 'update', 'delete',
    'create table', 'create index', 'create type', 'create sequence', 'create unique index',
    'alter table', 'alter sequence', 'alter type',
    'truncate', 'set', 'select', 'begin', 'commit', 'rollback', 'do',
    'copy', 'grant', 'comment', 'create extension',
];

function isAllowedStatement(stmt: string): boolean {
    const lower = stmt.toLowerCase().trimStart();
    return ALLOWED_PREFIXES.some(prefix => lower.startsWith(prefix));
}

// POST /api/admin/backup/import-sql
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getSession(token);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const contentType = request.headers.get('content-type') || '';

        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const mode = (formData.get('mode') as string) || 'data-only'; // 'data-only' | 'full'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        if (!file.name.endsWith('.sql')) {
            return NextResponse.json({ error: 'Only .sql files are accepted' }, { status: 400 });
        }

        // Read file as buffer to detect format
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length === 0) {
            return NextResponse.json({ error: 'File is empty' }, { status: 400 });
        }

        // --- PostgreSQL Custom Format (PGDMP) ---
        if (isPgCustomFormat(buffer)) {
            // Save to temp file, then run pg_restore
            let tmpDir: string | null = null;
            let tmpFile: string | null = null;

            try {
                tmpDir = await mkdtemp(join(tmpdir(), 'pgbackup-'));
                tmpFile = join(tmpDir, 'restore.sql');
                await writeFile(tmpFile, buffer);

                const result = await restoreWithPgRestore(
                    tmpFile,
                    mode as 'full' | 'data-only'
                );

                if (!result.success) {
                    // Try to extract useful error lines
                    const errorLines = result.error
                        .split('\n')
                        .filter(l => l.includes('ERROR') || l.includes('error'))
                        .slice(0, 10)
                        .join('\n');

                    return NextResponse.json({
                        success: false,
                        error: errorLines || result.error.slice(0, 500),
                        format: 'custom',
                    }, { status: 500 });
                }

                // Count restored lines from verbose output
                const restoredCount = (result.output.match(/restoring data for table/g) || []).length;
                const tableCount = (result.output.match(/processing item/g) || []).length;

                return NextResponse.json({
                    success: true,
                    message: `pg_restore สำเร็จ — นำเข้าข้อมูล ${restoredCount} ตาราง (${tableCount} items)`,
                    format: 'custom',
                    mode,
                    output: result.output.split('\n').slice(-20).join('\n'), // last 20 lines
                });
            } finally {
                // Cleanup temp file
                if (tmpFile) await unlink(tmpFile).catch(() => null);
            }
        }

        // --- Plain Text SQL ---
        const sqlContent = buffer.toString('utf-8');

        if (!sqlContent.trim()) {
            return NextResponse.json({ error: 'SQL file is empty' }, { status: 400 });
        }

        const statements = parseSqlStatements(sqlContent);

        if (statements.length === 0) {
            return NextResponse.json({ error: 'No SQL statements found in file' }, { status: 400 });
        }

        let executed = 0;
        let skipped = 0;
        const errors: { statement: string; error: string }[] = [];

        for (const stmt of statements) {
            if (!isAllowedStatement(stmt)) {
                skipped++;
                continue;
            }
            try {
                await prisma.$executeRawUnsafe(stmt);
                executed++;
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                errors.push({
                    statement: stmt.slice(0, 120) + (stmt.length > 120 ? '...' : ''),
                    error: errMsg,
                });
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Executed ${executed} statements, skipped ${skipped}`,
            format: 'plain',
            total: statements.length,
            executed,
            skipped,
            errors: errors.slice(0, 20),
        });
    } catch (error) {
        console.error('[POST /api/admin/backup/import-sql]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
