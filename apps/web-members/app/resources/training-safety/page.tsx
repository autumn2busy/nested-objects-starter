'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function TrainingSafetyPage() {
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
                        }}
                    >
                        Training & Safety
                    </h1>
                    <p
                        style={{
                            marginTop: '0.4rem',
                            fontSize: '0.95rem',
                            color: '#6b7280',
                        }}
                    >
                        Practical refreshers and safety protocols for daily field work.
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
                        href="/training"
                        style={{ textDecoration: 'none', color: '#111827', fontWeight: 600 }}
                    >
                        Go to Training Portal
                    </Link>
                </nav>
            </header>

            <Gate feature="training_safety">
                <section className="space-y-8">
                    <div className="prose prose-slate max-w-none">
                        <h3>Quick Reference Safety Guides</h3>
                        <p>
                            These guides are designed for quick review before handling hazardous situations or entering difficult properties.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Hazard Spotting and PPE</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Identifying common site hazards like steep pitches, aggressive animals, and structural damage.
                            </p>
                            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-4">
                                <li>Roof pitch assessment guide</li>
                                <li>Dog safety protocols</li>
                                <li>Mold and Asbestos awareness</li>
                            </ul>
                            <Link href="/training/modules/safety" className="text-sm font-semibold text-brand-copper hover:underline">
                                Start safety module →
                            </Link>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Route Planning Walkthroughs</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Video guides on how to efficiently structure your day to minimize drive time.
                            </p>
                            <Link href="/training/modules/logistics" className="text-sm font-semibold text-brand-copper hover:underline">
                                Watch walkthroughs →
                            </Link>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Photo Framing Tips</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Visual examples of &quot;Good vs. Bad&quot; photos for adjusters.
                            </p>
                            <Link href="/training/modules/photography" className="text-sm font-semibold text-brand-copper hover:underline">
                                View gallery →
                            </Link>
                        </div>
                    </div>

                </section>
            </Gate>
        </main>
    )
}
