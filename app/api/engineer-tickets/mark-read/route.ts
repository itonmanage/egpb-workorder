import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getSession(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Find all NEW tickets that haven't been viewed by this user
    const unviewedTickets = await prisma.engineerTicket.findMany({
      where: {
        status: 'NEW',
        views: {
          none: {
            userId: user.id,
          },
        },
      },
      select: { id: true },
    });

    if (unviewedTickets.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Create views for all found tickets
    await prisma.engineerTicketView.createMany({
      data: unviewedTickets.map((ticket) => ({
        ticketId: ticket.id,
        userId: user.id,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      count: unviewedTickets.length,
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

