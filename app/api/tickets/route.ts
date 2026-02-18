import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logTicketActivity } from '@/lib/activity-logger';
import { generateITTicketNumber } from '@/lib/ticket-number';
import { eventBus } from '@/lib/event-bus';
import { ROLE_TO_DEPARTMENT_MAP, DEPARTMENT_ROLES } from '@/lib/constants';
import { logInfo, logError } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';
import { createTicketApiSchema } from '@/lib/api-validation';

// GET /api/tickets - List all tickets with filters
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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unviewedOnly = searchParams.get('unviewedOnly') === 'true';

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const createdByMe = searchParams.get('createdByMe') === 'true';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Role-based access control
    if (user.role === 'USER') {
      // Regular users see only their own tickets
      where.userId = user.id;
    } else if (DEPARTMENT_ROLES.includes(user.role)) {
      // Department roles see tickets from their department
      const userDepartment = ROLE_TO_DEPARTMENT_MAP[user.role];
      if (userDepartment) {
        where.department = {
          contains: userDepartment,
          mode: 'insensitive',
        };
      }
    } else if (user.role === 'ENGINEER_ADMIN') {
      // Engineer Admin sees only Engineer department tickets in IT Dashboard
      where.department = {
        contains: 'Engineer',
        mode: 'insensitive',
      };
    }
    // ADMIN and IT_ADMIN see all tickets (no filter)

    // Filter by created by me
    if (createdByMe) {
      where.userId = user.id;
    }

    if (unviewedOnly) {
      where.views = {
        none: {
          userId: user.id,
        },
      };
    }

    if (status && status !== 'all') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.status = status as any; // Using any here because Prisma Enum typing can be tricky with string inputs
    }

    if (type) {
      where.typeOfDamage = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to include the end date fully (until 23:59:59)
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { typeOfDamage: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
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
          _count: {
            select: {
              comments: true,
              views: true,
            },
          },
        },
        orderBy: { ticketNumber: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.ticket.count({ where }),
    ]);

    // Get status counts with same filters
    // For DONE status: use date filter if present, otherwise use MTD logic
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Determine DONE filter based on whether date filters are present
    let doneWhere;
    if (startDate || endDate) {
      // If date filters are present, use them for DONE count
      doneWhere = {
        ...where,
        status: 'DONE'
      };
    } else {
      // No date filters: use MTD logic (updatedAt in current month)
      doneWhere = {
        ...where,
        status: 'DONE',
        updatedAt: { gte: startOfMonth }
      };
    }

    // Get counts for non-DONE statuses
    const nonDoneStatusCounts = await prisma.ticket.groupBy({
      by: ['status'],
      where: {
        ...where,
        status: { not: 'DONE' }
      },
      _count: {
        status: true,
      },
    });

    // Get DONE count (with date filter or MTD)
    const doneCount = await prisma.ticket.count({ where: doneWhere });

    // Format status counts
    const counts = {
      NEW: 0,
      IN_PROGRESS: 0,
      ON_HOLD: 0,
      DONE: doneCount,
      CANCEL: 0,
    };

    nonDoneStatusCounts.forEach((item) => {
      counts[item.status] = item._count.status;
    });

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        count: total,
        statusCounts: counts,
      },
    });
  } catch (error) {
    logError('Get tickets error', error);
    return handleError(error);
  }
}

// POST /api/tickets - Create new ticket
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

    const body = await request.json();

    // Validate request body
    const validationResult = createTicketApiSchema.safeParse(body);
    if (!validationResult.success) {
      logError('Ticket validation failed', validationResult.error, { userId: user.id });
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      department,
      location,
      typeOfDamage,
    } = validationResult.data;

    // Generate ticket number
    const ticketNumber = await generateITTicketNumber();

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        department,
        location,
        typeOfDamage: typeOfDamage || 'Other',
        status: 'NEW',
        userId: user.id,
      },
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

    // Log activity: ticket created
    await logTicketActivity({
      ticketId: ticket.id,
      userId: user.id,
      actionType: 'created',
      description: `Ticket created by ${user.username}`,
    });

    // Log user activity for profile
    const { logUserActivity } = await import('@/lib/user-activity');
    await logUserActivity(
      user.id,
      'Created ticket',
      ticket.id,
      ticket.ticketNumber,
      'IT',
      `Created IT ticket: ${ticket.title}`
    );

    // Emit event for SSE notifications
    eventBus.emit('new_it_ticket', {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      typeOfDamage: ticket.typeOfDamage,
      location: ticket.location,
      department: ticket.department,
      createdAt: ticket.createdAt,
      user: ticket.user,
    });

    logInfo('Ticket created successfully', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: { ticket },
    });
  } catch (error) {
    logError('Create ticket error', error);
    return handleError(error);
  }
}
