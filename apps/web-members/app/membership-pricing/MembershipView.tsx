import { membershipPlans } from '@/lib/ai-datasets'
import { PLAN_UIDS } from '@/lib/plan-config'
import { TestimonialStrip } from '@/components/TestimonialsSection'
import Link from 'next/link'
import { Ban, CheckCircle2, Clock, ShieldCheck, Star } from 'lucide-react'
import {
    CurrentPlanBadge,
    PricingFinalCta,
    PricingFinalCtaCopy,
    PricingHeroAccountStatus,
    PricingPlanButton,
    PricingViewTracker,
} from './PricingInteractions'

const proBenefitHighlights = [
    {
        title: 'Full firm profiles',
        body: 'Pay clues, coverage notes, application steps, and contractor expectations in one place.',
    },
    {
        title: 'Route-fit decisions',
        body: 'Compare firms by lane, geography, and assignment type before you spend time applying.',
    },
    {
        title: 'AI tools and templates',
        body: 'Use concierge prompts, resume tools, starter kits, and checklists while you test the hub.',
    },
]

const planDecisionPrompts = [
    'Start Free if you only need a 3-firm directory preview.',
    'Start Pro if you are ready to compare firms seriously this week.',
    'Upgrade later if you need Elite or Agency-level strategy support.',
]

const decisionConfidenceItems = [
    {
        title: 'Free is for browsing',
        body: 'Use Free when you want to explore the hub, preview 3 firms, and decide whether field work belongs in your plans.',
    },
    {
        title: 'Pro is for deciding',
        body: 'Use the trial when you are actively comparing firms, checking requirements, building a shortlist, or preparing applications.',
    },
    {
        title: 'Paid access is instant',
        body: 'After the trial, digital access continues automatically unless you cancel before billing. Paid memberships are non-refundable.',
    },
]

const trustAssuranceItems = [
    {
        title: 'Secure checkout',
        body: 'Payments are handled through Outseta and Stripe. Card details are processed by the billing provider, not stored by Nested Objects.',
        href: '/privacy',
        label: 'Privacy terms',
    },
    {
        title: 'Clear support path',
        body: 'Billing, account, and plan questions can go through support@nestedobjects.com or the contact page before you upgrade.',
        href: '/contact-us',
        label: 'Contact support',
    },
    {
        title: 'Refund expectations',
        body: 'Standard Pro trials bill after day 7. Promo checkouts charge the discounted first month today. Paid digital access is non-refundable.',
        href: '/refund-policy',
        label: 'Refund policy',
    },
]

export const pricingFaqs = [
    {
        question: 'Can I change plans or cancel anytime?',
        answer: 'Yes. You can upgrade, downgrade, or cancel from the Outseta billing widget at any time. You keep access until the end of your billing period, and Pro includes a 7-day free trial before paid billing begins.',
    },
    {
        question: 'What happens after the 7-day Pro trial?',
        answer: 'Pro starts with $0 due today. If you do not cancel before the trial ends, the membership renews as paid digital access using the billing terms shown during checkout.',
    },
    {
        question: 'Can I use a Summer promo with the 7-day trial?',
        answer: 'No. The Summer promo replaces the 7-day trial. The promo checkout charges the discounted first month today, then renews at the regular monthly Pro rate unless you cancel.',
    },
    {
        question: 'Do you offer refunds?',
        answer: 'No. Nested Objects is a digital membership, so paid access to firm intel, templates, and AI tools is non-refundable. Use the 7-day Pro trial to make sure the hub fits before billing starts.',
    },
    {
        question: 'Which plan should I choose first?',
        answer: 'Choose Free if you only want a directory preview and no card on file. Choose Pro if you are ready to compare firms, requirements, pay clues, route fit, and tools during the next week.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'All major credit cards are processed securely through Outseta and Stripe. Your billing details never touch the Nested Objects servers.',
    },
    {
        question: 'Is there a free option while I am getting started?',
        answer: 'Yes. The Free plan gives you ongoing access to a 3-firm directory preview and core hub without a card on file. When you are ready for full listings and AI tools, you can upgrade into Pro.',
    },
]

