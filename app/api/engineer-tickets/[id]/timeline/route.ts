import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getSession(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { id: ticketId } = await params;

        // Fetch all activities for this engineer ticket
        const activities = await prisma.engineerTicketActivity.findMany({
            where: {
                ticketId: ticketId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ activities });
    } catch (error) {
        console.error('Error fetching engineer ticket timeline:', error);
        return NextResponse.json(
            { error: 'Failed to fetch timeline' },
            { status: 500 }
        );
    }
}
