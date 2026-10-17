'use client'

import { useEffect, useRef, useState } from 'react'
import { decorateAcquisitionUrl } from '../../../../packages/acquisition-attribution'

import { useAuth } from '@/components/auth-provider'
import { membershipPlans, type MembershipPlan } from '@/lib/ai-datasets'
import { PLAN_UIDS } from '@/lib/plan-config'
import { beginPricingHandoff, waitForPricingWidget } from '@/lib/pricing-handoff'
import {
  trackJoinFreeClick,
  trackOutsetaModalOpen,
  trackPricingCtaClick,
  trackPricingView,
  trackSignupStarted,
  trackStartTrial,
  trackUpgradeStarted,
  trackEvent,
} from '@/lib/ac-events'

function getCurrentPlanName(planUid: string | null, isAuthenticated: boolean) {
  return membershipPlans.find((plan) => plan.planUid === planUid)?.name || (isAuthenticated ? 'Member' : null)
}

function getPlanPaymentTerm(plan: MembershipPlan) {
  if (plan.period === 'forever') return undefined
  return plan.period.includes('month') ? 'month' : 'oneTime'
}

function scheduleIdleWork(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, { timeout: 2500 })
    return () => window.cancelIdleCallback(idleId)
  }

  const timeoutId = globalThis.setTimeout(callback, 2000)
  return () => globalThis.clearTimeout(timeoutId)
}

function usePricingActions() {
  const { isAuthenticated, planUid, isLoading, user } = useAuth()
  const currentPlanName = getCurrentPlanName(planUid, isAuthenticated)
  const [pending, setPending] = useState(false)
  const [recovery, setRecovery] = useState<{ href: string; record: () => void } | null>(null)
  const attempt = useRef<ReturnType<typeof beginPricingHandoff> | null>(null)
  const readiness = useRef<AbortController | null>(null)
  const busy = useRef(false)
  useEffect(() => {
    readiness.current?.abort()
    attempt.current?.stop()
    busy.current = false
    setPending(false)
    setRecovery(null)
    return () => { readiness.current?.abort(); attempt.current?.stop(); busy.current = false }
  }, [isAuthenticated, planUid, user?.sub])

  const openPlanWidget = async (plan: MembershipPlan, isCurrentPlan: boolean) => {
    if (isLoading || isCurrentPlan || plan.waitlist || busy.current) return
    if (typeof window === 'undefined') return

    readiness.current?.abort()
    const controller = new AbortController()
    readiness.current = controller
    const targetPlan = plan.name
    const targetPlanUid = plan.planUid
    const planPaymentTerm = getPlanPaymentTerm(plan)
    attempt.current?.stop()
    busy.current = true
    setPending(true)
    setRecovery(null)
    const fallbackHref = isAuthenticated
      ? 'https://nested-objects.outseta.com/profile#o-plan-change'
      : decorateAcquisitionUrl(`https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${plan.planUid}&skipPlanOptions=true`, 'membership_pricing')
    const context = { sourcePage: 'membership_pricing', currentPlan: currentPlanName ?? 'anonymous',
      targetPlan, targetPlanUid, isAuthenticated, mode: isAuthenticated ? 'profile_plan_change' : 'register' }
    const handoff = beginPricingHandoff({
      widget: isAuthenticated ? 'profile' : 'auth',
      emit: event => trackEvent('checkout_handoff', { ...context, ...event }),
      observed: () => { busy.current = false; setPending(false) },
      unavailable: () => {
        busy.current = false
        setPending(false)
        setRecovery({ href: fallbackHref, record: () => handoff.recovery() })
      },
    })
    attempt.current = handoff

    trackPricingCtaClick({
      sourcePage: 'membership_pricing',
      currentPlan: currentPlanName ?? 'anonymous',
      targetPlan,
      targetPlanUid,
      isAuthenticated,
      handoffId: handoff.handoffId,
    })

    if (!isAuthenticated && targetPlan === 'Free') {
      trackJoinFreeClick({
        sourcePage: 'membership_pricing',
        targetPlan,
        targetPlanUid,
        handoffId: handoff.handoffId,
      })
    }

    if (!isAuthenticated && targetPlan === 'Pro') {
      trackStartTrial({
        sourcePage: 'membership_pricing',
        targetPlan,
        targetPlanUid,
        value: 0,
        currency: 'USD',
        handoffId: handoff.handoffId,
      })
    }

    if (isAuthenticated && targetPlan !== currentPlanName) {
      trackUpgradeStarted({
        sourcePage: 'membership_pricing',
        fromPlan: currentPlanName ?? 'unknown',
        targetPlan,
        targetPlanUid,
        handoffId: handoff.handoffId,
      })
    }

    if (isAuthenticated) {
      trackOutsetaModalOpen({
        sourcePage: 'membership_pricing',
        mode: 'profile_plan_change',
        targetPlan,
        targetPlanUid,
        handoffId: handoff.handoffId,
      })

      await waitForPricingWidget('profile', controller.signal)
      if (controller.signal.aborted) return
      const Outseta = window.Outseta
      try {
        if (Outseta?.profile?.open) {
          Promise.resolve(Outseta.profile.open({ tab: 'planChange' })).catch(() => handoff.failed())
          handoff.check()
        } else {
          handoff.redirect()
          window.location.href = fallbackHref
        }
      } catch { if (Outseta?.profile?.open) handoff.failed(); else handoff.redirectFailed() }
      return
    }

    trackSignupStarted(targetPlan)

    await waitForPricingWidget('auth', controller.signal)
    if (controller.signal.aborted) return
    const Outseta = window.Outseta

    if (Outseta?.auth?.open) {
      trackOutsetaModalOpen({
        sourcePage: 'membership_pricing',
        mode: 'register',
        targetPlan,
        targetPlanUid,
        planPaymentTerm,
        handoffId: handoff.handoffId,
      })

      try { Promise.resolve(Outseta.auth.open({
        widgetMode: 'register',
        planUid: plan.planUid,
        planPaymentTerm,
        skipPlanOptions: true,
      })).catch(() => handoff.failed()); handoff.check() } catch { handoff.failed() }
      return
    }

    trackOutsetaModalOpen({
      sourcePage: 'membership_pricing',
      mode: 'register_redirect',
      targetPlan,
      targetPlanUid,
      planPaymentTerm,
      handoffId: handoff.handoffId,
    })

    handoff.redirect()
    try { window.location.href = fallbackHref } catch { handoff.redirectFailed() }
  }

  const openManageBilling = () => {
    if (isAuthenticated) {
      window.Outseta?.profile?.open({ tab: 'billing' })
    }
  }

  return {
    currentPlanName,
    isAuthenticated,
    isLoading,
    openManageBilling,
    openPlanWidget,
    planUid,
    pending,
    recovery,
  }
}

