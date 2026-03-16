'use client'

import { useAuth } from '@/components/auth-provider'
import { membershipPlans } from '@/lib/ai-datasets'

const hostedBaseUrl = 'https://nested-objects.outseta.com/auth'

export function UpgradeContent() {
  const { planUid, isAuthenticated } = useAuth()

  const currentPlanName = membershipPlans.find((plan) => plan.planUid === planUid)?.name

  const getPlanPaymentTerm = (period: string) => {
    if (period === 'forever') return undefined
    if (period.includes('month')) return 'month'
    if (period.includes('year')) return 'year'
    return 'oneTime'
  }

  const handleUpgrade = (selectedPlanUid: string, planPeriod: string, isCurrentPlan: boolean) => {
    if (isCurrentPlan) return
    if (typeof window === 'undefined') return

    const Outseta = (window as any).Outseta

    // For authenticated users, open the profile widget's plan change tab.
    // Outseta.auth.open only supports login/register — NOT subscription changes.
    if (isAuthenticated) {
      if (Outseta?.profile?.open) {
        Outseta.profile.open({ tab: 'planChange' })
      } else {
        window.location.href = 'https://nested-objects.outseta.com/profile#o-plan-change'
      }
      return
    }

    // For unauthenticated users, standard registration with plan pre-selected
    const planPaymentTerm = getPlanPaymentTerm(planPeriod)

    if (Outseta?.auth?.open) {
      Outseta.auth.open({
        widgetMode: 'register',
        planUid: selectedPlanUid,
        planPaymentTerm,
        skipPlanOptions: true,
      })
      return
    }

    window.location.href = `${hostedBaseUrl}?widgetMode=register&planUid=${selectedPlanUid}&skipPlanOptions=true`
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
        {membershipPlans
          .filter((plan) => !plan.hidden)
          .map((plan) => {
            const isCurrentPlan = planUid === plan.planUid

            return (
              <article
                key={plan.planUid}
                className={`relative flex h-full flex-col rounded-2xl border bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur ${
                  plan.highlight
                    ? 'border-brand-copper/80 ring-brand-copper/20 shadow-lg shadow-brand-copper/20'
                    : 'border-slate-200'
                }`}
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

                {plan.waitlist && (
                  <div className="absolute top-4 right-4 rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                    Coming Soon
                  </div>
                )}

                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
                  <p className="mt-1 text-sm font-medium text-brand-copper">{plan.headline}</p>
                  <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
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
                    onClick={() => handleUpgrade(plan.planUid, plan.period, isCurrentPlan)}
                    disabled={isCurrentPlan || plan.waitlist === true}
                    className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                      isCurrentPlan || plan.waitlist
                        ? 'cursor-not-allowed bg-slate-300 text-white'
                        : plan.highlight
                          ? 'bg-brand-copper text-white shadow-sm hover:bg-brand-copperDark'
                          : 'border border-brand-copper text-brand-copperDark hover:bg-brand-mist'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.waitlist ? 'Join Waitlist' : `Switch to ${plan.name}`}
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
