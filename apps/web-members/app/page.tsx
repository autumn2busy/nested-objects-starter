'use client'

import Script from 'next/script'
import Link from 'next/link'
import { RoleCarousel } from '@/components/RoleCarousel'
import { SiteFooter } from '@/components/SiteFooter'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Nested Objects Member Hub',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  url: 'https://nested-objects-starter.vercel.app',
  description:
    'Member hub and firm directory for field inspectors, notaries, real estate pros, and gig workers. Compare firms, see requirements, and plan better routes before you leave the driveway.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  creator: {
    '@type': 'Organization',
    name: 'Nested Objects',
  },
}

export default function HomePage() {
  return (
    <>
      {/* Structured data for SEO */}
      <Script
        id="nested-objects-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-brand-sand text-brand-dark">
        <RoleCarousel />

        <section className="border-b border-slate-200 bg-white/80">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 text-xs text-slate-700 shadow-sm sm:text-[13px]">
              <p className="font-semibold text-slate-900">Who this hub serves</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span>• Mortgage & insurance field inspectors</span>
                <span>• Mobile notaries & signing agents</span>
                <span>• Realtors & investor-friendly agents</span>
                <span>• Gig pros adding inspections as a new lane</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature pillars (Directory / Intel / AI tools) */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Inside the member hub
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-600">
                  One place to see who is hiring, what they pay, and what they expect from you before
                  you sign up for another portal.
                </p>
              </div>
              <Link
                href="/membership"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-brand-mist px-4 py-2 text-xs font-semibold text-brand-dark hover:bg-white"
              >
                Compare Starter vs Pro →
              </Link>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-sm font-semibold text-slate-900">Verified firm directory</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Search firms by region, service lane, tools required, and onboarding status. No
                  resumes uploaded. you control who sees your info.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Included with Starter
                </p>
                <Link
                  href="/directory"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  Browse active firms →
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-sm font-semibold text-slate-900">Transparent firm intel</h3>
                <p className="mt-2 text-sm text-slate-600">
                  See pay ranges, regions, typical volume, and expectations in plain language so you
                  can match firms to your schedule and gear.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Unlocks with Pro
                </p>
                <Link
                  href="/resources/firm-intel"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  View sample snapshots →
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-sm font-semibold text-slate-900">AI concierge for routes</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Ask which firms fit your lane, how to price routes, or what gear to buy first. Get
                  answers in seconds instead of scrolling random threads.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Pro · Elite · Agency
                </p>
                <Link
                  href="/tools"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  Explore tools →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it works timeline */}
        <section className="border-b border-brand-copper/15 bg-brand-mist">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                How inspectors use Nested Objects in real life
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Whether you are brand new or adding inspections to an existing route, the hub keeps
                your next steps simple.
              </p>
            </div>

            <ol className="mt-8 grid gap-6 text-sm text-slate-700 md:grid-cols-3">
              <li className="rounded-2xl border border-brand-copper/20 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Step 1</p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">Dial in your lane.</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Create your profile, pick your service lanes, and mark your home base. The hub
                  filters firms and routes around where you actually drive.
                </p>
              </li>
              <li className="rounded-2xl border border-brand-copper/20 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Step 2</p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Shortlist firms that fit your life.
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Use intel cards and AI concierge to compare pay ranges, volume, and gear so you
                  avoid dead-end portals and low-ball routes.
                </p>
              </li>
              <li className="rounded-2xl border border-brand-copper/20 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Step 3</p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Track applications and routes in one place.
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Save firms you apply to, jot notes after calls, and use starter kits to prep for day
                  one on a new client&apos;s route.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* Split section: New vs already in field */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-brand-copper/20 bg-white p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                  Just getting started.
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Use the free Starter plan to explore firms, learn the language, and decide which
                  lanes make sense for your life, car, and schedule.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  <li>• See which firms even work your state.</li>
                  <li>• Learn what tools and certifications matter first.</li>
                  <li>• Get checklists for your first inspections.</li>
                </ul>
                <Link
                  href="/membership"
                  className="mt-4 inline-flex text-sm font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  Start on Starter (free) →
                </Link>
              </div>

              <div className="rounded-2xl border border-brand-copper/30 bg-brand-dark p-6 text-slate-50">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200">
                  Already in the field.
                </h2>
                <p className="mt-2 text-sm text-slate-100">
                  Switch into Pro or higher to layer intel and AI tools on top of routes you already
                  run.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-100/90">
                  <li>• Compare what you&apos;re earning to typical ranges in your region.</li>
                  <li>• Spot firms paying better for the same lanes.</li>
                  <li>• Plan smarter routes around family, day jobs, or other gigs.</li>
                </ul>
                <Link
                  href="/membership"
                  className="mt-4 inline-flex text-sm font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  See Pro features →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA banner */}
        <section className="bg-brand-dark">
          <div className="mx-auto max-w-6xl px-4 py-10 text-center text-slate-50 sm:px-6 lg:px-8 lg:py-14">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Ready to stop guessing and start planning real routes.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
              Join the Nested Objects hub to see firms, intel, and tools in one place instead of
              chasing scattered posts and rumors.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                Explore membership options
              </Link>
              <Link
                href="/directory"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/50 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Preview the firm directory
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Starter is free. upgrade to Pro or higher only when the hub proves its value on your
              routes.
            </p>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  )
}
