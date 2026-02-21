import type { Metadata } from 'next'
import Link from 'next/link'
import {
    MapPin, DollarSign, GraduationCap, CheckCircle2,
    ArrowRight, Briefcase, Clock, Car, Smartphone, Shield,
    TrendingUp, Users, ChevronRight
} from 'lucide-react'
import { generatePageMetadata, SITE_URL } from '@/lib/seo'

export const metadata: Metadata = generatePageMetadata({
    title: 'How to Become a Field Inspector in 2026 — The Complete Guide',
    description: 'Step-by-step guide to becoming a field inspector. Learn requirements, pay rates ($25–$75/inspection), training, and which companies are hiring. No degree needed.',
    path: '/guides/how-to-become-a-field-inspector',
})

const SCHEMA_FAQ = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'Do you need a degree to become a field inspector?',
            acceptedAnswer: { '@type': 'Answer', text: 'No. Most field inspection roles require only a high school diploma or GED, a reliable vehicle, a smartphone with a camera, and internet access. Some specialized roles may require certifications.' },
        },
        {
            '@type': 'Question',
            name: 'How much do field inspectors make?',
            acceptedAnswer: { '@type': 'Answer', text: 'Field inspectors typically earn $5–$15 per exterior drive-by inspection, $25–$75 per interior inspection, and $75–$150 for specialized inspections like insurance loss control. Most inspectors are independent contractors paid per inspection, not hourly.' },
        },
        {
            '@type': 'Question',
            name: 'How do I find field inspector jobs?',
            acceptedAnswer: { '@type': 'Answer', text: 'Apply directly to field services companies like Safeguard Properties, National Field Representatives (NFR), or ServiceLink. You can browse 460+ hiring firms at members.nestedobjects.com/hiring-firms.' },
        },
        {
            '@type': 'Question',
            name: 'What tools do field inspectors need?',
            acceptedAnswer: { '@type': 'Answer', text: 'The basics are a reliable vehicle, a smartphone with a good camera, GPS navigation, and internet for uploading reports. Most companies provide their own mobile app for submitting inspections.' },
        },
    ],
}

const SCHEMA_HOWTO = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Become a Field Inspector',
    description: 'Step-by-step guide to starting a career as a field inspector in property, mortgage, or insurance services.',
    step: [
        { '@type': 'HowToStep', name: 'Meet basic requirements', text: 'Ensure you have a high school diploma/GED, reliable vehicle, smartphone, and clean background.' },
        { '@type': 'HowToStep', name: 'Choose your niche', text: 'Decide between mortgage inspections, property preservation, insurance loss control, or notary signing.' },
        { '@type': 'HowToStep', name: 'Get trained', text: 'Complete a field inspection training course to learn reporting standards and inspection types.' },
        { '@type': 'HowToStep', name: 'Apply to companies', text: 'Sign up with 3–5 field services companies to build a steady flow of work orders.' },
        { '@type': 'HowToStep', name: 'Build your reputation', text: 'Complete inspections accurately and on time to earn more volume and better-paying assignments.' },
    ],
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <h2 id={id} className="mt-14 mb-4 scroll-mt-24 text-2xl font-bold text-slate-900 sm:text-3xl">
            {children}
        </h2>
    )
}

function StepCard({ number, title, description, icon: Icon }: { number: number; title: string; description: string; icon: any }) {
    return (
        <div className="flex gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
                {number}
            </div>
            <div>
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
        </div>
    )
}

