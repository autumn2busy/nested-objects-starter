import type { Metadata } from 'next'
import Link from 'next/link'

const stats = [
  { label: 'Avg. appointment time saved', value: '22 min' },
  { label: 'Revisit reduction', value: '34%' },
  { label: 'Submission accuracy lift', value: '+28%' },
]

const expectations = [
  {
    title: 'Lender-ready documentation',
    points: [
      'Photo order, measurements, and asset tags mapped to each lender.',
      'Borrower communication scripts that keep you compliant.',
      'Submission checklists to avoid reshoots and delays.',
    ],
  },
  {
    title: 'Professional presence on site',
    points: [
      'Arrival notes, parking guidance, and safety steps.',
      'Identification reminders and badge requirements by institution.',
      'Incident and escalation paths that protect your schedule.',
    ],
  },
]

const playbook = [
  { title: 'Prep', detail: 'Get lender-specific briefs, address-level notes, and required proofs the night before.' },
  { title: 'Perform', detail: 'Use mobile prompts for entry, talk tracks, and capture order to stay consistent.' },
  { title: 'Submit', detail: 'Upload with checklists, auto-summaries, and confirmations on payout timelines.' },
]

export const metadata: Metadata = {
  title: 'Mortgage field inspector | Nested Objects',
  description: 'Stat-strip hero, lender expectation columns, and playbook timeline for mortgage field inspectors.',
}

export default function MortgageFieldInspectorPage() {
  return (
    <main className="bg-brand-sand text-slate-900">
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-16">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Mortgage field inspector</p>
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Consistency lenders expect, built in.</h1>
                <p className="max-w-3xl text-base text-slate-700 sm:text-lg">
                  Deliver lender-ready inspections with stat clarity, expectation guides, and a playbook timeline you can rely on
                  every day.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/membership"
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    View membership
                  </Link>
                  <Link
                    href="/directory"
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    See lender partners
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center text-sm font-semibold text-slate-700 underline-offset-4 transition hover:text-slate-900"
                  >
                    Home
                  </Link>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-brand-sand p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Performance snapshot</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
                  {stats.map((item) => (
                    <div key={item.label} className="rounded-md bg-white p-4 shadow-sm">
                      <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-steel">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-steel">
                  <span className="rounded-full bg-white px-3 py-1 shadow-sm">Stat strip</span>
                  <span className="rounded-full bg-white px-3 py-1 shadow-sm">Lender links</span>
                  <span className="rounded-full bg-white px-3 py-1 shadow-sm">Submission clarity</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <Link href="/membership" className="underline-offset-4 hover:underline">
                Start membership
              </Link>
              <span aria-hidden="true">•</span>
              <Link href="/directory" className="underline-offset-4 hover:underline">
                Directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-brand-sand py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">What lenders expect</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Stay aligned on every inspection</h2>
            <p className="mt-2 text-base text-slate-700">
              Two-column guidance for pre-arrival prep and on-site professionalism keeps you ahead of lender expectations.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {expectations.map((section) => (
              <div key={section.title} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Playbook</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Timeline for predictable submissions</h2>
            <p className="mt-2 text-base text-slate-700">A horizontal flow from prep to payout to keep your week predictable.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {playbook.map((item, index) => (
              <div key={item.title} className="relative flex flex-col gap-3 rounded-md border border-slate-200 bg-brand-sand p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                </div>
                <p className="text-sm text-slate-700">{item.detail}</p>
                {index < playbook.length - 1 && <span className="absolute right-3 top-1/2 hidden h-px w-6 bg-slate-300 sm:block" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-sand py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Testimonial</p>
            <blockquote className="mt-3 space-y-3">
              <p className="text-xl font-semibold text-slate-900">“Nested Objects took the guesswork out of lender requests.”</p>
              <p className="text-base text-slate-700">
                “The briefs tell me exactly how to talk to borrowers, which angles to capture, and when I’ll get paid. It’s made
                inspections smoother and faster.”
              </p>
              <footer className="text-sm font-semibold text-slate-800">— Dana, Mortgage Field Inspector</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-900 py-12 sm:py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">CTA</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Keep lender relationships strong</h2>
            <p className="text-sm text-slate-100">Join the hub that builds predictability into every mortgage inspection.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/membership"
              className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Start membership
            </Link>
            <Link
              href="/directory"
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
