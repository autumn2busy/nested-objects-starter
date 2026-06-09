import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { MapPin, ArrowRight, Users, DollarSign, Star, CheckCircle, Search, ShieldCheck } from 'lucide-react'

import { generatePageMetadata, SITE_URL, getBreadcrumbSchema, getFAQPageSchema } from '@/lib/seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { STATE_MAP, ALL_STATE_SLUGS, TOP_STATES } from '../state-data'

export const revalidate = 3600
export const dynamicParams = false


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
        title: `${stateInfo.label} Field Inspector Firms Hiring`,
        description: `Find field inspection, mobile notary, appraisal, and property preservation firms hiring in ${stateInfo.label}. Compare service areas, pay clues, reviews, and next steps.`,
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

type StateFirmPreviewResponse = {
    firms: FirmPreview[]
    totalCount: number
}

async function getFirmsByState(stateCode: string, stateLabel: string): Promise<StateFirmPreviewResponse> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return { firms: [], totalCount: 0 }

    try {
        const params = new URLSearchParams()
        params.set(
            'select',
            'id,slug,name,industry_focus,geographic_coverage,pay_min,pay_max,pay_type,contractor_rating,rating_count,logo_url,description,services'
        )
        params.set('is_published', 'eq.true')
        params.set('order', 'contractor_rating.desc.nullslast,name.asc')
        params.set('limit', '12')

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

        if (!res.ok) return { firms: [], totalCount: 0 }
        const contentRange = res.headers.get('content-range')
        const totalCount = contentRange
            ? Number.parseInt(contentRange.split('/')[1] ?? '', 10)
            : Number.NaN
        const firms = (await res.json()) as FirmPreview[]
        return {
            firms,
            totalCount: Number.isFinite(totalCount) ? totalCount : firms.length,
        }
    } catch {
        return { firms: [], totalCount: 0 }
    }
}

/* ── FAQ data per state ──────────────────────────────── */

function getStateFAQs(stateLabel: string) {
    return [
        {
            question: `Who hires field inspectors in ${stateLabel}?`,
            answer: `Field inspectors in ${stateLabel} are commonly hired by mortgage field service firms, insurance loss control companies, property preservation vendors, appraisal support companies, and national firms that cover multiple states. Nested Objects lists state-specific and nationwide firms so you can compare options before applying.`,
        },
        {
            question: `What field inspection work is available in ${stateLabel}?`,
            answer: `Common opportunities include mortgage occupancy checks, exterior and interior photo inspections, insurance loss control surveys, property preservation checks, drive-by valuation support, mobile notary assignments, and other independent contractor field service work.`,
        },
        {
            question: `What does a field inspector earn in ${stateLabel}?`,
            answer: `Pay varies by firm, assignment type, distance, photo requirements, and experience. Many basic mortgage field inspections are listed as per-order work, while specialty inspections, commercial surveys, and rush assignments may pay more. Always confirm current rates, trip fees, and revision rules before accepting work.`,
        },
        {
            question: `Do I need a license to be a field inspector in ${stateLabel}?`,
            answer: `Many mortgage field inspection assignments do not require a state field inspector license, but firms may require a background check, insurance, photos, a reliable vehicle, and basic training. Home inspection, appraisal, notary, and insurance-related work may have state-specific licensing or certification rules.`,
        },
        {
            question: `How do I compare firms before applying in ${stateLabel}?`,
            answer: `Compare the service area, assignment types, pay structure, onboarding requirements, revision policy, contractor reviews, and how often the firm appears to need vendors in your region. A higher rate is not always better if the route is sparse or the revision process is slow.`,
        },
        {
            question: `What is the fastest way to find field inspection firms in ${stateLabel}?`,
            answer: `The fastest path is to shortlist firms that mention ${stateLabel} or your nearest metro, add national firms with nationwide coverage, then remove any company that does not match your route radius, equipment, schedule, or pay requirements.`,
        },
        {
            question: `How many firms should I apply to in ${stateLabel}?`,
            answer: `Most contractors should compare several firms instead of relying on one application. A practical starting shortlist is five to ten firms across mortgage field inspections, loss control, preservation, notary, and appraisal support, then prioritize the ones with the clearest coverage and onboarding details.`,
        },
        {
            question: `What does Nested Objects Pro unlock for ${stateLabel} firm research?`,
            answer: `Pro helps you move beyond a simple list by organizing firm profiles, pay clues, route expectations, application notes, contractor feedback, and AI tools that help you choose which firms fit your schedule and service lanes.`,
        },
    ]
}

