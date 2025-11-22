import type { Metadata } from 'next'
import Link from 'next/link'

const comparisonPoints = [
  {
    title: 'Client coordination',
    pain: 'Juggling showings, vendor timelines, and anxious buyers without clear scripts.',
    solution: 'Member scripts, reminders, and expectations aligned to each milestone so everyone knows what happens next.',
  },
  {
    title: 'Vendor alignment',
    pain: 'Chasing inspectors, appraisers, and signing agents for updates.',
    solution: 'Shared status views and templated nudges that keep vendors on track without adding to your inbox.',
  },
  {
    title: 'Readiness to close',
    pain: 'Worried about last-minute surprises, missing documents, or off-brand messaging.',
    solution: 'Checklists, offer-ready packets, and calm messaging that mirror the Nested Objects tone your clients trust.',
  },
]

const timeline = [
  {
    title: 'Prepare listings with confidence',
    detail:
      'Use staging and disclosure checklists, then share clear expectations with inspectors and photographers before the first showing.',
  },
  {
    title: 'Guide clients through offers',
    detail:
      'Leverage templated updates, lender-friendly timelines, and calm explainer blurbs to reduce back-and-forth.',
  },
  {
    title: 'Close without surprises',
    detail:
      'Track signings, walkthroughs, and funding milestones with concise CTA buttons your clients can follow from any device.',
  },
]

const faqItems = [
  {
    question: 'Is this for agents or coordinators?',
    answer:
      'Both. Agents, coordinators, and assistants use the same calm scripts, vendor nudges, and client-ready explanations to keep deals moving.',
  },
  {
    question: 'Do you include marketing assets?',
    answer:
      'Yes. You get capability blurbs, branded email templates, and showing reminders aligned to the Nested Objects tone.',
  },
  {
    question: 'Can I track partners and vendors?',
    answer:
      'Save preferred inspectors, appraisers, and notaries with response-time expectations so you always have backups.',
  },
  {
    question: 'How does this help with cross-market deals?',
    answer:
      'Market summaries and timeline guidance adapt by state, so your messaging and checklists stay accurate even when you are remote.',
  },
]

export const metadata: Metadata = {
  title: 'Realtors | Calm coordination for buyers, sellers, and vendors',
  description:
    'Scripts, reminders, and vendor coordination tools that keep real estate transactions on track without frantic follow-ups.',
  openGraph: {
    title: 'Realtors | Calm coordination for buyers, sellers, and vendors',
    description:
      'Nested Objects gives realtors and coordinators client-ready messaging, vendor nudges, and closing checklists in one place.',
    url: 'https://nested-objects-starter.vercel.app/roles/realtor',
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
    title: 'Realtors | Calm coordination for buyers, sellers, and vendors',
    description:
      'Client-ready messaging, vendor alignment, and closing checklists to keep transactions steady.',
    images: ['https://nested-objects-starter.vercel.app/logo-slate.svg'],
  },
}

export default function RealtorRolePage() {
  return (
    <main className="bg-white text-slate-900">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Realtors</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Keep every transaction steady and calm.</h1>
            <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
              Whether you are an agent, coordinator, or assistant, the membership gives you vendor-aligned scripts, checklists,
              and reminders that protect timelines and your brand tone.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center bg-brand-copper px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
              >
                Explore realtor plans
              </Link>
              <Link
                href="/directory"
                className="inline-flex items-center justify-center border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
              >
                Find inspectors and partners
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ready messaging</p>
                <p className="mt-2 text-sm text-slate-700">Client emails, text blurbs, and vendor nudges that sound calm and clear.</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Aligned partners</p>
                <p className="mt-2 text-sm text-slate-700">Shared expectations for inspectors, appraisers, and signing agents.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-900">What realtors rely on</p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Calm scripts for status updates, offer responses, and timeline changes.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Vendor-ready expectations for inspections, appraisals, and signings.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Checklists for listings, offers, and closings you can share with clients.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Briefs on nearby firms so you can recommend partners with confidence.
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
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">From scramble to steady</h2>
            <p className="mt-2 text-base text-slate-600">
              Swap scattered notes for organized scripts, vendor nudges, and client-ready updates that keep everyone calm.
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
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">A composed deal flow</h2>
            <p className="mt-2 text-base text-slate-600">
              Follow a calm cadence from listing to closing with ready-made updates and partner expectations.
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
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Realtor hub questions</h2>
            <p className="mt-2 text-base text-slate-600">Quick answers so you can decide if the membership fits your deals.</p>
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
              <h2 className="text-2xl font-bold sm:text-3xl">Join the realtor hub for steady deals</h2>
              <p className="text-base text-slate-200">
                Start free to review the firm directory and scripts, then upgrade inside the hub for deeper vendor coordination
                and concierge support.
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
                  Ask about team access
                </Link>
              </div>
            </div>
            <div className="border border-white/15 bg-white/5 p-5 text-sm text-slate-100">
              <p className="font-semibold text-white">Included for realtors</p>
              <ul className="mt-3 space-y-2">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  Client-ready scripts and reminders across the deal cycle.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  Vendor coordination flows for inspections, appraisals, and signings.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  Local firm intel and response-time expectations.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

