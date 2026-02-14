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
            href="/inspector-resource-center"
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
            href="/hiring-firms"
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
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Updated Feb 2026</span>
            </div>
            <p className="text-gray-600 mb-6">
              Current demand hotspots where firms are actively recruiting new vendors.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-1">Bureau Veritas (Texas & Remote)</h3>
                <p className="text-sm text-slate-600">High demand for Petroleum and construction inspectors in TX ($21-$35/hr). Remote building inspector roles also trending ($60+/hr).</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-1">Safeguard Properties (National)</h3>
                <p className="text-sm text-slate-600">Actively recruiting mobile notaries and preservation crews for seasonal grass/snow maintenance. Elite Contractor Network expansion.</p>
              </div>
            </div>
          </div>

          {/* Pay Cadence */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Pay & Scheduling Notes</h2>
            <div className="prose prose-slate text-sm max-w-none text-slate-600">
              <p className="mb-4">
                Field service pay varies significantly by role and payment structure (hourly vs. by-the-job).
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Safeguard Properties:</strong> vendors average ~$46k/yr. Invoice via &quot;Vendor Web&quot; portal.</li>
                <li><strong>Bureau Veritas:</strong> Specialized roles (Electrical/Instrumentation) pay premium ($48-$57/hr). General inspections ~$30/hr.</li>
                <li><strong>Best Choice Roofing:</strong> Subcontractors paid &quot;by the job&quot; (piece rate). High volume potential ($100k+) for equipped crews.</li>
              </ul>
            </div>
          </div>

          {/* Equipment Expectations */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Equipment Requirements</h2>
            <p className="text-gray-600 mb-4">
              What you actually need to get the job done for these firms.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-brand-copper flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 block">Mobile Tech (Safeguard)</span>
                  <span className="text-sm text-slate-600">Must run &quot;SafeView Preserve&quot; app (iOS/Android). Digital camera backup often required.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-brand-copper flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 block">NDT & Safety Gear (Bureau Veritas)</span>
                  <span className="text-sm text-slate-600">Specialized NDT tools (Ultrasonic, Radiographic) plus standard PPE for industrial sites.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-brand-copper flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 block">Installation Crew Tools (Best Choice)</span>
                  <span className="text-sm text-slate-600">Vendor supplied: Nail guns, compressor, OSHA-compliant scaffolding/ladders, and transport.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Gate>
    </main>
  )
}