export function PricingViewTracker() {
  const { currentPlanName, isAuthenticated, isLoading, planUid } = usePricingActions()

  useEffect(() => {
    if (isLoading) return

    return scheduleIdleWork(() => {
      trackPricingView({
        sourcePage: 'membership_pricing',
        currentPlan: currentPlanName ?? 'anonymous',
        planUid: planUid ?? null,
        isAuthenticated,
      })
    })
  }, [currentPlanName, isAuthenticated, isLoading, planUid])

  return null
}

export function PricingHeroAccountStatus() {
  const { currentPlanName, isAuthenticated, isLoading } = usePricingActions()

  if (!isLoading && isAuthenticated && currentPlanName) {
    return (
      <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        Signed in. Current plan: <span className="font-semibold">{currentPlanName}</span>
      </p>
    )
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <p className="mx-auto mt-4 max-w-[16rem] text-sm text-slate-500 min-[380px]:max-w-[18rem] sm:max-w-none">
        Start Pro with $0 due today for 7 days, or create a Free account with no card required.
      </p>
    )
  }

  return null
}

export function CurrentPlanBadge({ planUid: targetPlanUid }: { planUid: string }) {
  const { isAuthenticated, planUid } = usePricingActions()

  if (!isAuthenticated || planUid !== targetPlanUid) return null

  return (
    <div className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
      Current
    </div>
  )
}

