import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, DollarSign, Building2 } from 'lucide-react'
import { getAllGuides } from '@/lib/guides'

export const metadata: Metadata = {
  title: 'Field Inspector Guides & Resources',
  description: 'Free guides for field inspectors, notaries, and property preservation contractors. Learn the industry, compare companies, and level up your career.',
  alternates: { canonical: 'https://nestedobjects.com/guides' },
}

const categoryIcons: Record<string, any> = {
  guide: BookOpen,
  'best-of': Building2,
  comparison: DollarSign,
  location: Building2,
  role: BookOpen,
}

export default function GuidesIndexPage() {
  const guides = getAllGuides()

  return (
    <main className="bg-brand-sand text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Resources</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Guides for field service professionals</h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Free, no-fluff guides to help you start, grow, and earn more as a field inspector, notary,
          or property preservation contractor.
        </p>

        <div className="mt-10 space-y-4">
          {guides.map((guide) => {
            const Icon = categoryIcons[guide.frontmatter.category] || BookOpen
            const categoryLabels: Record<string, string> = {
              guide: 'Career Guide',
              'best-of': 'Best Of',
              comparison: 'Comparison',
              location: 'Regional Guide',
              role: 'Role Guide',
            }

            return (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="flex items-start gap-5 rounded-xl border border-slate-200 bg-white px-6 py-5 transition hover:border-brand/30 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">{guide.frontmatter.title}</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{guide.frontmatter.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200/60">
                      {categoryLabels[guide.frontmatter.category] || 'Guide'}
                    </span>
                    <span className="rounded bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200/60">
                      {guide.frontmatter.readTime}
                    </span>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
