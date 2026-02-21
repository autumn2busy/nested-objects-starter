import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, DollarSign, Building2, Shield } from 'lucide-react'
import { generatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = generatePageMetadata({
    title: 'Field Inspector Guides & Resources | Nested Objects',
    description: 'Free guides for field inspectors, notaries, and property preservation contractors. Learn the industry, compare companies, and level up your career.',
    path: '/guides',
})

const guides = [
    {
        slug: 'how-to-become-a-field-inspector',
        title: 'How to Become a Field Inspector in 2026',
        description: 'Step-by-step guide covering requirements, pay rates, training, and which companies are hiring. No degree needed.',
        icon: BookOpen,
        tags: ['Getting Started', 'Career Guide'],
        status: 'live' as const,
    },
    {
        slug: 'property-preservation-pay-rates',
        title: 'Property Preservation Contractor Pay Rates',
        description: 'Real pay data from 460+ firms. What to expect by inspection type, company, and region.',
        icon: DollarSign,
        tags: ['Pay & Compensation'],
        status: 'coming-soon' as const,
    },
    {
        slug: 'mortgage-field-services-explained',
        title: 'Mortgage Field Services Explained',
        description: 'How the mortgage inspection industry works, who the players are, and how to get started.',
        icon: Building2,
        tags: ['Industry Guide'],
        status: 'coming-soon' as const,
    },
    {
        slug: 'best-property-preservation-companies',
        title: 'Top 15 Property Preservation Companies',
        description: 'Curated list of the best-rated property preservation firms hiring contractors nationwide.',
        icon: Shield,
        tags: ['Best Of', 'Company Reviews'],
        status: 'coming-soon' as const,
    },
]

export default function GuidesIndexPage() {
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
                        const isLive = guide.status === 'live'
                        const Wrapper = isLive ? Link : 'div'
                        const wrapperProps = isLive ? { href: `/guides/${guide.slug}` } : {}

                        return (
                            <Wrapper
                                key={guide.slug}
                                {...(wrapperProps as any)}
                                className={`flex items-start gap-5 rounded-xl border bg-white px-6 py-5 transition ${isLive
                                        ? 'border-slate-200 hover:border-brand/30 hover:shadow-sm cursor-pointer'
                                        : 'border-slate-100 opacity-70'
                                    }`}
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                                    <guide.icon className="h-5 w-5 text-brand" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-semibold text-slate-900">{guide.title}</h2>
                                        {!isLive && (
                                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">{guide.description}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {guide.tags.map((tag) => (
                                            <span key={tag} className="rounded bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200/60">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {isLive && <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />}
                            </Wrapper>
                        )
                    })}
                </div>
            </div>
        </main>
    )
}