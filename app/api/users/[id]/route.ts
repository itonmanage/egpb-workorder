import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { unlockUser, lockUser } from '@/lib/user-locker';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getSession(token);
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'IT_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


// PATCH /api/users/[id] - Update user or unlock account
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getSession(token);
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'IT_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const body = await request.json();

    // Check if user exists (Moved to top for logging availability)
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for unlock action
    if (body.action === 'unlock') {
      const success = await unlockUser(params.id);
      if (!success) {
        return NextResponse.json({ error: 'Failed to unlock user' }, { status: 500 });
      }

      // Log activity
      const { logUserActivity } = await import('@/lib/user-activity');
      await logUserActivity(
        currentUser.id,
        'unlock_user',
        undefined,
        undefined,
        undefined,
        `Unlocked user account: ${existingUser.username}`
      );

      return NextResponse.json({
        success: true,
        message: 'User account has been unlocked',
      });
    }

    // Check for lock action
    if (body.action === 'lock') {
      // Prevent locking yourself
      if (params.id === currentUser.id) {
        return NextResponse.json({ error: 'Cannot lock your own account' }, { status: 400 });
      }
      const success = await lockUser(params.id);
      if (!success) {
        return NextResponse.json({ error: 'Failed to lock user' }, { status: 500 });
      }

      // Log activity
      const { logUserActivity } = await import('@/lib/user-activity');
      await logUserActivity(
        currentUser.id,
        'lock_user',
        undefined,
        undefined,
        undefined,
        `Locked user account: ${existingUser.username}`
      );

      return NextResponse.json({
        success: true,
        message: 'User account has been locked',
      });
    }

    const { username, fullName, position, department, telephoneExtension, password, role } = body;

    // Prepare update data
    const updateData: Prisma.UserUpdateInput = {};

    if (username) updateData.username = username;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (position !== undefined) updateData.position = position;
    if (department !== undefined) updateData.department = department;
    if (telephoneExtension !== undefined) updateData.telephoneExtension = telephoneExtension;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (role) updateData.role = role as any;

    // Only hash password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        position: true,
        department: true,
        telephoneExtension: true,
        role: true,
        createdAt: true,
        // Removed security fields to avoid lint errors if client not generated
      },
    });

    // Log activity
    const { logUserActivity } = await import('@/lib/user-activity');
    await logUserActivity(
      currentUser.id,
      'update_user',
      undefined,
      undefined,
      undefined,
      `Updated user profile: ${user.username}`
    );

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getSession(token);
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'IT_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const params = await context.params;

    // Prevent self-deletion
    if (params.id === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.id },
    });

    // Log activity
    const { logUserActivity } = await import('@/lib/user-activity');
    await logUserActivity(
      currentUser.id,
      'delete_user',
      undefined,
      undefined,
      undefined,
      `Deleted user: ${existingUser.username}`
    );

    return NextResponse.json({
      success: true,
      data: { message: 'User deleted successfully' },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
