import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitConfig {
    limit: number;
    intervalMs: number;
}

const rates = new Map<string, { count: number; lastReset: number }>();

/**
 * Robust rate limiter.
 * Uses Upstash Redis for distributed state if environment variables are present.
 * Falls back to an in-memory map for basic rate limiting in local dev or limited deployments.
 */
export function rateLimit({ limit, intervalMs }: RateLimitConfig) {
    let upstashLimiter: Ratelimit | null = null;

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        // Convert intervalMs to seconds string for Upstash (e.g., '60 s')
        // @upstash/ratelimit requires typing the string literally like `${number} s`
        const intervalSeconds = Math.max(1, Math.floor(intervalMs / 1000));

        upstashLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(limit, `${intervalSeconds} s` as any),
            analytics: true,
        });
    }

    return {
        check: async (id: string) => {
            if (upstashLimiter) {
                const { success } = await upstashLimiter.limit(id);
                if (!success) {
                    throw new Error('Rate limit exceeded');
                }
                return;
            }

            // --- Fallback Strategy (In-Memory) ---
            const now = Date.now();
            const record = rates.get(id);

            if (!record) {
                rates.set(id, { count: 1, lastReset: now });
                return;
            }

            if (now - record.lastReset > intervalMs) {
                // Interval passed, reset count
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