function getQuickAnswers(stateLabel: string) {
    return [
        {
            title: `Best place to start in ${stateLabel}`,
            body: `Start with firms that explicitly cover ${stateLabel}, then add national firms that list nationwide or all-50-state coverage. This gives you both local and broader contractor options.`,
        },
        {
            title: 'Most common first assignments',
            body: 'New inspectors often begin with occupancy checks, exterior photos, insurance surveys, property condition reports, and simple route-based assignments before moving into specialty work.',
        },
        {
            title: 'What to verify before applying',
            body: 'Confirm pay per order, travel expectations, photo requirements, background check steps, insurance requirements, revision rules, and whether the firm has current work in your target counties.',
        },
        {
            title: 'How to use this page',
            body: `Use the ${stateLabel} list to shortlist firms, then open the full directory to filter by service area, rating, pay clues, and industry focus before you submit applications.`,
        },
    ]
}

function getStateApplicationSteps(stateLabel: string) {
    return [
        {
            title: 'Map your service lane',
            body: `Start with the counties, suburbs, or metros in ${stateLabel} you can reach without turning each order into a low-margin trip.`,
        },
        {
            title: 'Build a 5-10 firm shortlist',
            body: 'Mix local, regional, and national firms so one slow vendor queue does not become your whole pipeline.',
        },
        {
            title: 'Verify the real terms',
            body: 'Check assignment type, payment timing, trip fees, revision rules, equipment, background checks, and onboarding response time.',
        },
        {
            title: 'Apply in batches',
            body: 'Submit clean applications in one focused session, then track follow-ups so you can compare response quality and assignment fit.',
        },
    ]
}

function getStateShortlistSignals(stateLabel: string) {
    return [
        `Coverage names ${stateLabel}, your metro, nearby counties, or national service areas that include your route.`,
        'The firm explains assignment types clearly enough to know whether the work matches your skills.',
        'The onboarding process is realistic for your background check, insurance, phone, camera, and transportation setup.',
        'Payment timing, revision expectations, and communication patterns are clear enough to compare against other firms.',
    ]
}

function getComparisonChecks(stateLabel: string) {
    return [
        `Does the firm list ${stateLabel}, your metro, or nearby counties as an active service area?`,
        'Are pay ranges, trip fees, or order types clear enough to decide whether the route is worth it?',
        'Does the firm serve your lane: mortgage field inspections, loss control, notary, appraisal support, or preservation?',
        'Are onboarding steps realistic for you: background check, equipment, insurance, training, and turnaround time?',
        'Do contractor notes or reviews suggest consistent communication and fair revision handling?',
    ]
}

