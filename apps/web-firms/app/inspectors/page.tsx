import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Inspector Privacy Boundary',
  description: 'Nested Objects does not publish a hiring-firm-facing inspector directory.',
  robots: { index: false, follow: false },
}

export default function InspectorsPage() {
  return (
    <main className="min-h-screen bg-brand-sand px-4 py-20 sm:px-6">
      <section className="b2b-card mx-auto max-w-3xl p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light">
          <LockKeyhole className="h-7 w-7 text-brand" aria-hidden />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand">Private by design</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">There is no public inspector directory.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Nested Objects does not expose member names, profiles, contact details, service areas, background-check status,
          availability, ratings, or job history to hiring firms. The current firm-side work is a bounded owner-assisted pilot.
        </p>
        <div className="mx-auto mt-7 flex max-w-2xl gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-left">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <p className="text-sm leading-6 text-slate-700">
            Any future introduction requires a real business need, fit review, and affirmative consent from the specific
            inspector. Nested Objects does not guarantee placement, availability, performance, or earnings.
          </p>
        </div>
        <Link
          href="/post-a-job"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
        >
          Review the pilot brief <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </main>
  )
}
