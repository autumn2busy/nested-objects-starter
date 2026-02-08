import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getCanonicalUrl, getRolePageSchema } from '@/lib/seo'

const segments = [
  {
    name: 'Residential',
    summary: 'Quick exterior and interior snapshots with occupant scripts.',
    items: [
      'Access notes for HOAs and gated communities',
      'Photo order for roofs, utilities, and exteriors',
      'Resident-friendly intros and consent reminders',
    ],
  },
  {
    name: 'Small commercial',
    summary: 'Light risk assessments with minimal disruption to operations.',
    items: [
      'Open/close timelines and parking guidance',
      'Checklists for signage, egress, and equipment tags',
      'Escalation steps for hazards or denied access',
    ],
  },
  {
    name: 'Mid market',
    summary: 'Coordinated walkthroughs with underwriting-ready documentation.',
    items: [
      'Pre-call templates for facilities teams',
      'Shot lists for life-safety systems and maintenance records',
      'Delivery formats aligned to underwriting requirements',
    ],
  },
]

const underwritingBullets = [
  'Consistent labeling and alt-text on images to speed review.',
  'Highlight risk drivers early with severity, impact, and follow-up steps.',
  'Submission bundles structured to match carrier templates.',
]

const faqs = [
  {
    question: 'How do I switch between segments?',
    answer: 'Use the tabs to see capture order, scripts, and deliverables tailored to each segment.',
  },
  {
    question: 'Can I reuse templates with different carriers?',
    answer: 'Yes. We map core requirements to carrier-specific expectations so you can adjust without starting over.',
  },
  {
    question: 'Does this help with scheduling?',
    answer: 'You get scenario scripts, pre-visit checklists, and reminders that reduce reschedules.',
  },
]

export const metadata: Metadata = {
  title: 'Insurance loss control | Nested Objects',
  description: 'Role page for insurance loss control with hero, segments, underwriting bullets, FAQ, and CTA strip.',
}

export default function InsuranceLossControlPage() {
  const schema = getRolePageSchema({
    name: 'Insurance loss control',
    description:
      'Role page for insurance loss control with hero, segments, underwriting bullets, FAQ, and CTA strip.',
    url: getCanonicalUrl('/roles/insurance-loss-control'),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="bg-brand-sand text-slate-900">
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Insurance loss control</p>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Be the inspector underwriting loves.</h1>
              <p className="max-w-3xl text-base text-slate-700 sm:text-lg">
                Pair on-site clarity with underwriting-friendly deliverables so every visit moves from scheduling to submission
                smoothly.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/directory"
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  View carrier directory
                </Link>
                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  Loss control resources
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-brand-sand shadow-sm">
                <Image
                  src="/insurance-loss-control.png"
                  alt="Insurance loss control inspector reviewing underwriting checklist"
                  className="h-full w-full object-cover"
                  width={880}
                  height={620}
                  priority
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-brand-sand p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Use cases you can toggle</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" aria-hidden="true" />
                    Fast scheduling scripts for occupants and facilities managers.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" aria-hidden="true" />
                    Capture order lists built for underwriting.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" aria-hidden="true" />
                    Submission bundles that keep reviewers moving.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-brand-sand py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Segments</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Switch between segments without guessing</h2>
            <p className="mt-2 text-base text-slate-700">Use tabs to see the capture flow for each inspection type.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {segments.map((segment) => (
              <div key={segment.name} className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{segment.name}</p>
                  <p className="text-sm text-slate-700">{segment.summary}</p>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {segment.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" aria-hidden="true" />
                      <span>{item}</span>
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Underwriting friendly</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Submissions reviewers can trust</h2>
            <p className="mt-2 text-base text-slate-700">Bulletproof the handoff so underwriting can move faster.</p>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {underwritingBullets.map((item) => (
              <li key={item} className="rounded-md border border-slate-200 bg-brand-sand p-5 text-sm text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-brand-sand py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">FAQ</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Answers inspectors ask the most</h2>
            <p className="mt-2 text-base text-slate-700">Use this as a quick reference before each visit.</p>
          </div>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{faq.question}</p>
                <p className="mt-2 text-sm text-slate-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-900 py-12 sm:py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">CTA</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Join the loss control toolkit</h2>
            <p className="text-sm text-slate-100">Hero briefs, tabs, and underwriting bullets keep every visit aligned.</p>
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
    </>
  )
}
