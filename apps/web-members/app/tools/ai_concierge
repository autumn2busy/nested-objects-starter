'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'

export default function AiChatbotPage() {
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
            AI field services concierge
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Ask questions about firms, requirements, and inspection workflows in plain language.
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

      <Gate feature="ai_concierge">
        <section>
          <p style={{ marginBottom: '1rem' }}>
            The AI concierge will sit here. Phase one can be a simple chat surface wired to your
            curated knowledge base about firms, inspection types, and pay ranges.
          </p>
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            For now this is a placeholder. once we are ready we will plug the chat UI and backend
            in without changing the route or gating logic.
          </p>
        </section>
      </Gate>
    </main>
  )
}
