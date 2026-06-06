import { Metadata } from 'next'
import Link from 'next/link'
import { IndustryNews } from '@/components/IndustryNews'
import { ArrowLeft, BookOpen, Newspaper } from 'lucide-react'
import { generatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
    ...generatePageMetadata({
        title: 'Industry News | Mortgage & Field Inspection Updates',
        description:
            'Stay updated with RSS-based mortgage industry news, real estate market trends, and field inspection updates curated for Nested Objects members.',
        path: '/inspector-resource-center/industry-news',
    }),
    keywords: [
        'mortgage industry news',
        'field inspection updates',
        'real estate market news',
        'housing market trends',
        'property inspection news',
    ],
}

export default function IndustryNewsPage() {
    return (
        <main className="min-h-screen bg-brand-sand text-brand-dark">
            <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                    <Link
                        href="/inspector-resource-center"
                        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-brand-copper hover:text-brand-copperDark"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Resources
                    </Link>

                    <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-brand-copper/10 p-3">
                            <Newspaper className="h-8 w-8 text-brand-copper" />
                        </div>
                        <div className="max-w-3xl space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">
                                Industry News
                            </p>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Mortgage & Field Inspection Updates
                            </h1>
                            <p className="text-base text-slate-700">
                                The latest news from the mortgage, real estate, and field inspection industry. Updated
                                hourly from trusted RSS sources across the web. For reviewed first-party strategy,
                                read the Nested Objects Blog.
                            </p>
                            <Link
                                href="/blog"
                                className="inline-flex items-center gap-2 rounded-full border border-brand-copper/30 bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-mist"
                            >
                                <BookOpen className="h-4 w-4" />
                                Read owned blog articles
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white">
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
                    <IndustryNews limit={12} variant="full" />
                </div>
            </section>

            <section className="border-t border-brand-copper/15 bg-brand-mist">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Want reviewed first-party strategy?
                            </p>
                            <p className="text-sm text-slate-600">
                                The Nested Objects Blog has approved articles with categories, internal links, and Article schema.
                            </p>
                        </div>
                        <Link
                            href="/blog"
                            className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
                        >
                            Read the Blog -&gt;
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
