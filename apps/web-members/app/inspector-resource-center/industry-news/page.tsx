import { Metadata } from 'next'
import Link from 'next/link'
import { IndustryNews } from '@/components/IndustryNews'
import { Newspaper, ArrowLeft } from 'lucide-react'
import { generatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
    ...generatePageMetadata({
        title: 'Industry News | Mortgage & Field Inspection Updates',
        description: 'Stay updated with the latest mortgage industry news, real estate market trends, and field inspection updates. Curated daily for Nested Objects members.',
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
            {/* Header */}
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
                                hourly from trusted sources across the web. Stay informed on market trends, regulatory
                                changes, and opportunities that affect your routes.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* News Grid */}
            <section className="bg-white">
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
                    <IndustryNews limit={12} variant="full" />
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-brand-copper/15 bg-brand-mist">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Want deeper intel on specific firms?
                            </p>
                            <p className="text-sm text-slate-600">
                                Our Firm Intel library has pay rates, volume data, and hiring signals.
                            </p>
                        </div>
                        <Link
                            href="/inspector-resource-center/firm-intel"
                            className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
                        >
                            View Firm Intel →
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
