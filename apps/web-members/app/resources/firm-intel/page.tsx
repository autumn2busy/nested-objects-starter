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
            Firm intel and vendor breakdowns
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Pay ranges, requirements, and real world insights on mortgage field service firms.
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

      <Gate feature="firm_intel">
        <section>
          <p style={{ marginBottom: '1rem' }}>
            This is where you will show deep dives for firms like Safeguard, MCS, MSI, Xome, and others.
            Pay bands, expectations, and how to stay on their preferred lists.
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.95rem' }}>
            <li>Start with manual writeups stored in Supabase.</li>
            <li>Later let AI summarize public reviews and contracts for members.</li>
            <li>Link each intel card back to firms in your directory.</li>
          </ul>
        </section>
      </Gate>
    </main>
  )
}
