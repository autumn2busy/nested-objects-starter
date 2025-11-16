'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function SponsorEquipmentPage() {
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
            Recommended gear and sponsor partners
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Ladders, cameras, tablets, and safety gear vetted for mortgage field and PDC work.
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

      <Gate feature="sponsor_equipment_links">
        <section>
          <p style={{ marginBottom: '1rem' }}>
            This page will hold sponsor cards with links to recommended inspection gear, along with
            notes about why each item works well in the field.
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.95rem' }}>
            <li>Feature core gear lists for new inspectors.</li>
            <li>Highlight premium setups for heavy route runners.</li>
            <li>Attach affiliate links or sponsor tracking where appropriate.</li>
          </ul>
        </section>
      </Gate>
    </main>
  )
}
