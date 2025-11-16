'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function AiResumePage() {
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
            AI powered inspector resume builder
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Turn your experience, routes, and gear into a clean resume tailored for field service firms.
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

      <Gate feature="ai_resume">
        <section>
          <p style={{ marginBottom: '1rem' }}>
            Here you will eventually add a form that collects your regions, experience, tools, and
            preferred work types, then sends that to an AI backend to generate a ready to use resume.
          </p>
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            Phase one can be a simple form that produces a text resume your members can paste into
            Word or Google Docs.
          </p>
        </section>
      </Gate>
    </main>
  )
}
