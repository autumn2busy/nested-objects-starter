'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function ToolsTemplatesPage() {
    return (
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    marginBottom: '1.75rem',
                }}
            >
                <div>
                    <Link
                        href="/resources"
                        style={{
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            color: '#4b5563',
                            display: 'inline-block',
                            marginBottom: '0.5rem',
                        }}
                    >
                        ← Back to resources
                    </Link>
                    <h1
                        style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            margin: 0,
                            color: '#0f172a',
                        }}
                    >
                        Tools & Templates
                    </h1>
                    <p
                        style={{
                            marginTop: '0.4rem',
                            fontSize: '0.95rem',
                            color: '#6b7280',
                        }}
                    >
                        Downloadable assets to speed up your routing, reporting, and disputes.
                    </p>
                </div>
                <nav
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        fontSize: '0.9rem',
                        flexWrap: 'wrap',
                    }}
                >
                    <Link href="/" style={{ textDecoration: 'none', color: '#111827' }}>
                        Home
                    </Link>
                    <Link
                        href="/dashboard"
                        style={{ textDecoration: 'none', color: '#111827' }}
                    >
                        Dashboard
                    </Link>
                </nav>
            </header>

            <Gate feature="tools_templates">
                <section className="space-y-8">
                    {/* Downloads Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Job Packet Builder */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Job Packet Builder</h2>
                            <p className="text-sm text-gray-600 mb-4 flex-grow">
                                A checklist and folder structure template to keep every order organized from assignment to payment.
                            </p>
                            <button className="text-sm font-semibold text-brand-copper border border-brand-copper/30 rounded-lg py-2 hover:bg-brand-mist transition">
                                Download ZIP Template
                            </button>
                        </div>

                        {/* Route ROI Worksheet */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Route ROI Calculator</h2>
                            <p className="text-sm text-gray-600 mb-4 flex-grow">
                                Excel sheet to calculate your true profit per mile after gas, wear-and-tear, and taxes.
                            </p>
                            <button className="text-sm font-semibold text-brand-copper border border-brand-copper/30 rounded-lg py-2 hover:bg-brand-mist transition">
                                Download Excel Sheet
                            </button>
                        </div>
                    </div>

                    {/* AI Prompts */}
                    <div className="rounded-xl border border-gray-200 bg-slate-900 text-slate-50 p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">AI Prompt Library</h2>
                            <span className="bg-brand-copper text-white text-xs font-bold px-2 py-1 rounded">PRO</span>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-brand-copper mb-2">Dispute a Rejection</h3>
                                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 font-mono text-xs text-slate-300">
                                    &quot;Write a professional email to a vendor manager disputing a &apos;kickback&apos; for [Missing Photo]. Explain that the property was inaccessible due to [Reason] and reference the time-stamped photo included in the original report at [Time].&quot;
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-brand-copper mb-2">Ask for More Zones</h3>
                                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 font-mono text-xs text-slate-300">
                                    &quot;Draft a message to [Firm Name] inquiring about open coverage in [County Name]. Mention my 98% on-time score and readiness to take on rush orders in that area.&quot;
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Gate>
        </main>
    )
}
