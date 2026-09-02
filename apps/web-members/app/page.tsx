import Link from 'next/link'
import { Calculator, Search } from 'lucide-react'
import { FreeSignupCta } from '@/components/FreeSignupCta'
import { RoleCarousel } from '@/components/RoleCarousel'
import { TechHero } from '@/components/TechHero'
import { TestimonialsSection, TestimonialStrip } from '@/components/TestimonialsSection'
import { TESTIMONIALS, getAverageRating } from '@/lib/testimonials'

export const revalidate = 3600

const aggregateRatingLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nested Objects',
  url: 'https://members.nestedobjects.com',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: getAverageRating(),
    bestRating: 5,
    worstRating: 1,
    reviewCount: TESTIMONIALS.length,
  },
  review: TESTIMONIALS.filter(t => t.source === 'google' || t.source === 'review').map((t) => ({
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: t.name,
    },
    datePublished: t.date,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: t.rating,
      bestRating: 5,
    },
    reviewBody: t.quote,
  })),
}

const popularSearchLinks = [
  {
    href: '/hiring-firms',
    label: 'Field inspection companies hiring',
    detail: 'Compare firms, service areas, pay clues, and onboarding expectations.',
  },
  {
    href: '/hiring-firms/texas',
    label: 'Texas field inspection firms',
    detail: 'Browse firms serving Texas inspectors, notaries, and preservation vendors.',
  },
  {
    href: '/hiring-firms/florida',
    label: 'Florida field inspection firms',
    detail: 'Find companies with Florida coverage and route-compatible field work.',
  },
  {
    href: '/roles/mortgage-field-inspector',
    label: 'Mortgage field inspector guide',
    detail: 'Learn requirements, assignment types, pay questions, and firm-fit checks.',
  },
  {
    href: '/roles/insurance-loss-control',
    label: 'Insurance loss control work',
    detail: 'Compare underwriting surveys, appointment expectations, and report complexity.',
  },
  {
    href: '/tools',
    label: 'Field inspection tools preview',
    detail: 'Preview planned route, income, firm-tracking, and preparation tools.',
  },
]

