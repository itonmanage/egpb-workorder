import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PUT /api/admin/settings/options/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getSession(token);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { label, sortOrder, isActive } = body;

        const existing = await prisma.systemOption.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Option not found' }, { status: 404 });
        }

        const updated = await prisma.systemOption.update({
            where: { id },
            data: {
                ...(label !== undefined && { label }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('[PUT /api/admin/settings/options/[id]]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/settings/options/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getSession(token);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        const existing = await prisma.systemOption.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Option not found' }, { status: 404 });
        }

        await prisma.systemOption.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/admin/settings/options/[id]]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
