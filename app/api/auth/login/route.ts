import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken, createSession } from '@/lib/auth';
import { checkLoginRateLimit, getRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIP, isIPBlocked, recordFailedIPAttempt, resetIPAttempts, getRemainingIPAttempts } from '@/lib/ip-blocker';
import { recordFailedUserAttempt, resetUserAttempts } from '@/lib/user-locker';
import { loginSchema, validateData } from '@/lib/validation-schemas';

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = getClientIP(request);

    // Check if IP is blocked
    const ipBlocked = await isIPBlocked(ip);
    if (ipBlocked) {
      return NextResponse.json(
        {
          error: 'IP address is temporarily blocked due to too many failed login attempts. Please try again later or contact administrator.',
          code: 'IP_BLOCKED'
        },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitResult = checkLoginRateLimit(ip);
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`,
          code: 'RATE_LIMITED',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );

      // Add rate limit headers
      const headers = getRateLimitHeaders(rateLimitResult, RATE_LIMITS.LOGIN);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(loginSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.message, details: validation.errors },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;

    // Find user by username (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
        password: true,
        role: true,
        isLocked: true,
        failedAttempts: true,
      },
    });

    if (!user) {
      // Record failed IP attempt (user doesn't exist)
      await recordFailedIPAttempt(ip);

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user account is locked
    if (user.isLocked) {
      return NextResponse.json(
        {
          error: 'Your account is locked due to too many failed login attempts. Please contact administrator to unlock your account.',
          code: 'ACCOUNT_LOCKED'
        },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      // Record failed attempt for both IP and user
      const [ipBlocked, userLockResult] = await Promise.all([
        recordFailedIPAttempt(ip),
        recordFailedUserAttempt(user.id),
      ]);

      // Build error message
      let errorMessage = 'Invalid credentials';
      const additionalInfo: Record<string, unknown> = {};

      if (userLockResult.locked) {
        errorMessage = 'Your account has been locked due to too many failed login attempts. Please contact administrator.';
        additionalInfo.code = 'ACCOUNT_LOCKED';
      } else if (userLockResult.remainingAttempts <= 3) {
        additionalInfo.remainingAttempts = userLockResult.remainingAttempts;
        additionalInfo.warning = `Warning: ${userLockResult.remainingAttempts} attempt(s) remaining before account lock.`;
      }

      if (ipBlocked) {
        errorMessage = 'Your IP has been blocked due to too many failed login attempts. Please try again later.';
        additionalInfo.code = 'IP_BLOCKED';
      } else {
        const remainingIPAttempts = getRemainingIPAttempts(ip);
        if (remainingIPAttempts <= 3) {
          additionalInfo.remainingIPAttempts = remainingIPAttempts;
        }
      }

      return NextResponse.json(
        { error: errorMessage, ...additionalInfo },
        { status: 401 }
      );
    }

    // Successful login - reset all attempt counters
    await Promise.all([
      resetUserAttempts(user.id),
    ]);
    resetIPAttempts(ip);

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: '', // Unused
      role: user.role,
    });

    // Create session
    await createSession(user.id, token);

    // Log user activity
    const { logUserActivity } = await import('@/lib/user-activity');
    await logUserActivity(
      user.id,
      'login',
      undefined,
      undefined,
      undefined,
      'User logged in successfully'
    );

    // Set cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        token,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      // Disable secure cookie for HTTP (IP address) access in production
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day (Server enforces 30 min inactivity timeout)
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
