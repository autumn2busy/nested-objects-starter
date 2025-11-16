'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function JobTrackingPage() {
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
            Job tracking tool
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Track inspections, due dates, pay, and status in one place so nothing slips through.
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

      <Gate feature="job_tracking">
        <section>
          <p style={{ color: '#374151', marginBottom: '1rem' }}>
            This is where your job tracking tool will live. For now, consider this a placeholder
            so routing and SEO can see it.
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.95rem' }}>
            <li>Log inspections by firm, work type, pay, and due date.</li>
            <li>Track status. assigned, in progress, submitted, paid.</li>
            <li>Later. visualize your routes and revenue over time.</li>
          </ul>
        </section>
      </Gate>
    </main>
  )
}
