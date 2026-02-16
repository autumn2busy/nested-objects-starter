'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

/**
 * ConciergeSection — Client component for the Contact Us page.
 * Shows "Request a call" with Google Calendar link for Elite/Agency.
 * Shows "Upgrade for concierge" for everyone else.
 */

// Elite = NmdnNO90, Agency = rmk5Xk9g
const ELITE_AGENCY_UIDS = ['NmdnNO90', 'rmk5Xk9g']

const CALENDAR_LINK = 'https://calendar.app.google/mhKo47RvNkCTiEp97'

export default function ConciergeSection() {
    const { isAuthenticated, planUid, isLoading } = useAuth()

    const isEliteOrAgency = isAuthenticated && planUid && ELITE_AGENCY_UIDS.includes(planUid)

    return (
        <div className="rounded-2xl border border-brand-copper/20 bg-brand-dark p-5 text-slate-100">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-copper">Call the concierge</p>
            <p className="mt-2 text-sm text-slate-100">
                Active Elite and Agency members can request a 15-minute call to review routes, onboarding steps, or crew rollouts.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
                {isLoading ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white">
                        Checking plan…
                    </span>
                ) : isEliteOrAgency ? (
                    <a
                        href={CALENDAR_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-dark transition hover:bg-brand-mist"
                    >
                        Request a call
                    </a>
                ) : (
                    <>
                        <span className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold text-white/60 cursor-not-allowed">
                            Request a call
                        </span>
                        <Link
                            href="/membership-pricing"
                            className="inline-flex items-center justify-center rounded-full border border-white/40 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                            Upgrade for concierge
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}