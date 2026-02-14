'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function ReadinessGuidesPage() {
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
                        href="/inspector-resource-center"
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
                        }}
                    >
                        Route readiness guides
                    </h1>
                    <p
                        style={{
                            marginTop: '0.4rem',
                            fontSize: '0.95rem',
                            color: '#6b7280',
                        }}
                    >
                        Step-by-step checklists to ensure you are prepped for inspections, lender requirements, and safe load-outs.
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
                        href="/inspector-dashboard"
                        style={{ textDecoration: 'none', color: '#111827' }}
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/hiring-firms"
                        style={{ textDecoration: 'none', color: '#111827' }}
                    >
                        Directory
                    </Link>
                </nav>
            </header>

            <Gate feature="readiness_guides">
                <section className="space-y-8">
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <h2 className="text-xl font-bold mb-4">Load-out and safety checks</h2>
                        <p className="text-gray-600 mb-4">
                            Before you leave the driveway, ensure your vehicle and gear are ready for the day&apos;s route.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li>Vehicle inspection checklist (Tires, Fluids, Fuel)</li>
                            <li>Ladder rack security check</li>
                            <li>PPE Inventory (Boots, Vest, Hard Hat, Pitch Gauge)</li>
                            <li>Device battery check and charger availability</li>
                        </ul>
                        <div className="mt-4">
                            <button className="text-sm font-semibold text-brand-copper hover:underline">Download Checklist (PDF) →</button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <h2 className="text-xl font-bold mb-4">Pre-call scripts and templates</h2>
                        <p className="text-gray-600 mb-4">
                            Professional scripts for confirming appointments and setting expectations with property contacts.
                        </p>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold text-sm mb-2">Standard Confirmation Text</h3>
                                <p className="font-mono text-xs text-gray-800 bg-white p-2 border rounded">
                                    &quot;Hi [Name], this is [Your Name] regarding the inspection at [Address]. I&apos;m scheduled to arrive between [Time Window]. Please reply C to confirm or let me know if we need to reschedule.&quot;
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold text-sm mb-2">Voicemail Script</h3>
                                <p className="font-mono text-xs text-gray-800 bg-white p-2 border rounded">
                                    &quot;Hello, I am calling for [Name] regarding a required property inspection at [Address]. My name is [Your Name]. Please call me back at [Number] to confirm access details. Thank you.&quot;
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <h2 className="text-xl font-bold mb-4">Turnaround and upload standards</h2>
                        <p className="text-gray-600 mb-4">
                            General guidelines for submitting reports to major firms to minimize kickbacks.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li>Photo labeling conventions (Front, Left, Rear, Right)</li>
                            <li>Caption requirements for damage photos</li>
                            <li>Upload timing expectations (same-day vs. 24-hour)</li>
                        </ul>
                    </div>
                </section>
            </Gate>
        </main>
    )
}
