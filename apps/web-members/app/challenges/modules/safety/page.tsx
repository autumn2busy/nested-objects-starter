'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function SafetyModulePage() {
    return (
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
            <header className="mb-8">
                <Link
                    href="/inspector-resource-center/challenges-safety"
                    className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block"
                >
                    ← Back to Training & Safety
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Hazard Spotting & PPE</h1>
                <p className="text-gray-600 mt-2">
                    Essential protocols for identifying risks before you step out of the vehicle.
                </p>
            </header>

            <Gate feature="training_safety">
                <section className="space-y-12">
                    {/* Hazard Assessment */}
                    <div className="bg-white rounded-xl p-8 border border-gray-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Pre-Inspection Hazard Check</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                    <h3 className="font-bold text-red-800 mb-2">Check the Roof Pitch</h3>
                                    <p className="text-sm text-red-700">
                                        If it looks steeper than 8/12, do not walk it without a rope and harness system. Use your pole cam or 4-point ladder inspection.
                                    </p>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                    <h3 className="font-bold text-orange-800 mb-2">Animal Hazards</h3>
                                    <p className="text-sm text-orange-700">
                                        Rattle gates before entering. Look for signs of &quot;Beware of Dog&quot; or worn dirt paths. Never enter if an unsecured dog is present.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <h3 className="font-bold text-yellow-800 mb-2">Structural Integrity</h3>
                                    <p className="text-sm text-yellow-700">
                                        Look for sagging rooflines or rotted decking. If the fascia board crumbles when you set your ladder, the roof is not safe to walk.
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <h3 className="font-bold text-blue-800 mb-2">Electrical Risks</h3>
                                    <p className="text-sm text-blue-700">
                                        Identify service mast location. Keep aluminum ladders at least 10ft away from overhead power lines.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PPE Gear List */}
                    <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Required Personal Protective Equipment (PPE)</h2>
                        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <li className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-2xl">🦺</span>
                                <div>
                                    <span className="font-bold block text-sm">High-Vis Vest</span>
                                    <span className="text-xs text-gray-500">ANSI Class 2 required for all roadside work.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-2xl">🥾</span>
                                <div>
                                    <span className="font-bold block text-sm">Non-Slip Boots</span>
                                    <span className="text-xs text-gray-500">Cougar Paws or aggressive tread suggested for roofs.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-2xl">👷</span>
                                <div>
                                    <span className="font-bold block text-sm">Hard Hat</span>
                                    <span className="text-xs text-gray-500">Required for all active construction sites and interior REO work.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-2xl">👓</span>
                                <div>
                                    <span className="font-bold block text-sm">Safety Glasses</span>
                                    <span className="text-xs text-gray-500">Z87+ rated. Wear when inspecting attics or crawlspaces.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-2xl">🔦</span>
                                <div>
                                    <span className="font-bold block text-sm">High-Lumen Flashlight</span>
                                    <span className="text-xs text-gray-500">Minimum 1000 lumens for spotting defects in dark basements.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-2xl">🧤</span>
                                <div>
                                    <span className="font-bold block text-sm">Work Gloves</span>
                                    <span className="text-xs text-gray-500">Protect against rusty nails, fiberglass insulation, and debris.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>
            </Gate>
        </main>
    )
}
