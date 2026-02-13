import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

const timeline = [
  {
    label: 'Morning brief',
    detail:
      'Review lender and carrier guidelines, badge requirements, and safety notes before heading to the first address.',
  },
  {
    label: 'On-site flow',
    detail:
      'Follow stepwise prompts for entry, photo sequence, measurements, and quick notes to keep every inspection consistent.',
  },
  {
    label: 'Closeout',
    detail:
      'Upload proofs, send scripts to stakeholders, and confirm payout timing without waiting for back-and-forth.',
  },
]

const benefits = [
  {
    title: 'Ready on arrival',
    body: 'Job briefs call out access rules, neighbor notifications, and risk flags so you walk in prepared.',
  },
  {
    title: 'Confidence with clients',
    body: 'Scripts for lenders, adjusters, and occupants help you move the appointment forward without friction.',
  },
  {
    title: 'Protected time',
    body: 'Route grouping, weather notes, and required shots reduce repeat visits and rework.',
  },
]

const steps = [
  {
    title: 'Join and set your market',
    description: 'Pick your coverage radius and inspection types so briefs and leads stay relevant.',
  },
  {
    title: 'Use the daily playbook',
    description: 'Start with timelines, safety checks, and required deliverables for every firm you work with.',
  },
  {
    title: 'Submit with clarity',
    description: 'Ship photos, notes, and signatures with templates that match lender and carrier expectations.',
  },
]

export const metadata: Metadata = {
  title: 'Gig pro inspector | Nested Objects',
  description:
    'Route-ready playbooks for independent inspectors who switch between lender, insurance, and occupancy checks.',
}

export default function GigProInspectorPage() {
  return (
    <main className="bg-brand-sand text-slate-900">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-steel">Gig pro inspector</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Arrive with a plan. Finish with proof.</h1>
            <p className="max-w-3xl text-base text-slate-700 sm:text-lg">
              Membership gives mobile inspectors lender-ready checklists, carrier scripts, and route clarity so you can move
              through each appointment with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/hiring-firms"
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                Browse lender directory
              </Link>
              <Link
                href="/inspector-resource-center"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                Open inspection resources
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
              <span className="rounded-full bg-white px-3 py-2 shadow-sm">Pre-field briefs</span>
              <span className="rounded-full bg-white px-3 py-2 shadow-sm">Photo & note sequences</span>
              <span className="rounded-full bg-white px-3 py-2 shadow-sm">Safety & escalation steps</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <Image
                src="/gig-pro-inspector.png"
                alt="Gig pro inspector preparing for the next route"
                className="h-full w-full object-cover"
                width={880}
                height={620}
                priority
              />
            </div>
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <p className="text-sm font-semibold text-slate-900">Your day at a glance</p>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Route ready</span>
              </div>
              <ol className="space-y-4">
                {timeline.map((item) => (
                  <li key={item.label} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-slate-900" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="pt-2">
                <Link
                  href="/membership-pricing"
                  className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  See the 7-day starter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Before and after</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Walk in organized, leave with approvals</h2>
            </div>
            <Link
              href="/hiring-firms"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              See firms in the hub
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-brand-sand p-5">
              <p className="text-sm font-semibold text-slate-900">Before Nested Objects</p>
              <p className="mt-2 text-sm text-slate-700">
                Scrambling between emails, portals, and past notes to figure out what shots and signatures each lender wants.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">After Nested Objects</p>
              <p className="mt-2 text-sm text-slate-700">
                A single brief with access steps, proof lists, and scripts that align to lender and carrier expectations—ready
                on mobile.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-sand py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Route ready benefits</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">What keeps inspections moving</h2>
            <p className="mt-2 text-base text-slate-700">
              Tools and briefs shaped for pros who split time between occupancy checks, lender verifications, and light
              insurance work.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{benefit.title}</p>
                <p className="mt-2 text-sm text-slate-700">{benefit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">How to start in 7 days</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Get productive fast</h2>
            <p className="mt-2 text-base text-slate-700">Turn on the basics in a week and keep refining as you add routes.</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col rounded-md border border-slate-200 bg-brand-sand p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-2 text-sm text-slate-700">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-900 py-12 sm:py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">Ready to inspect differently?</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Join the hub built for gig inspectors</h2>
            <p className="text-sm text-slate-100">
              Get lender-ready templates, on-site scripts, and payout clarity without adding another complex system.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/membership-pricing"
              className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Start membership
            </Link>
            <Link
              href="/hiring-firms"
              className="inline-flex items-center justify-center rounded-md border border-slate-500 px-5 py-3 text-sm font-semibold text-white transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              View lender partners
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
