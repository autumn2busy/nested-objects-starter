'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

// Let TypeScript know about the Google Maps JS global
declare const google: any

type Firm = {
  id: string
  slug: string | null
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
  address_street: string | null
  address_city: string | null
  address_state: string | null
  address_postal_code: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || ''

const US_STATES = [
  { code: 'ALL', label: 'All service areas' },
  { code: 'AL', label: 'Alabama' },
  { code: 'AK', label: 'Alaska' },
  { code: 'AZ', label: 'Arizona' },
  { code: 'AR', label: 'Arkansas' },
  { code: 'CA', label: 'California' },
  { code: 'CO', label: 'Colorado' },
  { code: 'CT', label: 'Connecticut' },
  { code: 'DE', label: 'Delaware' },
  { code: 'FL', label: 'Florida' },
  { code: 'GA', label: 'Georgia' },
  { code: 'HI', label: 'Hawaii' },
  { code: 'ID', label: 'Idaho' },
  { code: 'IL', label: 'Illinois' },
  { code: 'IN', label: 'Indiana' },
  { code: 'IA', label: 'Iowa' },
  { code: 'KS', label: 'Kansas' },
  { code: 'KY', label: 'Kentucky' },
  { code: 'LA', label: 'Louisiana' },
  { code: 'ME', label: 'Maine' },
  { code: 'MD', label: 'Maryland' },
  { code: 'MA', label: 'Massachusetts' },
  { code: 'MI', label: 'Michigan' },
  { code: 'MN', label: 'Minnesota' },
  { code: 'MS', label: 'Mississippi' },
  { code: 'MO', label: 'Missouri' },
  { code: 'MT', label: 'Montana' },
  { code: 'NE', label: 'Nebraska' },
  { code: 'NV', label: 'Nevada' },
  { code: 'NH', label: 'New Hampshire' },
  { code: 'NJ', label: 'New Jersey' },
  { code: 'NM', label: 'New Mexico' },
  { code: 'NY', label: 'New York' },
  { code: 'NC', label: 'North Carolina' },
  { code: 'ND', label: 'North Dakota' },
  { code: 'OH', label: 'Ohio' },
  { code: 'OK', label: 'Oklahoma' },
  { code: 'OR', label: 'Oregon' },
  { code: 'PA', label: 'Pennsylvania' },
  { code: 'RI', label: 'Rhode Island' },
  { code: 'SC', label: 'South Carolina' },
  { code: 'SD', label: 'South Dakota' },
  { code: 'TN', label: 'Tennessee' },
  { code: 'TX', label: 'Texas' },
  { code: 'UT', label: 'Utah' },
  { code: 'VT', label: 'Vermont' },
  { code: 'VA', label: 'Virginia' },
  { code: 'WA', label: 'Washington' },
  { code: 'WV', label: 'West Virginia' },
  { code: 'WI', label: 'Wisconsin' },
  { code: 'WY', label: 'Wyoming' },
]

function formatCategories(raw: any) {
  if (!raw) return ''
  if (Array.isArray(raw)) return raw.join(', ')
  if (typeof raw === 'string') return raw.replace(/[\[\]"]/g, '')
  return String(raw)
}

function buildAddress(firm: Firm): string {
  return [
    firm.address_street,
    firm.address_city,
    firm.address_state,
    firm.address_postal_code,
  ]
    .filter(Boolean)
    .join(', ')
}

// Map component with multi-pin support
function DirectoryMap({ firms }: { firms: Firm[] }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return
    if (!mapContainerRef.current) return
    if (!firms.length) return

    const firmsWithAddress = firms
      .filter((f) => buildAddress(f).length > 0)
      .slice(0, 50)

    if (!firmsWithAddress.length) return

    const loadScript = () =>
      new Promise<void>((resolve) => {
        const existing = document.getElementById('google-maps-js')
        if (existing) {
          if ((window as any).google) {
            resolve()
          } else {
            existing.addEventListener('load', () => resolve())
          }
          return
        }

        const script = document.createElement('script')
        script.id = 'google-maps-js'
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        document.head.appendChild(script)
      })

    const initMap = async () => {
      await loadScript()
      if (!mapContainerRef.current) return

      const g = (window as any).google
      if (!g || !g.maps) return

      const map = new g.maps.Map(mapContainerRef.current, {
        center: { lat: 39.5, lng: -98.35 }, // rough US center
        zoom: 4,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      const geocoder = new g.maps.Geocoder()
      const bounds = new g.maps.LatLngBounds()

      firmsWithAddress.forEach((firm) => {
        const address = buildAddress(firm)
        if (!address) return

        geocoder.geocode({ address }, (results: any, status: string) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location

            const marker = new g.maps.Marker({
              map,
              position: location,
              title: firm.name,
            })

            const info = new g.maps.InfoWindow({
              content: `<div style="font-size:13px;"><strong>${firm.name}</strong><br/>${address}</div>`,
            })

            marker.addListener('click', () => {
              info.open(map, marker)
            })

            bounds.extend(location)
            map.fitBounds(bounds)
          } else {
            console.warn('Geocode failed for', firm.name, status)
          }
        })
      })
    }

    initMap()
  }, [firms])

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: 260,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        backgroundColor: '#e5e7eb',
      }}
    />
  )
}

