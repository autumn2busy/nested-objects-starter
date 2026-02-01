'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function LogisticsModulePage() {
    return (
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
            <header className="mb-8">
                <Link
                    href="/resources/training-safety"
                    className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block"
                >
                    ← Back to Training & Safety
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Route Planning & Logistics</h1>
                <p className="text-gray-600 mt-2">
                    Maximize your hourly rate by minimizing windshield time.
                </p>
            </header>

            <Gate feature="training_safety">
                <section className="space-y-12">
                    {/* Strategy Guide */}
                    <div className="bg-white rounded-xl p-8 border border-gray-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">The &quot;Cluster&quot; Strategy</h2>
                        <div className="prose prose-slate max-w-none text-slate-700">
                            <p>
                                Never route your day in a straight line or a wide circle. Instead, build <strong>clusters</strong>. A cluster is a group of 3-5 inspections within a 5-mile radius.
                            </p>
                            <ul>
                                <li><strong>Step 1:</strong> Identify your &quot;Anchor&quot; job—the one with the strictest deadline or appointment time.</li>
                                <li><strong>Step 2:</strong> Find all other orders within 15 minutes of that anchor.</li>
                                <li><strong>Step 3:</strong> Schedule that entire cluster for the morning block (8am - 12pm).</li>
                                <li><strong>Step 4:</strong> Move to the next cluster for the afternoon.</li>
                            </ul>
                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mt-4">
                                <span className="font-bold text-blue-900">Pro Tip:</span> If a single outlying job adds more than 45 minutes of drive time, decline it or request a rush fee. It kills your hourly profitability.
                            </div>
                        </div>
                    </div>

                    {/* Time Blocking Template */}
                    <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Sample Time-Blocked Day</h2>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="min-w-[120px] font-mono text-sm font-bold text-slate-500">07:30 - 08:00</div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Pre-Route Prep</h3>
                                    <p className="text-sm text-gray-600">Check traffic, sync offline maps, verify battery levels on all cameras. Load the car.</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="min-w-[120px] font-mono text-sm font-bold text-slate-500">08:00 - 11:30</div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Cluster A (Primary Zone)</h3>
                                    <p className="text-sm text-gray-600">Execute 4-6 exterior inspections. No breaks. High tempo.</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="min-w-[120px] font-mono text-sm font-bold text-slate-500">11:30 - 12:00</div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Data Sync & Lunch</h3>
                                    <p className="text-sm text-gray-600">Find good signal. Upload Cluster A photos while eating. Clear errors immediately.</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="min-w-[120px] font-mono text-sm font-bold text-slate-500">12:30 - 15:00</div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Cluster B (Secondary Zone)</h3>
                                    <p className="text-sm text-gray-600">Execute appointments or remaining drive-bys on the way back home.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Gate>
        </main>
    )
}
