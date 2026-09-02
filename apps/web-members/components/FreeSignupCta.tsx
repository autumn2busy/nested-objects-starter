'use client'

import type { MouseEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { trackJoinFreeClick } from '@/lib/ac-events'
import { PLAN_UIDS } from '@/lib/plan-config'

// Match the existing hosted-registration fallback in PricingInteractions.
const FREE_SIGNUP_URL = `https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${PLAN_UIDS.FREE}&skipPlanOptions=true`

type FreeSignupCtaProps = {
  placement: 'home_hero' | 'home_mobile' | 'home_starter' | 'home_final'
  className?: string
}

export function FreeSignupCta({ placement, className = '' }: FreeSignupCtaProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 ${className}`

  const trackIntent = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isLoading || isAuthenticated || event.defaultPrevented) return

    try {
      trackJoinFreeClick({
        sourcePage: 'homepage',
        source: placement,
        targetPlan: 'Free',
        targetPlanUid: PLAN_UIDS.FREE,
      })
    } catch {
      // Analytics must never prevent the browser from following the link.
    }
  }

  if (isLoading) {
    return (
      <button type="button" disabled aria-busy="true" data-cta-placement={placement} className={`${classes} cursor-wait opacity-75`}>
        Checking sign-in...
      </button>
    )
  }

  return (
    <a
      href={isAuthenticated ? '/inspector-dashboard' : FREE_SIGNUP_URL}
      data-cta-placement={placement}
      className={classes}
      onClick={(event) => {
        if (event.button === 0) trackIntent(event)
      }}
      onAuxClick={(event) => {
        if (event.button === 1) trackIntent(event)
      }}
    >
      {isAuthenticated ? 'Open my dashboard' : 'Start free'}
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  )
}
