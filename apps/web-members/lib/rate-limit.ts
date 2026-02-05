
interface RateLimitConfig {
    interval: number; // in milliseconds
    uniqueTokenPerInterval: number; // max users to track (LRU-ish usually, or just purge)
}

const rates = new Map<string, { count: number; lastReset: number }>();

/**
 * Basic in-memory rate limiter.
 * Note: In Vercel serverless, this memory is per-lambda-instance and ephemeral.
 * Truly distributed rate limiting requires Redis (e.g., Upstash).
 * 
 * @param limit Max requests per interval
 * @param intervalMs Interval in milliseconds
 * @returns { check: (id: string) => Promise<void> }
 */
export function rateLimit({ limit, intervalMs }: { limit: number; intervalMs: number }) {
    return {
        check: async (id: string) => {
            const now = Date.now();
            const record = rates.get(id);

            if (!record) {
                rates.set(id, { count: 1, lastReset: now });
                return;
            }

            if (now - record.lastReset > intervalMs) {
                // Interval passed, reset
                rates.set(id, { count: 1, lastReset: now });
                return;
            }

            if (record.count >= limit) {
                throw new Error('Rate limit exceeded');
            }

            record.count += 1;
        }
    };
}
