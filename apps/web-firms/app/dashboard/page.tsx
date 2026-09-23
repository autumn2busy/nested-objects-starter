import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Firm Dashboard Not Launched',
  description: 'The Nested Objects hiring-firm dashboard is not an operational product.',
  robots: { index: false, follow: false },
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-brand-sand px-4 py-20 sm:px-6">
      <section className="b2b-card mx-auto max-w-3xl p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light">
          <BarChart3 className="h-7 w-7 text-brand" aria-hidden />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand">Product status</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">The firm dashboard is not launched.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
          This page does not display firm accounts, inspector records, job activity, turnaround, completion, or performance
          metrics. Marketplace software will not be built or presented as live until paid demand, consented supply, and
          owner-assisted fulfillment have been validated.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
        >
          See the bounded pilot <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </main>
  )
}
