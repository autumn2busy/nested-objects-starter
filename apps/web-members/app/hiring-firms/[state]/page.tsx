import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { MapPin, ArrowRight, Users, DollarSign, Star } from 'lucide-react'

import { generatePageMetadata, SITE_URL, getBreadcrumbSchema, getFAQPageSchema } from '@/lib/seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { STATE_MAP, ALL_STATE_SLUGS, TOP_STATES } from '../state-data'


/* ── Static params for all 50 states ─────────────────── */

export function generateStaticParams() {
    return ALL_STATE_SLUGS.map((state) => ({ state }))
}

/* ── Dynamic metadata ────────────────────────────────── */

export async function generateMetadata({
    params,
}: {
    params: Promise<{ state: string }>
}): Promise<Metadata> {
    const { state: stateSlug } = await params
    const stateInfo = STATE_MAP[stateSlug]
    if (!stateInfo) return {}

    return generatePageMetadata({
        title: `Field Inspector & Notary Firms Hiring in ${stateInfo.label}`,
        description: `Browse verified firms hiring field inspectors, mobile notaries, and appraisal professionals in ${stateInfo.label}. Compare pay rates, coverage areas, and apply directly.`,
        path: `/hiring-firms/${stateSlug}`,
    })
}

/* ── Supabase query ──────────────────────────────────── */

type FirmPreview = {
    id: string
    slug: string | null
    name: string
    industry_focus: string | null
    geographic_coverage: string | null
    pay_min: number | null
    pay_max: number | null
    pay_type: string | null
    contractor_rating: number | null
    rating_count: number | null
    logo_url: string | null
    description: string | null
    services: string | null
}

async function getFirmsByState(stateCode: string, stateLabel: string): Promise<FirmPreview[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return []

    try {
        const params = new URLSearchParams()
        params.set(
            'select',
            'id,slug,name,industry_focus,geographic_coverage,pay_min,pay_max,pay_type,contractor_rating,rating_count,logo_url,description,services'
        )
        params.set('is_published', 'eq.true')
        params.set('order', 'contractor_rating.desc.nullslast,name.asc')
        params.set('limit', '24')

        // Match state name, code, or national firms
        const orFilter = [
            `geographic_coverage.ilike.*${stateLabel}*`,
            `geographic_coverage.ilike.*${stateCode}*`,
            'geographic_coverage.ilike.*national*',
            'geographic_coverage.ilike.*nationwide*',
            'geographic_coverage.ilike.*all 50*',
        ].join(',')
        params.set('or', `(${orFilter})`)

        const res = await fetch(`${supabaseUrl}/rest/v1/firms?${params.toString()}`, {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                Prefer: 'count=exact',
            },
            next: { tags: ['firms'] },
        })

        if (!res.ok) return []
        const contentRange = res.headers.get('content-range')
        const firms = (await res.json()) as FirmPreview[]
        return firms
    } catch {
        return []
    }
}

/* ── FAQ data per state ──────────────────────────────── */

function getStateFAQs(stateLabel: string) {
    return [
        {
            question: `How many firms are hiring field inspectors in ${stateLabel}?`,
            answer: `Our directory includes verified firms actively hiring in ${stateLabel}, plus national firms that service all 50 states. New firms are added weekly as we verify their contractor programs.`,
        },
        {
            question: `What does a field inspector earn in ${stateLabel}?`,
            answer: `Pay varies by firm, assignment type, and experience. Most inspectors in ${stateLabel} earn $25–$75 per inspection for mortgage field work, with commercial and specialty inspections paying $75–$200+. Check individual firm profiles for current rates.`,
        },
        {
            question: `Do I need a license to be a field inspector in ${stateLabel}?`,
            answer: `Requirements depend on the type of inspection. Mortgage field inspections typically require no state license—just a background check and reliable transportation. Home inspections and notary work may require state-specific certification. Check your state's Department of Professional Regulation for details.`,
        },
    ]
}

/* ── Page component ──────────────────────────────────── */

