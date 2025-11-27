'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function JobsPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      {/* Header with back link and nav */}
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
            href="/dashboard"
            style={{
              fontSize: '0.9rem',
              textDecoration: 'none',
              color: '#4b5563',
              display: 'inline-block',
              marginBottom: '0.5rem',
            }}
          >
            ← Back to dashboard
          </Link>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Weekly field inspection job board
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Fresh opportunities for mortgage field inspections, occupancy checks, and property data collection.
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
            href="/dashboard"
            style={{ textDecoration: 'none', color: '#111827' }}
          >
            Dashboard
          </Link>
          <Link
            href="/directory"
            style={{ textDecoration: 'none', color: '#111827' }}
          >
            Directory
          </Link>
          <Link
            href="/membership"
            style={{ textDecoration: 'none', color: '#111827' }}
          >
            Membership
          </Link>
        </nav>
      </header>

        <Gate feature="job_board">
          {/* Placeholder content for now */}
          <section>
            <p style={{ marginBottom: '1rem' }}>
              This is where your weekly job board will live. In the next phase we will connect this
              to a Supabase table of jobs and optionally external feeds like Indeed or vendor APIs.
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.95rem' }}>
              <li>Show new jobs for the last 7 days first.</li>
              <li>Tag jobs by type: mortgage inspection, PDC, notary, REO, or BPO.</li>
              <li>Later, filter by state, pay range, and vendor.</li>
            </ul>
          </section>
        </Gate>
      </main>
  )
}
