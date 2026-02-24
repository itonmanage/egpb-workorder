import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/admin/backup - Export all data as JSON
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getSession(token);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'full'; // 'full' | 'settings' | 'tickets'

        const backup: Record<string, unknown> = {
            exportedAt: new Date().toISOString(),
            exportedBy: user.username,
            version: '1.0',
        };

        if (type === 'full' || type === 'settings') {
            backup.systemOptions = await prisma.systemOption.findMany({
                orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
            });
        }

        if (type === 'full' || type === 'tickets') {
            backup.tickets = await prisma.ticket.findMany({
                include: { images: true, comments: true },
                orderBy: { createdAt: 'asc' },
            });
            backup.engineerTickets = await prisma.engineerTicket.findMany({
                include: { images: true, comments: true },
                orderBy: { createdAt: 'asc' },
            });
        }

        const json = JSON.stringify(backup, null, 2);
        const filename = `egpb-backup-${type}-${new Date().toISOString().split('T')[0]}.json`;

        return new NextResponse(json, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('[GET /api/admin/backup]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/backup - Import settings from JSON backup
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getSession(token);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { systemOptions } = body;

        if (!systemOptions || !Array.isArray(systemOptions)) {
            return NextResponse.json(
                { error: 'Invalid backup file: missing systemOptions array' },
                { status: 400 }
            );
        }

        let imported = 0;
        let skipped = 0;

        for (const opt of systemOptions) {
            if (!opt.category || !opt.value || !opt.label) {
                skipped++;
                continue;
            }
            try {
                await prisma.systemOption.upsert({
                    where: { category_value: { category: opt.category, value: opt.value } },
                    create: {
                        category: opt.category,
                        value: opt.value,
                        label: opt.label,
                        sortOrder: opt.sortOrder ?? 0,
                        isActive: opt.isActive ?? true,
                    },
                    update: {
                        label: opt.label,
                        sortOrder: opt.sortOrder ?? 0,
                        isActive: opt.isActive ?? true,
                    },
                });
                imported++;
            } catch {
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Imported ${imported} options, skipped ${skipped}`,
            imported,
            skipped,
        });
    } catch (error) {
        console.error('[POST /api/admin/backup]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
