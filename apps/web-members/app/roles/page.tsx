import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { generatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = generatePageMetadata({
  title: 'Inspector and notary role guides',
  description:
    'Browse role-specific Nested Objects guides for field inspectors, notaries, insurance loss control surveyors, and property preservation pros.',
  path: '/roles',
})

const roles = [
  {
    title: 'Mortgage field inspector',
    slug: 'mortgage-field-inspector',
    description: 'Occupancy checks, photo sets, lender notes, and mortgage field service expectations.',
  },
  {
    title: 'Insurance loss control',
    slug: 'insurance-loss-control',
    description: 'Risk surveys, underwriting photos, measurements, and carrier-ready reporting habits.',
  },
  {
    title: 'Mobile notary',
    slug: 'mobile-notary',
    description: 'Signing services, title/escrow vendors, RON platforms, route math, and adjacent field work.',
  },
  {
    title: 'Asset preservation',
    slug: 'asset-preservation',
    description: 'REO, preservation, before-and-after documentation, and vendor coordination.',
  },
  {
    title: 'Gig pro inspector',
    slug: 'gig-pro-inspector',
    description: 'Ways to layer inspection work into delivery, route, and local field-service income.',
  },
  {
    title: 'Inspector',
    slug: 'inspector',
    description: 'General inspection workflows, field readiness, and reporting fundamentals.',
  },
  {
    title: 'Realtor',
    slug: 'realtor',
    description: 'BPO, occupancy, and property-condition work that can support real estate operators.',
  },
  {
    title: 'Gig worker',
    slug: 'gig-worker',
    description: 'Field work paths for operators adding inspection-style assignments to existing routes.',
  },
]

export default function RolesPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
            Role guides
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Field service paths Nested Objects supports
          </h1>
          <p className="mt-3 max-w-3xl text-base text-slate-700">
            Start with the role closest to your work, then use the firm directory and tools preview to
            compare opportunities, requirements, and next steps.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Link
              key={role.slug}
              href={`/roles/${role.slug}`}
              className="group flex h-full flex-col rounded-md border border-slate-200 bg-white p-5 transition hover:border-brand-copper/50 hover:shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-brand-copper">
                {role.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {role.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-copper">
                Open guide <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
