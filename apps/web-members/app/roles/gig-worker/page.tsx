import type { Metadata } from 'next'
import Link from 'next/link'
import { getRolePageSchema } from '@/lib/seo'

const comparisonPoints = [
  {
    title: 'Before you head out',
    pain: 'Unclear SLAs, pickup rules, or safety guidelines for each stop.',
    solution: 'Fast briefs showing ID rules, access steps, and safety notes for every firm so you know what to expect.',
  },
  {
    title: 'On the route',
    pain: 'Switching between apps, guessing priority, and worrying about delays.',
    solution: 'Single view of stop priority, required photos, and suggested detours to stay on time.',
  },
  {
    title: 'After the drop-off',
    pain: 'Uncertain payout timing and what to do if something changes.',
    solution: 'Clear submission steps, incident scripts, and payout expectations by firm.',
  },
]

const timeline = [
  {
    title: 'Start the day with clarity',
    detail:
      'Pick routes with pay transparency, safety notes, and required gear so you can decline bad fits before leaving home.',
  },
  {
    title: 'Navigate without the scramble',
    detail:
      'Follow stop-by-stop prompts, alternate routes, and quick scripts for security desks, residents, or clients on the move.',
  },
  {
    title: 'Wrap and get paid',
    detail:
      'Submission checklists, proof-of-delivery tips, and payout timelines keep you confident about the next job.',
  },
]

const faqItems = [
  {
    question: 'Which gig roles does this support?',
    answer:
      'Couriers, runners, mobile assistants, and field support pros who handle pickups, drop-offs, and simple inspections.',
  },
  {
    question: 'Do I need special equipment?',
    answer:
      'We outline recommended gear by route type—think safety vests, lockboxes, carts, or cooling packs—plus when it is optional.',
  },
  {
    question: 'Can I see pay expectations before accepting?',
    answer:
      'Yes. The hub highlights typical payout ranges and timing per firm so you can pick the routes that make sense.',
  },
  {
    question: 'Is there help if something changes mid-route?',
    answer:
      'You get quick scripts and escalation steps for access issues, weather changes, or incident reporting to keep you covered.',
  },
]

export const metadata: Metadata = {
  title: 'Gig workers | Confident routes with safety and payout clarity',
  description:
    'Route prep, safety guardrails, and payout expectations for gig workers who handle pickups, deliveries, and field support.',
  openGraph: {
    title: 'Gig workers | Confident routes with safety and payout clarity',
    description:
      'Nested Objects gives gig workers route briefs, access scripts, and payout transparency so you can focus on the next stop.',
    url: 'https://nested-objects-starter.vercel.app/roles/gig-worker',
    images: [
      {
        url: 'https://nested-objects-starter.vercel.app/logo-slate.svg',
        width: 1200,
        height: 630,
        alt: 'Nested Objects wordmark in slate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gig workers | Confident routes with safety and payout clarity',
    description:
      'See stop-by-stop prompts, safety notes, and payout expectations so routes stay predictable.',
    images: ['https://nested-objects-starter.vercel.app/logo-slate.svg'],
  },
}

const roleSchema = getRolePageSchema({
  title: 'Gig workers | Confident routes with safety and payout clarity',
  description:
    'Route prep, safety guardrails, and payout expectations for gig workers who handle pickups, deliveries, and field support.',
  path: '/roles/gig-worker',
  about: 'Gig workers',
})

export default function GigWorkerRolePage() {
  return (
    <main className="bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(roleSchema) }}
      />
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Gig workers</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Routes that feel predictable every time.</h1>
            <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
              Membership gives you route briefs, access scripts, and payout expectations so you can take jobs with clarity and
              avoid surprises on the road.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center bg-brand-copper px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
              >
                Explore gig worker plans
              </Link>
              <Link
                href="/directory"
                className="inline-flex items-center justify-center border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
              >
                See firms hiring gig pros
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Route-ready</p>
                <p className="mt-2 text-sm text-slate-700">Know the stop order, required proofs, and safety notes before you leave.</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Backed up</p>
                <p className="mt-2 text-sm text-slate-700">Scripts, escalation paths, and payout details if plans change.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-900">What gig workers rely on</p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Stop-by-stop briefs with access and parking notes.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Safety guardrails and escalation steps for each route type.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Proof-of-delivery guidance and quick reply scripts.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Payout expectations and typical timing per firm.
              </li>
            </ul>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
              >
                Talk with member success
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Comparison</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Choose predictability over chaos</h2>
            <p className="mt-2 text-base text-slate-600">
              Replace scattered instructions with clear briefs, scripts, and payout details for every gig.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {comparisonPoints.map((item) => (
              <div key={item.title} className="flex flex-col border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">{item.pain}</p>
                <div className="mt-4 border-l-2 border-brand-copper pl-3">
                  <p className="text-sm font-semibold text-slate-900">With Nested Objects</p>
                  <p className="mt-1 text-sm text-slate-700">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Timeline</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">A steady day on the road</h2>
            <p className="mt-2 text-base text-slate-600">
              Use the hub from planning through payout to keep every stop predictable.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {timeline.map((item) => (
              <div key={item.title} className="border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-700">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">FAQs</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Gig worker FAQs</h2>
            <p className="mt-2 text-base text-slate-600">Quick details so you can decide if this hub fits your routes.</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {faqItems.map((item) => (
              <div key={item.question} className="border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div className="space-y-3 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Membership</p>
              <h2 className="text-2xl font-bold sm:text-3xl">Join the gig worker hub for calm routes</h2>
              <p className="text-base text-slate-200">
                Start with Starter to browse firms and safety notes, then upgrade inside the hub for route planning and concierge
                scripts while you are on the road.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/membership"
                  className="inline-flex items-center justify-center bg-brand-copper px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Choose your membership
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Ask about route pilots
                </Link>
              </div>
            </div>
            <div className="border border-white/15 bg-white/5 p-5 text-sm text-slate-100">
              <p className="font-semibold text-white">Included for gig workers</p>
              <ul className="mt-3 space-y-2">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  Route briefs with safety notes and access scripts.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  Proof and incident templates for every stop type.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  Payout expectations and timing by firm.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
