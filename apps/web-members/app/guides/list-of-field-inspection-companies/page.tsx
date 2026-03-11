import { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo'

// Highly optimized metadata targeting exact match keywords
export const metadata: Metadata = generatePageMetadata({
    title: 'List of Top Field Inspection Companies (2026)',
    description: 'A curated list of the top field inspection companies for 2026. Browse our directory to find the best vendors for residential, commercial, and property preservation field inspections.',
    path: '/guides/list-of-field-inspection-companies',
})

const companies = [
    {
        name: 'iVueit',
        url: 'https://ivueit.com/',
        description: 'A popular app-based platform that crowdsources photos and data for commercial property maintenance and facility management.',
        tags: ['Commercial', 'App-Based', 'Nationwide']
    },
    {
        name: 'Spectrum Field Services',
        url: 'https://spectrumfsi.com/',
        description: 'A national default field services company providing property preservation, inspection, and REO maintenance services.',
        tags: ['Default Services', 'Nationwide', 'REO']
    },
    {
        name: 'GSI Field Services',
        url: 'https://gisfieldservices.com/',
        description: 'Provides quick, reliable, and cost-effective property data collection and inspection services for the mortgage industry.',
        tags: ['Mortgage', 'Data Collection']
    },
    {
        name: 'Velocity REOs',
        url: 'https://bpophotoflow.com/',
        description: 'Focuses on BPO (Broker Price Opinion) photo flows and REO property inspections for real estate professionals.',
        tags: ['BPO', 'REO', 'Photography']
    },
    {
        name: 'Sand Castle Field Services',
        url: 'https://www.sandcastlefs.com/',
        description: 'Offers field inspection services primarily for the financial services industry, focusing on vehicle and property verifications.',
        tags: ['Financial Services', 'Vehicle', 'Property']
    },
    {
        name: 'JMI Reports',
        url: 'https://www.jmireports.com/',
        description: 'One of the nation\'s premier providers of insurance underwriting inspections and risk management services.',
        tags: ['Insurance', 'Underwriting', 'Risk Management']
    },
    {
        name: 'Virtual Site Inspections',
        url: 'https://virtualsiteinspections.com/',
        description: 'Specializes in providing high-quality photo and video inspection data for commercial and residential properties.',
        tags: ['Photo/Video', 'Commercial', 'Residential']
    },
    {
        name: 'PhotoInspection',
        url: 'https://photoinspection.com/',
        description: 'A specialized service connecting inspectors with clients needing rapid photo verification of properties and assets.',
        tags: ['Photo Verification', 'Assets']
    },
    {
        name: 'Land Gorilla',
        url: 'https://landgorilla.com/',
        description: 'A leading software and services provider for construction loan management, featuring a strong network of construction inspectors.',
        tags: ['Construction', 'Lending', 'Software']
    },
    {
        name: 'WeGoLook',
        url: 'https://www.wegolook.com/',
        description: 'Provides on-demand field services including automotive, property, and heavy equipment inspections using a gig-economy model.',
        tags: ['Gig-Economy', 'Automotive', 'Heavy Equipment']
    },
    {
        name: 'QuikTrak',
        url: 'https://quiktrak.com/',
        description: 'Global leader in agricultural, construction, and commercial equipment inspections and floor plan auditing.',
        tags: ['Equipment', 'Commercial', 'Auditing']
    },
    {
        name: 'JGM Property Group',
        url: 'https://jgmpropertygroup.com/',
        description: 'A regional facility maintenance and property preservation firm servicing both commercial and residential sectors.',
        tags: ['Property Preservation', 'Maintenance']
    },
    {
        name: 'Safeguard Properties',
        url: 'https://safeguardproperties.com/',
        description: 'The largest privately held field services company in the US, specializing in mortgage field services and property preservation.',
        tags: ['Mortgage', 'Property Preservation', 'Nationwide']
    },
    {
        name: 'ComplyTraq',
        url: 'https://www.complytraq.com/',
        description: 'Focuses on specialized credentialing and physical site inspections to ensure compliance with financial industry regulations.',
        tags: ['Compliance', 'Credentialing', 'Financial']
    },
    {
        name: 'TrendSource',
        url: 'https://trendsource.com/',
        description: 'Offers a wide variety of on-site inspection services, including I-9 verifications, physical site inspections, and retail audits.',
        tags: ['I-9 Verification', 'Retail Audits']
    },
    {
        name: 'Mueller Reports',
        url: 'https://www.muellerreports.com/',
        description: 'Provides time-critical data and risk assessment services to the insurance and lending industries.',
        tags: ['Insurance', 'Lending', 'Risk Assessment']
    }
];

const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'List of Top Field Inspection Companies',
    'description': 'A curated directory of field inspection companies, property preservation vendors, and mobile notary services.',
    'itemListElement': companies.map((company, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
            '@type': 'Organization',
            'name': company.name,
            'url': company.url,
            'description': company.description
        }
    }))
};

