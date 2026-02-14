'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { FirmsPreview } from './FirmsPreview'

interface RolePageLayoutProps {
    roleTitle: string
    heroHeadline: React.ReactNode
    heroSubhead: string
    benefits: { title: string; desc: string }[]
    children?: React.ReactNode
}

export function RolePageLayout({
    roleTitle,
    heroHeadline,
    heroSubhead,
    benefits,
    children
}: RolePageLayoutProps) {
    return (
        <main className="bg-brand-background min-h-screen">
            {/* 1. Tech Hero Section */}
            <section className="relative overflow-hidden bg-slate-950 pt-20 pb-20 lg:pt-32">
                <div className="absolute inset-0 opacity-[0.1]"
                    style={{ backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>

                <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 backdrop-blur-md mb-6">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        FOR {roleTitle.toUpperCase()}
                    </div>

                    <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
                        {heroHeadline}
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg text-slate-400 mb-10 leading-relaxed">
                        {heroSubhead}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/membership-pricing"
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-8 py-3 text-base font-semibold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all"
                        >
                            Start Searching Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                        <Link
                            href="/hiring-firms"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 px-8 py-3 text-base font-semibold text-white hover:bg-slate-800 transition-all"
                        >
                            Browse Directory
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. Value Prop Grid */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Why add Inspections to your workflow?</h2>
                        <p className="text-slate-600 text-lg">You are already mobile and verified. Field inspections are the perfect &quot;gap filler&quot; between your primary appointments.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {benefits.map((benefit, i) => (
                            <div key={i} className="p-6 rounded-xl border border-slate-200 bg-slate-50 hover:border-emerald-500/50 transition-colors">
                                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4 text-emerald-700">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Directory Preview */}
            <section className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Firms hiring now</h2>
                            <p className="text-slate-600 mt-2">A live look at who is looking for {roleTitle}s.</p>
                        </div>
                        <Link href="/hiring-firms" className="text-emerald-700 font-semibold hover:underline">
                            View all 200+ Firms →
                        </Link>
                    </div>

                    <FirmsPreview />
                </div>
            </section>

            {/* 4. Custom Content Injection */}
            {children}

            {/* 5. Final CTA */}
            <section className="py-24 bg-slate-900 text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to fill your schedule?</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto mb-8">
                        Join thousands of {roleTitle.toLowerCase()}s using Nested Objects to find direct-contract work with no middleman fees.
                    </p>
                    <Link
                        href="/membership-pricing"
                        className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-bold text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                        Get Started Free
                    </Link>
                </div>
            </section>
        </main>
    )
}
