'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function BasicTrainingPage() {
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
            Basic field inspection training track
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Step by step path from zero to your first completed field inspections.
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

      <Gate feature="basic_training">
        <section>
          <p style={{ marginBottom: '1rem' }}>
            This page will host your basic course modules. For now, think of it as the syllabus.
          </p>
          <ol style={{ paddingLeft: '1.25rem', fontSize: '0.95rem' }}>
            <li>Intro to mortgage field services and inspection types.</li>
            <li>Gear checklist and photo standards.</li>
            <li>How to complete your first occupancy and loss draft inspections.</li>
            <li>How to submit reports that keep you on the preferred list.</li>
          </ol>
        </section>
      </Gate>
    </main>
  )
}
