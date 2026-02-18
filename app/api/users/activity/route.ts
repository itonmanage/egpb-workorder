import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/users/activity - Get user activity log
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
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');

        const [activities, total] = await Promise.all([
            prisma.userActivity.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.userActivity.count({
                where: { userId: user.id }
            })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                activities,
                total
            }
        });
    } catch (error) {
        console.error('User activity error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
