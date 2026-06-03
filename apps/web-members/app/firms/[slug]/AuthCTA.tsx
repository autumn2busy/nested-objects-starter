'use client'

import { useAuth } from '@/components/auth-provider'
import { trackPaywallHit, trackUpgradeClicked } from '@/lib/ac-events'

interface AuthCTAProps {
    children: React.ReactNode
}

/**
 * Wraps firm hero CTAs.
 * Guests are prompted to log in; Free members are sent to pricing; Pro+ members
 * get the real firm contact/apply links.
 */
export function AuthCTA({ children }: AuthCTAProps) {
    const { isAuthenticated, isLoading, login, planUid, hasAccess } = useAuth()

    if (isLoading) return null

    if (isAuthenticated && hasAccess('firm_intel')) {
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
