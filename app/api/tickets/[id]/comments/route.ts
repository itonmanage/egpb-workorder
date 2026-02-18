import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logTicketActivity } from '@/lib/activity-logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/tickets/[id]/comments - Add comment to ticket
export async function POST(
  request: NextRequest,
  context: RouteContext
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

    const params = await context.params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Create comment
    // Changed from prisma.comment to prisma.ticketComment and 'content' to 'comment' to match schema
    const comment = await prisma.ticketComment.create({
      data: {
        comment: content,
        userId: user.id,
        ticketId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Log activity: comment added
    await logTicketActivity({
      ticketId: params.id,
      userId: user.id,
      actionType: 'comment_added',
      description: content.substring(0, 100),
    });

    // Log user activity and notify
    const { logUserActivity, notifyNewComment } = await import('@/lib/user-activity');
    await logUserActivity(
      user.id,
      'Commented on ticket',
      ticket.id,
      ticket.ticketNumber,
      'IT',
      content.substring(0, 100)
    );

    // Notify ticket creator if not the commenter
    if (ticket.userId !== user.id) {
      await notifyNewComment(
        ticket.userId,
        ticket.ticketNumber,
        user.username,
        'IT',
        ticket.id
      );
    }

    return NextResponse.json({
      success: true,
      data: { comment },
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
