'use client'

import { useEffect, useState } from 'react'
import { PLAN_UIDS } from '@/lib/plan-config'
import { useAuth } from '@/components/auth-provider'
import { trackOutsetaModalOpen, trackUpgradeStarted } from '@/lib/ac-events'

// ─── SET YOUR PROMO END DATE HERE ───────────────────────────────────
// Change this to whatever date you want the promo to expire.
// The banner auto-hides after this date — no code change needed.
const PROMO_END = new Date('2026-06-19T23:59:59-05:00') // June 19, 2026
const PROMO_CODE = 'SUMMER2026'
const bannerShellClass = 'relative isolate min-h-[10.75rem] overflow-x-clip bg-slate-950 text-white sm:min-h-[6.25rem]'
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
    const { isAuthenticated, planUid, isLoading } = useAuth()
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

    // Reserve first-load space while auth resolves so public pages do not shift after hydration.
    if (isLoading) {
        return <div className={bannerShellClass} aria-hidden="true" />
    }

    // Don't render if promo expired, user dismissed, or if authenticated paid user
    if (isAuthenticated && planUid && planUid !== PLAN_UIDS.FREE) return null
    if (!timeLeft || dismissed) return null

    const handlePromoClick = () => {
        if (typeof window === 'undefined') return

        const Outseta = (window as any).Outseta
        const planChangeParams = {
            planUid: PLAN_UIDS.PRO,
            planPaymentTerm: 'month',
            skipPlanOptions: true,
            registrationDefaults,
        }

        const redirectToPlanChange = () => {
            const params = new URLSearchParams({
                planUid: PLAN_UIDS.PRO,
                planPaymentTerm: 'month',
                skipPlanOptions: 'true',
                registrationDefaults: JSON.stringify(registrationDefaults),
            })
            window.location.href = `https://nested-objects.outseta.com/profile?${params.toString()}#o-plan-change`
        }

        if (Outseta?.auth?.open) {
            if (isAuthenticated) {
                trackUpgradeStarted({
                    sourcePage: 'promo_banner',
                    fromPlan: 'Free',
                    targetPlan: 'Pro',
                    targetPlanUid: PLAN_UIDS.PRO,
                    promoCode: PROMO_CODE,
                })

                trackOutsetaModalOpen({
                    sourcePage: 'promo_banner',
                    mode: 'profile_plan_change',
                    targetPlan: 'Pro',
                    targetPlanUid: PLAN_UIDS.PRO,
                    promoCode: PROMO_CODE,
                })

                if (Outseta?.profile?.open) {
                    Outseta.profile.open({
                        tab: 'planChange',
                        ...planChangeParams,
                    })
                } else {
                    redirectToPlanChange()
                }
                return
            }

            trackUpgradeStarted({
                sourcePage: 'promo_banner',
                fromPlan: 'anonymous',
                targetPlan: 'Pro',
                targetPlanUid: PLAN_UIDS.PRO,
                promoCode: PROMO_CODE,
                value: 29,
                currency: 'USD',
            })

            trackOutsetaModalOpen({
                sourcePage: 'promo_banner',
                mode: 'register',
                targetPlan: 'Pro',
                targetPlanUid: PLAN_UIDS.PRO,
                promoCode: PROMO_CODE,
            })

            Outseta.auth.open({
                widgetMode: 'register',
                planUid: PLAN_UIDS.PRO,
                planPaymentTerm: 'month',
                skipPlanOptions: true,
                registrationDefaults,
            })
        } else if (isAuthenticated) {
            redirectToPlanChange()
        } else {
            trackUpgradeStarted({
                sourcePage: 'promo_banner',
                fromPlan: 'anonymous',
                targetPlan: 'Pro',
                targetPlanUid: PLAN_UIDS.PRO,
                promoCode: PROMO_CODE,
                value: 29,
                currency: 'USD',
            })

            trackOutsetaModalOpen({
                sourcePage: 'promo_banner',
                mode: 'register_redirect',
                targetPlan: 'Pro',
                targetPlanUid: PLAN_UIDS.PRO,
                promoCode: PROMO_CODE,
            })

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
        <div className={bannerShellClass}>
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

            <div className="mx-auto flex max-w-5xl items-center px-3 py-2.5 sm:min-h-[5.5rem] sm:px-6 sm:py-3">
                <div className="grid w-full items-center gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_10.5rem] sm:gap-4">
                    {/* Left: Message */}
                    <div className="min-w-0 text-center sm:text-left">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-amber-300 sm:text-sm">
                            Summer Ramp Special
                        </p>
                        <p className="mt-0.5 text-xs font-bold leading-snug text-white sm:mt-1 sm:truncate sm:text-base">
                            First month of Pro for <span className="text-amber-300">$29 today</span> with code{' '}
                            <span className="rounded bg-amber-200 px-1.5 py-0.5 font-mono text-slate-950">{PROMO_CODE}</span>
                            <span className="hidden text-slate-100 lg:inline">. Full directory + AI tools.</span>
                        </p>
                        <p className="mt-0.5 text-[0.68rem] leading-snug text-slate-300 sm:text-[0.7rem]">
                            Promo replaces the 7-day trial. Renews at $49/mo unless canceled.
                        </p>
                    </div>

                    {/* Center: Countdown */}
                    <div className="mx-auto grid w-36 grid-cols-[1fr_auto_1fr_auto_1fr] items-center text-center sm:w-full" aria-label="Time remaining">
                        <div className="flex w-10 flex-col justify-self-center">
                            <span className="text-lg font-bold tabular-nums text-white sm:text-xl">{timeLeft.days}</span>
                            <span className="text-[0.6rem] uppercase tracking-wide text-slate-300">days</span>
                        </div>
                        <span className="text-lg font-light text-slate-300">:</span>
                        <div className="flex w-10 flex-col justify-self-center">
                            <span className="text-lg font-bold tabular-nums text-white sm:text-xl">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="text-[0.6rem] uppercase tracking-wide text-slate-300">hrs</span>
                        </div>
                        <span className="text-lg font-light text-slate-300">:</span>
                        <div className="flex w-10 flex-col justify-self-center">
                            <span className="text-lg font-bold tabular-nums text-white sm:text-xl">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="text-[0.6rem] uppercase tracking-wide text-slate-300">min</span>
                        </div>
                    </div>

                    {/* Right: CTA */}
                    <button
                        onClick={handlePromoClick}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:min-h-11 sm:min-w-[10.5rem] sm:py-2.5"
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
