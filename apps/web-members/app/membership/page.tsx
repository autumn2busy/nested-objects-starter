'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'

import { useAuth } from '@/components/auth-provider'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

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
  const searchParams = useSearchParams()
  const checkoutStatus = searchParams.get('checkout')

  const { isAuthenticated, planUid, user } = useAuth()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const showQaBanner = process.env.NODE_ENV !== 'production'

  const startProCheckout = async () => {
    if (!stripePromise || !publishableKey) {
      setCheckoutError('Stripe is not configured yet. Add your publishable key to continue.')
      return
    }

    setCheckoutError(null)
    setIsCheckingOut(true)

    try {
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to initialize.')
      }

      const response = await fetch('/api/checkout/pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:
            (user?.email as string | undefined) ??
            (user?.Email as string | undefined) ??
            undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data?.id) {
        throw new Error(data?.error || 'Unable to start checkout.')
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: data.id })
      if (error) {
        throw error
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to start checkout. Please try again.'
      setCheckoutError(message)
    } finally {
      setIsCheckingOut(false)
    }
  }

  const currentPlanName =
    plans.find((p) => p.planUid === planUid)?.name || (isAuthenticated ? 'Member' : null)

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

        {checkoutStatus === 'success' && (
          <p
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            aria-live="polite"
          >
            Checkout complete. Your Pro subscription is being activated. You can close this tab once
            your dashboard finishes loading.
          </p>
        )}

        {checkoutStatus === 'cancelled' && (
          <p
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
            aria-live="polite"
          >
            Checkout was cancelled. You can restart whenever you are ready.
          </p>
        )}
      </header>

      {/* QA banner. only visible outside production */}
      {showQaBanner && (
        <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold text-emerald-900 sm:text-base">
            QA only. Create a Pro profile using Stripe test cards.
          </h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-emerald-800 sm:text-[0.95rem]">
            <li>Click the Pro plan button below to start checkout.</li>
            <li>Register with any test name and email address.</li>
            <li>
              Use the Stripe test card{' '}
              <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-[0.8rem]">
                4242&nbsp;4242&nbsp;4242&nbsp;4242
              </code>{' '}
              with any future expiry, CVC, and ZIP code.
            </li>
            <li>Complete checkout and you will land in the hub with Pro entitlements.</li>
          </ol>
          <p className="mt-2 text-xs text-emerald-700">
            This flow is for testing only. It does not charge a real card and can be repeated as
            needed during QA.
          </p>
        </section>
      )}

      {/* Plans + sidebar */}
      <section className="mt-10 lg:mt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          {/* Plan cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => {
              const isCurrentPlan = planUid === plan.planUid
              const isPro = plan.planUid === 'rQVqlLm6'

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
                    {isPro ? (
                      <button
                        type="button"
                        onClick={startProCheckout}
                        disabled={isCurrentPlan || isCheckingOut}
                        className={buttonClasses}
                      >
                        {isCurrentPlan
                          ? 'Current plan'
                          : isCheckingOut
                          ? 'Starting checkout...'
                          : 'Start with Pro'}
                      </button>
                    ) : (
                      <a
                        href={`https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${plan.planUid}&planPaymentTerm=month&skipPlanOptions=true`}
                        className={buttonClasses}
                        aria-disabled={isCurrentPlan}
                        onClick={(e) => {
                          if (isCurrentPlan) e.preventDefault()
                        }}
                      >
                        {isCurrentPlan ? 'Current plan' : 'Get started'}
                      </a>
                    )}

                    {plan.name === 'Starter' && (
                      <p className="mt-2 text-center text-xs text-slate-500">
                        No credit card required. Upgrade whenever you are ready.
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          {/* Right sidebar. who this is for + 7 day roadmap */}
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
              Can I change plans or cancel anytime.
            </h3>
            <p className="mt-2">
              Yes. You can upgrade, downgrade, or cancel from your profile at any time. Changes take
              effect immediately and you keep access until the end of your billing period.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              What payment methods do you accept.
            </h3>
            <p className="mt-2">
              All major credit cards are processed securely through Stripe. Your billing details never
              touch the Nested Objects servers.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Is there a free option while I am getting started.
            </h3>
            <p className="mt-2">
              Yes. The Starter plan gives you ongoing access to the directory and core hub without a
              card on file. When you are ready for intel and AI tools you can upgrade into Pro or
              higher.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Who is Nested Objects built for.
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
        <button
          type="button"
          onClick={startProCheckout}
          disabled={isCheckingOut}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-sky-400"
        >
          {isCheckingOut ? 'Starting checkout...' : 'Start with Pro'}
        </button>
        <p className="mt-3 text-xs text-slate-300">
          Prefer to ease in. Stay on Starter and upgrade from your dashboard any time.
        </p>
      </section>

      {checkoutError && (
        <div
          className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
          aria-live="polite"
        >
          {checkoutError}
        </div>
      )}

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
