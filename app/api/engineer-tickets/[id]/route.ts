import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { ROLE_TO_DEPARTMENT_MAP, DEPARTMENT_ROLES } from '@/lib/constants';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/engineer-tickets/[id]
export async function GET(
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

    // Allow ADMIN and ENGINEER_ADMIN to access
    // if (user.role !== 'ADMIN' && user.role !== 'ENGINEER_ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const params = await context.params;
    const ticket = await prisma.engineerTicket.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            position: true,
            telephoneExtension: true,
          },
        },
        images: true,
        views: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { viewedAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Role-based access control for viewing
    if (user.role === 'USER' && ticket.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } else if (DEPARTMENT_ROLES.includes(user.role)) {
      // Department roles can view tickets from their department
      const userDepartment = ROLE_TO_DEPARTMENT_MAP[user.role];
      if (userDepartment && ticket.department) {
        // Check if ticket department contains user's department (case-insensitive)
        if (!ticket.department.toLowerCase().includes(userDepartment.toLowerCase())) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Track view
    await prisma.engineerTicketView.upsert({
      where: {
        ticketId_userId: {
          ticketId: params.id,
          userId: user.id,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: user.id,
        ticketId: params.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ticket },
    });
  } catch (error) {
    console.error('Get engineer ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/engineer-tickets/[id]
export async function PATCH(
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

    // Allow ADMIN and ENGINEER_ADMIN to access
    // if (user.role !== 'ADMIN' && user.role !== 'ENGINEER_ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const params = await context.params;
    const body = await request.json();

    // Role-based access control for updating
    // Only ADMIN and ENGINEER_ADMIN can update Engineer tickets
    if (user.role !== 'ADMIN' && user.role !== 'ENGINEER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if ticket exists
    const existing = await prisma.engineerTicket.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = await prisma.engineerTicket.update({
      where: { id: params.id },
      data: body,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        images: true,
      },
    });

    // Log activity for status changes
    if (body.status && body.status !== existing.status) {
      await prisma.engineerTicketActivity.create({
        data: {
          ticketId: params.id,
          userId: user.id,
          actionType: 'status_changed',
          oldValue: existing.status,
          newValue: body.status,
        },
      });

      // Log user activity and notify
      const { logUserActivity, notifyStatusChange } = await import('@/lib/user-activity');
      await logUserActivity(
        user.id,
        'Updated ticket status',
        ticket.id,
        ticket.ticketNumber,
        'ENGINEER',
        `Changed status from ${existing.status} to ${body.status}`
      );

      if (ticket.userId !== user.id) {
        await notifyStatusChange(
          ticket.userId,
          ticket.ticketNumber,
          existing.status,
          body.status,
          'ENGINEER',
          ticket.id
        );
      }
    }

    // Log activity for assignment changes
    if (body.assignTo !== undefined && body.assignTo !== existing.assignTo) {
      await prisma.engineerTicketActivity.create({
        data: {
          ticketId: params.id,
          userId: user.id,
          actionType: existing.assignTo ? 'reassigned' : 'assigned',
          oldValue: existing.assignTo || undefined,
          newValue: body.assignTo || undefined,
        },
      });

      // Log user activity and notify
      const { logUserActivity, notifyTicketAssignment } = await import('@/lib/user-activity');
      await logUserActivity(
        user.id,
        'Assigned ticket',
        ticket.id,
        ticket.ticketNumber,
        'ENGINEER',
        `Assigned to ${body.assignTo}`
      );

      if (body.assignTo) {
        await notifyTicketAssignment(
          body.assignTo,
          ticket.ticketNumber,
          'ENGINEER',
          ticket.id
        );
      }
    }

    // Log activity for notes updates
    if (body.adminNotes !== undefined && body.adminNotes !== existing.adminNotes) {
      await prisma.engineerTicketActivity.create({
        data: {
          ticketId: params.id,
          userId: user.id,
          actionType: 'notes_updated',
          oldValue: existing.adminNotes || undefined,
          newValue: body.adminNotes || undefined,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { ticket },
    });
  } catch (error) {
    console.error('Update engineer ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


