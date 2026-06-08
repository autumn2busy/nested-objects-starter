import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { generatePageMetadata } from '@/lib/seo'
import { NotaryRouteCalculator } from './NotaryRouteCalculator'

export const metadata: Metadata = generatePageMetadata({
  title: 'Notary Route Income Calculator',
  description:
    'Estimate mobile notary route profit after printing, scan-backs, mileage, drive time, cancellations, and nearby inspection add-ons.',
  path: '/tools/notary-route-calculator',
})

export default function NotaryRouteCalculatorPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm font-semibold text-brand-copper hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to tools
          </Link>
          <div className="mt-5 max-w-3xl">
            <p className="text-xs font-semibold uppercase text-brand-copper">Mobile notary route math</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Notary Route Income Calculator</h1>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Estimate net pay after printing, scan-backs, mileage, drive time, cancellations, and nearby field-service add-ons.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <NotaryRouteCalculator />
      </section>
    </main>
  )
}
