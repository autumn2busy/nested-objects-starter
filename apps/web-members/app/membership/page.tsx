'use client'

import { Suspense } from 'react'
import { useAuth } from '@/components/auth-provider'

type Plan = {
  name: string
  planUid: string
  price: string
  period: string
  description: string
  highlight: boolean
  features: string[]
}

const plans: Plan[] = [
  {
    name: 'Starter',
    planUid: 'L9nbKV9Z',
    price: '$0',
    period: 'forever',
    description: 'Perfect for testing the waters and browsing firms at your own pace.',
    highlight: false,
    features: [
      'Access to the verified Firm Directory',
      'Basic search by state and service lane',
      'Member hub dashboard access',
      'Community updates and announcements',
      'Access to starter resources and checklists',
    ],
  },
  {
    name: 'Pro',
    planUid: 'rQVqlLm6',
    price: '$37',
    period: 'month',
    description: 'For working pros who want pay intel, better routing, and less guesswork.',
    highlight: true,
    features: [
      'Everything in Starter',
      'AI Concierge to answer firm and industry questions',
      'Firm intel snapshots, rates, and requirements',
      'Advanced filters by region, tools, and experience level',
      'Weekly market and route-planning insights',
      'Export options for firm lists and notes',
    ],
  },
  {
    name: 'Elite',
    planUid: 'NmdnNO90',
    price: '$97',
    period: 'month',
    description: 'For high volume inspectors and team leads who treat routes like a business.',
    highlight: false,
    features: [
      'Everything in Pro',
      'Priority support with faster response times',
      'Deeper intel on volume, gear, and regional demand',
      'Workflow templates for multi-market routes',
      'Early access to new tools and features',
      'Reserved slots for beta programs and pilots',
    ],
  },
  {
    name: 'Agency',
    planUid: 'rmk5Xk9g',
    price: '$297',
    period: 'month',
    description: 'For agencies and coordinators managing crews across multiple markets.',
    highlight: false,
    features: [
      'Everything in Elite',
      'Multi-user accounts for coordinators and staff',
      'Agency-level analytics and reporting',
      'White label options and custom views',
      'Onboarding and training for your team',
      'Quarterly strategy review sessions',
    ],
  },
]

function MembershipContent() {
  const { isAuthenticated, planUid } = useAuth()

  const currentPlanName =
    plans.find((p) => p.planUid === planUid)?.name || (isAuthenticated ? 'Member' : null)

  const isProOrHigher =
    planUid === 'rQVqlLm6' || planUid === 'NmdnNO90' || planUid === 'rmk5Xk9g'

  const proPlan = plans.find((p) => p.planUid === 'rQVqlLm6')!

  const hostedBaseUrl = 'https://nested-objects.outseta.com/auth'

  const openPlanWidget = (plan: Plan, isCurrentPlan: boolean) => {
    if (isCurrentPlan) return
    if (typeof window === 'undefined') return

    const Outseta = window.Outseta
    const widgetMode = isAuthenticated ? 'updateSubscription' : 'register'

    // Preferred. use the embedded widget so existing sessions are respected.
    if (Outseta?.auth?.open) {
      Outseta.auth.open({
        widgetMode,
        planUid: plan.planUid,
        planPaymentTerm: 'month',
        skipPlanOptions: true,
      })
      return
    }

    // Fallback. if the JS SDK is missing, bounce to the hosted page.
    const params = new URLSearchParams({
      widgetMode,
      planUid: plan.planUid,
      planPaymentTerm: 'month',
      skipPlanOptions: 'true',
    })

    window.location.href = `${hostedBaseUrl}?${params.toString()}`
  }

  const openManageBilling = () => {
    if (typeof window === 'undefined') return
    const Outseta = window.Outseta

    if (Outseta?.auth?.open) {
      Outseta.auth.open({ widgetMode: 'updateSubscription' })
      return
    }

    window.location.href = `${hostedBaseUrl}?widgetMode=updateSubscription`
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      {/* Hero */}
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
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
              className="font-semibold text-sky-600 underline underline-offset-4 hover:text-sky-700"
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
            {plans.map((plan) => {
              const isCurrentPlan = planUid === plan.planUid

              const buttonBase =
                'inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900/0 transition'

              let buttonClasses = ''
              if (isCurrentPlan) {
                buttonClasses = `${buttonBase} cursor-not-allowed bg-slate-300 text-white`
              } else if (plan.highlight) {
                buttonClasses = `${buttonBase} bg-sky-600 text-white shadow-sm hover:bg-sky-700`
              } else {
                buttonClasses = `${buttonBase} border border-sky-600 text-sky-700 hover:bg-sky-50`
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
                  className={`relative flex h-full flex-col rounded-2xl border bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur ${
                    plan.highlight
                      ? 'border-sky-400/80 ring-sky-100 shadow-lg shadow-sky-100'
                      : 'border-slate-200'
                  }`}
                  aria-label={`${plan.name} plan`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
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
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Open manage plan &amp; billing
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openPlanWidget(proPlan, false)}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
          className="text-sm font-medium text-sky-600 underline underline-offset-4 hover:text-sky-700"
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