export default function DirectoryPage() {
  const { isAuthenticated, isLoading, planUid } = useAuth()

  const [firms, setFirms] = useState<Firm[]>([])
  const [loadingFirms, setLoadingFirms] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stateFilter, setStateFilter] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')

  useEffect(() => {
    async function fetchFirms() {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Missing Supabase env vars')
        setError('Directory is temporarily unavailable.')
        setLoadingFirms(false)
        return
      }

      try {
        const url =
          `${SUPABASE_URL}/rest/v1/firms` +
          '?select=' +
          [
            'id',
            'slug',
            'name',
            'url',
            'geographic_coverage',
            'categories',
            'pay_min',
            'pay_max',
            'pay_type',
            'company_size',
            'industry_focus',
            'is_published',
            'address_street',
            'address_city',
            'address_state',
            'address_postal_code',
          ].join(',') +
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

  const matchesStateFilter = (firm: Firm) => {
    if (stateFilter === 'ALL') return true
    if (!firm.geographic_coverage) return false

    const coverage = firm.geographic_coverage.toLowerCase()
    const selected = US_STATES.find((s) => s.code === stateFilter)
    if (!selected) return true

    if (
      coverage.includes('nationwide') ||
      coverage.includes('national') ||
      coverage.includes('all 50')
    ) {
      return true
    }

    const label = selected.label.toLowerCase()
    const code = selected.code.toLowerCase()

    if (coverage.includes(label)) return true
    if (coverage.includes(` ${code} `) || coverage.endsWith(` ${code}`)) return true
    if (coverage.includes(`(${code})`)) return true

    return false
  }

  const matchesSearch = (firm: Firm) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      firm.name.toLowerCase().includes(q) ||
      (firm.geographic_coverage ?? '').toLowerCase().includes(q) ||
      (firm.industry_focus ?? '').toLowerCase().includes(q) ||
      formatCategories(firm.categories).toLowerCase().includes(q)
    )
  }

  const filteredFirms = firms.filter(matchesStateFilter).filter(matchesSearch)
  const displayedFirms = isStarter ? filteredFirms.slice(0, 5) : filteredFirms
  const mapHeadlineFirm = displayedFirms[0] ?? filteredFirms[0] ?? null

  // Logged out view
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
          Log in to see firms that are actively hiring field inspectors, notaries, and
          other gig pros.
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
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1.5rem 3rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background:
          'radial-gradient(circle at top left, #eef2ff 0, #ffffff 42%, #f9fafb 100%)',
      }}
    >
      {/* Header */}
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
              Membership and pricing
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label
              htmlFor="state-filter"
              style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}
            >
              Filter by service area
            </label>
            <select
              id="state-filter"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{
                marginTop: '0.25rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
                minWidth: '220px',
                backgroundColor: 'white',
              }}
            >
              {US_STATES.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="search"
              style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}
            >
              Search by name or keyword
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try Safeguard, SoFi, mortgage, appraisal..."
              style={{
                marginTop: '0.25rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
                minWidth: '260px',
                backgroundColor: 'white',
              }}
            />
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#6b7280', maxWidth: '320px' }}>
          {stateFilter === 'ALL' ? (
            <p>
              Tip, many firms are national or multi state, so start here then narrow
              down if needed.
            </p>
          ) : (
            <p>
              Showing firms that list{' '}
              {US_STATES.find((s) => s.code === stateFilter)?.label || 'this state'} in
              their coverage, plus any nationwide firms.
            </p>
          )}
        </div>
      </section>

      {/* Starter banner */}
      {isStarter && (
        <section
          style={{
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            background:
              'linear-gradient(135deg, #fffbeb 0%, #fef3c7 40%, #fff7ed 100%)',
            border: '1px solid #f59e0b',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Starter members see a preview
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#92400e', marginBottom: '0.75rem' }}>
            You are currently viewing a small sample of firms that match your filter.
            Upgrade to Pro or Elite to unlock the full directory, deeper intel, and
            upcoming auto assign tools.
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

      {loadingFirms && (
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading firms…</p>
      )}

      {error && (
        <p style={{ color: '#b91c1c', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      {!loadingFirms && !error && (
        <>
          {displayedFirms.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
              No firms match this combination yet, try clearing your search or
              switching back to All service areas.
            </p>
          ) : (
            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.4fr)',
                gap: '1.75rem',
                alignItems: 'flex-start',
              }}
            >
              {/* Cards column */}
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
                      borderRadius: 16,
                      border: '1px solid #e5e7eb',
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, #ffffff, #f9fafb)',
                      boxShadow:
                        '0 18px 35px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.8rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.35rem',
                          gap: '0.75rem',
                        }}
                      >
                        <h3
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          {firm.name}
                        </h3>

                        {firm.geographic_coverage && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              padding: '0.18rem 0.5rem',
                              borderRadius: '999px',
                              backgroundColor: '#eef2ff',
                              color: '#4f46e5',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {firm.geographic_coverage.includes('National')
                              ? 'National coverage'
                              : 'Regional'}
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem',
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
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span style={{ color: '#9ca3af' }}>Focus.</span>{' '}
                          {formatCategories(firm.categories)}
                        </p>
                      )}

                      {(firm.address_city || firm.address_state) && (
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span style={{ color: '#9ca3af' }}>Based in.</span>{' '}
                          {[
                            firm.address_city,
                            firm.address_state,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}

                      {firm.pay_min != null && (
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '0.35rem 0.9rem',
                            borderRadius: 999,
                            background:
                              'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(22,163,74,0.24))',
                            fontSize: '0.8rem',
                            color: '#166534',
                            fontWeight: 600,
                            marginTop: '0.3rem',
                          }}
                        >
                          Typical range. ${firm.pay_min}
                          {firm.pay_max != null && ` – $${firm.pay_max}`}
                          {firm.pay_type && ` ${firm.pay_type}`}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      <Link
                        href={`/firms/${firm.slug ?? firm.id}`}
                        style={{
                          display: 'inline-block',
                          padding: '0.55rem 1.3rem',
                          borderRadius: 999,
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View firm snapshot →
                      </Link>

                      {firm.url && (
                        <a
                          href={firm.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.8rem',
                            color: '#3b82f6',
                            textDecoration: 'none',
                            textAlign: 'right',
                            flexGrow: 1,
                          }}
                        >
                          Visit website
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/* Map column */}
              <aside
                style={{
                  borderRadius: 16,
                  border: '1px solid #e5e7eb',
                  padding: '1.25rem 1.5rem',
                  background: 'linear-gradient(135deg, #ffffff, #f9fafb)',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    marginTop: 0,
                    marginBottom: '0.75rem',
                  }}
                >
                  Map preview
                </h2>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#4b5563',
                    marginTop: 0,
                    marginBottom: '0.75rem',
                  }}
                >
                  Pins show firms in your current filter, hover over cards or change
                  filters to see how they cover your region.
                </p>

                {mapHeadlineFirm && (
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#374151',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{mapHeadlineFirm.name}</div>
                    {buildAddress(mapHeadlineFirm) && (
                      <div>{buildAddress(mapHeadlineFirm)}</div>
                    )}
                  </div>
                )}

                <DirectoryMap firms={displayedFirms} />
              </aside>
            </section>
          )}

          {isStarter && filteredFirms.length > displayedFirms.length && (
            <p
              style={{
                marginTop: '1.5rem',
                fontSize: '0.85rem',
                color: '#6b7280',
              }}
            >
              Showing {displayedFirms.length} of {filteredFirms.length} matching firms
              on the Starter preview.
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
              You have full directory access. As new published firms are added to
              Supabase, they will appear here automatically.
            </p>
          )}
        </>
      )}
    </main>
  )
}
