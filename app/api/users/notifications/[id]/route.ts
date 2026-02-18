import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH /api/users/notifications/[id] - Mark notification as read
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getSession(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        // Verify notification belongs to user
        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification || notification.userId !== user.id) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        // Mark as read
        const updated = await prisma.notification.update({
            where: { id },
            data: { read: true }
        });

        return NextResponse.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/users/notifications/[id] - Delete notification
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getSession(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        // Verify notification belongs to user
        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification || notification.userId !== user.id) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        await prisma.notification.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
