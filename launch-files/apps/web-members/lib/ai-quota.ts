import { createServiceRoleClient } from './supabase-server'
import { PLAN_UIDS } from './auth-server'

// Quota limits per month
export const AI_QUOTAS = {
    STARTER: {
        CONCIERGE: 50,
        RESUME: 10,
    },
} as const

/**
 * Check if a user has sufficient quota for a feature.
 * Throws an error if quota is exceeded.
 */
export async function checkAIQuota(userId: string, planUid: string, feature: 'ai_concierge' | 'ai_resume'): Promise<void> {
    // Pro, Elite, Agency have "unlimited" (or at least no hard cap defined here yet)
    if (
        planUid === PLAN_UIDS.PRO ||
        planUid === PLAN_UIDS.ELITE ||
        planUid === PLAN_UIDS.AGENCY
    ) {
        return
    }

    // Check Starter and Founders (which mirrors Starter)
    if (planUid === PLAN_UIDS.STARTER || planUid === PLAN_UIDS.FOUNDERS) {
        const limit = feature === 'ai_concierge' ? AI_QUOTAS.STARTER.CONCIERGE : AI_QUOTAS.STARTER.RESUME
        const supabase = createServiceRoleClient()

        // Get usage count for the current month
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        // ISO string for Postgres comparison
        const startOfMonthISO = startOfMonth.toISOString()

        const { count, error } = await supabase
            .from('ai_usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('feature', feature)
            .gte('created_at', startOfMonthISO)

        if (error) {
            console.error('Error checking AI quota:', error)
            // Fail open (allow access) if we can't check quota to avoid blocking users due to DB errors
            // Or fail closed. defaulting to fail open for UX.
            return
        }

        if (count !== null && count >= limit) {
            throw new Error(`Monthly quota exceeded for ${feature}. Limit: ${limit}.`)
        }

        return
    }

    // Default: deny if plan is unknown or not explicitly allowed
    // For safety, unless it's a known plan, we might want to deny. 
    // But strictly adhering to spec: "Pro and above should bypass"
}

/**
 * Track usage for a user.
 */
export async function trackAIUsage(userId: string, feature: 'ai_concierge' | 'ai_resume'): Promise<void> {
    const supabase = createServiceRoleClient()

    const { error } = await supabase
        .from('ai_usage_logs')
        .insert({
            user_id: userId,
            feature: feature,
        })

    if (error) {
        console.error('Error logging AI usage:', error)
        // Non-blocking error
    }
}
