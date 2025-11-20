'use client'

import Script from 'next/script'
import { useAuth } from '@/components/auth-provider'
import Link from 'next/link'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Nested Objects Member Hub',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  url: 'https://nested-objects-starter.vercel.app',
  description:
    'AI powered member hub for field inspectors, notaries, realtors, and gig pros, helping you find firms, get trained, and land more work.',
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
  const { user, planUid, isLoading, isAuthenticated, logout } = useAuth()

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
        return 'Unknown'
    }
  }

  const planName = getPlanName(planUid)

  const firstName =
    (user as any)?.first_name ??
    (user as any)?.FirstName ??
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

      <main className="mx-auto max-w-screen-xl px-6 py-10 font-sans lg:py-14">
        {/* Header */}
        <header className="flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-10">
            <h1 className="text-3xl font-bold text-slate-900">Nested Objects</h1>

            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-800 lg:gap-6">
              <Link className="transition hover:text-blue-600" href="/">
                Home
              </Link>
              {isAuthenticated && (
                <Link className="transition hover:text-blue-600" href="/dashboard">
                  Dashboard
                </Link>
              )}
              <Link className="transition hover:text-blue-600" href="/directory">
                Directory
              </Link>
              <Link className="transition hover:text-blue-600" href="/membership">
                Membership
              </Link>
              <Link className="transition hover:text-blue-600" href="/tools">
                Tools
              </Link>
              <Link className="transition hover:text-blue-600" href="/resources">
                Resources
              </Link>
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {isLoading ? (
              <span className="text-slate-600">Loading...</span>
            ) : isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 rounded-full bg-white/80 px-3 py-2 shadow-sm ring-1 ring-slate-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-base font-semibold text-slate-900">
                    {initials}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-slate-900">{firstName}</span>
                    {planName !== 'Unknown' && (
                      <span className="text-xs text-slate-500">{planName} plan</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                  className="rounded-md border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  Login
                </a>
                <a
                  href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
                >
                  Sign Up
                </a>
              </>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="mb-16 flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex-1 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
              Uniting inspectors. Protecting neighborhoods. Elevating standards.
            </p>
            <h2 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Get hired faster as a field inspector, notary, or realtor.
            </h2>
            <p className="max-w-3xl text-lg leading-relaxed text-slate-600">
              Nested Objects is a verified hub for field pros who are tired of chasing mystery firms and guessing about pay.
              Find reputable companies, understand requirements, and use AI powered tools to move from applications to actual
              work.
            </p>

            {isAuthenticated ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-blue-500 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-600"
                >
                  Go to your dashboard
                </Link>
                <Link
                  href="/directory"
                  className="rounded-lg border border-blue-500 px-5 py-3 text-base font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  Browse hiring firms
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                    className="rounded-lg bg-emerald-500 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    Get directory access
                  </a>
                  <Link
                    href="/directory"
                    className="rounded-lg border border-blue-500 px-5 py-3 text-base font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    Preview hiring firms
                  </Link>
                </div>
                <p className="text-sm text-slate-500">No spam. You control your membership and notifications at any time.</p>
              </>
            )}
          </div>

          <div className="flex-1 min-w-[260px] max-w-sm space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-indigo-100/60 to-sky-50 p-7 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Built for people who work in the field.</h3>
            <ul className="list-disc space-y-2 pl-4 text-sm text-slate-600">
              <li>Mortgage and insurance field inspectors</li>
              <li>Mobile notaries and signing agents</li>
              <li>Realtors and investor friendly agents</li>
              <li>Gig pros adding inspections as a new income stream</li>
            </ul>
            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-slate-900">Inside the member hub.</p>
              <p className="text-sm text-slate-600">• Verified firm directory with pay and requirements</p>
              <p className="text-sm text-slate-600">• AI concierge to answer firm and industry questions</p>
              <p className="text-sm text-slate-600">
                • Checklists, templates, and starter kits so you can land your first or next contract
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mb-16 text-center">
          <h3 className="mb-4 text-3xl font-bold text-slate-900">Why Nested Objects exists.</h3>
          <p className="mx-auto max-w-4xl text-lg leading-relaxed text-slate-600">
            This hub was created for working parents, night shift hustlers, and full time entrepreneurs who deserve clear
            information, fair pay, and real support. We verify firms, unpack fine print, and give you practical tools so you
            can build a sustainable inspection business instead of piecing things together from random posts.
          </p>
        </section>

        {/* Ways to Plug In Grid */}
        <section className="mb-16">
          <h3 className="mb-10 text-center text-3xl font-bold text-slate-900">Three ways to plug into the ecosystem.</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <h4 className="mb-3 text-2xl font-semibold text-slate-900">📁 Verified firm directory</h4>
              <p className="mb-5 text-slate-600">
                Browse firms by region, service type, and requirements. Skip the guesswork and focus on companies that are
                actually hiring and paying.
              </p>
              <span className="mb-4 inline-flex w-fit items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                Included in all plans
              </span>
              <div>
                <Link className="text-sm font-semibold text-blue-600 underline" href="/directory">
                  View the directory →
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <h4 className="mb-3 text-2xl font-semibold text-slate-900">🎓 Training and starter kits</h4>
              <p className="mb-5 text-slate-600">
                Learn how inspections really work before you touch your first order. Use checklists, photo examples, and
                scripts to move with confidence from day one.
              </p>
              <span className="mb-4 inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
                Best for Starter and Pro
              </span>
              <div>
                <Link className="text-sm font-semibold text-blue-600 underline" href="/resources">
                  Explore resources →
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <h4 className="mb-3 text-2xl font-semibold text-slate-900">🤝 Community and office hours</h4>
              <p className="mb-5 text-slate-600">
                Join live sessions and conversations about pay, workload, and what firms are really like. Learn from other
                working pros instead of guessing alone.
              </p>
              <span className="mb-4 inline-flex w-fit items-center rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-900">
                Coming online as we grow
              </span>
              <div>
                <Link className="text-sm font-semibold text-blue-600 underline" href="/membership">
                  See membership options →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Operations Section */}
        <section className="mb-16 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900">Standards, systems, and shortcuts for field work.</h3>
              <p className="text-base leading-relaxed text-slate-600">
                We collect the small details that make or break your routes. From photo checklists to communication
                templates, Nested Objects helps you stay compliant, protect your score, and keep firms calling you back.
              </p>
            </div>
            <div>
              <ul className="space-y-3 text-base text-slate-700">
                <li>
                  <span className="font-semibold">Compliance and quality.</span> Sample photos, checklists, and guidance so
                  you know exactly what firms expect on each order.
                </li>
                <li>
                  <span className="font-semibold">Tech that works for you.</span> Recommended apps, simple automations, and
                  AI helpers that cut your admin time.
                </li>
                <li>
                  <span className="font-semibold">Business minded support.</span> Email templates, rate conversations, and
                  client communication tips, so you show up as a business owner instead of just a vendor.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mb-16">
          <h3 className="mb-8 text-center text-3xl font-bold text-slate-900">Member stories and early wins.</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-3 text-base leading-relaxed text-slate-600">
                “Instead of scrolling random Facebook threads, I opened the directory, picked three firms, and actually got
                responses. I stop wasting time on companies that are not even onboarding.”
              </p>
              <p className="text-sm text-slate-500">Field inspector. Georgia</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-3 text-base leading-relaxed text-slate-600">
                “The starter kit helped me understand what a clean photo set looks like and what firms actually care about. I
                walked into my first orders with way more confidence.”
              </p>
              <p className="text-sm text-slate-500">New inspector. North Carolina</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-3 text-base leading-relaxed text-slate-600">
                “Having intel on different firms in one place keeps me from saying yes to things that would burn me out. I can
                aim for work that fits my schedule and family.”
              </p>
              <p className="text-sm text-slate-500">Inspector and parent. Nationwide</p>
            </div>
          </div>
        </section>

        {/* Opportunity Section for Firms */}
        <section className="mb-16 rounded-2xl border border-blue-100 bg-blue-50 p-10 shadow-sm">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900">For hiring firms. Connect with trained field pros.</h3>
              <p className="text-base leading-relaxed text-slate-700">
                If you hire inspectors, notaries, or real estate partners, Nested Objects gives you a way to show up in front
                of motivated professionals who understand the work. Share your requirements, regions, and expectations
                clearly, and match with people who want long term relationships, not just one off orders.
              </p>
            </div>
            <div className="space-y-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
              <ul className="space-y-3 text-base text-slate-700">
                <li>• Highlight your pay structure and expectations up front.</li>
                <li>• Reach inspectors and notaries who treat this like a real business.</li>
                <li>• Reduce churn by setting clear standards and support from day one.</li>
              </ul>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/membership"
                  className="rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  Explore firm membership
                </Link>
                <Link
                  href="/directory"
                  className="rounded-full border border-blue-200 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  Preview the directory
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!isAuthenticated && (
          <section className="rounded-2xl bg-slate-100 px-8 py-10 text-center shadow-sm">
            <h3 className="mb-4 text-3xl font-bold text-slate-900">Ready to treat inspections like a real business.</h3>
            <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-slate-600">
              Join Nested Objects to see verified firms, practical training, and AI powered tools in one place, so you can
              build income that respects your time and your household.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                className="rounded-lg bg-blue-500 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-600"
              >
                Start free
              </a>
              <Link
                href="/membership"
                className="rounded-lg border border-blue-500 px-5 py-3 text-base font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                View membership plans
              </Link>
            </div>
          </section>
        )}

        <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          <p>© 2025 Nested Objects LLC. All rights reserved.</p>
        </footer>
      </main>
    </>
  )
}
