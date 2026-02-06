'use client'

import { useAuth } from '@/components/auth-provider'

import { PLAN_UIDS } from '@/lib/plan-config'

type Plan = {
  name: string
  uid: string
  price: string
  features: string[]
  recommended?: boolean
}

const plans: Plan[] = [
  {
    name: 'Free',
    uid: PLAN_UIDS.FREE,
    price: '$0',
    features: [
      'Access to Firm Directory',
      'Basic search functionality',
      'Community support',
    ],
  },
  {
    name: 'Starter', // Formerly Directory
    uid: PLAN_UIDS.STARTER,
    price: '$99 / 3mo',
    features: [
      'Full Firm Directory access for 90 days',
      'Automatically expires after three months',
      'Renew for $49 once the pass ends',
      'Limited AI Features (Concierge)',
    ],
  },
  {
    name: 'Pro',
    uid: PLAN_UIDS.PRO,
    price: '$37/mo',
    features: [
      'Everything in Starter',
      'AI Chatbot Concierge',
      'Job Intel Reports',
      'Priority email support',
      'Advanced search filters',
    ],
    recommended: true,
  },
  {
    name: 'Elite',
    uid: PLAN_UIDS.ELITE,
    price: 'Contact us',
    features: [
      'Everything in Pro',
      'Priority Support',
      'Custom integrations',
      'Dedicated account manager',
      'Early access to new features',
    ],
  },
  {
    name: 'Agency',
    uid: PLAN_UIDS.AGENCY,
    price: 'Contact us',
    features: [
      'Everything in Elite',
      'White Label Options',
      'Multi-user accounts',
      'Custom branding',
      'API access',
      'SLA guarantees',
    ],
  },
]

const hostedBaseUrl = 'https://nested-objects.outseta.com/auth'

export function UpgradeContent() {
  const { planUid, isAuthenticated } = useAuth()

  const currentPlanName = plans.find((plan) => plan.uid === planUid)?.name

  const handleUpgrade = (selectedPlanUid: string, isCurrentPlan: boolean) => {
    if (isCurrentPlan) return
    if (typeof window === 'undefined') return

    const Outseta = window.Outseta

    // Ensure the embedded widget is aware of the existing session cookie so
    // authenticated users aren't prompted to log in again when upgrading.
    const accessToken = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('outseta_access_token='))
      ?.split('=')[1]

    if (accessToken && Outseta?.setAccessToken) {
      Outseta.setAccessToken(decodeURIComponent(accessToken))
    }

    const hasSession = isAuthenticated || Boolean(accessToken)
    const widgetMode = hasSession ? 'updateSubscription' : 'register'

    if (Outseta?.auth?.open) {
      Outseta.auth.open({
        widgetMode,
        planUid: selectedPlanUid,
        planPaymentTerm: 'month',
        skipPlanOptions: true,
      })
      return
    }

    const params = new URLSearchParams({
      widgetMode,
      planUid: selectedPlanUid,
      planPaymentTerm: 'month',
      skipPlanOptions: 'true',
    })

    window.location.href = `${hostedBaseUrl}?${params.toString()}`
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Upgrade</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          Choose your plan
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          Unlock more features and grow your business.
        </p>
        {currentPlanName && (
          <p className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-brand-copper/30 bg-brand-mist px-4 py-2 text-sm font-medium text-brand-copperDark">
            Current plan: <span className="font-semibold">{currentPlanName}</span>
          </p>
        )}
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const isCurrentPlan = planUid === plan.uid

          return (
            <article
              key={plan.uid}
              className={`relative flex h-full flex-col rounded-2xl border bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur ${plan.recommended
                  ? 'border-brand-copper/80 ring-brand-copper/20 shadow-lg shadow-brand-copper/20'
                  : 'border-slate-200'
                }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-copper px-3 py-1 text-xs font-semibold text-white shadow-md">
                  Recommended
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
                  Current plan
                </div>
              )}

              <header className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
                <p className="mt-1 text-2xl font-bold text-slate-900">{plan.price}</p>
              </header>

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
                  onClick={() => handleUpgrade(plan.uid, isCurrentPlan)}
                  disabled={isCurrentPlan}
                  className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${isCurrentPlan
                      ? 'cursor-not-allowed bg-slate-300 text-white'
                      : plan.recommended
                        ? 'bg-brand-copper text-white shadow-sm hover:bg-brand-copperDark'
                        : 'border border-brand-copper text-brand-copperDark hover:bg-brand-mist'
                    }`}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <div className="mt-12 text-center">
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
