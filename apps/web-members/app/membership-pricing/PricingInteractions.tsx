'use client'

import { useEffect } from 'react'

import { useAuth } from '@/components/auth-provider'
import { membershipPlans, type MembershipPlan } from '@/lib/ai-datasets'
import { PLAN_UIDS } from '@/lib/plan-config'
import {
  trackJoinFreeClick,
  trackOutsetaModalOpen,
  trackPricingCtaClick,
  trackPricingView,
  trackStartTrial,
  trackUpgradeStarted,
} from '@/lib/ac-events'

function getCurrentPlanName(planUid: string | null, isAuthenticated: boolean) {
  return membershipPlans.find((plan) => plan.planUid === planUid)?.name || (isAuthenticated ? 'Member' : null)
}

function getPlanPaymentTerm(plan: MembershipPlan) {
  if (plan.period === 'forever') return undefined
  return plan.period.includes('month') ? 'month' : 'oneTime'
}

function usePricingActions() {
  const { isAuthenticated, planUid, isLoading } = useAuth()
  const currentPlanName = getCurrentPlanName(planUid, isAuthenticated)

  const openPlanWidget = (plan: MembershipPlan, isCurrentPlan: boolean) => {
    if (isCurrentPlan || plan.waitlist) return
    if (typeof window === 'undefined') return

    const Outseta = window.Outseta
    const targetPlan = plan.name
    const targetPlanUid = plan.planUid
    const planPaymentTerm = getPlanPaymentTerm(plan)

    trackPricingCtaClick({
      sourcePage: 'membership_pricing',
      currentPlan: currentPlanName ?? 'anonymous',
      targetPlan,
      targetPlanUid,
      isAuthenticated,
    })

    if (!isAuthenticated && targetPlan === 'Free') {
      trackJoinFreeClick({
        sourcePage: 'membership_pricing',
        targetPlan,
        targetPlanUid,
      })
    }

    if (!isAuthenticated && targetPlan === 'Pro') {
      trackStartTrial({
        sourcePage: 'membership_pricing',
        targetPlan,
        targetPlanUid,
        value: 0,
        currency: 'USD',
      })
    }

    if (isAuthenticated && targetPlan !== currentPlanName) {
      trackUpgradeStarted({
        sourcePage: 'membership_pricing',
        fromPlan: currentPlanName ?? 'unknown',
        targetPlan,
        targetPlanUid,
      })
    }

    if (isAuthenticated) {
      trackOutsetaModalOpen({
        sourcePage: 'membership_pricing',
        mode: 'profile_plan_change',
        targetPlan,
        targetPlanUid,
      })

      if (Outseta?.profile?.open) {
        Outseta.profile.open({ tab: 'planChange' })
      } else {
        window.location.href = 'https://nested-objects.outseta.com/profile#o-plan-change'
      }
      return
    }

    if (Outseta?.auth?.open) {
      trackOutsetaModalOpen({
        sourcePage: 'membership_pricing',
        mode: 'register',
        targetPlan,
        targetPlanUid,
        planPaymentTerm,
      })

      Outseta.auth.open({
        widgetMode: 'register',
        planUid: plan.planUid,
        planPaymentTerm,
        skipPlanOptions: true,
      })
      return
    }

    trackOutsetaModalOpen({
      sourcePage: 'membership_pricing',
      mode: 'register_redirect',
      targetPlan,
      targetPlanUid,
      planPaymentTerm,
    })

    window.location.href = `https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${plan.planUid}&skipPlanOptions=true`
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
  }
}

export function PricingViewTracker() {
  const { currentPlanName, isAuthenticated, isLoading, planUid } = usePricingActions()

  useEffect(() => {
    if (isLoading) return

    trackPricingView({
      sourcePage: 'membership_pricing',
      currentPlan: currentPlanName ?? 'anonymous',
      planUid: planUid ?? null,
      isAuthenticated,
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
  const { currentPlanName, isAuthenticated, openPlanWidget, planUid } = usePricingActions()
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
    if (isCurrentPlan) return 'Current plan'
    if (plan.waitlist) return 'Join Waitlist'
    if (!isAuthenticated && plan.name === 'Free') return 'Join for Free'
    if (!isAuthenticated && plan.name === 'Pro') return 'Start Pro Trial - $0 Due Today'
    if (isAuthenticated) return `Upgrade to ${plan.name}`
    return 'Sign up'
  })()

  return (
    <>
      <button
        type="button"
        disabled={isCurrentPlan || plan.waitlist === true}
        className={buttonClasses}
        onClick={() => openPlanWidget(plan, isCurrentPlan)}
      >
        {label}
      </button>

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
  const { isAuthenticated, openManageBilling, openPlanWidget, planUid } = usePricingActions()

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
      <button
        type="button"
        onClick={() => {
          const elitePlan = membershipPlans.find((plan) => plan.planUid === PLAN_UIDS.ELITE)
          if (elitePlan) openPlanWidget(elitePlan, false)
        }}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        Upgrade to Elite
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => openPlanWidget(proPlan, false)}
      className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    >
      {isAuthenticated ? 'Upgrade to Pro' : 'Start Pro Trial - $0 Due Today'}
    </button>
  )
}

export function PricingFinalCtaCopy() {
  const { isAuthenticated, planUid } = usePricingActions()

  return (
    <p className="mx-auto mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
      {isAuthenticated && planUid === PLAN_UIDS.PRO
        ? 'Upgrade to Elite for 1-to-1 strategy sessions, partner referrals, and concierge routing reviews.'
        : 'Start Pro with $0 due today so you can see firms, intel, and tools in one place before paid billing begins.'}
    </p>
  )
}