export default async function StateLandingPage({
    params,
}: {
    params: Promise<{ state: string }>
}) {
    const { state: stateSlug } = await params
    const stateInfo = STATE_MAP[stateSlug]
    if (!stateInfo) notFound()

    const firms = await getFirmsByState(stateInfo.code, stateInfo.label)
    const faqs = getStateFAQs(stateInfo.label)
    const faqSchema = getFAQPageSchema(faqs)
    const breadcrumbSchema = getBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Firm Directory', url: `${SITE_URL}/hiring-firms` },
        { name: stateInfo.label, url: `${SITE_URL}/hiring-firms/${stateSlug}` },
    ])

    // Cross-link states (exclude current state, pick up to 10)
    const crossLinkStates = TOP_STATES
        .filter((s) => s !== stateSlug)
        .slice(0, 10)
        .map((slug) => STATE_MAP[slug])
        .filter(Boolean)

    return (
        <main className="min-h-screen bg-white text-slate-900">
            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* ═══ Hero ═══ */}
            <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                    <Breadcrumbs
                        items={[
                            { name: 'Home', url: SITE_URL },
                            { name: 'Firm Directory', url: `${SITE_URL}/hiring-firms` },
                            { name: stateInfo.label, url: `${SITE_URL}/hiring-firms/${stateSlug}` },
                        ]}
                    />

                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-copper/10 text-brand-copper">
                            <MapPin className="h-7 w-7" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Field Inspector & Notary Firms Hiring in {stateInfo.label}
                            </h1>
                            <p className="max-w-3xl text-base text-slate-600">
                                Browse {firms.length > 0 ? firms.length : ''} verified firms hiring field inspectors, mobile notaries,
                                and appraisal professionals in {stateInfo.label}. Compare pay rates, read contractor reviews, and apply directly.
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Link
                                    href={`/hiring-firms?state=${stateInfo.code}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    <Users className="h-4 w-4" />
                                    View full directory for {stateInfo.label}
                                </Link>
                                <Link
                                    href="/membership-pricing"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    See membership plans
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ Firm grid ═══ */}
            <section className="py-10 sm:py-14">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">
                            Top firms in {stateInfo.label}
                        </h2>
                        {firms.length > 0 && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {firms.length} firm{firms.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {firms.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-12 text-center">
                            <p className="text-sm font-semibold text-slate-700">
                                We&apos;re still building our {stateInfo.label} directory
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Many national firms service {stateInfo.label}. Browse the full directory to find opportunities.
                            </p>
                            <Link
                                href="/hiring-firms"
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
                            >
                                Browse all firms <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {firms.slice(0, 12).map((firm) => (
                                <FirmPreviewCard key={firm.id} firm={firm} state={stateInfo.label} />
                            ))}
                        </div>
                    )}

                    {firms.length > 12 && (
                        <div className="mt-8 text-center">
                            <Link
                                href={`/hiring-firms?state=${stateInfo.code}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-copperDark"
                            >
                                See all {firms.length} firms in {stateInfo.label} <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* ═══ CTA Banner ═══ */}
            <section className="border-y border-slate-200 bg-slate-900 py-10 sm:py-14">
                <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                        Ready to start inspecting in {stateInfo.label}?
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
                        Join Nested Objects for full firm profiles, pay intel, AI tools, and training resources.
                        Start with a free account to preview the directory.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/membership-pricing"
                            className="inline-flex items-center justify-center rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-copperDark"
                        >
                            Join free — explore the directory
                        </Link>
                        <Link
                            href="/contact-us"
                            className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            Talk with our team
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══ FAQs ═══ */}
            <section className="py-10 sm:py-14">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-xl font-bold text-slate-900">
                        Frequently asked questions about inspecting in {stateInfo.label}
                    </h2>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {faqs.map((faq) => (
                            <div key={faq.question} className="rounded-xl border border-slate-200 bg-white p-5">
                                <p className="text-sm font-semibold text-slate-900">{faq.question}</p>
                                <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ Cross-links ═══ */}
            <section className="border-t border-slate-200 bg-slate-50 py-10 sm:py-14">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-xl font-bold text-slate-900">
                        Also hiring field inspectors
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Browse firms in other states with active inspector and notary openings.
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                        {crossLinkStates.map((s) => (
                            <Link
                                key={s.slug}
                                href={`/hiring-firms/${s.slug}`}
                                className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-brand-copper hover:text-brand-copper"
                            >
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-brand-copper" />
                                {s.label}
                            </Link>
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <Link
                            href="/hiring-firms"
                            className="text-sm font-semibold text-brand-copper transition hover:text-brand-copperDark"
                        >
                            View all states →
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}

/* ── Firm preview card (server component) ────────────── */

function FirmPreviewCard({ firm, state }: { firm: FirmPreview; state: string }) {
    const pay =
        firm.pay_min != null || firm.pay_max != null
            ? [
                firm.pay_min != null ? `$${Math.round(Number(firm.pay_min))}` : null,
                firm.pay_max != null ? `$${Math.round(Number(firm.pay_max))}` : null,
            ]
                .filter(Boolean)
                .join(' – ') + (firm.pay_type ? ` ${firm.pay_type}` : '')
            : null

    const initials = firm.name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w.charAt(0))
        .join('')
        .toUpperCase()

    let hash = 0
    for (let i = 0; i < firm.name.length; i++) hash = firm.name.charCodeAt(i) + ((hash << 5) - hash)
    const hue = Math.abs(hash) % 360

    return (
        <Link
            href={`/firms/${firm.slug ?? firm.id}`}
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-copper/40 hover:shadow-md"
        >
            <div className="flex items-start gap-3">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: `hsl(${hue}, 45%, 52%)` }}
                >
                    {initials}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-copper">
                        {firm.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                        {firm.industry_focus || 'Field services'}
                    </p>
                </div>
            </div>

            {firm.description && (
                <p className="mt-3 line-clamp-2 text-xs text-slate-600">{firm.description}</p>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs">
                {pay ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <DollarSign className="h-3 w-3" /> {pay}
                    </span>
                ) : (
                    <span className="text-slate-400">Pay shared on profile</span>
                )}
                {firm.contractor_rating != null && firm.contractor_rating > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-amber-700">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {firm.contractor_rating.toFixed(1)}
                    </span>
                )}
            </div>
        </Link>
    )
}
