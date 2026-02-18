import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import cache from './cache';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '1d'; // Token signature validity (long enough to not interfere with session logic)

export interface JWTPayload {
  userId: string;
  email: string; // Keep for legacy compatibility, though unused
  role: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Create session
export async function createSession(userId: string, token: string, durationMinutes: number = 30) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  // Cache in memory (seconds)
  cache.setex(`session:${token}`, durationMinutes * 60, userId);
}

// Get session from database (and extend it)
export async function getSession(token: string) {
  // We skip reading from cache to ensure we can extend the DB session expiry correctly
  // This ensures the sliding window is strictly enforced on the server side.

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });

  if (session && session.expiresAt > new Date()) {
    // SLIDING WINDOW LOGIC
    // We need to determine if this is a "short" session (30 mins) or "long" session (Remember Me - 7 days)
    // without schema changes. We use a heuristic based on current validity.

    const now = new Date();
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
    const isLongSession = timeUntilExpiry > 60 * 60 * 1000; // If > 1 hour remaining, treat as long session

    const newExpiresAt = new Date();
    let cacheDuration = 30 * 60; // Default 30 mins

    if (isLongSession) {
      // Extend by 7 days
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);
      cacheDuration = 7 * 24 * 60 * 60;
    } else {
      // Extend by 30 mins
      newExpiresAt.setMinutes(newExpiresAt.getMinutes() + 30);
    }

    // Update DB with new expiry
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt }
    });

    // Refresh Cache
    cache.setex(`session:${token}`, cacheDuration, session.userId);

    return session.user;
  }

  return null;
}

// Delete session
export async function deleteSession(token: string) {
  try {
    await prisma.session.delete({
      where: { token },
    });
  } catch (error) {
    // Ignore if already deleted
    console.error('Error deleting session:', error);
  }

  cache.delete(`session:${token}`);
}

// Clean expired sessions
export async function cleanExpiredSessions() {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
