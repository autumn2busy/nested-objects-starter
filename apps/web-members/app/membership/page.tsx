'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { membershipPlans, type MembershipPlan } from '@/lib/ai-datasets'

function MembershipContent() {
  const { isAuthenticated, planUid } = useAuth()

  const currentPlanName =
    membershipPlans.find((p) => p.planUid === planUid)?.name || (isAuthenticated ? 'Member' : null)

  const isProOrHigher =
    planUid === 'rQVqlLm6' || planUid === 'NmdnNO90' || planUid === 'rmk5Xk9g'

  const proPlan = membershipPlans.find((p) => p.planUid === 'rQVqlLm6')!

  const router = useRouter();

  const PLAN_CHANGE_URLS: Record<string, string> = {
    'rmk5Xk9g': 'https://nested-objects.outseta.com/profile?tab=planChange&stateProps=%7B%22planUid%22%3A%22rmk5Xk9g%22%2C%22planPaymentTerm%22%3A%22monthly%22%7D#o-authenticated', // Agency
    'zWZD0rQp': 'https://nested-objects.outseta.com/profile?tab=planChange&stateProps=%7B%22planUid%22%3A%22zWZD0rQp%22%2C%22planPaymentTerm%22%3A%22oneTime%22%7D#o-authenticated', // Directory
    'NmdnNO90': 'https://nested-objects.outseta.com/profile?tab=planChange&stateProps=%7B%22planUid%22%3A%22NmdnNO90%22%2C%22planPaymentTerm%22%3A%22monthly%22%7D#o-authenticated', // Elite
    'rQVqlLm6': 'https://nested-objects.outseta.com/profile?tab=planChange&stateProps=%7B%22planUid%22%3A%22rQVqlLm6%22%2C%22planPaymentTerm%22%3A%22monthly%22%7D#o-authenticated', // Pro
    'L9nbKV9Z': 'https://nested-objects.outseta.com/profile?tab=planChange&stateProps=%7B%22planUid%22%3A%22L9nbKV9Z%22%2C%22planPaymentTerm%22%3A%22monthly%22%7D#o-authenticated', // Starter
  };

  const openPlanWidget = (plan: MembershipPlan, isCurrentPlan: boolean) => {
    if (isCurrentPlan) return

    if (!isAuthenticated) {
      // Fallback for unauth: bounce to hosted page or open register widget
      if (typeof window !== 'undefined' && window.Outseta?.auth?.open) {
        window.Outseta.auth.open({
          widgetMode: 'register',
          planUid: plan.planUid,
          planPaymentTerm: 'month',
          skipPlanOptions: true,
        })
      } else {
        window.location.href = `https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${plan.planUid}`
      }
      return
    }

    // Authenticated: Redirect to Outseta portal (iframe not allowed)
    const url = PLAN_CHANGE_URLS[plan.planUid]
    if (url) {
      window.location.href = url
    }
  }

  const openManageBilling = () => {
    if (isAuthenticated) {
      router.push('/profile')
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      {/* Hero */}
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">
          Membership
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          Choose the hub that matches your lane in the field.
        </h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg">
          Nested Objects is built for inspectors, notaries, real estate pros, and gig workers who
          want clear intel on firms, gear, and routes before they hit the road.
        </p>

        {isAuthenticated && currentPlanName && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            Signed in. Current plan. <span className="font-semibold">{currentPlanName}</span>
          </p>
        )}

        {!isAuthenticated && (
          <p className="mt-4 text-sm text-slate-500">
            Create a free Starter account first. then upgrade inside the hub whenever you are ready.
          </p>
        )}

        {isAuthenticated && !isProOrHigher && (
          <p className="mt-4 text-sm text-slate-500">
            You can upgrade your plan using the buttons below. changes are handled securely by
            Outseta&apos;s billing portal.
          </p>
        )}

        {isProOrHigher && (
          <p className="mt-4 text-sm text-slate-500">
            Your billing and plan changes are managed from the{' '}
            <button
              type="button"
              onClick={openManageBilling}
              className="font-semibold text-brand-copper underline underline-offset-4 hover:text-brand-copperDark"
            >
              manage plan &amp; billing
            </button>{' '}
            widget.
          </p>
        )}
      </header>

      {/* Plans + sidebar */}
      <section className="mt-10 lg:mt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          {/* Plan cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {membershipPlans.map((plan) => {
              const isCurrentPlan = planUid === plan.planUid

              const buttonBase =
                'inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900/0 transition'

              let buttonClasses = ''
              if (isCurrentPlan) {
                buttonClasses = `${buttonBase} cursor-not-allowed bg-slate-300 text-white`
              } else if (plan.highlight) {
                buttonClasses = `${buttonBase} bg-brand-copper text-white shadow-sm hover:bg-brand-copperDark`
              } else {
                buttonClasses = `${buttonBase} border border-brand-copper text-brand-copperDark hover:bg-brand-mist`
              }

              const label = (() => {
                if (isCurrentPlan) return 'Current plan'
                if (!isAuthenticated && plan.name === 'Starter') return 'Join free'
                if (!isAuthenticated) return `Start on ${plan.name}`
                return `Switch to ${plan.name}`
              })()

              return (
                <article
                  key={plan.planUid}
                  className={`relative flex h-full flex-col rounded-2xl border bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur ${plan.highlight
                    ? 'border-brand-copper/80 ring-brand-copper/20 shadow-lg shadow-brand-copper/20'
                    : 'border-slate-200'
                    }`}
                  aria-label={`${plan.name} plan`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-copper px-3 py-1 text-xs font-semibold text-white shadow-md">
                      Most popular
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
                      Current plan
                    </div>
                  )}

                  <header className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
                  </header>

                  <div className="mb-5 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-500">/ {plan.period}</span>
                  </div>

                  <ul className="mb-6 space-y-2 text-sm text-slate-700">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-500">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <button
                      type="button"
                      disabled={isCurrentPlan}
                      className={buttonClasses}
                      onClick={() => openPlanWidget(plan, isCurrentPlan)}
                    >
                      {label}
                    </button>

                    {plan.name === 'Starter' && (
                      <p className="mt-2 text-center text-xs text-slate-500">
                        No credit card required. upgrade whenever you are ready.
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          {/* Right sidebar */}
          <aside className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-700 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                This is for you if
              </h2>
              <ul className="mt-3 space-y-2">
                <li>• You are tired of guessing which firms actually pay well in your region.</li>
                <li>• You want one place to track firms, gear, and requirements instead of random posts.</li>
                <li>• You are adding inspections as a new lane on top of a job, family, or business.</li>
                <li>• You want to step into routes with clear expectations, not mystery assignments.</li>
              </ul>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                Your first 7 days inside the hub
              </h2>
              <ol className="mt-3 space-y-2">
                <li>
                  <span className="font-semibold text-slate-900">Day 1.</span> Set up your profile, choose
                  your lanes, and preview firms in your state.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Day 2 to 3.</span> Use firm intel to filter
                  by pay, tools, and regions that match your life.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Day 4 to 5.</span> Apply to your short list
                  and track responses in one place.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Day 6 to 7.</span> Turn on AI tools and
                  starter kits to prep for your first or next route.
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </section>

      {/* FAQ section */}
      <section className="mt-16 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8">
        <h2 className="text-center text-2xl font-semibold text-slate-900">Frequently asked questions</h2>

        <div className="mx-auto mt-6 grid max-w-3xl gap-6 text-sm text-slate-700">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Can I change plans or cancel anytime?
            </h3>
            <p className="mt-2">
              Yes. You can upgrade, downgrade, or cancel from the Outseta billing widget at any time.
              Changes take effect immediately and you keep access until the end of your billing
              period.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              What payment methods do you accept?
            </h3>
            <p className="mt-2">
              All major credit cards are processed securely through Outseta and Stripe. Your billing
              details never touch the Nested Objects servers.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Is there a free option while I am getting started?
            </h3>
            <p className="mt-2">
              Yes. The Starter plan gives you ongoing access to the directory and core hub without a
              card on file. When you are ready for intel and AI tools you can upgrade into Pro or
              higher.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Who is Nested Objects built for?
            </h3>
            <p className="mt-2">
              Field inspectors, mobile notaries, real estate and investor friendly agents, and gig
              workers adding inspections as a new income lane. If you work outside, drive routes, or
              step into other people&apos;s properties, this hub is for you.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-16 rounded-2xl bg-slate-900 px-6 py-10 text-center text-slate-50 sm:px-10">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Ready to build routes that actually pay for your time.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
          Start with the Pro plan so you can see firms, intel, and tools in one place instead of
          chasing random posts and rumor threads.
        </p>

        {isProOrHigher ? (
          <button
            type="button"
            onClick={openManageBilling}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Open manage plan &amp; billing
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openPlanWidget(proPlan, false)}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Start with Pro
          </button>
        )}

        <p className="mt-3 text-xs text-slate-300">
          Prefer to ease in. stay on Starter and upgrade from your dashboard any time.
        </p>
      </section>

      <div className="mt-10 border-t border-slate-200 pt-4 text-center">
        <a
          href="/"
          className="text-sm font-medium text-brand-copper underline underline-offset-4 hover:text-brand-copperDark"
        >
          ← Back to home
        </a>
      </div>
    </main>
  )
}

export default function MembershipPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-base text-slate-600">Loading membership options...</p>
        </main>
      }
    >
      <MembershipContent />
    </Suspense>
  )
}
