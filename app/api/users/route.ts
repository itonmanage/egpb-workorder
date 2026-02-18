import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { createUserSchema, validateData } from '@/lib/validation-schemas';

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getSession(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'IT_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.username = { contains: search, mode: 'insensitive' };
    }

    if (role) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.role = role as any;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        fullName: true,
        position: true,
        department: true,
        telephoneExtension: true,
        role: true,
        createdAt: true,
        // Security fields
        isLocked: true,
        lockedAt: true,
        failedAttempts: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        }
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getSession(token);
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'IT_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(createUserSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.message, details: validation.errors },
        { status: 400 }
      );
    }

    const { username, fullName, position, department, telephoneExtension, password, role } = validation.data;

    // Trim whitespace from username
    const trimmedUsername = username?.trim();

    // Validation
    if (!trimmedUsername || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: trimmedUsername,
          mode: 'insensitive',
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists (case-insensitive)' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        fullName,
        position,
        department,
        telephoneExtension,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        position: true,
        department: true,
        telephoneExtension: true,
        role: true,
        createdAt: true,
      },
    });

    // Log admin activity
    const { logUserActivity } = await import('@/lib/user-activity');
    await logUserActivity(
      currentUser.id,
      'create_user',
      undefined,
      undefined,
      undefined,
      `Created user: ${user.username} (${user.role})`
    );

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error: unknown) {
    console.error('Create user error:', error);

    // Return detailed error for debugging
    const err = error as { message?: string; code?: string };
    const errorMessage = err.message || 'Internal server error';
    const errorDetails = err.code ? ` (Code: ${err.code})` : '';

    return NextResponse.json(
      {
        error: 'Failed to create user',
        details: `${errorMessage}${errorDetails}`
      },
      { status: 500 }
    );
  }
}
