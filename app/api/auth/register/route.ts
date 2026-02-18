import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Trim whitespace from username
    const trimmedUsername = username?.trim();

    if (!trimmedUsername || !password) {
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
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
