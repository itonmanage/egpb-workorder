/**
 * IP Blocking Library
 * Tracks failed login attempts and blocks IPs after threshold
 */

import { prisma } from './prisma';
import cache from './cache';

// Configuration
const IP_BLOCK_CONFIG = {
    maxFailedAttempts: 10,    // Block after 10 failed attempts
    blockDurationMs: 10 * 60 * 1000, // Block for 10 minutes
    trackingWindowMs: 15 * 60 * 1000, // Track attempts for 15 minutes
};

interface FailedAttemptEntry {
    count: number;
    firstAttempt: number;
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: Request): string {
    // Try various headers (for reverse proxy setups)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback - may not work in all environments
    return '127.0.0.1';
}

/**
 * Check if IP is blocked
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
    // Check cache first
    const cacheKey = `blocked_ip:${ip}`;
    const cachedResult = cache.get<boolean>(cacheKey);
    if (cachedResult !== null) {
        return cachedResult;
    }

    try {
        // Check database
        const blocked = await prisma.blockedIP.findFirst({
            where: {
                ipAddress: ip,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        const isBlocked = !!blocked;

        // Cache result for 1 minute
        cache.set(cacheKey, isBlocked, 60);

        return isBlocked;
    } catch (error) {
        console.error('Error checking blocked IP:', error);
        return false;
    }
}

/**
 * Record failed login attempt for IP
 * Returns true if IP should be blocked
 */
export async function recordFailedIPAttempt(ip: string): Promise<boolean> {
    const cacheKey = `ip_attempts:${ip}`;
    const now = Date.now();

    // Get current attempt count
    let entry = cache.get<FailedAttemptEntry>(cacheKey);

    // Reset if window expired
    if (!entry || (now - entry.firstAttempt) >= IP_BLOCK_CONFIG.trackingWindowMs) {
        entry = {
            count: 1,
            firstAttempt: now,
        };
    } else {
        entry.count++;
    }

    // Update cache
    cache.set(cacheKey, entry, Math.ceil(IP_BLOCK_CONFIG.trackingWindowMs / 1000));

    // Check if should block
    if (entry.count >= IP_BLOCK_CONFIG.maxFailedAttempts) {
        await blockIP(ip, 'too_many_failed_logins', entry.count);

        // Clear attempt counter
        cache.delete(cacheKey);

        return true;
    }

    return false;
}

/**
 * Block an IP address
 */
export async function blockIP(ip: string, reason: string, failedCount: number = 0): Promise<void> {
    const expiresAt = new Date(Date.now() + IP_BLOCK_CONFIG.blockDurationMs);

    try {
        await prisma.blockedIP.upsert({
            where: { ipAddress: ip },
            create: {
                ipAddress: ip,
                reason,
                expiresAt,
                failedCount,
            },
            update: {
                reason,
                blockedAt: new Date(),
                expiresAt,
                failedCount,
            },
        });

        // Update cache
        cache.set(`blocked_ip:${ip}`, true, Math.ceil(IP_BLOCK_CONFIG.blockDurationMs / 1000));

        console.log(`IP ${ip} blocked for ${IP_BLOCK_CONFIG.blockDurationMs / 1000 / 60} minutes. Reason: ${reason}`);
    } catch (error) {
        console.error('Error blocking IP:', error);
    }
}

/**
 * Unblock an IP address
 */
export async function unblockIP(ip: string): Promise<boolean> {
    try {
        await prisma.blockedIP.delete({
            where: { ipAddress: ip },
        });

        // Clear cache
        cache.delete(`blocked_ip:${ip}`);
        cache.delete(`ip_attempts:${ip}`);

        console.log(`IP ${ip} unblocked`);
        return true;
    } catch (error) {
        console.error('Error unblocking IP:', error);
        return false;
    }
}

/**
 * Unblock IP by ID
 */
export async function unblockIPById(id: string): Promise<boolean> {
    try {
        const blocked = await prisma.blockedIP.findUnique({
            where: { id },
        });

        if (!blocked) return false;

        await prisma.blockedIP.delete({
            where: { id },
        });

        // Clear cache
        cache.delete(`blocked_ip:${blocked.ipAddress}`);
        cache.delete(`ip_attempts:${blocked.ipAddress}`);

        console.log(`IP ${blocked.ipAddress} unblocked by ID`);
        return true;
    } catch (error) {
        console.error('Error unblocking IP by ID:', error);
        return false;
    }
}

/**
 * Get all blocked IPs
 */
export async function getBlockedIPs() {
    try {
        const blockedIPs = await prisma.blockedIP.findMany({
            orderBy: { blockedAt: 'desc' },
        });
        return blockedIPs;
    } catch (error) {
        console.error('Error getting blocked IPs:', error);
        return [];
    }
}

/**
 * Clean expired blocked IPs
 */
export async function cleanExpiredBlockedIPs(): Promise<number> {
    try {
        const result = await prisma.blockedIP.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        return result.count;
    } catch (error) {
        console.error('Error cleaning expired blocked IPs:', error);
        return 0;
    }
}

/**
 * Reset failed attempt counter for IP (on successful login)
 */
export function resetIPAttempts(ip: string): void {
    cache.delete(`ip_attempts:${ip}`);
}

/**
 * Get remaining attempts before block
 */
export function getRemainingIPAttempts(ip: string): number {
    const cacheKey = `ip_attempts:${ip}`;
    const entry = cache.get<FailedAttemptEntry>(cacheKey);

    if (!entry) {
        return IP_BLOCK_CONFIG.maxFailedAttempts;
    }

    return Math.max(0, IP_BLOCK_CONFIG.maxFailedAttempts - entry.count);
}
