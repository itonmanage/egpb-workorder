import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/users/stats - Get user statistics
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

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get statistics
        const [
            totalCreated,
            totalAssigned,
            completedThisMonth,
            activeTickets,
            engineerCreated,
            engineerAssigned,
            engineerCompletedThisMonth,
            engineerActiveTickets
        ] = await Promise.all([
            // IT Tickets
            prisma.ticket.count({
                where: { userId: user.id }
            }),
            prisma.ticket.count({
                where: { assignTo: user.username }
            }),
            prisma.ticket.count({
                where: {
                    userId: user.id,
                    status: 'DONE',
                    updatedAt: { gte: startOfMonth }
                }
            }),
            prisma.ticket.count({
                where: {
                    userId: user.id,
                    status: { in: ['NEW', 'IN_PROGRESS', 'ON_HOLD'] }
                }
            }),
            // Engineer Tickets
            prisma.engineerTicket.count({
                where: { userId: user.id }
            }),
            prisma.engineerTicket.count({
                where: { assignTo: user.username }
            }),
            prisma.engineerTicket.count({
                where: {
                    userId: user.id,
                    status: 'DONE',
                    updatedAt: { gte: startOfMonth }
                }
            }),
            prisma.engineerTicket.count({
                where: {
                    userId: user.id,
                    status: { in: ['NEW', 'IN_PROGRESS', 'ON_HOLD'] }
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                totalCreated: totalCreated + engineerCreated,
                totalAssigned: totalAssigned + engineerAssigned,
                completedThisMonth: completedThisMonth + engineerCompletedThisMonth,
                activeTickets: activeTickets + engineerActiveTickets
            }
        });
    } catch (error) {
        console.error('User stats error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