function PayTable() {
    const rows = [
        { type: 'Exterior / Drive-by', range: '$5 – $15', time: '5–10 min', notes: 'Photo + occupancy check from vehicle' },
        { type: 'Occupancy Verification', range: '$10 – $25', time: '10–20 min', notes: 'Door knock, photos, condition notes' },
        { type: 'Interior Inspection', range: '$25 – $75', time: '30–60 min', notes: 'Full walk-through with photo set' },
        { type: 'Insurance Loss Control', range: '$50 – $150', time: '45–90 min', notes: 'Detailed risk assessment + report' },
        { type: 'Commercial Inspection', range: '$75 – $200+', time: '1–3 hours', notes: 'Larger properties, more documentation' },
        { type: 'Property Preservation', range: '$25 – $100+', time: 'Varies', notes: 'Winterization, securing, maintenance' },
    ]

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Inspection Type</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Pay Range</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Time on Site</th>
                        <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">What You Do</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => (
                        <tr key={r.type} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-900">{r.type}</td>
                            <td className="px-4 py-3 font-semibold text-emerald-700">{r.range}</td>
                            <td className="px-4 py-3 text-slate-600">{r.time}</td>
                            <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{r.notes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function CTABanner() {
    return (
        <div className="my-10 rounded-2xl border border-brand/20 bg-brand/5 px-6 py-8 text-center sm:px-10">
            <h3 className="text-xl font-bold text-slate-900">Ready to find firms hiring field inspectors?</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                Browse 460+ firms in our directory, filtered by industry, rating, and state. See real pay data, contractor reviews, and apply links.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                    href="/hiring-firms"
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    Browse Hiring Firms <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                    href="/training"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Start Training <GraduationCap className="h-4 w-4" />
                </Link>
            </div>
        </div>
    )
}

function TableOfContents() {
    const sections = [
        { id: 'what-is', label: 'What is a field inspector?' },
        { id: 'requirements', label: 'Requirements' },
        { id: 'pay', label: 'How much do field inspectors make?' },
        { id: 'types', label: 'Types of field inspections' },
        { id: 'steps', label: '5 steps to get started' },
        { id: 'companies', label: 'Companies that are hiring' },
        { id: 'training', label: 'Training and certifications' },
        { id: 'tips', label: 'Tips for success' },
        { id: 'faq', label: 'FAQ' },
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

export default function HowToBecomeFieldInspectorPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_FAQ) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_HOWTO) }}
            />

            <main className="bg-brand-sand text-slate-900">
                {/* Breadcrumb */}
                <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
                    <nav className="flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-brand">Home</Link>
                        <span>/</span>
                        <Link href="/guides" className="hover:text-brand">Guides</Link>
                        <span>/</span>
                        <span className="text-slate-700">How to Become a Field Inspector</span>
                    </nav>
                </div>

                {/* Hero */}
                <header className="mx-auto max-w-4xl px-4 pb-8 pt-6 sm:px-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Career Guide</p>
                    <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                        How to Become a Field Inspector in 2026
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                        No degree required. Flexible schedule. Earn $25–$75 per inspection working as an independent contractor
                        for mortgage companies, insurance firms, and property preservation vendors across the US.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> 12 min read</span>
                        <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Updated Feb 2026</span>
                    </div>
                </header>

                {/* Content Grid */}
                <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:grid lg:grid-cols-[1fr_220px] lg:gap-10">
                    <article className="prose-slate max-w-none">

                        <SectionHeading id="what-is">What is a field inspector?</SectionHeading>
                        <p className="text-base leading-relaxed text-slate-700">
                            A field inspector visits properties on behalf of banks, mortgage lenders, insurance companies, and asset management firms.
                            Your job is to document the condition of a property through photos, notes, and standardized reports — then submit
                            everything through a mobile app or web portal.
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-slate-700">
                            Most field inspectors are independent contractors (1099), not employees. That means you set your own schedule,
                            use your own vehicle, and can work for multiple companies simultaneously. It&apos;s one of the most accessible
                            gig-economy roles available — and one of the least talked about.
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-slate-700">
                            Field inspectors typically cover a geographic territory (usually within 50 miles of home) and complete anywhere from
                            5 to 20+ inspections per day depending on the type. Drive-by exterior checks take minutes. Full interior inspections
                            with damage reports take longer but pay significantly more.
                        </p>

                        <SectionHeading id="requirements">What you need to get started</SectionHeading>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                { icon: GraduationCap, label: 'High school diploma or GED' },
                                { icon: Car, label: 'Reliable vehicle with insurance' },
                                { icon: Smartphone, label: 'Smartphone with camera' },
                                { icon: Shield, label: 'Clean background check' },
                                { icon: MapPin, label: 'Willingness to travel locally' },
                                { icon: Briefcase, label: 'Self-motivation (you\'re your own boss)' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                                    <span className="text-sm text-slate-700">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-sm text-slate-600">
                            No college degree, no special license, no prior experience required for most entry-level positions.
                            Some specialized roles (insurance loss control, commercial appraisals) may require certifications — but
                            you can start without them and add credentials as you grow.
                        </p>

                        <SectionHeading id="pay">How much do field inspectors make?</SectionHeading>
                        <p className="mb-4 text-base leading-relaxed text-slate-700">
                            Pay varies widely by inspection type, company, and region. Here&apos;s what you can realistically expect
                            based on current industry data and contractor reports from our directory of 460+ firms:
                        </p>
                        <PayTable />
                        <p className="mt-4 text-sm text-slate-600">
                            Most field inspectors working full-time report annual earnings between $30,000 and $65,000. Top performers
                            who stack multiple companies and cover high-volume territories can earn $75,000+. Your income depends on
                            volume, speed, territory density, and which companies you work with.
                        </p>

                        <CTABanner />

                        <SectionHeading id="types">Types of field inspections</SectionHeading>
                        <p className="mb-4 text-base leading-relaxed text-slate-700">
                            Not all inspections are the same. Here are the main categories you&apos;ll encounter:
                        </p>

                        <div className="space-y-4">
                            {[
                                { title: 'Mortgage / Occupancy Inspections', desc: 'The most common type. Lenders are legally required to check properties that are behind on payments. You verify occupancy, take exterior photos, and note condition. These are high-volume, moderate-pay assignments.' },
                                { title: 'Property Preservation', desc: 'Securing, winterizing, and maintaining vacant or foreclosed properties. This includes changing locks, boarding windows, draining pipes, debris removal, and lawn care. Pays more but requires basic handyman skills.' },
                                { title: 'Insurance Loss Control', desc: 'Evaluating properties for insurance risk. Detailed interior and exterior inspections with specific documentation requirements. Higher pay ($50–$150+) but more time-intensive.' },
                                { title: 'Commercial / Business Verification', desc: 'Verifying that a business exists and operates at a stated location. Quick visits with photos and basic documentation. Growing niche.' },
                                { title: 'Vehicle & Equipment Inspections', desc: 'Inspecting vehicles, boats, RVs, or heavy equipment for lenders. Niche but pays well per unit.' },
                            ].map((item) => (
                                <div key={item.title} className="rounded-lg border-l-4 border-brand/30 bg-white px-5 py-4">
                                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <SectionHeading id="steps">5 steps to become a field inspector</SectionHeading>
                        <div className="space-y-4">
                            <StepCard
                                number={1}
                                icon={CheckCircle2}
                                title="Confirm you meet the basic requirements"
                                description="Reliable vehicle, smartphone, clean background, high school diploma. If you're reading this, you probably already qualify."
                            />
                            <StepCard
                                number={2}
                                icon={Briefcase}
                                title="Pick your starting niche"
                                description="Mortgage inspections are the easiest to break into — high volume, low barrier. Property preservation pays more but requires tools. Insurance loss control is the highest-paying entry point but more selective."
                            />
                            <StepCard
                                number={3}
                                icon={GraduationCap}
                                title="Complete a training course"
                                description="While not always required, completing a recognized inspection course makes you more competitive and helps you avoid costly rookie mistakes. We offer structured training by role and experience level."
                            />
                            <StepCard
                                number={4}
                                icon={Users}
                                title="Apply to 3–5 companies simultaneously"
                                description="Don't put all your eggs in one basket. Sign up with multiple firms to build consistent volume. Our directory lists 460+ firms with pay data, ratings, and direct apply links."
                            />
                            <StepCard
                                number={5}
                                icon={TrendingUp}
                                title="Build your reputation and expand"
                                description="Complete inspections on time, submit clean reports, and communicate proactively. As your rating improves, companies assign more volume and higher-paying orders."
                            />
                        </div>

                        <SectionHeading id="companies">Companies hiring field inspectors</SectionHeading>
                        <p className="mb-4 text-base leading-relaxed text-slate-700">
                            Hundreds of companies across the US hire independent field inspectors. Here are some of the largest national firms:
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                { name: 'Safeguard Properties', focus: 'Property Preservation', slug: 'safeguard-properties' },
                                { name: 'National Field Representatives (NFR)', focus: 'Mortgage & Preservation', slug: 'national-field-representatives' },
                                { name: 'ServiceLink', focus: 'Mortgage Field Services', slug: 'servicelink' },
                                { name: 'MCS (Mortgage Contracting Services)', focus: 'Property Preservation', slug: 'mcs' },
                                { name: 'Cyprexx', focus: 'Property Preservation & REO', slug: 'cyprexx' },
                                { name: 'GIS Field Services', focus: 'Mortgage Inspections', slug: 'gis-field-services' },
                            ].map((firm) => (
                                <Link
                                    key={firm.slug}
                                    href={`/firms/${firm.slug}`}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-brand/30 hover:shadow-sm"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{firm.name}</p>
                                        <p className="text-xs text-slate-500">{firm.focus}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                                </Link>
                            ))}
                        </div>
                        <p className="mt-4 text-sm text-slate-600">
                            This is just a sample.{' '}
                            <Link href="/hiring-firms" className="font-semibold text-brand underline">
                                Browse all 460+ firms in our directory →
                            </Link>
                        </p>

                        <SectionHeading id="training">Training and certifications</SectionHeading>
                        <p className="text-base leading-relaxed text-slate-700">
                            While most companies provide basic on-the-job training, completing a structured course before you apply
                            gives you a significant advantage. You&apos;ll understand inspection types, reporting standards, photo
                            requirements, and lender-specific expectations before your first assignment.
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-slate-700">
                            Nested Objects offers role-based training tracks for field inspectors at every level — from
                            complete beginners to experienced contractors looking to expand into new inspection types. Our courses
                            cover mortgage inspections, property preservation, insurance loss control, and more.
                        </p>
                        <div className="mt-4">
                            <Link
                                href="/training"
                                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
                            >
                                Explore Training Tracks <GraduationCap className="h-4 w-4" />
                            </Link>
                        </div>

                        <SectionHeading id="tips">Tips for success as a new inspector</SectionHeading>
                        <div className="space-y-3">
                            {[
                                { title: 'Stack companies, not just inspections', detail: 'Working for 3–5 firms ensures steady volume even when one company is slow. Different companies peak at different times.' },
                                { title: 'Invest in your route', detail: 'Plan efficient routes to maximize inspections per hour. GPS apps and route optimization can double your daily output.' },
                                { title: 'Overcommunicate', detail: 'If you can\'t access a property, document it. If you\'re running late, notify the company. Proactive communication builds trust.' },
                                { title: 'Photos are everything', detail: 'Blurry, poorly lit, or missing photos cause rejects. Take more than required. Use the company\'s exact photo order.' },
                                { title: 'Track your expenses', detail: 'As a 1099 contractor, mileage, phone, camera equipment, and supplies are all tax-deductible. Track from day one.' },
                                { title: 'Ask for more volume', detail: 'Once you\'ve proven reliability (30+ days, no rejects), proactively ask for expanded territory or higher-tier inspections.' },
                            ].map((tip) => (
                                <div key={tip.title} className="rounded-lg border border-slate-200 bg-white px-5 py-4">
                                    <h3 className="text-sm font-semibold text-slate-900">{tip.title}</h3>
                                    <p className="mt-1 text-sm text-slate-600">{tip.detail}</p>
                                </div>
                            ))}
                        </div>

                        <CTABanner />

                        <SectionHeading id="faq">Frequently asked questions</SectionHeading>
                        <div className="space-y-4">
                            {SCHEMA_FAQ.mainEntity.map((q: any) => (
                                <details key={q.name} className="group rounded-lg border border-slate-200 bg-white">
                                    <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                                        {q.name}
                                    </summary>
                                    <p className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                                        {q.acceptedAnswer.text}
                                    </p>
                                </details>
                            ))}
                        </div>

                    </article>

                    {/* Sidebar (desktop) */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-8 space-y-6">
                            <TableOfContents />
                            <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-5 text-center">
                                <p className="text-xs font-semibold uppercase tracking-wider text-brand">Free to browse</p>
                                <p className="mt-2 text-lg font-bold text-slate-900">460+ Firms</p>
                                <p className="mt-1 text-xs text-slate-600">Pay data, ratings, and apply links</p>
                                <Link
                                    href="/hiring-firms"
                                    className="mt-3 block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                    View Directory
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </>
    )
}