function MembershipContent() {
    const proPlan = membershipPlans.find((p) => p.planUid === PLAN_UIDS.PRO)!

    return (
        <main className="mx-auto w-screen max-w-none overflow-x-clip px-4 py-10 sm:w-full sm:px-6 lg:max-w-6xl lg:px-8 lg:py-16">
            <PricingViewTracker />
            {/* Hero */}
            <header className="mx-auto w-full max-w-[calc(100vw-2rem)] text-center sm:max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">
                    Membership
                </p>
                <h1 className="mx-auto mt-4 max-w-[calc(100vw-2rem)] text-balance text-2xl font-bold leading-tight tracking-tight text-slate-900 min-[380px]:max-w-[22rem] min-[380px]:text-3xl sm:max-w-none sm:text-4xl md:text-5xl">
                    Choose the hub that matches your lane in the field.
                </h1>
                <p className="mx-auto mt-4 max-w-[18rem] text-base text-slate-600 min-[380px]:max-w-[20rem] sm:max-w-none sm:text-lg">
                    Nested Objects is built for inspectors, notaries, real estate pros, and gig workers who
                    want clear intel on firms, gear, and routes before they hit the road.
                </p>

                <PricingHeroAccountStatus />
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

            <section className="mx-auto mt-8 max-w-5xl rounded-lg border border-brand-copper/25 bg-white p-5 shadow-sm sm:p-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-start">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
                            Pro trial path
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                            Use the 7-day trial to decide whether the hub fits your route.
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                            Pro is the fastest way to evaluate real firm options, inspect the workflow, and test
                            the tools before paid billing begins.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {proBenefitHighlights.map((item) => (
                                <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                                    <p className="mt-2 text-xs leading-5 text-slate-600">{item.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-white shadow-sm selection:bg-amber-200 selection:text-slate-950">
                        <h3 className="text-sm font-semibold text-white">Which plan should I pick?</h3>
                        <ul className="mt-3 space-y-3 text-sm text-slate-100">
                            {planDecisionPrompts.map((prompt) => (
                                <li key={prompt} className="flex gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" aria-hidden />
                                    <span>{prompt}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 rounded-lg bg-white/15 px-3 py-2 text-xs leading-5 text-white ring-1 ring-white/10">
                            $0 due today for Pro. Cancel before day 7 if the membership is not the right fit.
                        </p>
                        <p className="mt-3 text-xs leading-5 text-slate-300">
                            Promo codes are separate offers. A first-month discount replaces the trial checkout.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-6 max-w-5xl rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
                            Decision confidence
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                            Pick the plan by what you need to decide this week.
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Preview 3 firms for free, test Pro for seven days, or stay paid only when the firm intel
                            and tools are worth it for your route.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {decisionConfidenceItems.map((item) => (
                            <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-4">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
                                <h3 className="mt-3 text-sm font-semibold text-slate-950">{item.title}</h3>
                                <p className="mt-2 text-xs leading-5 text-slate-600">{item.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-8 max-w-5xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
                            Trust and billing
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                            Know how checkout, support, and access work before you choose.
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            The membership is designed to be easy to test and easy to cancel. Review the
                            support and policy links before paid access starts or before using a promo.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {trustAssuranceItems.map((item) => (
                            <article key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden />
                                <h3 className="mt-3 text-sm font-semibold text-slate-950">{item.title}</h3>
                                <p className="mt-2 text-xs leading-5 text-slate-600">{item.body}</p>
                                <Link
                                    href={item.href}
                                    className="mt-3 inline-flex text-xs font-semibold text-brand-copper underline underline-offset-4 hover:text-brand-copperDark"
                                >
                                    {item.label}
                                </Link>
                            </article>
                        ))}
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
                                const isPro = plan.planUid === PLAN_UIDS.PRO

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

                                        <CurrentPlanBadge planUid={plan.planUid} />

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
                                                    <span className="mt-0.5 font-semibold text-emerald-600" aria-hidden>
                                                        +
                                                    </span>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="mt-auto">
                                            <PricingPlanButton plan={plan} />
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
                                <li>You are tired of guessing which firms actually pay well in your region.</li>
                                <li>You want one place to track firms, gear, and requirements instead of random posts.</li>
                                <li>You are adding inspections as a new lane on top of a job, family, or business.</li>
                                <li>You want to step into routes with clear expectations, not mystery assignments.</li>
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
                                Standard Pro starts with $0 due today for the 7-day trial. Summer promo
                                checkouts replace the trial with a discounted first month due today. After
                                billing starts, paid digital memberships, firm intel, templates, and AI tools
                                are non-refundable because access is delivered instantly.
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
                    {pricingFaqs.map((faq) => (
                        <div key={faq.question}>
                            <h3 className="text-base font-semibold text-slate-900">
                                {faq.question}
                            </h3>
                            <p className="mt-2">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="mt-16 rounded-2xl bg-slate-900 px-6 py-10 text-center text-white shadow-sm selection:bg-amber-200 selection:text-slate-950 sm:px-10">
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                    Ready to build routes that actually pay for your time?
                </h2>
                <PricingFinalCtaCopy />

                <PricingFinalCta proPlan={proPlan} />

                <p className="mt-3 text-xs leading-5 text-slate-100">
                    Prefer to ease in? Stay on Free and upgrade from your dashboard any time. Paid digital access is non-refundable.
                </p>

            </section>

            {/* Social proof */}
            <section className="mx-auto mt-12 max-w-3xl rounded-lg border border-slate-200 bg-white px-5 py-6 text-center shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-copper">
                    Member proof
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Real members use Nested Objects to compare firms and routes.
                </h2>
                <div className="mt-5 flex justify-center">
                    <TestimonialStrip />
                </div>
            </section>

            <div className="mt-10 border-t border-slate-200 pt-4 text-center">
                <a
                    href="/"
                    className="text-sm font-medium text-brand-copper underline underline-offset-4 hover:text-brand-copperDark"
                >
                    Back to home
                </a>
            </div>
        </main>
    )
}

export function MembershipView() {
    return <MembershipContent />
}
