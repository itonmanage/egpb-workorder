import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/users/notifications - Get user notifications
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getSession(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        const where = unreadOnly
            ? { userId: user.id, read: false }
            : { userId: user.id };

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit
            }),
            prisma.notification.count({
                where: { userId: user.id, read: false }
            })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error('User notifications error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
