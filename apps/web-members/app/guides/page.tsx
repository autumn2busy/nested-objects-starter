import type { Metadata } from 'next'
import Link from 'next/link'
import { generatePageMetadata } from '@/lib/seo'
import { ArrowRight, BookOpen, Clock } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata({
    title: 'Field Inspector Guides & Resources',
    description: 'Read our ultimate guides to building a six-figure independent route as a field inspector, property preservation contractor, or mobile notary.',
    path: '/guides',
})

const guides = [
    {
        title: 'How to Become a Field Inspector in 2026',
        description: 'No degree required. Learn the requirements, pay rates ($25–$75/inspection), training, and which companies are hiring right now.',
        slug: 'how-to-become-a-field-inspector',
        readTime: '12 min read',
        category: 'Career Guide',
    },
    {
        title: 'Field Inspection vs. Home Inspection: The Ultimate Breakdown',
        description: 'Stop paying thousands for a state license you don\'t need. Discover the difference in pay, licensing, liability, and day-to-day work.',
        slug: 'field-inspection-vs-home-inspection',
        readTime: '8 min read',
        category: 'Industry Comparison',
    },
    {
        title: 'List of Top Field Inspection Companies',
        description: 'A curated directory of the top companies currently hiring residential, commercial, and property preservation field inspectors.',
        slug: 'list-of-field-inspection-companies',
        readTime: '6 min read',
        category: 'Company Directory',
    },
]

export default function GuidesIndexPage() {
    return (
        <main className="bg-brand-sand min-h-[80vh] text-slate-900 pb-24">
            <header className="bg-white border-b border-slate-200 py-16 sm:py-24">
                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    <p className="text-sm font-bold uppercase tracking-widest text-brand mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" /> Resource Library
                    </p>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Guides & Strategies
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg text-slate-600">
                        Actionable intelligence for independent field inspectors, property preservation contractors, and mobile notaries who want to build a profitable route.
                    </p>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-16">
                <div className="grid gap-8 md:grid-cols-2">
                    {guides.map((guide) => (
                        <Link
                            key={guide.slug}
                            href={`/guides/${guide.slug}`}
                            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-brand/30 hover:shadow-md"
                        >
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-brand">{guide.category}</p>
                                <h2 className="mt-3 text-2xl font-bold leading-snug text-slate-900 group-hover:text-brand transition">
                                    {guide.title}
                                </h2>
                                <p className="mt-4 text-base leading-relaxed text-slate-600">
                                    {guide.description}
                                </p>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                    <Clock className="h-4 w-4" /> {guide.readTime}
                                </span>
                                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 group-hover:text-brand transition">
                                    Read Guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}
