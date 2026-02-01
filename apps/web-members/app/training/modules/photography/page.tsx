'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function PhotographyModulePage() {
    return (
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
            <header className="mb-8">
                <Link
                    href="/resources/training-safety"
                    className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block"
                >
                    ← Back to Training & Safety
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Photo Framing Standards</h1>
                <p className="text-gray-600 mt-2">
                    Avoid &quot;kickbacks&quot; by getting the shot right the first time.
                </p>
            </header>

            <Gate feature="training_safety">
                <section className="space-y-12">
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Address Verification */}
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <div className="h-48 bg-slate-200 flex items-center justify-center text-slate-400">
                                [Address Placard Example]
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Address Verification</h3>
                                <div className="space-y-2">
                                    <p className="text-sm text-emerald-700">
                                        <span className="font-bold">✅ Good:</span> Include the house number and a piece of the house (door or window) in the same frame to prove context.
                                    </p>
                                    <p className="text-sm text-red-700">
                                        <span className="font-bold">❌ Bad:</span> Zooming so tight on the numbers that you can&apos;t tell which house it belongs to.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Front Elevation */}
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <div className="h-48 bg-slate-200 flex items-center justify-center text-slate-400">
                                [Front View Example]
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Front Elevation</h3>
                                <div className="space-y-2">
                                    <p className="text-sm text-emerald-700">
                                        <span className="font-bold">✅ Good:</span> Step back to capture the ENTIRE roofline and ground simultaneously. Landscape mode.
                                    </p>
                                    <p className="text-sm text-red-700">
                                        <span className="font-bold">❌ Bad:</span> Cutting off the chimney or the driveway. Shooting in Portrait mode.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Damage Detail */}
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <div className="h-48 bg-slate-200 flex items-center justify-center text-slate-400">
                                [Damage Zoom Example]
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Damage Detail</h3>
                                <div className="space-y-2">
                                    <p className="text-sm text-emerald-700">
                                        <span className="font-bold">✅ Good:</span> Use a reference object (tape measure or finger) for scale. Follow up with a &quot;zoom out&quot; shot to show location.
                                    </p>
                                    <p className="text-sm text-red-700">
                                        <span className="font-bold">❌ Bad:</span> Extreme close-up of a water stain with no context of where it is in the room.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Wide Angle Interiors */}
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <div className="h-48 bg-slate-200 flex items-center justify-center text-slate-400">
                                [Room Corner Example]
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Interior Rooms</h3>
                                <div className="space-y-2">
                                    <p className="text-sm text-emerald-700">
                                        <span className="font-bold">✅ Good:</span> Stand in one corner and shoot across to the opposite corner to maximize depth.
                                    </p>
                                    <p className="text-sm text-red-700">
                                        <span className="font-bold">❌ Bad:</span> Standing in the center of the room and spinning around.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Gate>
        </main>
    )
}
