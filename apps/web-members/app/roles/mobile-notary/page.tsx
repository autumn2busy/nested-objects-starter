import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

const scenarios = [
  {
    title: 'Back-to-back signings',
    detail: 'Blend signings with light inspections using scripts and shot lists for borrowers and occupants.',
  },
  {
    title: 'Evening or weekend visits',
    detail: 'Scheduling prompts and safety reminders keep you covered when working off-hours.',
  },
  {
    title: 'Last-minute lender requests',
    detail: 'Use-ready templates for photos, acknowledgments, and quick addenda without slowing the signing.',
  },
]

const checklist = [
  'Confirm IDs, occupancy statements, and access notes before arrival.',
  'Follow dual-purpose checklists for signings plus inspection photos.',
  'Send wrap-up scripts that set expectations on submission and payouts.',
]

export const metadata: Metadata = {
  title: 'Mobile notary | Nested Objects',
  description: 'Role page for mobile notaries with hero bullets, scenarios, social proof, checklist, and CTA.',
}

export default function MobileNotaryPage() {
  return (
    <main className="bg-brand-sand text-slate-900">
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Mobile notary</p>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Signings plus inspections, without chaos.</h1>
              <p className="max-w-3xl text-base text-slate-700 sm:text-lg">
                Combine notary appointments with inspection tasks using ready-made scripts, checklists, and submission steps for
                every lender.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/hiring-firms"
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  View lender directory
                </Link>
                <Link
                  href="/inspector-resource-center"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  Notary resources
                </Link>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" aria-hidden="true" /> Perfect for remote closings
                  with property checks.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" aria-hidden="true" /> Built-in safety and arrival
                  prompts.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" aria-hidden="true" /> Aligned with lender and title
                  partner expectations.
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-brand-sand shadow-sm">
                <Image
                  src="/mobile-notary.png"
                  alt="Mobile notary preparing documents and inspection materials"
                  className="h-full w-full object-cover"
                  width={880}
                  height={620}
                  priority
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-brand-sand p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Scheduling scenarios</p>
                <div className="mt-4 space-y-4">
                  {scenarios.map((scenario) => (
                    <div key={scenario.title} className="rounded-md bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{scenario.title}</p>
                      <p className="mt-1 text-sm text-slate-700">{scenario.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-brand-sand py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Social proof</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Built for notaries balancing both worlds</h2>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-steel shadow-sm">
              Member quote
            </span>
          </div>
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base text-slate-700">
              “Nested Objects keeps me calm during signings with photos. Clients trust the flow, and I know exactly what to send
              the lender.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">— Alexis, Mobile Notary</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Get started</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Checklist for your next week</h2>
            <p className="mt-2 text-base text-slate-700">Ready-to-use steps for your first seven days.</p>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {checklist.map((item) => (
              <li key={item} className="rounded-md border border-slate-200 bg-brand-sand p-5 text-sm text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-900 py-12 sm:py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">CTA</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to combine signings and inspections?</h2>
            <p className="text-sm text-slate-100">Join the membership built for mobile notaries taking on inspection work.</p>
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
              View directory
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
