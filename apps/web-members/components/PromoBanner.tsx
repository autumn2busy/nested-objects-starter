'use client'

import { useEffect, useState } from 'react'
import { PLAN_UIDS } from '@/lib/plan-config'

// ─── SET YOUR PROMO END DATE HERE ───────────────────────────────────
// Change this to whatever date you want the promo to expire.
// The banner auto-hides after this date — no code change needed.
const PROMO_END = new Date('2026-06-19T23:59:59-05:00') // June 19, 2026
const PROMO_CODE = 'SUMMER26'
// ────────────────────────────────────────────────────────────────────

const registrationDefaults = {
    Subscription: {
        DiscountCouponSubscriptions: [
            {
                DiscountCoupon: {
                    UniqueIdentifier: PROMO_CODE,
                },
            },
        ],
    },
}

function getTimeLeft() {
    const now = new Date()
    const diff = PROMO_END.getTime() - now.getTime()

    if (diff <= 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return { days, hours, minutes }
}

export function PromoBanner() {
    const [timeLeft, setTimeLeft] = useState(getTimeLeft())
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = getTimeLeft()
            if (!remaining) {
                clearInterval(interval)
            }
            setTimeLeft(remaining)
        }, 60_000)

        return () => clearInterval(interval)
    }, [])

    // Don't render if promo expired or user dismissed
    if (!timeLeft || dismissed) return null

    const handleSignup = () => {
        if (typeof window !== 'undefined' && (window as any).Outseta?.auth?.open) {
            (window as any).Outseta.auth.open({
                widgetMode: 'register',
                planUid: PLAN_UIDS.PRO, // Assuming PRO plan
                planPaymentTerm: 'month',
                skipPlanOptions: true,
                registrationDefaults,
            })
        } else {
            const params = new URLSearchParams({
                widgetMode: 'register',
                planUid: PLAN_UIDS.PRO,
                planPaymentTerm: 'month',
                skipPlanOptions: 'true',
                registrationDefaults: JSON.stringify(registrationDefaults),
            })
            window.location.href = `https://nested-objects.outseta.com/auth?${params.toString()}#o-anonymous`
        }
    }

    return (
        <div className="relative isolate min-h-[8.5rem] bg-slate-900 text-white sm:min-h-[5.5rem]">
            {/* Dismiss button */}
            <button
                onClick={() => setDismissed(true)}
                className="absolute right-3 top-3 z-10 text-white/50 hover:text-white transition"
                aria-label="Dismiss banner"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            <div className="mx-auto flex min-h-[8.5rem] max-w-5xl items-center px-4 py-4 sm:min-h-[5.5rem] sm:px-6 sm:py-3">
                <div className="grid w-full items-center gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_10.5rem] sm:gap-4">
                    {/* Left: Message */}
                    <div className="min-w-0 text-center sm:text-left">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 sm:text-sm">
                            Summer Ramp Special
                        </p>
                        <p className="mt-1 text-sm font-bold leading-snug text-white sm:truncate sm:text-base">
                            First month of Pro for <span className="text-amber-400">$29</span> with code{' '}
                            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-amber-300">{PROMO_CODE}</span>
                            <span className="hidden text-slate-100 lg:inline">. Full directory + AI tools.</span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400 sm:hidden">
                            Full directory + AI tools.
                        </p>
                    </div>

                    {/* Center: Countdown */}
                    <div className="mx-auto grid w-40 grid-cols-[1fr_auto_1fr_auto_1fr] items-center text-center sm:w-full" aria-label="Time remaining">
                        <div className="flex w-10 flex-col justify-self-center">
                            <span className="text-xl font-bold tabular-nums text-white">{timeLeft.days}</span>
                            <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">days</span>
                        </div>
                        <span className="text-lg font-light text-slate-500">:</span>
                        <div className="flex w-10 flex-col justify-self-center">
                            <span className="text-xl font-bold tabular-nums text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">hrs</span>
                        </div>
                        <span className="text-lg font-light text-slate-500">:</span>
                        <div className="flex w-10 flex-col justify-self-center">
                            <span className="text-xl font-bold tabular-nums text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">min</span>
                        </div>
                    </div>

                    {/* Right: CTA */}
                    <button
                        onClick={handleSignup}
                        className="inline-flex min-h-11 w-full min-w-[10.5rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                        Claim Summer Rate
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
