import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * Parse a SQL dump into individual executable statements.
 * Handles:
 *  - Single-line comments (--)
 *  - Multi-line block comments (/* ... *\/)
 *  - Dollar-quoted strings ($$...$$) common in PostgreSQL
 *  - Standard quoted strings (' and ")
 *  - Statement separator: semicolon outside of any quote/comment
 */
function parseSqlStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = '';
    let i = 0;

    // States
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inDollarQuote = false;
    let dollarTag = '';
    let inLineComment = false;
    let inBlockComment = false;

    while (i < sql.length) {
        const ch = sql[i];
        const next = sql[i + 1] ?? '';

        // -- Line comment
        if (!inSingleQuote && !inDoubleQuote && !inDollarQuote && !inBlockComment && ch === '-' && next === '-') {
            inLineComment = true;
            i++;
            continue;
        }
        if (inLineComment) {
            if (ch === '\n') inLineComment = false;
            i++;
            continue;
        }

        // /* Block comment */
        if (!inSingleQuote && !inDoubleQuote && !inDollarQuote && ch === '/' && next === '*') {
            inBlockComment = true;
            i += 2;
            continue;
        }
        if (inBlockComment) {
            if (ch === '*' && next === '/') {
                inBlockComment = false;
                i += 2;
            } else {
                i++;
            }
            continue;
        }

        // Dollar-quoted string $tag$...$tag$
        if (!inSingleQuote && !inDoubleQuote && ch === '$') {
            if (inDollarQuote) {
                // Check if this is the closing tag
                const closing = dollarTag;
                if (sql.startsWith(closing, i)) {
                    current += sql.slice(i, i + closing.length);
                    i += closing.length;
                    inDollarQuote = false;
                    dollarTag = '';
                    continue;
                }
            } else {
                // Try to detect opening $tag$
                const match = sql.slice(i).match(/^\$([A-Za-z_0-9]*)\$/);
                if (match) {
                    inDollarQuote = true;
                    dollarTag = match[0];
                    current += match[0];
                    i += match[0].length;
                    continue;
                }
            }
        }

        // Single-quoted string
        if (!inDoubleQuote && !inDollarQuote && ch === "'") {
            inSingleQuote = !inSingleQuote;
            current += ch;
            i++;
            continue;
        }

        // Double-quoted identifier
        if (!inSingleQuote && !inDollarQuote && ch === '"') {
            inDoubleQuote = !inDoubleQuote;
            current += ch;
            i++;
            continue;
        }

        // Statement terminator
        if (!inSingleQuote && !inDoubleQuote && !inDollarQuote && ch === ';') {
            const stmt = current.trim();
            if (stmt.length > 0) {
                statements.push(stmt);
            }
            current = '';
            i++;
            continue;
        }

        current += ch;
        i++;
    }

    // Remaining content without semicolon
    const last = current.trim();
    if (last.length > 0) {
        statements.push(last);
    }

    return statements;
}

// Allowed SQL statement prefixes (whitelist for safety)
const ALLOWED_PREFIXES = [
    'insert',
    'update',
    'delete',
    'create table',
    'create index',
    'alter table',
    'truncate',
    'set',
    'select', // allow selects (no-op but harmless)
    'begin',
    'commit',
    'rollback',
    'do',
    'copy', // PostgreSQL COPY ... FROM STDIN
];

function isAllowedStatement(stmt: string): boolean {
    const lower = stmt.toLowerCase().trimStart();
    return ALLOWED_PREFIXES.some(prefix => lower.startsWith(prefix));
}

// POST /api/admin/backup/import-sql
// Body: multipart/form-data with field "file" containing the .sql file
// OR: text/plain with raw SQL content
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getSession(token);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let sqlContent = '';

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;
            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }
            if (!file.name.endsWith('.sql')) {
                return NextResponse.json({ error: 'Only .sql files are accepted' }, { status: 400 });
            }
            sqlContent = await file.text();
        } else {
            // text/plain or application/sql
            sqlContent = await request.text();
        }

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
                    statement: stmt.slice(0, 100) + (stmt.length > 100 ? '...' : ''),
                    error: errMsg,
                });
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Executed ${executed} statements, skipped ${skipped}`,
            total: statements.length,
            executed,
            skipped,
            errors: errors.slice(0, 20), // return first 20 errors max
        });
    } catch (error) {
        console.error('[POST /api/admin/backup/import-sql]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
