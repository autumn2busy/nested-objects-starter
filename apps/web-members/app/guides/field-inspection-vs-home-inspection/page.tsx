import type { Metadata } from 'next'
import Link from 'next/link'
import {
    AlertCircle, CheckCircle2, MapPin, Search, ChevronRight, Clock, ShieldCheck, ArrowRight
} from 'lucide-react'
import { generatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = generatePageMetadata({
    title: 'Field Inspection vs Home Inspection',
    description: 'Learn the massive differences between Field Inspections vs Home Inspections. Licensing, costs, liability, and pay broken down.',
    path: '/guides/field-inspection-vs-home-inspection',
})

const SCHEMA_FAQ = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'Do field inspectors need a state license?',
            acceptedAnswer: { '@type': 'Answer', text: 'Unlike home inspectors, field inspectors do not require an expensive state license. Field inspections are considered visual data collection rather than professional structural engineering assessments.' },
        },
        {
            '@type': 'Question',
            name: 'Which pays more, home inspections or field inspections?',
            acceptedAnswer: { '@type': 'Answer', text: 'Home inspections pay more per job ($300-$500) but require finding your own clients (realtors & buyers). Field inspections pay less per job ($25-$150) but banks give you a routed volume of 5-20 jobs a day automatically.' },
        },
    ],
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <h2 id={id} className="mt-14 mb-4 scroll-mt-24 text-2xl font-bold text-slate-900 sm:text-3xl">
            {children}
        </h2>
    )
}

