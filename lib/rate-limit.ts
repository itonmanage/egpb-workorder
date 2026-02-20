/**
 * Simple in-memory rate limiter
 * Algorithm: Fixed Window Counter
 * 
 * Note: Since this uses in-memory storage, it resets when the server restarts.
 * For a distributed system (like Vercel serverless functions), a Redis-based approach (e.g., Upstash) is better.
 * But for a persistent server (VPS/Local), this is efficient and robust enough.
 */

type Options = {
    uniqueTokenPerInterval?: number; // Max number of unique IPs to track (to prevent memory leaks)
    interval?: number; // Window size in milliseconds
};

export class RateLimiter {
    private tokenCache: Map<string, number[]>;
    private uniqueTokenPerInterval: number;
    private interval: number;

    constructor(options?: Options) {
        this.tokenCache = new Map();
        this.uniqueTokenPerInterval = options?.uniqueTokenPerInterval || 500;
        this.interval = options?.interval || 60000; // Default 1 minute
    }

    /**
     * Check if the request is allowed
     * @param limit Max requests allowed per interval
     * @param token Unique identifier (e.g., IP address)
     */
    check(limit: number, token: string): Promise<boolean> {
        return new Promise((resolve) => {
            const now = Date.now();
            const tokenCount = this.tokenCache.get(token) || [0];
            const [currentUsage, lastResetTime] = tokenCount;

            // If the cache is too large, reset it (simple cleanup strategy)
            // In a real prod environment, we might use LRU cache
            if (this.tokenCache.size > this.uniqueTokenPerInterval) {
                this.tokenCache.clear();
            }

            // If time window has passed, reset the counter
            if (!lastResetTime || now - lastResetTime > this.interval) {
                this.tokenCache.set(token, [1, now]);
                return resolve(true);
            }

            // If within window, check limit
            if (currentUsage < limit) {
                this.tokenCache.set(token, [currentUsage + 1, lastResetTime]);
                return resolve(true);
            }

            // Limit exceeded
            return resolve(false);
        });
    }
}

// Global instance for the middleware to use across requests
// In Next.js dev mode, this might reset on fast refresh, which is fine.
export const rateLimiter = new RateLimiter({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 IPs tracked at once
});

export const authRateLimiter = new RateLimiter({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500,
});

export const uploadRateLimiter = new RateLimiter({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500,
});
