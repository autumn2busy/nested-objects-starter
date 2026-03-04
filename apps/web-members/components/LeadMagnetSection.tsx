'use client'

import { BookOpen, CheckCircle, Download } from 'lucide-react'
import { PLAN_UIDS } from '@/lib/plan-config'

export function LeadMagnetSection() {
    const handleDownloadClick = () => {
        if (typeof window !== 'undefined' && (window as any).Outseta?.auth?.open) {
            (window as any).Outseta.auth.open({
                widgetMode: 'register',
                planUid: PLAN_UIDS.FREE,
                planPaymentTerm: 'month',
                skipPlanOptions: true,
            })
        } else {
            window.location.href = `https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${PLAN_UIDS.FREE}`
        }
    }

    return (
        <section className="relative overflow-hidden bg-brand-background border-b border-slate-200 py-16 sm:py-24">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
            <div className="absolute -left-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-brand-copper/10 blur-3xl sm:-left-20" />
            <div className="absolute -right-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl sm:-right-20" />

            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-12 lg:p-16">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

                        {/* Left: Copy & CTA */}
                        <div className="max-w-xl">
                            <div className="flex items-center gap-2 text-brand-copper mb-4">
                                <BookOpen className="h-5 w-5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Free Download</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                The 2026 Field Inspector Starter Kit.
                            </h2>
                            <p className="mt-4 text-lg text-slate-600">
                                Stop guessing how to start. We compiled exactly what you need to go from an empty schedule to your first paying route.
                            </p>

                            <ul className="mt-8 space-y-4 text-sm text-slate-700 font-medium">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                                    <span><strong>Gear & App Checklist:</strong> Avoid buying the wrong tools. Know exactly what apps, measuring sticks, and cameras you need.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                                    <span><strong>Average Pay Guide:</strong> Stop accepting low-ball orders. See standard payout rates for drive-bys, property preservation, and commercial jobs.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                                    <span><strong>Red Flags Cheat Sheet:</strong> Learn to spot bad contractors before you do the work so you actually get paid on time.</span>
                                </li>
                            </ul>

                            <div className="mt-10">
                                <button
                                    onClick={handleDownloadClick}
                                    className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800 sm:w-auto shadow-lg shadow-slate-900/20"
                                >
                                    <Download className="h-5 w-5 transition group-hover:-translate-y-0.5" />
                                    Create Free Account to Download
                                </button>
                                <p className="mt-3 text-xs text-slate-500 sm:text-center lg:text-left">
                                    Includes full access to the Free Tier firm directory and resource center.
                                </p>
                            </div>
                        </div>

                        {/* Right: Visual */}
                        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
                            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 shadow-inner relative flex items-center justify-center">

                                {/* Abstract Book/Document Graphics */}
                                <div className="absolute inset-0 opacity-20 bg-[url('/grid.svg')]" />
                                <div className="relative z-10 w-3/4 aspect-[8.5/11] bg-white rounded-lg shadow-2xl border border-slate-200 transform -rotate-3 transition-transform hover:rotate-0 flex flex-col p-6">
                                    {/* Document Header */}
                                    <div className="w-12 h-1 bg-brand-copper/40 rounded-full mb-4" />
                                    <div className="w-3/4 h-4 bg-slate-200 rounded-md mb-2" />
                                    <div className="w-1/2 h-4 bg-slate-200 rounded-md mb-8" />

                                    {/* Document Content Skeleton */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded bg-emerald-100" />
                                            <div className="h-2 w-full bg-slate-100 rounded-full" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded bg-amber-100" />
                                            <div className="h-2 w-5/6 bg-slate-100 rounded-full" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded bg-brand-copper/20" />
                                            <div className="h-2 w-4/6 bg-slate-100 rounded-full" />
                                        </div>
                                    </div>

                                    <div className="mt-auto self-end">
                                        <div className="px-3 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-400">PDF REPORT</div>
                                    </div>
                                </div>

                                {/* Second background page for depth */}
                                <div className="absolute z-0 w-3/4 aspect-[8.5/11] bg-slate-50 rounded-lg shadow-xl border border-slate-200 transform rotate-3" />
                            </div>

                            {/* Floating badges */}
                            <div className="absolute -left-6 top-12 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-lg">
                                <span className="text-xl">🛠️</span>
                                <span className="text-xs font-bold text-slate-700">Essential Tools</span>
                            </div>
                            <div className="absolute -right-6 bottom-20 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-lg">
                                <span className="text-xl">💰</span>
                                <span className="text-xs font-bold text-slate-700">Pay Rates</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    )
}