export default function HomePage() {
  return (
    <>
      <script
        id="aggregate-rating-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingLd) }}
      />

      <script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How do I find Independent Field Inspector work near me?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Nested Objects connects you with national firms hiring for Mortgage Field Inspection services and Insurance Loss Control jobs in your exact zip code."
                }
              },
              {
                "@type": "Question",
                "name": "Can I do Mobile Notary for real estate closings?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Our hub lists firms specifically looking for Loan Signing Agents and notaries certified for Remote Online Notarization (RON)."
                }
              },
              {
                "@type": "Question",
                "name": "Who hires for Drive-by appraisal services?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Lenders and AMCs hire through Nested Objects for drive-by appraisals and BPOs. Upgrade to Pro to see pay rates for these valuation orders."
                }
              }
            ]
          })
        }}
      />

      <main className="min-h-screen bg-brand-background text-brand-text">
        {/* TECH HERO (Control Center) */}
        <TechHero />

        <section className="border-b border-slate-200 bg-white [content-visibility:auto] [contain-intrinsic-size:0_180px]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-5 sm:px-6 md:flex-row lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-copper">
                Verified review signal
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Real member reviews from Google, YouTube, email, and in-app messages.
              </p>
            </div>
            <TestimonialStrip />
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50 [content-visibility:auto] [contain-intrinsic-size:0_220px] md:hidden">
          <div className="mx-auto max-w-md px-4 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-copper">
              Start here
            </p>
            <div className="mt-3 grid gap-2">
              <FreeSignupCta
                placement="home_mobile"
                className="min-h-14 border border-brand-copper bg-brand-copper px-4 py-3 text-sm font-semibold text-white shadow-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/hiring-firms"
                  className="flex min-h-14 flex-col justify-center border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm"
                >
                  <Search className="mb-1 h-4 w-4 text-brand-copper" aria-hidden />
                  Browse firms
                </Link>
                <Link
                  href="/tools"
                  className="flex min-h-14 flex-col justify-center border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm"
                >
                  <Calculator className="mb-1 h-4 w-4 text-brand-copper" aria-hidden />
                  Preview tools
                </Link>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Free account. No credit card required. Compare paid options when you are ready.
            </p>
            <Link href="/membership-pricing" className="mt-1 inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-brand-copper underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper">
              Compare membership plans
            </Link>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white [content-visibility:auto] [contain-intrinsic-size:0_620px]">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-copper">
                Popular searches
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Start with the pages inspectors search for most.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use these hubs to compare companies hiring field inspectors, choose a role path,
                and estimate whether a route is worth applying for before you share personal details.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popularSearchLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-copper/60 hover:bg-white hover:shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-slate-950 group-hover:text-brand-copper">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ROLES CAROUSEL BAND . FULL-BLEED BG IMAGE + GRADIENT + ZOOM */}
        <section className="relative overflow-hidden border-b border-slate-200 [content-visibility:auto] [contain-intrinsic-size:0_760px]">
          {/* background image sits directly under the section. spans full width */}
          <div className="pointer-events-none absolute inset-0">

            {/* gradient fade from solid hub color into the image. like oracle */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-background/92 via-brand-background/70 to-transparent" />
          </div>

          {/* content lives on top of the gradient/image */}
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <RoleCarousel />
          </div>
        </section>

        {/* subtle gray background for separation */}
        <section className="border-b border-slate-200 bg-slate-50 [content-visibility:auto] [contain-intrinsic-size:0_220px]">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 text-xs text-slate-700 shadow-sm sm:text-[13px]">
              <p className="font-semibold text-slate-900">Who this hub serves</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span>• Mortgage Field Inspection services &amp; Loss Control</span>
                <span>• Mobile Notary for real estate closings (RON)</span>
                <span>• Certified residential property appraisal pros</span>
                <span>• Independent Field Inspector near me (Gig)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature pillars (Directory / Intel / AI tools) */}
        <section className="border-b border-slate-200 bg-white [content-visibility:auto] [contain-intrinsic-size:0_720px]">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Find Field Inspection &amp; Appraisal Jobs
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-600">
                  One place to see who is hiring for Mortgage Field Inspection services and Home valuation for mortgage lenders.
                </p>
              </div>
              <Link
                href="/membership-pricing"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-brand-mist px-4 py-2 text-xs font-semibold text-brand-dark hover:bg-white"
              >
                Compare Free vs Pro →
              </Link>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-sm font-semibold text-slate-900">Verified Firm Directory</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Search firms for &ldquo;Independent Field Inspector near me&rdquo; and &ldquo;Mobile Notary&rdquo; work. No
                  resumes uploaded. you control who sees your info.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Included with Free
                </p>
                <Link
                  href="/hiring-firms"
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
                  href="/inspector-resource-center/firm-intel"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  View sample snapshots →
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-sm font-semibold text-slate-900">Member tools roadmap</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Preview the planned income, route, firm-tracking, resume, and AI workflows. Tool
                  execution and data submission remain disabled.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Preview only
                </p>
                <Link
                  href="/tools"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  Preview tools →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it works timeline */}
        <section className="border-b border-brand-copper/15 bg-brand-mist [content-visibility:auto] [contain-intrinsic-size:0_620px]">
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
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">
                  Step 1
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">Dial in your lane.</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Create your profile, pick your service lanes, and mark your home base. The hub
                  filters firms and routes around where you actually drive.
                </p>
              </li>
              <li className="rounded-2xl border border-brand-copper/20 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">
                  Step 2
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Shortlist firms that fit your life.
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Use firm intel and training resources to compare pay clues, requirements, volume,
                  and gear so you avoid dead-end portals and low-ball routes.
                </p>
              </li>
              <li className="rounded-2xl border border-brand-copper/20 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">
                  Step 3
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Prepare applications and routes with clearer context.
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Build a shortlist, keep your own application notes, and use starter kits to prep for
                  day one on a new client&apos;s route.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* TRUST SIGNALS: Real Results */}
        <section className="border-b border-slate-200 bg-white [content-visibility:auto] [contain-intrinsic-size:0_720px]">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Real Members, Real Routes
              </h2>
              <p className="mt-2 text-slate-600">
                Join 500+ verified professionals securing work through the hub.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  quote: "Found a regional firm paying $45/job for occupancy checks I was already driving past. Added $600/week to my route.",
                  author: "Sarah J.",
                  role: "Field Inspector",
                  loc: "Austin, TX",
                  metric: "+$600/wk"
                },
                {
                  quote: "Used the directory to find 3 direct clients. No more fighting for scraps on national portals.",
                  author: "Mike T.",
                  role: "Property Preservation",
                  loc: "Tampa, FL",
                  metric: "3 New Clients"
                },
                {
                  quote: "The training helped me translate my driving experience into field inspection skills and prepare for firm applications.",
                  author: "David L.",
                  role: "New Inspector",
                  loc: "Chicago, IL",
                  metric: "Hired in 14 Days"
                }
              ].map((testimonial, i) => (
                <div key={i} className="relative rounded-2xl bg-slate-50 p-6 shadow-sm border border-slate-100">
                  <div className="absolute -top-3 right-6 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                    {testimonial.metric}
                  </div>
                  <p className="text-slate-700 italic mb-4">&quot;{testimonial.quote}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.author}</div>
                      <div className="text-xs text-slate-500">{testimonial.role} • {testimonial.loc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INCOME TEASER: non-functional tools preview */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-slate-900 text-white [content-visibility:auto] [contain-intrinsic-size:0_720px]">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  Planned scenario tool
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  What could you earn?
                </h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  Field inspection pay varies wildly by region and service type.
                  Preview how the planned income scenario tool will compare route volume,
                  service mix, and operating costs before you commit to a target.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/tools"
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-base font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
                  >
                    Preview the Income Tool →
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-slate-500 px-2">
                    <span>• No inputs collected</span>
                    <span>• Execution disabled</span>
                  </div>
                </div>
              </div>

              {/* Visual Teaser for Calculator */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-30"></div>
                <div className="relative rounded-2xl bg-slate-800 border border-slate-700 p-6 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                      <span className="text-slate-400">Target Weekly Volume</span>
                      <span className="font-mono font-bold text-white">45 Jobs</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                      <span className="text-slate-400">Avg. Pay Per Job</span>
                      <span className="font-mono font-bold text-emerald-400">$35.00</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-semibold text-white">Est. Weekly Revenue</span>
                      <span className="text-2xl font-bold text-white font-mono">$1,575.00</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-700/50 text-center">
                    <p className="text-xs text-slate-500">Illustrative scenario only. No live calculation or local estimate is running.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Split section */}
        <section className="border-b border-slate-200 bg-slate-50 [content-visibility:auto] [contain-intrinsic-size:0_620px]">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-brand-copper/20 bg-white p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                  Just getting started.
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Use the Free plan to explore firms, learn the language, and decide which
                  lanes make sense for your life, car, and schedule.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  <li>• See which firms even work your state.</li>
                  <li>• Learn what tools and certifications matter first.</li>
                  <li>• Get checklists for your first inspections.</li>
                </ul>
                <FreeSignupCta
                  placement="home_starter"
                  className="mt-4 px-2 text-sm font-semibold text-brand-copper hover:text-brand-copperDark"
                />
              </div>

              <div className="rounded-2xl border border-brand-copper/30 bg-brand-dark p-6 text-slate-50">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200">
                  Already in the field.
                </h2>
                <p className="mt-2 text-sm text-slate-100">
                  Switch into Pro or higher to layer full firm intel, training, and readiness
                  resources on top of routes you already run.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-100/90">
                  <li>• Compare what you&apos;re earning to typical ranges in your region.</li>
                  <li>• Spot firms paying better for the same lanes.</li>
                  <li>• Plan smarter routes around family, day jobs, or other gigs.</li>
                </ul>
                <Link
                  href="/membership-pricing"
                  className="mt-4 inline-flex text-sm font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  See Pro features →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Member testimonials ──────────────────────────── */}
        <section className="[content-visibility:auto] [contain-intrinsic-size:0_1100px]">
          <TestimonialsSection variant="full" />
        </section>

        {/* Final CTA banner */}
        <section className="bg-brand-dark [content-visibility:auto] [contain-intrinsic-size:0_360px]">
          <div className="mx-auto max-w-6xl px-4 py-10 text-center text-slate-50 sm:px-6 lg:px-8 lg:py-14">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Ready to stop guessing and start planning real routes.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
              Join the Nested Objects hub to see firms, intel, and tools in one place instead of
              chasing scattered posts and rumors.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <FreeSignupCta
                placement="home_final"
                className="bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              />
              <Link
                href="/membership-pricing"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-copper/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Compare membership plans
              </Link>
              <Link
                href="/hiring-firms"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/50 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Preview the firm directory
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Free plan available. Upgrade to Pro or higher only when the hub proves its value on your
              routes.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
