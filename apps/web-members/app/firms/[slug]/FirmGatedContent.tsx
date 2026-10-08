'use client'

import { BlurGate } from '@/components/BlurGate'
import { useAuth } from '@/components/auth-provider'
import { PAID_PLANS } from '@/lib/plan-config'

interface FirmGatedContentProps {
    children: React.ReactNode
}

/**
 * Keep the firm-detail presentation consistent with the server page's explicit
 * paid-plan allowlist. Grandfathered Starter/Founders are directory plans, not
 * Pro subscriptions, and must not be rejected by a Pro-only feature ranking.
 *
 * This is a plan-capability check, not subscription-lifecycle verification.
 * The server remains responsible for authentication and effective expiration.
 */
export function FirmGatedContent({ children }: FirmGatedContentProps) {
    const { isAuthenticated, isLoading, planUid } = useAuth()

    if (isLoading) {
        return <div role="status" aria-live="polite">Checking membership access...</div>
    }

    if (isAuthenticated && planUid && PAID_PLANS.includes(planUid)) {
        return <>{children}</>
    }

    return (
        <BlurGate
            feature="firm_intel"
            title="Upgrade to Pro for full firm intel"
            description="Full firm details are included with Pro, Elite, Agency, and eligible grandfathered directory subscriptions."
            ctaLabel="See Pro plans"
            ctaHref="/membership-pricing"
        >
            {children}
        </BlurGate>
    )
}
