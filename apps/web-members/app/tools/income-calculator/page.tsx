'use client'

import Link from 'next/link'
import IncomeCalculator from '@/components/training/IncomeCalculator'

export default function IncomeCalculatorPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <div className="bg-slate-900 border-b border-slate-800 py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <Link href="/tools" className="text-sm font-semibold text-emerald-400 mb-4 hover:underline">
                        ← Back to Tools
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">Income Calculator</h1>
                    <p className="mt-3 max-w-2xl text-lg text-slate-400">
                        Visualize your potential earnings in field services compared to gig work. Adjust the variables to match your availability.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                <IncomeCalculator />
            </div>
        </main>
    )
}
