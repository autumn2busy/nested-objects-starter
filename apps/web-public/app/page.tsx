import Link from 'next/link'
import Script from 'next/script'
import { ArrowRight, Search, GraduationCap, Bot, Shield, Users, TrendingUp, Star, CheckCircle2 } from 'lucide-react'
import { TestimonialsSection } from '@/components/TestimonialsSection'
import { TESTIMONIALS, getAverageRating } from '@/lib/testimonials'

const aggregateRatingLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Nested Objects',
  url: 'https://nestedobjects.com',
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

export default function HomePage() {
  return (
    <>
      <Script
        id="aggregate-rating-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingLd) }}
      />
      <main className="bg-brand-sand text-slate-900">
      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
            For inspectors. By inspectors.
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Find work. Get trained.<br className="hidden sm:block" /> Level up with AI.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
            The #1 platform for field inspectors, notaries, and property preservation contractors.
            Browse 460+ hiring firms, learn the industry, and grow your career — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="https://members.nestedobjects.com/membership-pricing"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Join Free — Access the Directory <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Read Our Guides
            </Link>
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Everything you need to succeed in field services</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, title: '460+ Hiring Firms', desc: 'Browse the largest curated directory of field services companies. Pay data, ratings, and direct apply links.' },
              { icon: GraduationCap, title: 'Structured Training', desc: 'Role-based courses for inspectors, notaries, and preservation contractors. From basics to advanced.' },
              { icon: Bot, title: 'AI Tools', desc: 'AI concierge, resume builder, and job intel — tailored to field services. Know what to do next.' },
              { icon: Users, title: 'Community', desc: 'Connect with other inspectors, share intel, and grow together. No gatekeeping.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                  <item.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
            {[
              { value: '460+', label: 'Hiring Firms' },
              { value: '$5–$200', label: 'Per Inspection' },
              { value: '50 States', label: 'Coverage' },
              { value: 'Free', label: 'To Start' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Member testimonials ── */}
      <div className="border-t border-slate-200 bg-white">
        <TestimonialsSection variant="full" />
      </div>

      {/* ── Latest Guides ── */}
      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest guides</h2>
            <Link href="/guides" className="text-sm font-semibold text-brand hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'How to Become a Field Inspector in 2026', slug: 'how-to-become-a-field-inspector', tag: 'Career Guide' },
              { title: 'Property Preservation Pay Rates', slug: 'property-preservation-pay-rates', tag: 'Pay & Compensation' },
              { title: 'Mortgage Field Services Explained', slug: 'mortgage-field-services-explained', tag: 'Industry Guide' },
            ].map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group rounded-xl border border-slate-200 bg-white px-5 py-5 transition hover:border-brand/30 hover:shadow-sm"
              >
                <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                  {guide.tag}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-brand">
                  {guide.title}
                </h3>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition group-hover:opacity-100">
                  Read guide <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to find your next inspection job?</h2>
          <p className="mt-3 text-base text-slate-600">
            Join for free and get instant access to 3 verified hiring firms, pay data, and our training basics.
            Upgrade anytime to unlock the full directory and AI tools.
          </p>
          <a
            href="https://members.nestedobjects.com/membership-pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Join Free <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
    </>
  )
}
