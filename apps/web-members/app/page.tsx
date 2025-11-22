'use client'

import Script from 'next/script'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { useAuth } from '@/components/auth-provider'
import { RoleCarousel } from '@/components/RoleCarousel'

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

// Map Outseta plan UIDs to plan names for quick display
const getPlanName = (uid: string | null) => {
  switch (uid) {
    case 'L9nbKV9Z':
      return 'Starter'
    case 'rQVqlLm6':
      return 'Pro'
    case 'NmdnNO90':
      return 'Elite'
    case 'rmk5Xk9g':
      return 'Agency'
    default:
      return null
  }
}

export default function HomePage() {
  const { user, planUid, isLoading, isAuthenticated, logout, profileDisplayName } = useAuth()

  const planName = getPlanName(planUid)

  const firstName =
    (profileDisplayName as string | null) ??
    ((user as any)?.first_name as string | undefined) ??
    ((user as any)?.FirstName as string | undefined) ??
    (user?.name ? user.name.split(' ')[0] : undefined) ??
    (user?.email ? user.email.split('@')[0] : undefined) ??
    'Member'

  const initials = firstName.charAt(0).toUpperCase()

  return (
    <>
      {/* Structured data for SEO */}
      <Script
        id="nested-objects-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-brand-sand text-brand-dark">
        <SiteHeader />

        {/* Hero + stat card section */}
        <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:py-16">
            {/* Left hero copy */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-copper">
                Built for people who work in the field
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl lg:text-5xl">
                Keep routes moving. Keep assets compliant. Keep your time protected.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-700 sm:text-base">
                The Nested Objects Member Hub is your command center for inspections. See which firms
                are onboarding, understand requirements in plain language, and use AI-powered tools to
                plan your next route before you leave the driveway.
              </p>

              {/* Primary CTAs */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/directory"
                  className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
                >
                  Preview hiring firms
                </Link>
                <Link
                  href="/membership"
                  className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-mist"
                >
                  See plans & pricing
                </Link>
              </div>

              {/* Who we serve strip */}
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-700 shadow-sm sm:text-[13px]">
                <p className="font-semibold text-slate-900">Who this hub serves</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span>• Mortgage & insurance field inspectors</span>
                  <span>• Mobile notaries & signing agents</span>
                  <span>• Realtors & investor-friendly agents</span>
                  <span>• Gig pros adding inspections as a new lane</span>
                </div>
              </div>
            </div>

            {/* Right: daily route preview card */}
            <div className="flex items-stretch">
              <div className="relative w-full rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-200 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Live beta
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {isAuthenticated ? `Welcome back, ${firstName}` : 'Your daily route overview'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Today&apos;s opportunities. filtered by your state.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    {planName ? `${planName} member` : 'Guest preview'}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">
                        Exterior occupancy checks · 12 stops
                      </p>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Priority
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Local bank portfolio · 45–60 sec per door. ladder not required.
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">$180–$240 route est.</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="font-semibold text-slate-900">
                      Insurance loss photos · 6 stops · ladder required
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Mix of roofs & interiors. pay bump for photo sets and measurements.
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">$90 min est.</p>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
                    <p className="text-[11px] text-slate-600">
                      Turn on Pro to see real firms, rates, and requirements mapped to your home base.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-900">3</span> lanes selected ·{' '}
                    <span className="font-semibold text-slate-900">2</span> firms in onboarding status
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-[11px] font-semibold text-brand-copper hover:text-brand-copperDark"
                  >
                    Open your hub →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <RoleCarousel />

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

        {/* Footer */}
        <footer className="border-t border-brand-copper/25 bg-brand-dark">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-[11px] text-brand-steel sm:flex-row sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} Nested Objects LLC. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/membership" className="hover:text-white">
                Membership
              </Link>
              <Link href="/directory" className="hover:text-white">
                Directory
              </Link>
              <Link href="/resources" className="hover:text-white">
                Resources
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