function getStateCollectionSchema({
    stateLabel,
    stateSlug,
    firms,
}: {
    stateLabel: string
    stateSlug: string
    firms: FirmPreview[]
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${stateLabel} field inspector firms hiring`,
        url: `${SITE_URL}/hiring-firms/${stateSlug}`,
        description: `A state directory page for field inspection, mobile notary, appraisal support, and property preservation firms hiring independent contractors in ${stateLabel}.`,
        about: [
            'Field inspection jobs',
            'Mortgage field inspection services',
            'Insurance loss control inspection',
            'Mobile notary assignments',
            'Property preservation vendors',
        ],
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: firms.slice(0, 12).map((firm, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `${SITE_URL}/firms/${firm.slug ?? firm.id}`,
                name: firm.name,
            })),
        },
    }
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

    const { firms, totalCount } = await getFirmsByState(stateInfo.code, stateInfo.label)
    const faqs = getStateFAQs(stateInfo.label)
    const quickAnswers = getQuickAnswers(stateInfo.label)
    const applicationSteps = getStateApplicationSteps(stateInfo.label)
    const shortlistSignals = getStateShortlistSignals(stateInfo.label)
    const comparisonChecks = getComparisonChecks(stateInfo.label)
    const faqSchema = getFAQPageSchema(faqs)
    const collectionSchema = getStateCollectionSchema({
        stateLabel: stateInfo.label,
        stateSlug,
        firms,
    })
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
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
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

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-copper/10 text-brand-copper sm:h-14 sm:w-14">
                            <MapPin className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                                Field Inspector & Notary Firms Hiring in {stateInfo.label}
                            </h1>
                            <p className="max-w-3xl text-base text-slate-600">
                                Find field inspection, mobile notary, appraisal support, and property preservation firms serving {stateInfo.label}.
                                Compare service areas, pay clues, contractor reviews, and application next steps before you spend time on vendor portals.
                            </p>
                            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                                <Link
                                    href={`/hiring-firms?state=${stateInfo.code}`}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto sm:py-2.5"
                                >
                                    <Users className="h-4 w-4" />
                                    View full directory for {stateInfo.label}
                                </Link>
                                <Link
                                    href="/membership-pricing"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:py-2.5"
                                >
                                    See membership plans
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick answers */}
            <section className="border-b border-slate-200 bg-white py-10 [content-visibility:auto] [contain-intrinsic-size:0_560px] sm:py-12">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
                            Quick answers
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                            Field inspection opportunities in {stateInfo.label}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Use these answers to understand who hires, what work exists, and what to verify before applying.
                        </p>
                    </div>
                    <div className="mt-7 grid gap-4 md:grid-cols-2">
                        {quickAnswers.map((answer) => (
                            <article key={answer.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">{answer.title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{answer.body}</p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Application path */}
            <section className="border-b border-slate-200 bg-white py-10 [content-visibility:auto] [contain-intrinsic-size:0_620px] sm:py-12">
                <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:px-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
                            Best path
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                            How to start applying in {stateInfo.label}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Treat firm research like route planning. The right shortlist should match your location,
                            schedule, equipment, and tolerance for revisions before you spend time on vendor portals.
                        </p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {applicationSteps.map((step, index) => (
                                <article key={step.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    <aside className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                                <ShieldCheck className="h-5 w-5" aria-hidden />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                    Shortlist signals
                                </p>
                                <h3 className="mt-1 text-lg font-bold text-slate-900">
                                    What a strong firm match includes
                                </h3>
                            </div>
                        </div>
                        <ul className="mt-5 space-y-3">
                            {shortlistSignals.map((signal) => (
                                <li key={signal} className="flex gap-3 text-sm leading-6 text-slate-700">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                                    <span>{signal}</span>
                                </li>
                            ))}
                        </ul>
                    </aside>
                </div>
            </section>

            {/* ═══ Firm grid ═══ */}
            <section className="py-10 [content-visibility:auto] [contain-intrinsic-size:0_720px] sm:py-14">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">
                            Top firms in {stateInfo.label}
                        </h2>
                        {firms.length > 0 && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {totalCount} firm{totalCount !== 1 ? 's' : ''}
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
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white sm:w-auto sm:py-2.5"
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

                    {totalCount > firms.length && (
                        <div className="mt-8 text-center">
                            <Link
                                href={`/hiring-firms?state=${stateInfo.code}`}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-copperDark sm:w-auto"
                            >
                                See all {totalCount} firms in {stateInfo.label} <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Compare and qualify */}
            <section className="border-y border-slate-200 bg-slate-50 py-10 [content-visibility:auto] [contain-intrinsic-size:0_620px] sm:py-14">
                <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:px-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
                            Compare before applying
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                            How to choose a {stateInfo.label} inspection firm
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            The best firm for you is not only the one with the highest listed pay. Route density,
                            revision process, assignment type, and communication can matter just as much.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Pay clues</span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Route fit</span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Reviews</span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Onboarding</span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-copper/10 text-brand-copper">
                                <Search className="h-5 w-5" aria-hidden />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Five checks before you apply</h3>
                                <p className="text-xs text-slate-500">Use this checklist on every firm profile.</p>
                            </div>
                        </div>
                        <ul className="mt-5 space-y-3">
                            {comparisonChecks.map((check) => (
                                <li key={check} className="flex gap-3 text-sm leading-6 text-slate-700">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                                    <span>{check}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ═══ CTA Banner ═══ */}
            <section className="border-y border-slate-200 bg-slate-900 py-10 [content-visibility:auto] [contain-intrinsic-size:0_420px] sm:py-14">
                <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                        Ready to start inspecting in {stateInfo.label}?
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
                        Join Nested Objects for firm profiles, pay clues, route-fit notes, AI tools, and training resources.
                        Start free, then upgrade when you are ready to compare firms more seriously.
                    </p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                        <Link
                            href="/membership-pricing"
                            className="inline-flex w-full items-center justify-center rounded-lg bg-brand-copper px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-copperDark sm:w-auto"
                        >
                            Start the 7-day Pro trial
                        </Link>
                        <Link
                            href={`/hiring-firms?state=${stateInfo.code}`}
                            className="inline-flex w-full items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                        >
                            Filter firms in {stateInfo.label}
                        </Link>
                        <Link
                            href="/contact-us"
                            className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white/90 transition hover:bg-white/10 sm:w-auto"
                        >
                            Talk with our team
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══ FAQs ═══ */}
            <section className="py-10 [content-visibility:auto] [contain-intrinsic-size:0_720px] sm:py-14">
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
            <section className="border-t border-slate-200 bg-slate-50 py-10 [content-visibility:auto] [contain-intrinsic-size:0_460px] sm:py-14">
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
