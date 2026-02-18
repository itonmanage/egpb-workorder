import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const STATUSES = ['NEW', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCEL'] as const;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role === 'USER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const type = searchParams.get('type'); // 'IT' | 'ENGINEER'

    // Permission Check based on Type
    if (type === 'IT' && session.role !== 'ADMIN' && session.role !== 'IT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (type === 'ENGINEER' && session.role !== 'ADMIN' && session.role !== 'ENGINEER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!type && session.role !== 'ADMIN') {
      // Only ADMIN can access combined view without type
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: any = {};
    if (fromDate && toDate) {
      dateFilter.createdAt = {
        gte: new Date(fromDate),
        lte: new Date(toDate + 'T23:59:59.999Z'),
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Calculate last month range
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Calculate Year-to-Date range (from January 1st of current year)
    const startOfYear = new Date(now.getFullYear(), 0, 1);


    const fetchIT = type === 'IT' || !type;
    const fetchEngineer = type === 'ENGINEER' || !type;

    // Initialize variables
    let ticketCount = 0;
    let engineerTicketCount = 0;
    let monthTicketCount = 0;
    let monthEngineerTicketCount = 0;
    let lastMonthTicketCount = 0;
    let lastMonthEngineerTicketCount = 0;
    let yearToDateTicketCount = 0;
    let yearToDateEngineerTicketCount = 0;
    let ticketUsers: { userId: string }[] = [];
    let engineerUsers: { userId: string }[] = [];
    let ticketDurations: { createdAt: Date; updatedAt: Date }[] = [];
    let engineerDurations: { createdAt: Date; updatedAt: Date }[] = [];
    let ticketStatusBreakdown: (Prisma.PickEnumerable<Prisma.TicketGroupByOutputType, "status"[]> & { _count: { _all: number } })[] = [];
    let engineerStatusBreakdown: (Prisma.PickEnumerable<Prisma.EngineerTicketGroupByOutputType, "status"[]> & { _count: { _all: number } })[] = [];
    let ticketTypeBreakdown: (Prisma.PickEnumerable<Prisma.TicketGroupByOutputType, "typeOfDamage"[]> & { _count: { _all: number } })[] = [];
    let engineerTypeBreakdown: (Prisma.PickEnumerable<Prisma.EngineerTicketGroupByOutputType, "typeOfDamage"[]> & { _count: { _all: number } })[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ticketDepartmentStatusBreakdown: any[] = [];
    let engineerLocationBreakdown: (Prisma.PickEnumerable<Prisma.EngineerTicketGroupByOutputType, "location"[]> & { _count: { _all: number } })[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let engineerInformationByBreakdown: any[] = [];
    let engineerDepartmentBreakdown: (Prisma.PickEnumerable<Prisma.EngineerTicketGroupByOutputType, "department"[]> & { _count: { _all: number } })[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let engineerDepartmentStatusBreakdown: any[] = [];

    // Fetch IT Data
    if (fetchIT) {
      [
        ticketCount,
        monthTicketCount,
        lastMonthTicketCount,
        yearToDateTicketCount,
        ticketUsers,
        ticketDurations,
        ticketStatusBreakdown,
        ticketTypeBreakdown,
        ticketDepartmentStatusBreakdown,
      ] = await Promise.all([
        // Total: Count ALL tickets in database (no date filter)
        prisma.ticket.count(),
        // This Month (MTD): Count DONE tickets updated in current month
        prisma.ticket.count({
          where: {
            status: 'DONE',
            updatedAt: { gte: startOfMonth }
          }
        }),
        // Last Month: Count DONE tickets in previous month
        prisma.ticket.count({
          where: {
            status: 'DONE',
            updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth }
          }
        }),
        // Year-to-Date: Count tickets created this year
        prisma.ticket.count({ where: { createdAt: { gte: startOfYear } } }),
        prisma.ticket.findMany({
          where: dateFilter.createdAt ? dateFilter : { createdAt: { gte: thirtyDaysAgo } },
          select: { userId: true },
        }),
        prisma.ticket.findMany({
          where: { ...dateFilter, status: 'DONE' },
          select: { createdAt: true, updatedAt: true },
        }),
        prisma.ticket.groupBy({
          by: ['status'],
          _count: { _all: true },
          where: dateFilter,
        }),
        prisma.ticket.groupBy({
          by: ['typeOfDamage'],
          _count: { _all: true },
          where: dateFilter,
        }),
        prisma.ticket.groupBy({
          by: ['department', 'status'],
          _count: { _all: true },
          where: dateFilter,
        }),
      ]);
    }

    // Fetch Engineer Data
    if (fetchEngineer) {
      [
        engineerTicketCount,
        monthEngineerTicketCount,
        lastMonthEngineerTicketCount,
        yearToDateEngineerTicketCount,
        engineerUsers,
        engineerDurations,
        engineerStatusBreakdown,
        engineerTypeBreakdown,
        engineerLocationBreakdown,
        engineerInformationByBreakdown,
        engineerDepartmentBreakdown,
        engineerDepartmentStatusBreakdown,
      ] = await Promise.all([
        // Total: Count ALL tickets in database (no date filter)
        prisma.engineerTicket.count(),
        // This Month (MTD): Count DONE tickets updated in current month
        prisma.engineerTicket.count({
          where: {
            status: 'DONE',
            updatedAt: { gte: startOfMonth }
          }
        }),
        // Last Month: Count DONE tickets in previous month
        prisma.engineerTicket.count({
          where: {
            status: 'DONE',
            updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth }
          }
        }),
        // Year-to-Date: Count tickets created this year
        prisma.engineerTicket.count({ where: { createdAt: { gte: startOfYear } } }),
        prisma.engineerTicket.findMany({
          where: dateFilter.createdAt ? dateFilter : { createdAt: { gte: thirtyDaysAgo } },
          select: { userId: true },
        }),
        prisma.engineerTicket.findMany({
          where: { ...dateFilter, status: 'DONE' },
          select: { createdAt: true, updatedAt: true },
        }),
        prisma.engineerTicket.groupBy({
          by: ['status'],
          _count: { _all: true },
          where: dateFilter,
        }),
        prisma.engineerTicket.groupBy({
          by: ['typeOfDamage'],
          _count: { _all: true },
          where: dateFilter,
        }),
        prisma.engineerTicket.groupBy({
          by: ['location'],
          _count: { _all: true },
          where: dateFilter,
        }),
        prisma.engineerTicket.groupBy({
          by: ['informationBy'],
          _count: { _all: true },
          where: dateFilter,
        }),
        prisma.engineerTicket.groupBy({
          by: ['department'],
          _count: { _all: true },
          where: dateFilter,
        }),
        prisma.engineerTicket.groupBy({
          by: ['department', 'status'],
          _count: { _all: true },
          where: dateFilter,
        }),
      ]);
    }

    const totalTickets = ticketCount + engineerTicketCount;
    const thisMonthTickets = monthTicketCount + monthEngineerTicketCount;
    const lastMonthTickets = lastMonthTicketCount + lastMonthEngineerTicketCount;
    const yearToDateTickets = yearToDateTicketCount + yearToDateEngineerTicketCount;

    const activeUsers = new Set([
      ...ticketUsers.map((user) => user.userId),
      ...engineerUsers.map((user) => user.userId),
    ]).size;

    const resolutionHours: number[] = [
      ...ticketDurations,
      ...engineerDurations,
    ]
      .filter((ticket) => ticket.updatedAt)
      .map(
        (ticket) =>
          (ticket.updatedAt.getTime() - ticket.createdAt.getTime()) /
          (1000 * 60 * 60)
      );

    const avgResolutionHours = resolutionHours.length
      ? Number(
        (resolutionHours.reduce((sum, hours) => sum + hours, 0) /
          resolutionHours.length).toFixed(1)
      )
      : null;

    const statusMap = new Map<string, number>();
    ticketStatusBreakdown.forEach((entry) => {
      statusMap.set(
        entry.status,
        (statusMap.get(entry.status) || 0) + entry._count._all
      );
    });
    engineerStatusBreakdown.forEach((entry) => {
      statusMap.set(
        entry.status,
        (statusMap.get(entry.status) || 0) + entry._count._all
      );
    });

    const statusBreakdown = STATUSES.map((status) => ({
      status,
      count: statusMap.get(status) || 0,
    }));

    const typeMap = new Map<string, number>();
    ticketTypeBreakdown.forEach((entry) => {
      const type = entry.typeOfDamage || 'Other';
      typeMap.set(type, (typeMap.get(type) || 0) + entry._count._all);
    });
    engineerTypeBreakdown.forEach((entry) => {
      const type = entry.typeOfDamage || 'Other';
      typeMap.set(type, (typeMap.get(type) || 0) + entry._count._all);
    });

    const typeBreakdown = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Process IT ticket department-status breakdown
    const itDepartmentStatusMap = new Map<string, Record<string, number>>();
    ticketDepartmentStatusBreakdown.forEach((entry) => {
      const dept = entry.department || 'Unknown';
      const status = entry.status;

      if (!itDepartmentStatusMap.has(dept)) {
        itDepartmentStatusMap.set(dept, {
          NEW: 0,
          IN_PROGRESS: 0,
          ON_HOLD: 0,
          DONE: 0,
          CANCEL: 0,
        });
      }

      const deptData = itDepartmentStatusMap.get(dept)!;
      deptData[status] = entry._count._all;
    });

    const itDepartmentStatusBreakdown = Array.from(itDepartmentStatusMap.entries())
      .map(([department, statuses]) => ({
        department,
        ...statuses,
        total: Object.values(statuses).reduce((sum, count) => sum + count, 0),
      }))
      .sort((a, b) => b.total - a.total);

    // Process Engineer department-status breakdown
    const departmentStatusMap = new Map<string, Record<string, number>>();
    engineerDepartmentStatusBreakdown.forEach((entry) => {
      const dept = entry.department || 'Unknown';
      const status = entry.status;

      if (!departmentStatusMap.has(dept)) {
        departmentStatusMap.set(dept, {
          NEW: 0,
          IN_PROGRESS: 0,
          ON_HOLD: 0,
          DONE: 0,
          CANCEL: 0,
        });
      }

      const deptData = departmentStatusMap.get(dept)!;
      deptData[status] = entry._count._all;
    });

    const departmentStatusBreakdown = Array.from(departmentStatusMap.entries())
      .map(([department, statuses]) => ({
        department,
        ...statuses,
        total: Object.values(statuses).reduce((sum, count) => sum + count, 0),
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      data: {
        totalTickets,
        thisMonthTickets,
        lastMonthTickets,
        yearToDateTickets,
        activeUsers,
        avgResolutionHours,
        statusBreakdown,
        typeBreakdown,
        locationBreakdown: engineerLocationBreakdown.map(e => ({ name: e.location || 'Unknown', count: e._count._all })).sort((a, b) => b.count - a.count),
        informationByBreakdown: engineerInformationByBreakdown.map(e => ({ name: e.informationBy || 'Unknown', count: e._count._all })).sort((a, b) => b.count - a.count),
        departmentBreakdown: engineerDepartmentBreakdown.map(e => ({ name: e.department || 'Unknown', count: e._count._all })).sort((a, b) => b.count - a.count),
        departmentStatusBreakdown,
        itDepartmentStatusBreakdown,
      },
    });
  } catch (error) {
    console.error('Summary stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
