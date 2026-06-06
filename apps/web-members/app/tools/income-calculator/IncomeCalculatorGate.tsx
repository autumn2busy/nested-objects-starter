'use client'

import dynamic from 'next/dynamic'

import { Gate } from '@/components/Gate'

const IncomeCalculator = dynamic(() => import('@/components/training/IncomeCalculator'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-2xl rounded-2xl border border-brand-steel/40 bg-white/90 p-8 text-center shadow-brand-card">
      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-copper border-t-transparent" aria-hidden />
      <p className="mt-4 text-sm font-semibold text-brand-dark">Loading calculator...</p>
    </div>
  ),
})

export function IncomeCalculatorGate() {
  return (
    <Gate>
      <IncomeCalculator />
    </Gate>
  )
}
