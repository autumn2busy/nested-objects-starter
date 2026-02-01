'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function FirmIntelPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <Link
            href="/resources"
            style={{
              fontSize: '0.9rem',
              textDecoration: 'none',
              color: '#4b5563',
              display: 'inline-block',
              marginBottom: '0.5rem',
            }}
          >
            ← Back to resources
          </Link>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
              color: '#0f172a',
            }}
          >
            Firm Intel Library
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Concise briefs on hiring signals, pay consistency, and equipment expectations.
          </p>
        </div>
        <nav
          style={{
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.9rem',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', color: '#111827' }}>
            Home
          </Link>
          <Link
            href="/directory"
            style={{ textDecoration: 'none', color: '#111827' }}
          >
            Directory
          </Link>
        </nav>
      </header>

      <Gate feature="firm_intel">
        <section className="space-y-8">
          {/* Hiring Signals */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Hiring Signals by Region</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Updated Mar 2025</span>
            </div>
            <p className="text-gray-600 mb-6">
              Current demand hotspots where firms are actively recruiting new vendors.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-1">Southeast (FL, GA, NC)</h3>
                <p className="text-sm text-slate-600">High demand for detailed roof inspections. Firms paying premium for 2-day turnaround.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-1">Midwest (OH, IL, MI)</h3>
                <p className="text-sm text-slate-600">Occupancy verification volume increasing. Good lane for gap-filling between larger jobs.</p>
              </div>
            </div>
          </div>

          {/* Pay Cadence */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Pay & Scheduling Notes</h2>
            <div className="prose prose-slate text-sm max-w-none text-slate-600">
              <p className="mb-4">
                Most national firms are moving to Net-30, but regional players often stick to Net-15 or bi-weekly.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Sandcastle Field Services:</strong> Consistently Net-30. Direct deposit only.</li>
                <li><strong>EquiVerify:</strong> Bi-weekly interactions. Requires dedicated invoicing portal use.</li>
                <li><strong>ProView Global:</strong> Fast pay (Net-7) for &quot;Rush&quot; orders, standard Net-30 otherwise.</li>
              </ul>
            </div>
          </div>

          {/* Equipment Expectations */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Equipment Requirements</h2>
            <p className="text-gray-600 mb-4">
              What you actually need versus what the &quot;requirements&quot; list says.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-brand-copper flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 block">30ft Pole Camera</span>
                  <span className="text-sm text-slate-600">Essential for 2-story steep roofs where walking is unsafe. Accepted by 90% of firms in lieu of walking.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-brand-copper flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 block">Laser Measure</span>
                  <span className="text-sm text-slate-600">Don&apos;t rely on tape. Speed up interior sketching by 50%.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Gate>
    </main>
  )
}
