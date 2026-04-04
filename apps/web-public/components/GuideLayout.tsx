import Link from 'next/link'
import { Clock, TrendingUp, ChevronRight, ArrowRight, GraduationCap } from 'lucide-react'
import type { GuideFrontmatter } from '@/lib/guides'

// ─── Table of Contents ──────────────────────────────────────────

function TableOfContents({ toc }: { toc: GuideFrontmatter['toc'] }) {
  return (
    <nav className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm" aria-label="Table of contents">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">In this guide</p>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="flex items-center gap-2 text-sm text-slate-600 transition hover:text-brand">
              <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ─── CTA Banner ─────────────────────────────────────────────────

function CTABanner({ links }: { links: GuideFrontmatter['ctaLinks'] }) {
  return (
    <div className="my-10 rounded-2xl border border-brand/20 bg-brand/5 px-6 py-8 text-center sm:px-10">
      <h3 className="text-xl font-bold text-slate-900">Ready to take the next step?</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
        Browse 460+ firms in our directory, start training, or explore membership options.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {links.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              i === 0
                ? 'inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800'
                : 'inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
            }
          >
            {link.label} <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Directory Sidebar Widget ───────────────────────────────────

function DirectorySidebar() {
  return (
    <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand">Free to browse</p>
      <p className="mt-2 text-lg font-bold text-slate-900">460+ Firms</p>
      <p className="mt-1 text-xs text-slate-600">Pay data, ratings, and apply links</p>
      <a
        href="https://members.nestedobjects.com/hiring-firms"
        className="mt-3 block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
      >
        View Directory
      </a>
    </div>
  )
}

// ─── FAQ Section ────────────────────────────────────────────────

function FAQSection({ faq }: { faq: NonNullable<GuideFrontmatter['faq']> }) {
  return (
    <div className="space-y-4">
      {faq.map((q) => (
        <details key={q.question} className="group rounded-lg border border-slate-200 bg-white">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
            {q.question}
          </summary>
          <p className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
            {q.answer}
          </p>
        </details>
      ))}
    </div>
  )
}

// ─── Schema Markup ──────────────────────────────────────────────

function SchemaMarkup({ frontmatter }: { frontmatter: GuideFrontmatter }) {
  const schemas: object[] = []

  // Article schema (always)
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.publishedAt,
    dateModified: frontmatter.updatedAt,
    author: { '@type': 'Organization', name: 'Nested Objects' },
    publisher: { '@type': 'Organization', name: 'Nested Objects', url: 'https://nestedobjects.com' },
  })

  // FAQ schema
  if (frontmatter.faq?.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: frontmatter.faq.map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: { '@type': 'Answer', text: q.answer },
      })),
    })
  }

  // HowTo schema
  if (frontmatter.howToSteps?.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: frontmatter.title,
      description: frontmatter.description,
      step: frontmatter.howToSteps.map((s) => ({
        '@type': 'HowToStep',
        name: s.name,
        text: s.text,
      })),
    })
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}

// ─── Main Layout ────────────────────────────────────────────────

type GuideLayoutProps = {
  frontmatter: GuideFrontmatter
  children: React.ReactNode
}

export function GuideLayout({ frontmatter, children }: GuideLayoutProps) {
  const categoryLabels: Record<string, string> = {
    guide: 'Career Guide',
    'best-of': 'Best Of',
    comparison: 'Comparison',
    location: 'Regional Guide',
    role: 'Role Guide',
  }

  return (
    <>
      <SchemaMarkup frontmatter={frontmatter} />

      <main className="bg-brand-sand text-slate-900">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span>/</span>
            <Link href="/guides" className="hover:text-brand">Guides</Link>
            <span>/</span>
            <span className="text-slate-700 truncate max-w-[200px]">{frontmatter.title}</span>
          </nav>
        </div>

        {/* Hero */}
        <header className="mx-auto max-w-4xl px-4 pb-8 pt-6 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
            {categoryLabels[frontmatter.category] || 'Guide'}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            {frontmatter.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            {frontmatter.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {frontmatter.readTime}
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Updated {String(frontmatter.updatedAt)}
            </span>
          </div>
        </header>

        {/* Content Grid */}
        <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:grid lg:grid-cols-[1fr_220px] lg:gap-10">
          {/* Article */}
          <article className="prose-slate max-w-none">
            {children}

            {/* Mid-article CTA */}
            {frontmatter.ctaLinks?.length > 0 && (
              <CTABanner links={frontmatter.ctaLinks} />
            )}

            {/* FAQ */}
            {frontmatter.faq?.length && (
              <>
                <h2 id="faq" className="mt-14 mb-4 scroll-mt-24 text-2xl font-bold text-slate-900 sm:text-3xl">
                  Frequently asked questions
                </h2>
                <FAQSection faq={frontmatter.faq} />
              </>
            )}
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              {frontmatter.toc?.length > 0 && <TableOfContents toc={frontmatter.toc} />}
              <DirectorySidebar />
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
