import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { generatePageMetadata } from '@/lib/seo'
import { RoleAeoJsonLd, RoleAeoSection, roleAeoContent } from '../role-aeo-content'

const opportunityTypes = [
  {
    title: 'Signing services',
    detail: 'Compare signing platforms, direct vendor pages, scan-back expectations, and payout clues before applying.',
  },
  {
    title: 'Title and escrow vendors',
    detail: 'Use firm research to separate direct title opportunities from broad platforms and low-context assignment feeds.',
  },
  {
    title: 'RON and hybrid platforms',
    detail: 'Track remote notarization, witness, ID, and document workflow requirements alongside traditional mobile work.',
  },
  {
    title: 'Inspection add-ons',
    detail: 'Layer occupancy checks, photo tasks, document delivery, and lender support work into existing route gaps.',
  },
]

const routeMath = [
  'Signing fee after printing, scan-backs, and travel',
  'Inspection/photo add-ons that fit the same route window',
  'Mileage, deadhead time, and cancellation risk before accepting work',
]

const applicationSignals = [
  'Requires NNA certification or background screening',
  'Lists E&O, bond, commission, or RON requirements clearly',
  'Provides a real vendor application or signing-agent onboarding page',
  'Shows pay timing, scan-back rules, revision policy, or service area fit',
]

export const metadata: Metadata = generatePageMetadata({
  title: 'Mobile Notary Jobs, Signing Services & Field Work',
  description:
    'Find signing services, notary vendor applications, RON platforms, and route-compatible field inspection work with pay-fit tools and firm research from Nested Objects.',
  path: '/roles/mobile-notary',
})

export default function MobileNotaryPage() {
  const roleAeo = roleAeoContent['mobile-notary']

  return (
    <main className="bg-white text-slate-900">
      <RoleAeoJsonLd content={roleAeo} />

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:px-8 lg:py-16">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase text-brand-copper">Mobile notary opportunity hub</p>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Find signing services, notary vendor programs, and route work worth your drive.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
                Nested Objects helps mobile notaries and signing agents compare companies before applying, estimate net route
                pay, and add compatible field-service work without chasing random platforms.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/hiring-firms?industry=Notary"
                className="inline-flex w-full items-center justify-center rounded-md bg-brand-copper px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-copperDark sm:w-auto"
              >
                Browse notary-friendly firms
              </Link>
              <Link
                href="/tools/notary-route-calculator"
                className="inline-flex w-full items-center justify-center rounded-md border border-slate-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-white sm:w-auto"
              >
                Calculate route profit
              </Link>
            </div>
            <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              {routeMath.map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/5 p-3">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-2xl">
              <Image
                src="/mobile-notary.webp"
                alt="Mobile notary preparing documents and inspection materials"
                className="h-full w-full object-cover"
                width={880}
                height={620}
                priority
              />
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Best-fit notary opportunities</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Start with signing services and title vendors, then add field photo assignments only when the distance,
                deadline, and documentation rules protect your margin.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-brand-sand py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-brand-copper">What to compare</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Use the directory before you apply everywhere.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Notaries do not need another generic list. They need to know which firms have a real onboarding path,
              clear requirements, and enough route fit to justify the time.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {opportunityTypes.map((type) => (
              <article key={type.title} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">{type.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{type.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-brand-copper">Application quality</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Shortlist firms with stronger vendor signals.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Nested Objects should help a notary protect time before the application. The best targets make requirements,
              service lanes, and next steps visible before you upload credentials.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/hiring-firms?industry=Notary&search=signing"
                className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
              >
                Find signing services
              </Link>
              <Link
                href="/hiring-firms?industry=Notary&search=RON"
                className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50 sm:w-auto"
              >
                Find RON platforms
              </Link>
            </div>
          </div>

          <ul className="grid gap-3">
            {applicationSignals.map((signal) => (
              <li key={signal} className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {signal}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-brand-copper">Route math</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Check the net before you accept the trip.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              A signing fee can look strong until printing, scan-backs, fuel, and dead time hit the route. The calculator
              gives notaries a fast way to compare the real weekly picture.
            </p>
          </div>
          <Link
            href="/tools/notary-route-calculator"
            className="inline-flex w-full items-center justify-center rounded-md bg-brand-copper px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-copperDark sm:w-auto"
          >
            Open notary calculator
          </Link>
        </div>
      </section>

      <RoleAeoSection content={roleAeo} />

      <section className="bg-slate-950 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-brand-copper">Next step</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Build a better notary target list.</h2>
            <p className="text-sm leading-6 text-slate-300">
              Compare signing services, vendor pages, route fit, and adjacent inspection work before you commit time.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/membership-pricing"
              className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
            >
              Start membership
            </Link>
            <Link
              href="/tools/companies"
              className="inline-flex w-full items-center justify-center rounded-md border border-slate-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-white sm:w-auto"
            >
              Track saved firms
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
