import type { Metadata } from 'next'
import Link from 'next/link'

const comparisonPoints = [
  {
    title: 'Scheduling',
    pain: 'Last-minute lender updates and mismatched packet requirements.',
    solution: 'Automatic prep notes by lender and package type, with buffer recommendations for traffic and borrower questions.',
  },
  {
    title: 'At the table',
    pain: 'Juggling IDs, signatures, and scanbacks while keeping borrowers calm.',
    solution: 'Concise signer scripts, ID capture prompts, and scanback checklists that keep appointments under control.',
  },
  {
    title: 'After the signing',
    pain: 'Worried about rejections, missing forms, or payout delays.',
    solution: 'Submission guardrails with courier guidance, revision templates, and payout expectations by lender.',
  },
]

const timeline = [
  {
    title: 'Lock in the assignment',
    detail:
      'See lender nuances, required stamps, and distance guidance before you confirm, with suggested buffers for travel and printing.',
  },
  {
    title: 'Walk in prepared',
    detail:
      'Borrower-friendly introductions, table layouts, and ID check reminders keep the room calm while you work through the packet.',
  },
  {
    title: 'Scan, ship, and submit',
    detail:
      'Built-in scanback order, courier drop prompts, and simple lender updates reduce after-hours corrections.',
  },
]

const faqItems = [
  {
    question: 'Do you include state-specific notary guidance?',
    answer:
      'Yes. Each prep brief layers in state requirements, lender expectations, and any specialized certificates before you head out.',
  },
  {
    question: 'Can I manage multiple signing types?',
    answer:
      'Create quick presets for refinances, purchases, HELOCs, and debt settlements so the right checklists appear automatically.',
  },
  {
    question: 'How does routing support work for mobile notaries?',
    answer:
      'Pair assignments with mapping suggestions, traffic buffers, and borrower communication templates to avoid last-minute scrambles.',
  },
  {
    question: 'Is member support available during appointments?',
    answer:
      'You get an AI concierge plus human support to answer lender-specific questions or provide alternative scripts mid-appointment.',
  },
]

export const metadata: Metadata = {
  title: 'Notaries | Signing support and lender-ready membership',
  description:
    'Mobile and remote notaries get lender-specific prep briefs, borrower scripts, and routing support to keep every signing smooth.',
  openGraph: {
    title: 'Notaries | Signing support and lender-ready membership',
    description:
      'Nested Objects helps notaries reduce rework with lender-specific checklists, borrower comms, and payout transparency.',
    url: 'https://nested-objects-starter.vercel.app/roles/notary',
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
    title: 'Notaries | Signing support and lender-ready membership',
    description:
      'Scripts, scanback lists, and lender intel keep mobile notaries calm from confirmation through payout.',
    images: ['https://nested-objects-starter.vercel.app/logo-slate.svg'],
  },
}

export default function NotaryRolePage() {
  return (
    <main className="bg-white text-slate-900">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Notaries</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Never guess what each lender expects.</h1>
            <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
              The membership delivers calm, lender-specific briefs, ready-to-use borrower scripts, and routing prompts so you can
              run efficient appointments without surprises.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center bg-brand-copper px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
              >
                See notary membership plans
              </Link>
              <Link
                href="/directory"
                className="inline-flex items-center justify-center border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
              >
                Browse lenders and firms
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prepared arrivals</p>
                <p className="mt-2 text-sm text-slate-700">Borrower messaging, ID guidance, and scanback reminders.</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Confident wrap-ups</p>
                <p className="mt-2 text-sm text-slate-700">Courier prompts, revision templates, and payout expectations.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-900">What notaries lean on</p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Lender nuances, scanback steps, and ID requirements in one brief.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Borrower-friendly scripts that reduce friction at the table.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Route-aware timing so you can stack appointments confidently.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Payout and revision expectations for every lender.
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
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">The calm path for every signing</h2>
            <p className="mt-2 text-base text-slate-600">
              Move from scattered notes to lender-ready scripts, checklists, and payout clarity that keep signings on time.
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
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">A smooth signing day, step by step</h2>
            <p className="mt-2 text-base text-slate-600">
              Use the hub before, during, and after appointments to keep borrowers confident and lenders informed.
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
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Notary membership questions</h2>
            <p className="mt-2 text-base text-slate-600">Direct answers so you know exactly how the hub supports each signing.</p>
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
              <h2 className="text-2xl font-bold sm:text-3xl">Join the notary hub built for calm signings</h2>
              <p className="text-base text-slate-200">
                Start with Starter to explore lender intel, then upgrade inside the hub for routing support and concierge answers
                mid-signing.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/membership"
                  className="inline-flex items-center justify-center bg-brand-copper px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Choose your plan
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Ask about regional rollouts
                </Link>
              </div>
            </div>
            <div className="border border-white/15 bg-white/5 p-5 text-sm text-slate-100">
              <p className="font-semibold text-white">Included for notaries</p>
              <ul className="mt-3 space-y-2">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  Lender and title firm intel with payout norms.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  AI scripts and recap summaries for borrowers.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  Scanback, shipping, and revision checklists.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

