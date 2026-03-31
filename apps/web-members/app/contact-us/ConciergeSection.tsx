'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

/**
 * ConciergeSection — Client component for the Contact Us page.
 * Shows "Request a call" + "Book gaming session" for Elite/Agency.
 * Shows "Upgrade for concierge" for everyone else.
 */

// Elite = NmdnNO90, Agency = rmk5Xk9g
const ELITE_AGENCY_UIDS = ['NmdnNO90', 'rmk5Xk9g']

const CALENDAR_LINK = 'https://calendar.app.google/UYJz8Ythw1tCbdPn6'
const STRATEGY_CALL_LINK = 'https://calendar.app.google/ndksjETjb3CbYTs28'
const GAMING_SESSION_LINK = 'https://calendar.app.google/NrcA4CNwzH28vnZn9'

export default function ConciergeSection() {
    const { isAuthenticated, planUid, isLoading } = useAuth()

    const isEliteOrAgency = isAuthenticated && planUid && ELITE_AGENCY_UIDS.includes(planUid)

    return (
        <div className="rounded-2xl border border-brand-copper/20 bg-brand-dark p-5 text-slate-100">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-copper">Elite perks</p>
            <p className="mt-2 text-sm text-slate-100">
                Active Elite and Agency members can request a 15-minute concierge call or book a 1-to-1 gaming session to talk strategy, routes, and partner intros.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
                {isLoading ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white">
                        Checking plan…
                    </span>
                ) : isEliteOrAgency ? (
                    <>
                        <a
                            href={CALENDAR_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-dark transition hover:bg-brand-mist"
                        >
                            Request a call
                        </a>
                        <a
                            href={GAMING_SESSION_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-brand-copper bg-brand-copper/10 px-4 py-2 text-xs font-semibold text-brand-copper transition hover:bg-brand-copper/20"
                        >
                            Book gaming session
                        </a>
                    </>
                ) : (
                    <>
                        <span className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold text-white/60 cursor-not-allowed">
                            Request a call
                        </span>
                        <span className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold text-white/60 cursor-not-allowed">
                            Book gaming session
                        </span>
                        <Link
                            href="/membership-pricing"
                            className="inline-flex items-center justify-center rounded-full border border-white/40 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                            Upgrade to Elite
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}