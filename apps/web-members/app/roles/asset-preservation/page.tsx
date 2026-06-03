import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { generatePageMetadata } from '@/lib/seo'
import { RoleAeoJsonLd, RoleAeoSection, roleAeoContent } from '../role-aeo-content'

const comparison = [
  {
    label: 'Traditional vendor list',
    points: ['Fragmented contacts and unclear SLAs', 'Limited visibility into active needs', 'Slow updates when scope changes'],
  },
  {
    label: 'Nested Objects hub',
    points: ['Central briefs with access and safety notes', 'Live needs by asset type and geography', 'Faster coordination with scripts and timelines'],
  },
]

const pillars = [
  { title: 'Protect', body: 'Risk flags, safety notes, and compliance reminders before dispatch.' },
  { title: 'Preserve', body: 'Checklists for debris removal, winterization, and routine upkeep.' },
  { title: 'Profit', body: 'Clear payout expectations and optimized routing to avoid rework.' },
]

const roles = [
  {
    role: 'Solo inspector',
    focus: 'One-stop briefs for occupancy, photos, and quick maintenance tasks.',
  },
  {
    role: 'Crew lead',
    focus: 'Assign tasks, share access steps, and keep proofs aligned with client requirements.',
  },
  {
    role: 'Coordinator',
    focus: 'Balance vendors, schedules, and reporting with a single playbook.',
  },
]

export const metadata: Metadata = generatePageMetadata({
  title: 'Asset Preservation Vendor Guide',
  description:
    'Learn how asset preservation vendors compare firms, service areas, documentation requirements, reimbursement rules, and route-fit expectations.',
  path: '/roles/asset-preservation',
})

export default function AssetPreservationPage() {
  const roleAeo = roleAeoContent['asset-preservation']

  return (
    <main className="bg-brand-sand text-slate-900">
      <RoleAeoJsonLd content={roleAeo} />
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8 lg:pb-16 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Asset preservation</p>
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Industrial-ready workflows for every property.</h1>
                <p className="max-w-3xl text-base text-slate-700 sm:text-lg">
                  Keep vacant, occupied, and distressed assets protected with clear expectations, comparison transparency, and
                  roles that scale.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/inspector-resource-center"
                  className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:w-auto"
                >
                  Preservation resources
                </Link>
                <Link
                  href="/hiring-firms"
                  className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:w-auto"
                >
                  Vendor directory
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-brand-sand shadow-sm">
              <Image
                src="/asset-preservation.webp"
                alt="Asset preservation crew coordinating property upkeep"
                className="h-full w-full object-cover"
                width={880}
                height={620}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-brand-sand py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Comparison</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Traditional vendor list vs Nested Objects hub</h2>
            </div>
            <Link
              href="/membership-pricing"
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-brand-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              See how it works
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {comparison.map((item) => (
              <div key={item.label} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {item.points.map((point) => (
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Pillars</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Protect. Preserve. Profit.</h2>
            <p className="mt-2 text-base text-slate-700">Three pillars to keep every asset on track.</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="rounded-md border border-slate-200 bg-brand-sand p-5">
                <p className="text-sm font-semibold text-slate-900">{pillar.title}</p>
                <p className="mt-2 text-sm text-slate-700">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-brand-sand py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-steel">Roles</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Role table for every team member</h2>
            <p className="mt-2 text-base text-slate-700">Match responsibilities to the right playbook.</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {roles.map((role) => (
              <div key={role.role} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{role.role}</p>
                <p className="mt-2 text-sm text-slate-700">{role.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RoleAeoSection content={roleAeo} />

      <section className="border-t border-slate-200 bg-slate-900 py-12 sm:py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">CTA</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to preserve more assets?</h2>
            <p className="text-sm text-slate-100">Join the hub that aligns crews, coordinators, and clients.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/membership-pricing"
              className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              Start membership
            </Link>
            <Link
              href="/hiring-firms"
              className="inline-flex w-full items-center justify-center rounded-md border border-slate-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              View directory
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
