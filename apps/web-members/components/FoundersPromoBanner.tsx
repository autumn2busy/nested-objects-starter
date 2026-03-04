'use client'

import { useEffect, useState } from 'react'
import { PLAN_UIDS } from '@/lib/plan-config'

// ─── SET YOUR PROMO END DATE HERE ───────────────────────────────────
// Change this to whatever date you want the promo to expire.
// The banner auto-hides after this date — no code change needed.
const PROMO_END = new Date('2026-03-11T00:00:00-05:00') // March 11, 2026 midnight EST
// ────────────────────────────────────────────────────────────────────

function getTimeLeft() {
    const now = new Date()
    const diff = PROMO_END.getTime() - now.getTime()

    if (diff <= 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
}

export function FoundersPromoBanner() {
    const [timeLeft, setTimeLeft] = useState(getTimeLeft())
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = getTimeLeft()
            if (!remaining) {
                clearInterval(interval)
            }
            setTimeLeft(remaining)
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    // Don't render if promo expired or user dismissed
    if (!timeLeft || dismissed) return null

    const handleSignup = () => {
        if (typeof window !== 'undefined' && (window as any).Outseta?.auth?.open) {
            (window as any).Outseta.auth.open({
                widgetMode: 'register',
                planUid: PLAN_UIDS.FOUNDERS,
                planPaymentTerm: 'year',
                skipPlanOptions: true,
            })
        } else {
            window.location.href = `https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${PLAN_UIDS.FOUNDERS}`
        }
    }

    return (
        <div className="relative isolate bg-slate-900 text-white">
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

            <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                    {/* Left: Message */}
                    <div className="text-center sm:text-left">
                        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                            Founders Week — Final Extension
                        </p>
                        <p className="mt-1 text-base sm:text-lg font-bold">
                            Lock in <span className="text-emerald-400">$37/year</span> for life.
                            <span className="hidden sm:inline"> Full directory + training + AI tools.</span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400 sm:hidden">
                            Full directory + training + AI tools.
                        </p>
                    </div>

                    {/* Center: Countdown */}
                    <div className="flex items-center gap-3 text-center" aria-label="Time remaining">
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tabular-nums text-white">{timeLeft.days}</span>
                            <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">days</span>
                        </div>
                        <span className="text-slate-500 text-lg font-light">:</span>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tabular-nums text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">hrs</span>
                        </div>
                        <span className="text-slate-500 text-lg font-light">:</span>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tabular-nums text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">min</span>
                        </div>
                        <span className="text-slate-500 text-lg font-light">:</span>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tabular-nums text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">sec</span>
                        </div>
                    </div>

                    {/* Right: CTA */}
                    <button
                        onClick={handleSignup}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                        Claim Founders Rate
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}