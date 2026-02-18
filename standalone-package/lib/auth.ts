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
export async function createSession(userId: string, token: string) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Session expires in 30 mins of inactivity

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  // Cache in memory
  cache.setex(`session:${token}`, 30 * 60, userId); // 30 mins
}

// Get session from database (and extend it)
export async function getSession(token: string) {
  // We skip reading from cache to ensure we can extend the DB session expiry correctly
  // This ensures the 30-minute sliding window is strictly enforced on the server side.

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
    // SLIDING WINDOW: Extend session by 30 mins on activity
    const newExpiresAt = new Date();
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + 30);

    // Update DB with new expiry
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt }
    });

    // Refresh Cache
    cache.setex(`session:${token}`, 30 * 60, session.userId);
    
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
