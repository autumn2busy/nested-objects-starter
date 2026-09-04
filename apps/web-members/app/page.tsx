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
    detail: 'See directory access options. Free is a small sample; search and filters require a paid plan.',
  },
  {
    href: '/hiring-firms/texas',
    label: 'Texas field inspection firms',
    detail: 'Read the public Texas coverage guide and preview selected firm information.',
  },
  {
    href: '/hiring-firms/florida',
    label: 'Florida field inspection firms',
    detail: 'Read the public Florida coverage guide and preview selected firm information.',
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
    label: 'Field inspection member tools',
    detail: 'Use the income scenario planner and review plan access for route economics and upcoming tools.',
  },
]

const directoryFaqs = [
  {
    question: 'What does a Free account include in the directory?',
    answer: 'Free includes up to 3 sample firm listings, plus locked previews. The locked previews are not additional accessible listings. There is no directory search or filtering on Free.',
  },
  {
    question: 'Which plans include directory search and firm intel?',
    answer: 'Pro, Elite and Agency include full directory access, search, filters, and detailed firm intel. Review the current membership plans for pricing and included features. Current hiring, rates and requirements must be confirmed with each firm.',
  },
  {
    question: 'Will the Free sample match my state or inspection type?',
    answer: 'No. The Free sample is not personalized to your location or inspection type. Public state and role guides can help you research the field, but they do not unlock directory filters. A listing is not a promise of available work or a guaranteed job.',
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
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: directoryFaqs.map(({ question, answer }) => ({
              '@type': 'Question',
              name: question,
              acceptedAnswer: { '@type': 'Answer', text: answer },
            })),
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
              Choose your directory access
            </p>
            <div className="mt-3 grid gap-2">
              <Link href="/membership-pricing" className="inline-flex min-h-14 items-center justify-center rounded-lg bg-brand-copper px-4 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper">
                Compare membership plans
              </Link>
              <FreeSignupCta
                placement="home_mobile"
                className="min-h-14 border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/hiring-firms"
                  className="flex min-h-14 flex-col justify-center border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm"
                >
                  <Search className="mb-1 h-4 w-4 text-brand-copper" aria-hidden />
                  Directory preview
                </Link>
                <Link
                  href="/tools"
                  className="flex min-h-14 flex-col justify-center border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm"
                >
                  <Calculator className="mb-1 h-4 w-4 text-brand-copper" aria-hidden />
                  Member tools
                </Link>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Free: up to 3 sample listings. No search or filters. No credit card required.
              Pro and higher include full directory search and firm intel.
            </p>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white [content-visibility:auto] [contain-intrinsic-size:0_620px]">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-copper">
                Public research guides
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Learn about the work before choosing a membership.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Read public state and role guides to understand the field. These pages do not
                unlock directory search or filters for a Free account.
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
        <section id="directory-access" aria-labelledby="directory-access-heading" className="scroll-mt-24 border-b border-slate-200 bg-white [content-visibility:auto] [contain-intrinsic-size:0_720px]">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="directory-access-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Know what your membership includes.
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-600">
                  Choose a limited Free sample or paid directory access before you sign up.
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
                <h3 className="text-sm font-semibold text-slate-900">Free directory sample</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Preview up to 3 sample firm listings. No search or filters. The sample is not
                  selected for your state or inspection type, and locked previews do not add more accessible listings.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Limited sample, not full directory access
                </p>
                <Link
                  href="/hiring-firms"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  View directory preview →
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-sm font-semibold text-slate-900">Paid directory research</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Search the full directory by name, state, industry and other filters. Review
                  detailed firm intel and available application/contact information, then verify it with the firm.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Included with Pro, Elite and Agency
                </p>
                <Link
                  href="/membership-pricing"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  Compare paid directory access →
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-sm font-semibold text-slate-900">Member tools</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Signed-in members can use the income scenario planner now. Elite and Agency members can also use
                  route economics; connected tools remain clearly labeled until verified.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Two tools available
                </p>
                <Link
                  href="/tools"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  Open member tools →
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
                <h3 className="mt-2 text-sm font-semibold text-slate-900">Review the Free sample.</h3>
                <p className="mt-2 text-sm text-slate-600">
                  See up to 3 sample listings to understand the directory format. Creating a
                  profile does not unlock search or match the sample to your area.
                </p>
              </li>
              <li className="rounded-2xl border border-brand-copper/20 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">
                  Step 2
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Choose paid access when you need search.
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Pro and higher add full directory search, filters and firm intel. Compare the
                  membership options before choosing whether that access fits your needs.
                </p>
              </li>
              <li className="rounded-2xl border border-brand-copper/20 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">
                  Step 3
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Research, then apply directly.
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Use available firm information to prepare your questions. Confirm current hiring,
                  service areas, pay and requirements with the firm before applying. Work is not guaranteed.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* INCOME TOOL: authenticated, browser-only scenario planning */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-slate-900 text-white [content-visibility:auto] [contain-intrinsic-size:0_720px]">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  Available member tool
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  What could you earn?
                </h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  Field inspection pay varies wildly by region and service type.
                  Use your own assignment, fee, time, mileage, and operating-cost assumptions to compare a scenario
                  before you commit to a target. Results are estimates, not income promises.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/tools/income-calculator"
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-base font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
                  >
                    Sign in to use the Income Planner →
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-slate-500 px-2">
                    <span>• Browser-based calculator</span>
                    <span>• No intentional input storage</span>
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
                  Start with a limited sample.
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Free includes up to 3 sample firm listings. No search or filters. It lets you
                  see the directory format, not search for a particular kind of work.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  <li>• The sample is not matched to your location.</li>
                  <li>• Locked previews are not extra accessible listings.</li>
                  <li>• No credit card is required for Free.</li>
                </ul>
                <FreeSignupCta
                  placement="home_starter"
                  className="mt-4 px-2 text-sm font-semibold text-brand-copper hover:text-brand-copperDark"
                />
              </div>

              <div className="rounded-2xl border border-brand-copper/30 bg-brand-dark p-6 text-slate-50">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200">
                  Need to search for relevant firms?
                </h2>
                <p className="mt-2 text-sm text-slate-100">
                  Pro and higher include full directory search and firm intel. Compare plans
                  when you need to research beyond the Free sample.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-100/90">
                  <li>• Use name, state and industry filters.</li>
                  <li>• Review available firm details and application information.</li>
                  <li>• Confirm current work and requirements directly with firms.</li>
                </ul>
                <Link
                  href="/membership-pricing"
                  className="mt-4 inline-flex text-sm font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                  Compare membership plans →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Member testimonials ──────────────────────────── */}
        <section className="[content-visibility:auto] [contain-intrinsic-size:0_1100px]">
          <TestimonialsSection variant="full" />
        </section>

        <section aria-labelledby="directory-faq-heading" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 id="directory-faq-heading" className="text-2xl font-bold text-slate-900">Before you create an account</h2>
            <div className="mt-6 space-y-6">
              {directoryFaqs.map(({ question, answer }) => (
                <div key={question}>
                  <h3 className="text-base font-semibold text-slate-900">{question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA banner */}
        <section className="bg-brand-dark [content-visibility:auto] [contain-intrinsic-size:0_360px]">
          <div className="mx-auto max-w-6xl px-4 py-10 text-center text-slate-50 sm:px-6 lg:px-8 lg:py-14">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Choose the access you actually need.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
              Free is up to 3 sample firm listings, with no search or filters. Pro and higher
              include full directory search and detailed firm intel. Choose a sample or compare paid access.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/membership-pricing"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Compare membership plans
              </Link>
              <FreeSignupCta
                placement="home_final"
                className="border border-brand-copper/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              />
              <Link
                href="/hiring-firms"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/50 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Preview the firm directory
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              No credit card required for Free. Listings are research resources, not guaranteed jobs.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
