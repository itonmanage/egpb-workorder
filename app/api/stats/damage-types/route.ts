import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = await getSession(token);
        if (!session || session.role === 'USER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get('month') || '');
        const year = parseInt(searchParams.get('year') || '');
        const type = searchParams.get('type'); // 'IT' | 'ENGINEER'

        // Allow month=0 for "All Time" option
        if (isNaN(month) || isNaN(year) || month < 0 || month > 12) {
            return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
        }

        // Permission Check based on Type
        if (type === 'IT' && session.role !== 'ADMIN' && session.role !== 'IT_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (type === 'ENGINEER' && session.role !== 'ADMIN' && session.role !== 'ENGINEER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Calculate date range for the specified month
        // If month is 0, it means "All Time" - no date filter
        let dateFilter: { createdAt?: { gte: Date; lte: Date } } = {};

        if (month > 0) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            dateFilter = {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            };
        }

        let typeBreakdown: { type: string; count: number }[] = [];
        let totalCount = 0;

        if (type === 'IT') {
            const ticketTypeBreakdown = await prisma.ticket.groupBy({
                by: ['typeOfDamage'],
                _count: { _all: true },
                where: dateFilter,
            });

            typeBreakdown = ticketTypeBreakdown.map(entry => ({
                type: entry.typeOfDamage || 'Other',
                count: entry._count._all,
            }));

            totalCount = await prisma.ticket.count({ where: dateFilter });
        } else if (type === 'ENGINEER') {
            const engineerTypeBreakdown = await prisma.engineerTicket.groupBy({
                by: ['typeOfDamage'],
                _count: { _all: true },
                where: dateFilter,
            });

            typeBreakdown = engineerTypeBreakdown.map(entry => ({
                type: entry.typeOfDamage || 'Other',
                count: entry._count._all,
            }));

            totalCount = await prisma.engineerTicket.count({ where: dateFilter });
        }

        // Calculate percentages and sort by count
        const typeBreakdownWithPercentage = typeBreakdown
            .map(item => ({
                type: item.type,
                count: item.count,
                percentage: totalCount > 0 ? Number(((item.count / totalCount) * 100).toFixed(1)) : 0,
            }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({
            success: true,
            data: {
                month,
                year,
                totalCount,
                typeBreakdown: typeBreakdownWithPercentage,
            },
        });
    } catch (error) {
        console.error('Damage types stats error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
