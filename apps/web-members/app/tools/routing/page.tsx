'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function RoutingToolPage() {
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
            href="/tools"
            style={{
              fontSize: '0.9rem',
              textDecoration: 'none',
              color: '#4b5563',
              display: 'inline-block',
              marginBottom: '0.5rem',
            }}
          >
            ← Back to tools
          </Link>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Route planning and optimization
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Stack your inspections into efficient routes so you burn less gas and make more per mile.
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

      <Gate feature="job_routing">
        <section>
          <p style={{ color: '#374151', marginBottom: '1rem' }}>
            This is where your routing tool will live. Right now it is a placeholder route that lets
            Google and your members know Nested Objects will help with route planning, not just finding work.
          </p>
          <ul
            style={{
              listStyle: 'disc',
              paddingLeft: '1.25rem',
              fontSize: '0.95rem',
            }}
          >
            <li>Start with simple stop lists by date, city, and vendor.</li>
            <li>Later. export routes to your preferred maps app or navigation tool.</li>
            <li>Eventually. combine with weather and auto assigned jobs for real route optimization.</li>
          </ul>
        </section>
      </Gate>
    </main>
  )
}