import { getCurrentUser } from '@/lib/auth-server'

export default async function FieldInspectionCompaniesPage() {
    const user = await getCurrentUser()
    const isAuthenticated = !!user

    const visibleCount = isAuthenticated ? companies.length : 3
    const visibleCompanies = companies.slice(0, visibleCount)
    const blurredCompanies = isAuthenticated ? [] : companies.slice(visibleCount, visibleCount + 3)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
            />
            <main className="bg-slate-50 py-16 sm:py-24 min-h-screen">
                <div className="mx-auto max-w-4xl px-4 sm:px-6">
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
                            List of Field Inspection Companies
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Looking for companies hiring field inspectors, property preservation contractors, or notaries? Here is our curated list of the top vendors across the industry.
                        </p>
                    </div>

                    {/* List Section */}
                    <div className="grid gap-6 relative pb-12">
                        {visibleCompanies.map((company, idx) => (
                            <div
                                key={company.name}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md hover:border-brand/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-semibold text-sm">
                                            {idx + 1}
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            {company.name}
                                        </h2>
                                    </div>
                                    <p className="text-slate-600 mb-4 sm:mb-2 ml-11">
                                        {company.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 ml-11">
                                        {company.tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand-dark">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="sm:text-right shrink-0 ml-11 sm:ml-0">
                                    <a
                                        href={company.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                    >
                                        Visit Website
                                        <svg className="ml-2 -mr-1 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        ))}

                        {!isAuthenticated && (
                            <>
                                {blurredCompanies.map((company, idx) => (
                                    <div
                                        key={`blurred-${company.name}`}
                                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 blur-[6px] opacity-60 select-none pointer-events-none"
                                        aria-hidden="true"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-semibold text-sm">
                                                    {visibleCount + idx + 1}
                                                </div>
                                                <h2 className="text-xl font-bold text-slate-900 bg-slate-200 text-transparent rounded w-48">
                                                    Hidden Company Name
                                                </h2>
                                            </div>
                                            <p className="text-slate-600 mb-4 sm:mb-2 ml-11 bg-slate-100 text-transparent rounded">
                                                {company.description}
                                            </p>
                                        </div>
                                        <div className="sm:text-right shrink-0 ml-11 sm:ml-0">
                                            <div className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-5 py-2.5 w-32 h-10"></div>
                                        </div>
                                    </div>
                                ))}

                                <div className="absolute bottom-0 left-0 right-0 h-[120%] bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent flex flex-col items-center justify-end pb-8 z-10 pointer-events-none">
                                    <div className="pointer-events-auto bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-brand/20 text-center max-w-lg mx-auto w-full -translate-y-8 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                                        <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Unlock the Full List</h3>
                                        <p className="text-slate-600 mb-8 font-medium leading-relaxed">
                                            Create a free account to instantly uncover <strong>{companies.length - visibleCount} more top-rated companies</strong> and access our entire field vendor network.
                                        </p>
                                        <a
                                            href="https://nested-objects.outseta.com/auth?widgetMode=register"
                                            className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-6 py-4 text-base font-bold text-white shadow hover:bg-emerald-400 transition-colors"
                                        >
                                            Create Free Account
                                        </a>
                                        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Takes less than 30 seconds</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Disclaimer */}
                    <div className="mt-8 text-sm text-slate-500 text-center px-4">
                        Note: This information is provided for educational purposes. We encourage individuals to conduct their own due diligence before engaging with any businesses mentioned.
                    </div>

                    {/* CTA Section (Only visible for logged in users, otherwise the gate handles CTA) */}
                    {isAuthenticated && (
                        <div className="mt-20 bg-brand-sand rounded-2xl border border-brand/20 p-8 sm:p-12 text-center shadow-sm">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                                Want access to our full directory?
                            </h2>
                            <p className="text-slate-600 mb-8 max-w-2xl mx-auto text-lg">
                                Stop guessing which companies are actually hiring. Nested Objects maintains the largest verified directory of active field inspections and notary vendors, complete with real contractor reviews and pay transparent data.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <a
                                    href="/hiring-firms"
                                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                                >
                                    Browse Full Directory
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
