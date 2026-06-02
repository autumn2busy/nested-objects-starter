import { Star, Quote, MessageCircle, Mail, Youtube } from 'lucide-react'
import {
  type Testimonial,
  getFeaturedTestimonials,
  getAllTestimonials,
  getAverageRating,
  TESTIMONIALS,
} from '@/lib/testimonials'

// ── Source icon mapper ───────────────────────────────────────────
function SourceIcon({ source }: { source: Testimonial['source'] }) {
  const cls = 'h-3.5 w-3.5 text-slate-400'
  switch (source) {
    case 'review':
      return <Star className={cls} />
    case 'google':
      return (
        <svg viewBox="0 0 24 24" className={cls} width="24" height="24">
          <path fill="currentColor" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.241z" />
        </svg>
      )
    case 'email':
      return <Mail className={cls} />
    case 'chat':
      return <MessageCircle className={cls} />
    case 'youtube':
      return <Youtube className={cls} />
  }
}

// ── Star rating display ──────────────────────────────────────────
function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-slate-200 text-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

// ── Single testimonial card ──────────────────────────────────────
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const dateLabel = new Date(testimonial.date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand/20">
      {/* Quote mark accent */}
      <Quote className="absolute -top-2.5 left-5 h-5 w-5 rotate-180 text-brand/15" />

      {/* Stars */}
      <StarRatingDisplay rating={testimonial.rating} />

      {/* Quote */}
      <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-700">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Attribution */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {testimonial.name}
          </p>
          {(testimonial.role || testimonial.location) && (
            <p className="text-xs text-slate-500">
              {[testimonial.role, testimonial.location]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <SourceIcon source={testimonial.source} />
          <span>{dateLabel}</span>
        </div>
      </div>
    </div>
  )
}

// ── Aggregate stats bar ──────────────────────────────────────────
function StatsBar() {
  const avg = getAverageRating()
  const total = TESTIMONIALS.length

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-lg bg-brand/5 px-6 py-3 text-sm">
      <div className="flex items-center gap-2">
        <StarRatingDisplay rating={Math.round(avg)} />
        <span className="font-semibold text-slate-900">{avg}</span>
        <span className="text-slate-500">avg rating</span>
      </div>
      <div className="h-4 w-px bg-slate-200" />
      <div className="text-slate-600">
        <span className="font-semibold text-slate-900">{total}</span> verified
        reviews &amp; testimonials
      </div>
      <div className="h-4 w-px bg-slate-200" />
      <div className="text-slate-600">
        <span className="font-semibold text-slate-900">100%</span> real members
      </div>
    </div>
  )
}

// ── Main section: Featured testimonials ──────────────────────────
export function TestimonialsSection({
  variant = 'full',
}: {
  /** 'full' = heading + stats + grid. 'compact' = just the cards (for embedding) */
  variant?: 'full' | 'compact'
}) {
  const featured = variant === 'full' ? getAllTestimonials() : getFeaturedTestimonials()

  if (variant === 'compact') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((t) => (
          <TestimonialCard key={t.id} testimonial={t} />
        ))}
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Member Voices
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Real inspectors. Real results.
        </h2>
        <p className="mt-2 text-base text-slate-600">
          Don&apos;t take our word for it — hear from members who use the
          directory and tools every day.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-8">
        <StatsBar />
      </div>

      {/* Grid */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((t) => (
          <TestimonialCard key={t.id} testimonial={t} />
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <a
          href="/membership-pricing"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-copperDark"
        >
          Join the community
        </a>
      </div>
    </section>
  )
}

/** Compact inline testimonial strip — for pricing page or hero */
export function TestimonialStrip() {
  const featured = getFeaturedTestimonials().slice(0, 3)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      {/* Avatars + count */}
      <div className="flex -space-x-2">
        {featured.map((t, i) => (
          <div
            key={t.id}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand/10 text-xs font-bold text-brand"
            style={{ zIndex: featured.length - i }}
          >
            {t.name.charAt(0)}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <StarRatingDisplay rating={5} />
        <span className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{TESTIMONIALS.length}+</span>{' '}
          verified member reviews
        </span>
      </div>
    </div>
  )
}