export function PricingPlanButton({ plan }: { plan: MembershipPlan }) {
  const { currentPlanName, isAuthenticated, isLoading, openPlanWidget, planUid, pending, recovery } = usePricingActions()
  const isCurrentPlan = planUid === plan.planUid

  const buttonBase =
    'inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900/0 transition'

  let buttonClasses = ''
  if (isCurrentPlan) {
    buttonClasses = `${buttonBase} cursor-not-allowed bg-slate-100 text-slate-500`
  } else if (plan.waitlist) {
    buttonClasses = `${buttonBase} cursor-not-allowed bg-slate-50 text-slate-400 border border-slate-200`
  } else if (plan.highlight) {
    buttonClasses = `${buttonBase} bg-brand-copper text-white shadow-sm hover:bg-brand-copperDark`
  } else {
    buttonClasses = `${buttonBase} border border-brand-copper text-brand-copperDark hover:bg-brand-mist`
  }

  const label = (() => {
    if (isLoading) return 'Checking your plan…'
    if (pending) return 'Opening plan form…'
    if (isCurrentPlan) return 'Current plan'
    if (plan.waitlist) return plan.name === 'Agency' ? 'Team access in preparation' : 'Join Waitlist'
    if (!isAuthenticated && plan.name === 'Free') return 'Join for Free'
    if (!isAuthenticated && plan.name === 'Pro') return 'Start Pro Trial - $0 Due Today'
    if (isAuthenticated) return `Upgrade to ${plan.name}`
    return 'Sign up'
  })()

  return (
    <>
      <button
        type="button"
        disabled={isLoading || isCurrentPlan || plan.waitlist === true || pending}
        aria-busy={isLoading || pending}
        className={buttonClasses}
        onClick={() => openPlanWidget(plan, isCurrentPlan)}
      >
        {label}
      </button>
      <PricingHandoffRecovery recovery={recovery} />

      {plan.name === 'Free' && (
        <p className="mt-2 text-center text-xs text-text-muted">
          No credit card required
        </p>
      )}
      {plan.planUid === PLAN_UIDS.PRO && (
        <p className="mt-2 text-center text-xs text-brand-copper">
          7-day free trial. Cancel before paid billing begins.
        </p>
      )}
      {isCurrentPlan && currentPlanName && (
        <p className="mt-2 text-center text-xs text-emerald-700">
          You are currently on {currentPlanName}.
        </p>
      )}
    </>
  )
}

export function PricingFinalCta({ proPlan }: { proPlan: MembershipPlan }) {
  const { isAuthenticated, isLoading, openManageBilling, openPlanWidget, planUid, pending, recovery } = usePricingActions()

  if (isAuthenticated && (planUid === PLAN_UIDS.ELITE || planUid === PLAN_UIDS.AGENCY)) {
    return (
      <button
        type="button"
        onClick={openManageBilling}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        Open manage plan &amp; billing
      </button>
    )
  }

  if (isAuthenticated && planUid === PLAN_UIDS.PRO) {
    return (
      <><button
        type="button"
        disabled={isLoading || pending}
        aria-busy={isLoading || pending}
        onClick={() => {
          const elitePlan = membershipPlans.find((plan) => plan.planUid === PLAN_UIDS.ELITE)
          if (elitePlan) openPlanWidget(elitePlan, false)
        }}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        {pending ? 'Opening plan form…' : 'Upgrade to Elite'}
      </button><PricingHandoffRecovery recovery={recovery} /></>
    )
  }

  return (
    <><button
      type="button"
      disabled={isLoading || pending}
      aria-busy={isLoading || pending}
      onClick={() => openPlanWidget(proPlan, false)}
      className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    >
      {isLoading ? 'Checking your plan…' : pending ? 'Opening plan form…' : isAuthenticated ? 'Upgrade to Pro' : 'Start Pro Trial - $0 Due Today'}
    </button><PricingHandoffRecovery recovery={recovery} /></>
  )
}

export function PricingHandoffRecovery({ recovery }: {
  recovery: { href: string; record: () => void } | null
}) {
  if (!recovery) return null
  return <div role="status" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
    <p>We couldn’t confirm that the plan form opened. You can continue on the secure hosted page.</p>
    <a href={recovery.href} onClick={recovery.record}
      className="mt-2 inline-flex min-h-11 items-center font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
      Continue on secure plan page
    </a>
  </div>
}

export function PricingFinalCtaCopy() {
  const { isAuthenticated, planUid } = usePricingActions()

  return (
    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-100 sm:text-base">
      {isAuthenticated && planUid === PLAN_UIDS.PRO
        ? 'Upgrade to Elite for 1-to-1 strategy sessions, partner referrals, and concierge routing reviews.'
        : 'Start Pro with $0 due today so you can see firms, intel, and training in one place before paid billing begins.'}
    </p>
  )
}
