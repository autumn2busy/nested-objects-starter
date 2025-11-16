'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function WeatherToolPage() {
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
            Field inspection weather tool
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Check weather along your routes so you can plan drive time, ladder work, and photo quality.
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

      <Gate feature="weather_tool">
        <section>
          <p style={{ color: '#374151', marginBottom: '1rem' }}>
            This is where your weather tool will live. For now, consider it a placeholder so routing
            and SEO can see that Nested Objects helps inspectors plan around storms and daylight.
          </p>
          <ul
            style={{
              listStyle: 'disc',
              paddingLeft: '1.25rem',
              fontSize: '0.95rem',
            }}
          >
            <li>Lookup weather by city, zip, or latitude and longitude for your inspection routes.</li>
            <li>Flag days that are risky for roof shots, ladders, or long rural drives.</li>
            <li>Later. combine this with your routing tool so you can reorder stops based on weather windows.</li>
          </ul>
        </section>
      </Gate>
    </main>
  )
}