function TableOfContents() {
    const sections = [
        { id: 'the-illusion', label: 'The Licensing Illusion' },
        { id: 'home-inspector', label: 'What is a Home Inspector?' },
        { id: 'field-inspector', label: 'What is a Field Inspector?' },
        { id: 'comparison', label: 'Head-to-Head Comparison' },
        { id: 'liability', label: 'Risk and Liability' },
        { id: 'getting-started', label: 'Which should you choose?' },
    ]

    return (
        <nav className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm" aria-label="Table of contents">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">In this guide</p>
            <ul className="space-y-2">
                {sections.map((s) => (
                    <li key={s.id}>
                        <a href={`#${s.id}`} className="flex items-center gap-2 text-sm text-slate-600 transition hover:text-brand">
                            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
                            {s.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}

export default function FieldVsHomeInspectorPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_FAQ) }}
            />

            <main className="bg-brand-sand min-h-screen text-slate-900 pb-20">
                {/* Breadcrumb */}
                <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
                    <nav className="flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-brand">Home</Link>
                        <span>/</span>
                        <Link href="/guides" className="hover:text-brand">Guides</Link>
                        <span>/</span>
                        <span className="text-slate-700 truncate">Field Inspection vs Home Inspection</span>
                    </nav>
                </div>

                {/* Hero */}
                <header className="mx-auto max-w-4xl px-4 pb-8 pt-6 sm:px-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Industry Comparison</p>
                    <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                        Field Inspection vs. Home Inspection: <span className="text-slate-500">The Ultimate Breakdown</span>
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                        Don&apos;t spend thousands of dollars on a state license you might not need.
                        We break down the massive differences in pay, liability, and day-to-day operations.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> 8 min read</span>
                    </div>
                </header>

                {/* Content Grid */}
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_220px] lg:gap-10">
                    <article className="prose-slate max-w-none">

                        <SectionHeading id="the-illusion">The Licensing Illusion</SectionHeading>
                        <p className="text-base leading-relaxed text-slate-700">
                            When people think about &quot;inspecting houses for a living,&quot; they immediately think of <strong>Home Inspectors</strong>.
                            They assume they need to enroll in a 120-hour online course, pass a rigorous state exam, pay massive annual licensing fees,
                            and spend their weekends crawling through moldy crawlspaces with a flashlight.
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-slate-700">
                            What a lot of people don&apos;t realize is that the banking and mortgage industry employs thousands of <strong>Field Inspectors</strong>.
                            This is an entirely different profession that requires <em>zero state licensing</em>, has significantly less liability, and allows you to build a profitable business without ever dealing with a stressed-out home buyer.
                        </p>

                        <div className="my-10 grid gap-6 sm:grid-cols-2">
                            {/* Home Inspector Card */}
                            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 mb-4">
                                    <Search className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Home Inspector</h3>
                                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                        <span>Works for buyers & sellers</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                        <span>Requires State License</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                        <span>High Liability / E&O Risk</span>
                                    </li>
                                </ul>
                            </div>
                            {/* Field Inspector Card */}
                            <div className="rounded-2xl border-2 border-brand bg-white p-6 shadow-md relative">
                                <span className="absolute -top-3 right-4 bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-full">
                                    Lower Barrier
                                </span>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand mb-4">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Field Inspector</h3>
                                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand mt-0.5" />
                                        <span>Works for Banks & Lenders</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand mt-0.5" />
                                        <span>No State License Required</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand mt-0.5" />
                                        <span>Visual Data Collection Only</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <SectionHeading id="home-inspector">What is a Home Inspector?</SectionHeading>
                        <p className="text-base leading-relaxed text-slate-700">
                            A Home Inspector is hired by a home buyer (or sometimes a seller) right before a real estate transaction closes.
                            Their job is to perform an exhaustive, multi-hour structural and mechanical assessment of the home. They check the HVAC,
                            run the water, ensure the electrical panel is up to code, and look for foundation cracks.
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-slate-700">
                            Because they are advising consumers on a massive purchase, the government heavily regulates them. If a home inspector misses
                            a termite infestation, the buyer can sue them for thousands of dollars in damages. Because of this, Home Inspectors must carry robust Errors and Omissions (E&O) insurance and market themselves heavily to realtors to get referrals.
                        </p>

                        <SectionHeading id="field-inspector">What is a Field Inspector?</SectionHeading>
                        <p className="text-base leading-relaxed text-slate-700">
                            A Field Inspector (also called a Mortgage Field Inspector or Property Preservation Inspector) is hired by banks, mortgage lenders, and insurance companies to check on the assets they finance.
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-slate-700">
                            If a homeowner falls behind on their mortgage, federal law requires the bank to send someone to the property to verify someone still lives there. The bank hires a field inspection order-mill (like Safeguard or National Field Representatives), who sub-contracts the job out to a local independent Field Inspector.
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-slate-700">
                            <strong>Note:</strong> A Field Inspector is NOT diagnosing the foundation. They are simply answering: <em>&quot;Is the grass cut? Is the front door locked? Is there a roof leak?&quot;</em> They take 5 to 20 photos using a mobile app, submit a simple form, and drive to the next house.
                        </p>

                        <SectionHeading id="comparison">Head-to-Head Comparison</SectionHeading>

                        <div className="overflow-x-auto my-8 rounded-xl border border-slate-200 shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-1/3">Feature</th>
                                        <th className="px-5 py-4 text-xs font-bold text-slate-900 border-x border-slate-200 w-1/3">Home Inspection</th>
                                        <th className="px-5 py-4 text-xs font-bold text-brand w-1/3">Field Inspection</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="bg-white">
                                        <td className="px-5 py-4 font-semibold text-slate-700">Licensing Required</td>
                                        <td className="px-5 py-4 border-x border-slate-200 text-slate-600">Yes (Strict State Laws)</td>
                                        <td className="px-5 py-4 font-medium text-emerald-700">No (Unlicensed)</td>
                                    </tr>
                                    <tr className="bg-slate-50 border-t border-slate-100">
                                        <td className="px-5 py-4 font-semibold text-slate-700">Pay Per Job</td>
                                        <td className="px-5 py-4 border-x border-slate-200 text-slate-600">$300 - $600</td>
                                        <td className="px-5 py-4 font-medium text-emerald-700">$10 - $150</td>
                                    </tr>
                                    <tr className="bg-white border-t border-slate-100">
                                        <td className="px-5 py-4 font-semibold text-slate-700">Volume Level</td>
                                        <td className="px-5 py-4 border-x border-slate-200 text-slate-600">Low (1-2 per day)</td>
                                        <td className="px-5 py-4 font-medium text-emerald-700">High (10-30 per day)</td>
                                    </tr>
                                    <tr className="bg-slate-50 border-t border-slate-100">
                                        <td className="px-5 py-4 font-semibold text-slate-700">How You Get Work</td>
                                        <td className="px-5 py-4 border-x border-slate-200 text-slate-600">Networking with Realtors</td>
                                        <td className="px-5 py-4 font-medium text-emerald-700">Auto-assigned routes via apps</td>
                                    </tr>
                                    <tr className="bg-white border-t border-slate-100">
                                        <td className="px-5 py-4 font-semibold text-slate-700">Time on Site</td>
                                        <td className="px-5 py-4 border-x border-slate-200 text-slate-600">2 to 4 hours</td>
                                        <td className="px-5 py-4 font-medium text-emerald-700">5 to 30 minutes</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <SectionHeading id="getting-started">Which should you choose?</SectionHeading>
                        <p className="text-base leading-relaxed text-slate-700">
                            If you enjoy meticulous analysis, don&apos;t mind dealing with the stress of home buyers making the biggest purchase of their lives, and have the capital to invest in a state license, <strong>Home Inspection</strong> is an incredibly honorable career.
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-slate-700">
                            If you want to be your own boss starting <em>next week</em>, prefer driving a steady route list while listening to podcasts, and want zero customer interaction, then <strong>Field Inspection</strong> is the path for you.
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-slate-700">
                            Countless people use Field Inspections as a stepping stone. They run mortgage routes to generate immediate cash flow, and then spend their nights studying to get their official Home Inspector license 1-2 years later.
                        </p>

                        <div className="my-10 rounded-2xl border border-brand/20 bg-brand/5 px-6 py-8 text-center sm:px-10">
                            <h3 className="text-xl font-bold text-slate-900">Ready to start a Field Inspection Route?</h3>
                            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                                Browse 460+ mortgage and preservation firms hiring field inspectors today.
                            </p>
                            <div className="mt-5 flex justify-center">
                                <Link
                                    href="/hiring-firms"
                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
                                >
                                    Browse Hiring Firms <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                    </article>

                    <aside className="hidden lg:block">
                        <div className="sticky top-8 space-y-6">
                            <TableOfContents />
                        </div>
                    </aside>
                </div>
            </main>
        </>
    )
}
