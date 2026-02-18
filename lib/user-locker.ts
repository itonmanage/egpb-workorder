/**
 * User Account Locking Library
 * Locks user accounts after too many failed password attempts
 */

import { prisma } from './prisma';
import cache from './cache';

// Configuration
const USER_LOCK_CONFIG = {
    maxFailedAttempts: 5,    // Lock after 5 failed attempts
    attemptResetMs: 15 * 60 * 1000, // Reset counter after 15 minutes of no attempts
};

interface UserLockStatus {
    isLocked: boolean;
    failedAttempts: number;
    lockedAt: Date | null;
    remainingAttempts: number;
}

/**
 * Check if a user account is locked
 */
export async function isUserLocked(userId: string): Promise<boolean> {
    // Check cache first
    const cacheKey = `user_locked:${userId}`;
    const cachedResult = cache.get<boolean>(cacheKey);
    if (cachedResult !== null) {
        return cachedResult;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isLocked: true },
        });

        const isLocked = user?.isLocked ?? false;

        // Cache for 1 minute
        cache.set(cacheKey, isLocked, 60);

        return isLocked;
    } catch (error) {
        console.error('Error checking user lock status:', error);
        return false;
    }
}

/**
 * Get user lock status details
 */
export async function getUserLockStatus(userId: string): Promise<UserLockStatus | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                isLocked: true,
                failedAttempts: true,
                lockedAt: true,
            },
        });

        if (!user) return null;

        return {
            isLocked: user.isLocked,
            failedAttempts: user.failedAttempts,
            lockedAt: user.lockedAt,
            remainingAttempts: Math.max(0, USER_LOCK_CONFIG.maxFailedAttempts - user.failedAttempts),
        };
    } catch (error) {
        console.error('Error getting user lock status:', error);
        return null;
    }
}

/**
 * Record failed login attempt for user
 * Returns true if user should be locked
 */
export async function recordFailedUserAttempt(userId: string): Promise<{
    locked: boolean;
    failedAttempts: number;
    remainingAttempts: number;
}> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                failedAttempts: true,
                lastFailedAt: true,
            },
        });

        if (!user) {
            return { locked: false, failedAttempts: 0, remainingAttempts: USER_LOCK_CONFIG.maxFailedAttempts };
        }

        const now = new Date();
        let newFailedAttempts = user.failedAttempts + 1;

        // Reset counter if last attempt was long ago
        if (user.lastFailedAt && (now.getTime() - user.lastFailedAt.getTime()) >= USER_LOCK_CONFIG.attemptResetMs) {
            newFailedAttempts = 1;
        }

        // Check if should lock
        const shouldLock = newFailedAttempts >= USER_LOCK_CONFIG.maxFailedAttempts;

        // Update user
        await prisma.user.update({
            where: { id: userId },
            data: {
                failedAttempts: newFailedAttempts,
                lastFailedAt: now,
                ...(shouldLock ? {
                    isLocked: true,
                    lockedAt: now,
                } : {}),
            },
        });

        // Clear cache
        cache.delete(`user_locked:${userId}`);

        if (shouldLock) {
            console.log(`User ${userId} locked after ${newFailedAttempts} failed attempts`);
        }

        return {
            locked: shouldLock,
            failedAttempts: newFailedAttempts,
            remainingAttempts: Math.max(0, USER_LOCK_CONFIG.maxFailedAttempts - newFailedAttempts),
        };
    } catch (error) {
        console.error('Error recording failed user attempt:', error);
        return { locked: false, failedAttempts: 0, remainingAttempts: USER_LOCK_CONFIG.maxFailedAttempts };
    }
}

/**
 * Reset failed attempts on successful login
 */
export async function resetUserAttempts(userId: string): Promise<void> {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                failedAttempts: 0,
                lastFailedAt: null,
            },
        });

        // Clear cache
        cache.delete(`user_locked:${userId}`);
    } catch (error) {
        console.error('Error resetting user attempts:', error);
    }
}

/**
 * Unlock a user account
 */
export async function unlockUser(userId: string): Promise<boolean> {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                isLocked: false,
                lockedAt: null,
                failedAttempts: 0,
                lastFailedAt: null,
            },
        });

        // Clear cache
        cache.delete(`user_locked:${userId}`);

        console.log(`User ${userId} unlocked`);
        return true;
    } catch (error) {
        console.error('Error unlocking user:', error);
        return false;
    }
}

/**
 * Lock a user account manually (admin action)
 */
export async function lockUser(userId: string): Promise<boolean> {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                isLocked: true,
                lockedAt: new Date(),
            },
        });

        // Update cache
        cache.set(`user_locked:${userId}`, true, 60);

        console.log(`User ${userId} manually locked`);
        return true;
    } catch (error) {
        console.error('Error locking user:', error);
        return false;
    }
}

/**
 * Get all locked users
 */
export async function getLockedUsers() {
    try {
        const lockedUsers = await prisma.user.findMany({
            where: { isLocked: true },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                isLocked: true,
                lockedAt: true,
                failedAttempts: true,
            },
            orderBy: { lockedAt: 'desc' },
        });
        return lockedUsers;
    } catch (error) {
        console.error('Error getting locked users:', error);
        return [];
    }
}

/**
 * Get user lock configuration
 */
export function getUserLockConfig() {
    return { ...USER_LOCK_CONFIG };
}
