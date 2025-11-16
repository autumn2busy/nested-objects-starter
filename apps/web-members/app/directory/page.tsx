'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

type Firm = {
  id: string
  name: string
  url: string | null
  geographic_coverage: string | null
  categories: any
  pay_min: number | null
  pay_max: number | null
  pay_type: string | null
  company_size: string | null
  industry_focus: string | null
  is_published?: boolean | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function DirectoryPage() {
  const { isAuthenticated, isLoading, planUid } = useAuth()

  const [firms, setFirms] = useState<Firm[]>([])
  const [loadingFirms, setLoadingFirms] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFirms() {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Missing Supabase env vars')
        setError('Directory is temporarily unavailable.')
        setLoadingFirms(false)
        return
      }

      try {
        // Only pull published firms so incomplete rows stay hidden
        const url =
          `${SUPABASE_URL}/rest/v1/firms` +
          '?select=id,name,url,geographic_coverage,categories,' +
          'pay_min,pay_max,pay_type,company_size,industry_focus,is_published' +
          '&is_published=eq.true' +
          '&order=name.asc'

        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        })

        if (!res.ok) {
          throw new Error(`Supabase returned ${res.status} ${res.statusText}`)
        }

        const data = (await res.json()) as Firm[]
        setFirms(data)
      } catch (err) {
        console.error('Error loading firms', err)
        setError(
          err instanceof Error ? err.message : 'Unknown error while loading firms',
        )
      } finally {
        setLoadingFirms(false)
      }
    }

    fetchFirms()
  }, [])

  const isStarter = planUid === 'L9nbKV9Z'
  const isProOrHigher = !!planUid && !isStarter

  const displayedFirms = isStarter ? firms.slice(0, 5) : firms

  const formatCategories = (raw: any) => {
    if (!raw) return ''
    if (Array.isArray(raw)) return raw.join(', ')
    if (typeof raw === 'string') {
      // handle '["Property Inspection","Mortgage Services"]'
      return raw.replace(/[\[\]"]/g, '')
    }
    return String(raw)
  }

  // Logged out state . show CTA instead of leaking directory
  if (!isLoading && !isAuthenticated) {
    return (
      <main
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Firm Directory</h1>
          <Link
            href="/"
            style={{ fontSize: '0.9rem', color: '#3b82f6', textDecoration: 'none' }}
          >
            ← Back home
          </Link>
        </header>

        <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
          Log in to see firms that are actively hiring field inspectors, notaries,
          and other gig pros.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <a
            href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              border: '1px solid #3b82f6',
              color: '#3b82f6',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            Login
          </a>
          <a
            href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            Get free access
          </a>
        </div>
      </main>
    )
  }

  return (
    <main
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header with back link and context */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: '0.25rem',
            }}
          >
            Directory
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
            Firms hiring field inspectors
          </h1>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>
          <Link
            href="/dashboard"
            style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}
          >
            ← Back to dashboard
          </Link>
          <div style={{ marginTop: '0.25rem' }}>
            <Link
              href="/membership"
              style={{ color: '#111827', textDecoration: 'none' }}
            >
              Membership & pricing
            </Link>
          </div>
        </div>
      </header>

      {/* Starter plan banner */}
      {isStarter && (
        <section
          style={{
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #f59e0b',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Starter members see a preview
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#92400e', marginBottom: '0.75rem' }}>
            You are currently viewing a small sample of firms. Upgrade to Pro or
            Elite to unlock the full directory, deeper intel, and upcoming auto-assign
            tools.
          </p>
          <Link
            href="/membership"
            style={{
              display: 'inline-block',
              padding: '0.6rem 1.25rem',
              borderRadius: '999px',
              backgroundColor: '#f59e0b',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            Upgrade for full access
          </Link>
        </section>
      )}

      {/* Loading or error states */}
      {loadingFirms && (
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading firms…</p>
      )}

      {error && (
        <p style={{ color: '#b91c1c', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      {/* Firm list */}
      {!loadingFirms && !error && (
        <>
          {displayedFirms.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
              No firms are published yet, check back soon.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {displayedFirms.map((firm) => (
                <article
                  key={firm.id}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {firm.name}
                  </h3>

                  {firm.geographic_coverage && (
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Coverage. {firm.geographic_coverage}
                    </p>
                  )}

                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {firm.company_size || 'Size n,a'} ·{' '}
                    {firm.industry_focus || 'Field services'}
                  </p>

                  {firm.categories && (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: '#4b5563',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Focus. {formatCategories(firm.categories)}
                    </p>
                  )}

                  {firm.pay_min != null && (
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: '#16a34a',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Typical range. ${firm.pay_min}
                      {firm.pay_max != null && ` - $${firm.pay_max}`}
                      {firm.pay_type && ` ${firm.pay_type}`}
                    </p>
                  )}

                  {firm.url && (
                    <a
                      href={firm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        fontSize: '0.85rem',
                        color: '#3b82f6',
                        textDecoration: 'none',
                      }}
                    >
                      Visit website →
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}

          {isStarter && firms.length > displayedFirms.length && (
            <p
              style={{
                marginTop: '1.5rem',
                fontSize: '0.85rem',
                color: '#6b7280',
              }}
            >
              Showing {displayedFirms.length} of {firms.length} published firms on
              the Starter preview.
            </p>
          )}

          {isProOrHigher && (
            <p
              style={{
                marginTop: '1.5rem',
                fontSize: '0.85rem',
                color: '#6b7280',
              }}
            >
              You have full directory access. As n8n adds new published firms to
              Supabase, they will appear here automatically.
            </p>
          )}
        </>
      )}
    </main>
  )
}
