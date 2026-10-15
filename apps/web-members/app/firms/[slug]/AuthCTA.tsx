'use client'

import { useAuth } from '@/components/auth-provider'
import { trackPaywallHit, trackUpgradeClicked } from '@/lib/ac-events'
import { PAID_PLANS } from '@/lib/plan-config'

interface AuthCTAProps {
    children: React.ReactNode
}

/**
 * Wraps firm hero CTAs using the same paid-plan allowlist as the server page.
 * Eligible grandfathered directory members retain the real contact/apply links
 * without receiving unrelated Pro or Elite features. Subscription state and
 * effective expiration must be verified at the server boundary.
 */
export function AuthCTA({ children }: AuthCTAProps) {
    const { isAuthenticated, isLoading, login, planUid } = useAuth()

    if (isLoading) return null

    if (isAuthenticated && planUid && PAID_PLANS.includes(planUid)) {
        return <>{children}</>
    }

    return (
        <div
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()

                if (!isAuthenticated) {
                    trackPaywallHit({
                        sourcePage: 'firm_detail',
                        feature: 'firm_intel_contact_cta',
                        isAuthenticated: false,
                    })
                    login()
                    return
                }

                trackPaywallHit({
                    sourcePage: 'firm_detail',
                    feature: 'firm_intel_contact_cta',
                    planUid,
                    isAuthenticated: true,
                })
                trackUpgradeClicked('firm_detail_contact_cta', 'Pro', {
                    planUid,
                    feature: 'firm_intel',
                })
                window.location.href = '/membership-pricing'
            }}
            className="cursor-pointer"
        >
            <div className="pointer-events-none">
                {children}
            </div>
        </div>
    )
}
