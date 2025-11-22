'use client'

import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'

const planHighlights = [
  {
    name: 'Starter',
    summary: 'Browse the verified firm directory and learn the language of the field.',
    details: ['Directory access', 'Basic filters', 'Community updates', 'Starter checklists'],
  },
  {
    name: 'Pro',
    summary: 'Layer in intel, routing help, and AI concierge when you are working routes.',
    details: ['Firm intel snapshots', 'AI concierge', 'Advanced filters', 'Export options'],
  },
  {
    name: 'Elite',
    summary: 'Support for high-volume pros who manage routes like a business.',
    details: ['Priority support', 'Workflow templates', 'Regional demand briefs', 'Beta access'],
  },
  {
    name: 'Agency',
    summary: 'Tools and guidance for coordinators standing up multi-market teams.',
    details: ['Multi-user access', 'White-label options', 'Custom analytics', 'Quarterly strategy reviews'],
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <SiteHeader />

      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">About Nested Objects</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A hub built for people who work in the field.</h1>
            <p className="mt-4 max-w-2xl text-base text-slate-700">
              Nested Objects is the member hub for field inspectors, mobile notaries, real estate pros, and coordinators who want clarity before they get in the truck. We surface which firms are hiring, what they pay, and how to prep so you can protect your routes and your time.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                Explore membership tiers
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-mist"
              >
                Talk with our team
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-copper/20 bg-white/90 p-6 shadow-xl shadow-brand-copper/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-steel">Mission</p>
            <h2 className="mt-2 text-xl font-semibold text-brand-dark">Put real intel into the hands of people who keep properties moving.</h2>
            <p className="mt-3 text-sm text-slate-700">
              We started Nested Objects to fix the guesswork around inspections. Instead of chasing rumor threads and portal screenshots, members get one place to compare firms, prep routes, and ask questions of an AI concierge that is trained on the same data you see.
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div className="rounded-2xl border border-brand-copper/20 bg-brand-mist px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">What we do</p>
                <p className="mt-1">Curate the verified firm directory, intel snapshots, and training resources.</p>
              </div>
              <div className="rounded-2xl border border-brand-copper/20 bg-brand-mist px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Who we serve</p>
                <p className="mt-1">Inspectors, notaries, realtors, and coordinators who keep assets compliant.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-copper/15 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">How we help</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Clarity from onboarding to scaling your routes.</h2>
            <p className="mt-3 text-sm text-slate-700">
              Every feature is designed to shorten the distance between you and a well-run route: clear intel, transparent expectations, and tools that adapt to your plan tier.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-copper/20 bg-brand-mist p-5">
              <h3 className="text-sm font-semibold text-brand-dark">Verified directory</h3>
              <p className="mt-2 text-sm text-slate-700">See who is hiring in your state, what lanes they need, and how they prefer you to apply.</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-copper">Updated weekly</p>
            </div>
            <div className="rounded-2xl border border-brand-copper/20 bg-brand-mist p-5">
              <h3 className="text-sm font-semibold text-brand-dark">Intel without the noise</h3>
              <p className="mt-2 text-sm text-slate-700">Pay ranges, tools, and requirements in plain language—no more piecing together screenshots.</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-copper">Built from member feedback</p>
            </div>
            <div className="rounded-2xl border border-brand-copper/20 bg-brand-mist p-5">
              <h3 className="text-sm font-semibold text-brand-dark">AI concierge</h3>
              <p className="mt-2 text-sm text-slate-700">Ask questions about routes, firms, or gear and get answers tied to the same intel you review.</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-copper">Available in Pro and above</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-copper/15 bg-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Plan customizations</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Choose the experience that fits your lane.</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-700">
                Each plan unlocks different tools, concierge access, and reporting. Pick the tier that matches how you work today and scale into the next one when you are ready.
              </p>
            </div>
            <Link
              href="/membership"
              className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-white px-4 py-2 text-xs font-semibold text-brand-dark transition hover:bg-brand-sand"
            >
              View full plan comparison →
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {planHighlights.map((plan) => (
              <article key={plan.name} className="rounded-2xl border border-brand-copper/25 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-copper/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-copper">
                    {plan.name}
                  </span>
                  <span className="text-xs text-brand-steel">Customized experience</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-brand-dark">{plan.summary}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {plan.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-brand-copper" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Our promise</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Respect for your time, routes, and safety.</h2>
              <p className="mt-3 text-sm text-slate-700">
                We design every update to keep you informed without slowing you down. That means concise intel, clear comparisons, and training that respects the realities of being on the road.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-brand-copper/20 bg-brand-mist px-4 py-3">
                  <p className="text-sm font-semibold text-brand-dark">Transparent intel</p>
                  <p className="mt-1 text-sm text-slate-700">We publish how firms operate so you can make smart decisions quickly.</p>
                </div>
                <div className="rounded-2xl border border-brand-copper/20 bg-brand-mist px-4 py-3">
                  <p className="text-sm font-semibold text-brand-dark">Member-first tools</p>
                  <p className="mt-1 text-sm text-slate-700">Routing aids, checklists, and AI answers are tuned to save minutes on every stop.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-brand-copper/25 bg-brand-dark p-6 text-slate-100 shadow-xl shadow-brand-copper/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-copper">Values</p>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                  <span className="font-semibold text-white">Clarity over hype.</span> No noisy portals—just verified intel and tools that work.
                </li>
                <li>
                  <span className="font-semibold text-white">Time is money.</span> We build features that keep you in motion and reduce back-and-forth.
                </li>
                <li>
                  <span className="font-semibold text-white">Safety matters.</span> Training and guidance emphasize safe routes, gear, and client expectations.
                </li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">Field-tested guidance</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">Plan-tier support</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">Always evolving</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-brand-copper/15 bg-brand-sand">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <h2 className="text-2xl font-semibold text-brand-dark sm:text-3xl">Ready to see how the hub fits your routes?</h2>
            <p className="max-w-2xl text-sm text-slate-700">
              Start with the plan that matches where you are today, then unlock more intel, routing help, and concierge access as you grow.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                Compare plans
              </Link>
              <Link
                href="/directory"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-mist"
              >
                Preview the directory
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
