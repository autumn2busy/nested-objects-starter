'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Gate } from '@/components/Gate'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Firm {
  id: string
  name: string
  niche?: string
  website?: string
  phone?: string
  email?: string
  location?: string
  pay_range?: string
  requirements?: string
  notes?: string
  created_at: string
  updated_at: string
}

export default function DirectoryPage() {
  const [firms, setFirms] = useState<Firm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFirms = async () => {
      try {
        setLoading(true)
        // This query only succeeds if the user is authenticated,
        // thanks to our RLS policy in Supabase.
        const { data, error } = await supabase
          .from('firms')
          .select('*') // Select all columns
          .order('name', { ascending: true })

        if (error) throw error

        setFirms(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    // We can fetch immediately. The <Gate> component will handle
    // the auth check, and RLS will protect the data.
    fetchFirms()
  }, [])

  return (
    <main style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Top navigation and back link */}
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
            Firm directory
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Explore firms hiring field inspectors, notaries, and real estate pros.
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

      {/* Auth + entitlements gate */}
      <Gate feature="directory_access">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          Welcome, valued member. here is the directory.
        </h2>

        {loading && <p>Loading firms...</p>}
        {error && <p style={{ color: 'red' }}>Error. {error}</p>}

        {firms.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {firms.map((firm) => (
              <li
                key={firm.id}
                style={{
                  margin: '1.5rem 0',
                  padding: '1rem 1.25rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 10px 15px rgba(15,23,42,0.03)',
                }}
              >
                <strong style={{ fontSize: '1.1rem' }}>{firm.name}</strong>
                {firm.niche && (
                  <span
                    style={{
                      marginLeft: '10px',
                      background: '#eef2ff',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      color: '#4f46e5',
                    }}
                  >
                    {firm.niche}
                  </span>
                )}

                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {firm.location && (
                    <p style={{ margin: '0.15rem 0' }}>
                      <strong>Location.</strong> {firm.location}
                    </p>
                  )}
                  {firm.pay_range && (
                    <p style={{ margin: '0.15rem 0' }}>
                      <strong>Pay range.</strong> {firm.pay_range}
                    </p>
                  )}
                  {firm.phone && (
                    <p style={{ margin: '0.15rem 0' }}>
                      <strong>Phone.</strong> {firm.phone}
                    </p>
                  )}
                  {firm.email && (
                    <p style={{ margin: '0.15rem 0' }}>
                      <strong>Email.</strong> {firm.email}
                    </p>
                  )}
                  {firm.website && (
                    <p style={{ margin: '0.35rem 0 0' }}>
                      <a
                        href={firm.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#3b82f6',
                          textDecoration: 'underline',
                        }}
                      >
                        Visit website
                      </a>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && firms.length === 0 && (
          <p>No firms found in the directory yet.</p>
        )}
      </Gate>
    </main>
  )
}
