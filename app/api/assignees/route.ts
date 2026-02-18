import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/assignees - Get list of unique assignee names for autocomplete
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

        // Get type parameter from query string
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'IT'; // Default to IT

        const allAssignees = new Set<string>();

        if (type === 'Engineer') {
            // Get unique assignees from Engineer tickets only
            const engineerAssignees = await prisma.engineerTicket.findMany({
                where: {
                    assignTo: {
                        not: null,
                    },
                },
                select: {
                    assignTo: true,
                },
                distinct: ['assignTo'],
            });

            engineerAssignees.forEach(t => {
                if (t.assignTo) allAssignees.add(t.assignTo);
            });
        } else {
            // Get unique assignees from IT tickets only
            const itAssignees = await prisma.ticket.findMany({
                where: {
                    assignTo: {
                        not: null,
                    },
                },
                select: {
                    assignTo: true,
                },
                distinct: ['assignTo'],
            });

            itAssignees.forEach(t => {
                if (t.assignTo) allAssignees.add(t.assignTo);
            });
        }

        // Convert to array and sort
        const assigneeList = Array.from(allAssignees).sort();

        return NextResponse.json({ assignees: assigneeList });
    } catch (error) {
        console.error('Error fetching assignees:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assignees' },
            { status: 500 }
        );
    }
}
