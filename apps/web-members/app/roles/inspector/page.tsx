import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, getOccupationSchema } from '@/lib/seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { RoleAeoJsonLd, RoleAeoSection, roleAeoContent } from '../role-aeo-content'

const comparisonPoints = [
  {
    title: 'Before the job',
    pain: 'Digging through PDFs, fragmented firm instructions, and outdated templates.',
    solution: 'Use firm profiles, training, and readiness checklists to prepare for likely requirements before accepting work.',
  },
  {
    title: 'On-site',
    pain: 'Guessing what to capture first, worrying about compliance gaps, and missing quick fixes.',
    solution: 'Review training examples and firm-specific requirement notes, then follow the client instructions for each assignment.',
  },
  {
    title: 'After submission',
    pain: 'Waiting on feedback, chasing revisions, and losing track of payout timelines.',
    solution: 'Use firm intel and messaging templates to organize follow-up while confirming status directly with the client.',
  },
]

const milestones = [
  {
    title: 'Firm intel that supports route decisions',
    detail:
      'Compare service areas, equipment clues, and assignment expectations before you add a firm to your shortlist.',
  },
  {
    title: 'Photo standards without the second-guessing',
    detail:
      'Inline examples for exteriors, utilities, and attics keep your angles consistent while minimizing repeat visits.',
  },
  {
    title: 'Readiness guidance with human support',
    detail:
      'Use checklists and support resources while treating each firm’s current assignment instructions as authoritative.',
  },
]

const faqItems = [
  {
    question: 'How specific are the prep briefs for inspectors?',
    answer:
      'Current resources combine firm-profile context, training, and general readiness checklists. Always verify assignment-specific steps with the hiring firm.',
  },
  {
    question: 'Can I use my own report templates?',
    answer:
      'You can use the downloadable templates and adapt them outside the hub. Automated upload and firm-specific application are not enabled.',
  },
  {
    question: 'Do you cover gear recommendations?',
    answer:
      'Members get quick gear matrices covering moisture meters, drones, ladders, and PPE with notes on when each is expected or optional.',
  },
  {
    question: 'What if I manage a crew of inspectors?',
    answer:
      'Agency options provide a team-support path. Shared playbook automation and role-based tooling remain on the roadmap.',
  },
]

export const metadata: Metadata = {
  title: 'Inspectors',
  description:
    'Prep briefs, inspection checklists, and firm intel tailored for inspectors who want fewer surprises and faster approvals.',
  openGraph: {
    title: 'Inspectors | Field-ready membership for home and property inspectors',
    description:
      'Nested Objects gives inspectors prep briefs, submission guardrails, and payout clarity so every route runs smoother.',
    url: 'https://members.nestedobjects.com/roles/inspector',
    images: [
      {
        url: 'https://members.nestedobjects.com/logo-slate.svg',
        width: 1200,
        height: 630,
        alt: 'Nested Objects wordmark in slate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inspectors | Field-ready membership for home and property inspectors',
    description:
      'Use training, gear guidance, and firm intel to prepare for inspections while following each client’s current requirements.',
    images: ['https://members.nestedobjects.com/logo-slate.svg'],
  },
}

export default function InspectorRolePage() {
  const roleAeo = roleAeoContent.inspector
  const occupationSchema = getOccupationSchema({
    name: 'Home and Property Inspector',
    description: 'Home and property inspectors balancing documentation, safety, and client comms.',
    medianSalary: '60000',
  })

  return (
    <main className="bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(occupationSchema) }}
      />
      <RoleAeoJsonLd content={roleAeo} />
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <Breadcrumbs
          items={[
            { name: 'Home', url: SITE_URL },
            { name: 'Roles', url: `${SITE_URL}/roles` },
            { name: 'Inspectors', url: `${SITE_URL}/roles/inspector` },
          ]}
        />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Inspectors</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Prep, capture, and submit with fewer rewinds.
            </h1>
            <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
              Nested Objects keeps home and property inspectors aligned with each firm&apos;s SLAs, so you know exactly which shots,
              forms, and safety notes to prioritize before you step on site.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/membership-pricing"
                className="inline-flex items-center justify-center bg-brand-copper px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
              >
                Join the inspector membership
              </Link>
              <Link
                href="/hiring-firms"
                className="inline-flex items-center justify-center border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
              >
                View firms that hire inspectors
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Built for field clarity</p>
                <p className="mt-2 text-sm text-slate-700">Quick-read briefs, photo prompts, and compliance checks.</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Always on your side</p>
                <p className="mt-2 text-sm text-slate-700">Human support and readiness resources for clearer preparation.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-900">What inspectors lean on weekly</p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Firm profiles and training that clarify common assignment expectations.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Photo, equipment, and readiness examples for common inspection work.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Checklists that help you review likely requirements before submission.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                Payout expectations per firm with typical revision timelines.
              </li>
            </ul>
            <div className="pt-2">
              <Link
                href="/contact-us"
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
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Where Nested Objects changes the day</h2>
            <p className="mt-2 text-base text-slate-600">
              Inspectors who switch to the hub spend less time hunting for guidance and more time finishing reports on the first
              pass.
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Field story</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">What a calm inspection day looks like</h2>
            <p className="mt-2 text-base text-slate-600">
              Use the hub as your quiet co-pilot—from morning route checks to final submissions—without adding more tabs to your
              workflow.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {milestones.map((milestone) => (
              <div key={milestone.title} className="border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">{milestone.title}</p>
                <p className="mt-2 text-sm text-slate-700">{milestone.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RoleAeoSection content={roleAeo} />

      <section className="border-t border-slate-200 bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">FAQs</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Inspector questions we hear often</h2>
            <p className="mt-2 text-base text-slate-600">
              Transparent answers so you know exactly what&apos;s inside the membership before you join.
            </p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-copper">Ready to get started?</p>
              <h2 className="text-2xl font-bold sm:text-3xl">Join the inspector hub and keep routes calm</h2>
              <p className="text-base text-slate-200">
                Start with the Free plan to explore the directory, then upgrade inside the hub when you are ready for pro intel
                and readiness resources.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/membership-pricing"
                  className="inline-flex items-center justify-center bg-brand-copper px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Choose your membership
                </Link>
                <Link
                  href="/contact-us"
                  className="inline-flex items-center justify-center border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Ask about team access
                </Link>
              </div>
            </div>
            <div className="border border-white/15 bg-white/5 p-5 text-sm text-slate-100">
              <p className="font-semibold text-white">Included with membership</p>
              <ul className="mt-3 space-y-2">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  Vetted firm intel across states, services, and equipment expectations.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  A preview of planned member tools, with execution still disabled.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 bg-brand-copper" aria-hidden="true" />
                  Templates for readiness, messaging, and follow-up.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

