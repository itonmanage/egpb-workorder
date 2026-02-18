/**
 * Rate Limiter using in-memory cache
 * Uses sliding window algorithm for accurate rate limiting
 */

import cache from './cache';

interface RateLimitConfig {
    maxRequests: number;  // Maximum requests allowed
    windowMs: number;     // Time window in milliseconds
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetTime: number;    // Unix timestamp when limit resets
    retryAfter?: number;  // Seconds until next request allowed
}

interface RateLimitEntry {
    count: number;
    firstRequest: number;
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
    // Login: 5 requests per minute per IP
    LOGIN: {
        maxRequests: 5,
        windowMs: 60 * 1000, // 1 minute
    },
    // General API: 100 requests per minute per IP
    API: {
        maxRequests: 100,
        windowMs: 60 * 1000, // 1 minute
    },
    // Strict: For sensitive operations like password reset
    STRICT: {
        maxRequests: 3,
        windowMs: 60 * 1000, // 1 minute
    },
} as const;

/**
 * Check rate limit for a given identifier (usually IP address)
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
    prefix: string = 'ratelimit'
): RateLimitResult {
    const key = `${prefix}:${identifier}`;
    const now = Date.now();

    // Get existing rate limit entry
    let entry = cache.get<RateLimitEntry>(key);

    // If no entry or window has expired, create new entry
    if (!entry || (now - entry.firstRequest) >= config.windowMs) {
        entry = {
            count: 1,
            firstRequest: now,
        };
        cache.set(key, entry, Math.ceil(config.windowMs / 1000));

        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetTime: now + config.windowMs,
        };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
        const resetTime = entry.firstRequest + config.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        return {
            success: false,
            remaining: 0,
            resetTime,
            retryAfter: retryAfter > 0 ? retryAfter : 1,
        };
    }

    // Increment count
    entry.count++;
    cache.set(key, entry, Math.ceil((entry.firstRequest + config.windowMs - now) / 1000));

    return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.firstRequest + config.windowMs,
    };
}

/**
 * Reset rate limit for a given identifier
 */
export function resetRateLimit(identifier: string, prefix: string = 'ratelimit'): void {
    const key = `${prefix}:${identifier}`;
    cache.delete(key);
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult, config: RateLimitConfig): Record<string, string> {
    return {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
        ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
    };
}

/**
 * Helper: Check login rate limit
 */
export function checkLoginRateLimit(ip: string): RateLimitResult {
    return checkRateLimit(ip, RATE_LIMITS.LOGIN, 'ratelimit:login');
}

/**
 * Helper: Check API rate limit
 */
export function checkApiRateLimit(ip: string): RateLimitResult {
    return checkRateLimit(ip, RATE_LIMITS.API, 'ratelimit:api');
}
