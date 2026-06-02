'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { membershipPlans, type MembershipPlan } from '@/lib/ai-datasets'
import { PLAN_UIDS, PRO_OR_HIGHER } from '@/lib/plan-config'
import { TestimonialsSection } from '@/components/TestimonialsSection'
import { Ban, Clock, ShieldCheck, Star } from 'lucide-react'

function MembershipContent() {
    const { isAuthenticated, planUid } = useAuth()

    const currentPlanName =
        membershipPlans.find((p) => p.planUid === planUid)?.name || (isAuthenticated ? 'Member' : null)

    const isProOrHigher = planUid && PRO_OR_HIGHER.includes(planUid)

    const proPlan = membershipPlans.find((p) => p.planUid === PLAN_UIDS.PRO)!

    const openPlanWidget = (plan: MembershipPlan, isCurrentPlan: boolean) => {
        if (isCurrentPlan || plan.waitlist) return

        if (typeof window === 'undefined') return

        const Outseta = (window as any).Outseta

        // For authenticated users, open the profile widget's plan change tab.
        // Outseta.auth.open only supports login/register — using it for
        // subscription changes shows a blank login form.
        if (isAuthenticated) {
            if (Outseta?.profile?.open) {
                Outseta.profile.open({ tab: 'planChange' })
            } else {
                window.location.href = 'https://nested-objects.outseta.com/profile#o-plan-change'
            }
            return
        }

        // For unauthenticated users, standard registration with plan pre-selected
        const planPaymentTerm = plan.period === 'forever' ? undefined : plan.period.includes('month') ? 'month' : 'oneTime'

        if (Outseta?.auth?.open) {
            Outseta.auth.open({
                widgetMode: 'register',
                planUid: plan.planUid,
                planPaymentTerm,
                skipPlanOptions: true,
            })
            return
        }

        window.location.href = `https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${plan.planUid}&skipPlanOptions=true`
    }

    const openManageBilling = () => {
        if (isAuthenticated) {
            ; (window as any).Outseta?.profile?.open({ tab: 'billing' })
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
                        Signed in. Current plan: <span className="font-semibold">{currentPlanName}</span>
                    </p>
                )}

                {!isAuthenticated && (
                    <p className="mt-4 text-sm text-slate-500">
                        Start Pro with $0 due today for 7 days, or create a Free account with no card required.
                    </p>
                )}
            </header>

            <section className="mx-auto mt-8 grid max-w-4xl gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-start gap-3 border border-slate-200 bg-white p-4 shadow-sm">
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                    <div>
                        <p className="font-semibold text-slate-900">Verified reviews</p>
                        <p className="mt-1 text-xs text-slate-600">Real member proof near the decision point.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 border border-slate-200 bg-white p-4 shadow-sm">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <div>
                        <p className="font-semibold text-slate-900">7-day Pro trial</p>
                        <p className="mt-1 text-xs text-slate-600">$0 due today. Cancel before billing.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 border border-slate-200 bg-white p-4 shadow-sm">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-copper" aria-hidden />
                    <div>
                        <p className="font-semibold text-slate-900">Cancel anytime</p>
                        <p className="mt-1 text-xs text-slate-600">Cancel before renewal from billing settings.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 border border-slate-200 bg-white p-4 shadow-sm">
                    <Ban className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                    <div>
                        <p className="font-semibold text-slate-900">Digital access</p>
                        <p className="mt-1 text-xs text-slate-600">Paid digital memberships are non-refundable.</p>
                    </div>
                </div>
            </section>

            {/* Plans + sidebar */}
            <section className="mt-10 lg:mt-14">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
                    {/* Plan cards */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {membershipPlans
                            .filter((plan) => !plan.hidden)
                            .map((plan) => {
                                const isCurrentPlan = planUid === plan.planUid
                                const isPro = plan.planUid === PLAN_UIDS.PRO

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
                                    if (!isAuthenticated && plan.name === 'Pro') return 'Start Pro Trial - $0 Today'
                                    if (isAuthenticated) return `Upgrade to ${plan.name}`
                                    return 'Sign up'
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
                                        {plan.highlight && !isPro && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-copper px-3 py-1 text-xs font-semibold text-white shadow-md">
                                                Most popular
                                            </div>
                                        )}

                                        {isPro && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
                                                7 Day Free Trial
                                            </div>
                                        )}

                                        {isCurrentPlan && (
                                            <div className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
                                                Current
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
                                            {isPro && (
                                                <p className="mt-2 text-center text-xs text-brand-copper">
                                                    7-day free trial. Cancel before paid billing begins.
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

                        <div className="border-t border-slate-200 pt-4">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                                Billing clarity
                            </h2>
                            <p className="mt-3">
                                Pro starts with $0 due today for the 7-day trial. After the trial, paid digital
                                memberships, firm intel, templates, and AI tools are non-refundable because
                                access is delivered instantly.
                            </p>
                            <p className="mt-2">
                                You can cancel anytime before renewal from your billing settings.
                            </p>
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
                            You keep access until the end of your billing period, and Pro includes a 7-day free trial
                            before paid billing begins.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-slate-900">
                            Do you offer refunds?
                        </h3>
                        <p className="mt-2">
                            No. Nested Objects is a digital membership, so paid access to firm intel, templates,
                            and AI tools is non-refundable. Use the 7-day Pro trial to make sure the hub fits
                            before billing starts.
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
                            Yes. The Free plan gives you ongoing access to the directory preview and core hub without a
                            card on file. When you are ready for full listings and AI tools you can upgrade into Pro.
                        </p>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="mt-16 rounded-2xl bg-slate-900 px-6 py-10 text-center text-slate-50 sm:px-10">
                <h2 className="text-2xl font-semibold sm:text-3xl">
                    Ready to build routes that actually pay for your time?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
                    {isAuthenticated && planUid === PLAN_UIDS.PRO
                        ? "Upgrade to Elite for 1-to-1 strategy sessions, partner referrals, and concierge routing reviews."
                        : "Start Pro with $0 due today so you can see firms, intel, and tools in one place before paid billing begins."
                    }
                </p>

                {isAuthenticated && (planUid === PLAN_UIDS.ELITE || planUid === PLAN_UIDS.AGENCY) ? (
                    <button
                        type="button"
                        onClick={openManageBilling}
                        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                        Open manage plan &amp; billing
                    </button>
                ) : isAuthenticated && planUid === PLAN_UIDS.PRO ? (
                    <button
                        type="button"
                        onClick={() => {
                            const elitePlan = membershipPlans.find(p => p.planUid === PLAN_UIDS.ELITE);
                            if (elitePlan) openPlanWidget(elitePlan, false);
                        }}
                        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                        Upgrade to Elite
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => openPlanWidget(proPlan, false)}
                        className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                        {isAuthenticated ? 'Upgrade to Pro' : 'Start Pro Trial - $0 Today'}
                    </button>
                )}

                <p className="mt-3 text-xs text-slate-300">
                    Prefer to ease in? Stay on Free and upgrade from your dashboard any time. Paid digital access is non-refundable.
                </p>

            </section>

            {/* ── Social proof ────────────────────────────────── */}
            <TestimonialsSection variant="full" />

            <div className="mt-10 border-t border-slate-200 pt-4 text-center">
                <Suspense>
                    <a
                        href="/"
                        className="text-sm font-medium text-brand-copper underline underline-offset-4 hover:text-brand-copperDark"
                    >
                        ← Back to home
                    </a>
                </Suspense>
            </div>
        </main>
    )
}

export function MembershipView() {
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
