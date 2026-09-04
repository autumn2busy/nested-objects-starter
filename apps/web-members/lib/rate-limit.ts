import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitConfig {
    limit: number;
    intervalMs: number;
}

export type RateLimitBackend = 'upstash' | 'memory';

export type RateLimitDegradedReason =
    | 'upstash_unconfigured'
    | 'upstash_configuration_incomplete'
    | 'upstash_unavailable';

export interface RateLimitState {
    backend: RateLimitBackend;
    degraded: boolean;
    reason: RateLimitDegradedReason | null;
}

export type RateLimitErrorCode =
    | 'RATE_LIMIT_EXCEEDED'
    | 'RATE_LIMIT_BACKEND_UNAVAILABLE';

export class RateLimitError extends Error {
    readonly code: RateLimitErrorCode;
    readonly state: RateLimitState;

    constructor(code: RateLimitErrorCode, state: RateLimitState) {
        super(code === 'RATE_LIMIT_EXCEEDED' ? 'Rate limit exceeded' : 'Rate limit service unavailable');
        this.name = 'RateLimitError';
        this.code = code;
        this.state = { ...state };
    }
}

function hasRateLimitCode(error: unknown, code: RateLimitErrorCode): boolean {
    return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code);
}

export function isRateLimitExceededError(error: unknown): boolean {
    return hasRateLimitCode(error, 'RATE_LIMIT_EXCEEDED');
}

export function isRateLimitUnavailableError(error: unknown): boolean {
    return hasRateLimitCode(error, 'RATE_LIMIT_BACKEND_UNAVAILABLE');
}

const rates = new Map<string, { count: number; lastReset: number }>();

/**
 * Robust rate limiter.
 * Uses Upstash Redis for distributed state if environment variables are present.
 * Falls back to an explicitly degraded in-memory map only when Upstash is wholly unconfigured.
 * Partial configuration and runtime Upstash failures fail closed instead of being reported as
 * ordinary client throttling.
 */
export function rateLimit({ limit, intervalMs }: RateLimitConfig) {
    let upstashLimiter: Ratelimit | null = null;
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    const hasCompleteUpstashConfiguration = Boolean(upstashUrl && upstashToken);
    const hasPartialUpstashConfiguration = Boolean(upstashUrl || upstashToken) && !hasCompleteUpstashConfiguration;
    let state: RateLimitState = hasCompleteUpstashConfiguration
        ? { backend: 'upstash', degraded: false, reason: null }
        : hasPartialUpstashConfiguration
            ? { backend: 'upstash', degraded: true, reason: 'upstash_configuration_incomplete' }
            : { backend: 'memory', degraded: true, reason: 'upstash_unconfigured' };
    let lastReportedState: string | null = null;

    if (upstashUrl && upstashToken) {
        const redis = new Redis({
            url: upstashUrl,
            token: upstashToken,
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

    function reportState(nextState: RateLimitState) {
        const serialized = `${nextState.backend}:${nextState.degraded}:${nextState.reason ?? 'healthy'}`;
        if (serialized === lastReportedState) return;
        lastReportedState = serialized;

        // Deliberately emit only fixed state labels. Never include the request key,
        // Upstash URL/token, or the remote error object in application logs.
        const details = {
            backend: nextState.backend,
            degraded: nextState.degraded,
            reason: nextState.reason,
        };
        if (nextState.degraded) {
            console.warn('[Rate Limit] State changed', details);
        } else {
            console.info('[Rate Limit] State changed', details);
        }
    }

    function updateState(nextState: RateLimitState) {
        const changed = state.backend !== nextState.backend
            || state.degraded !== nextState.degraded
            || state.reason !== nextState.reason;
        state = nextState;
        if (changed || nextState.degraded) reportState(nextState);
    }

    return {
        getState: (): RateLimitState => ({ ...state }),
        check: async (id: string): Promise<RateLimitState> => {
            if (hasPartialUpstashConfiguration) {
                reportState(state);
                throw new RateLimitError('RATE_LIMIT_BACKEND_UNAVAILABLE', state);
            }

            if (upstashLimiter) {
                let success: boolean;
                try {
                    ({ success } = await upstashLimiter.limit(id));
                    updateState({ backend: 'upstash', degraded: false, reason: null });
                } catch {
                    updateState({ backend: 'upstash', degraded: true, reason: 'upstash_unavailable' });
                    throw new RateLimitError('RATE_LIMIT_BACKEND_UNAVAILABLE', state);
                }
                if (!success) {
                    throw new RateLimitError('RATE_LIMIT_EXCEEDED', state);
                }
                return { ...state };
            }

            // --- Fallback Strategy (In-Memory) ---
            reportState(state);
            const now = Date.now();
            const record = rates.get(id);

            if (!record) {
                rates.set(id, { count: 1, lastReset: now });
                return { ...state };
            }

            if (now - record.lastReset > intervalMs) {
                // Interval passed, reset count
                rates.set(id, { count: 1, lastReset: now });
                return { ...state };
            }

            if (record.count >= limit) {
                throw new RateLimitError('RATE_LIMIT_EXCEEDED', state);
            }

            record.count += 1;
            return { ...state };
        }
    };
}
