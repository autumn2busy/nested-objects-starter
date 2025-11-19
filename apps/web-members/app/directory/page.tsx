'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import Script from 'next/script'

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
  starter_featured?: boolean | null
  starter_rank?: number | null
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

declare global {
  interface Window {
    google: any
  }
}

export default function DirectoryPage() {
  const { isAuthenticated, isLoading, planUid } = useAuth()

  const [firms, setFirms] = useState<Firm[]>([])
  const [loadingFirms, setLoadingFirms] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stateFilter, setStateFilter] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [filterNotice, setFilterNotice] = useState<string | null>(null)

  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

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
            'starter_featured',
            'starter_rank',
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

  // Starter. lock to curated featured firms
  const starterFeatured = firms
    .filter((f) => !!f.starter_featured)
    .sort((a, b) => {
      const ra = a.starter_rank ?? 9999
      const rb = b.starter_rank ?? 9999
      if (ra !== rb) return ra - rb
      return a.name.localeCompare(b.name)
    })

  let filteredFirms: Firm[]
  let displayedFirms: Firm[]

  if (isStarter) {
    filteredFirms = starterFeatured
    displayedFirms = starterFeatured.slice(0, 5)
  } else {
    const baseFiltered = firms.filter(matchesStateFilter).filter(matchesSearch)
    filteredFirms = baseFiltered
    displayedFirms = baseFiltered
  }

  // Initialize and update map
  useEffect(() => {
    if (!mapLoaded || !window.google || displayedFirms.length === 0) return

    if (!mapRef.current) {
      const mapElement = document.getElementById('google-map')
      if (mapElement) {
        mapRef.current = new window.google.maps.Map(mapElement, {
          zoom: 4,
          center: { lat: 39.8283, lng: -98.5795 },
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })
      }
    }

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    const geocoder = new window.google.maps.Geocoder()
    const bounds = new window.google.maps.LatLngBounds()
    let geocodedCount = 0

    const firmsWithAddresses = displayedFirms.filter((f) => buildAddress(f))

    firmsWithAddresses.forEach((firm) => {
      const address = buildAddress(firm)
      if (!address) return

      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location

          const marker = new window.google.maps.Marker({
            position: location,
            map: mapRef.current,
            title: firm.name,
          })

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 220px;">
                <strong style="font-size: 14px;">${firm.name}</strong><br/>
                <span style="font-size: 12px; color: #666;">${address}</span>
              </div>
            `,
          })

          marker.addListener('mouseover', () => {
            infoWindow.open(mapRef.current, marker)
          })

          marker.addListener('mouseout', () => {
            infoWindow.close()
          })

          marker.addListener('click', () => {
            window.location.href = `/firms/${firm.slug ?? firm.id}`
          })

          markersRef.current.push(marker)
          bounds.extend(location)

          geocodedCount++
          if (geocodedCount === firmsWithAddresses.length) {
            mapRef.current.fitBounds(bounds)
            window.google.maps.event.addListenerOnce(
              mapRef.current,
              'bounds_changed',
              () => {
                if (mapRef.current.getZoom() > 15) {
                  mapRef.current.setZoom(15)
                }
              },
            )
          }
        }
      })
    })
  }, [displayedFirms, mapLoaded])

  if (!isLoading && !isAuthenticated) {
    return (
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Firm Directory</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          Log in to browse firms hiring field professionals.
        </p>
        <a
          href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '999px',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
          }}
        >
          Login to view directory
        </a>
      </main>
    )
  }

  return (
    <>
      {GOOGLE_MAPS_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`}
          strategy="afterInteractive"
          onLoad={() => setMapLoaded(true)}
        />
      )}

      <main
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#9ca3af',
                  marginBottom: '0.25rem',
                }}
              >
                DIRECTORY
              </p>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: 0 }}>
                Firms hiring field inspectors
              </h1>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.9rem',
              }}
            >
              <Link href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                ← Back to dashboard
              </Link>
              <Link
                href="/membership"
                style={{ color: '#6b7280', textDecoration: 'none' }}
              >
                Membership and pricing
              </Link>
            </div>
          </div>
        </header>

        {loadingFirms && <p>Loading firms…</p>}
        {error && <p style={{ color: '#ef4444' }}>{error}</p>}

        {!loadingFirms && !error && (
          <>
            {/* Filters */}
            <section
              style={{
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '0 0 220px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginBottom: '0.35rem',
                  }}
                >
                  Filter by service area
                </label>
                <select
                  value={stateFilter}
                  onChange={(e) => {
                    if (isStarter) {
                      setFilterNotice(
                        'Filtering by service area is locked on Starter. Upgrade to Pro or Elite to unlock full filters.',
                      )
                      return
                    }
                    setFilterNotice(null)
                    setStateFilter(e.target.value)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    backgroundColor: isStarter ? '#f3f4f6' : 'white',
                    cursor: isStarter ? 'not-allowed' : 'default',
                  }}
                >
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 300px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginBottom: '0.35rem',
                  }}
                >
                  Search by name or keyword
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    if (isStarter) {
                      setFilterNotice(
                        'Keyword search is disabled on the Starter preview. Upgrade to unlock full search and filtering.',
                      )
                      return
                    }
                    setFilterNotice(null)
                    setSearch(e.target.value)
                  }}
                  placeholder={
                    isStarter
                      ? 'Upgrade to unlock keyword search'
                      : 'Try Safeguard, SoFi, mortgage, appraisal...'
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    backgroundColor: isStarter ? '#f3f4f6' : 'white',
                    cursor: isStarter ? 'not-allowed' : 'text',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    margin: 0,
                  }}
                >
                  Tip. many firms are national or multi state, so start here then narrow
                  down if needed.
                </p>
              </div>
            </section>

            {filterNotice && (
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #facc15',
                  fontSize: '0.85rem',
                  color: '#78350f',
                }}
              >
                {filterNotice}
              </div>
            )}

            {/* Starter upgrade banner */}
            {isStarter && (
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '12px',
                  backgroundColor: '#fef3c7',
                  border: '2px solid #fbbf24',
                  marginBottom: '2rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: '#92400e',
                  }}
                >
                  Starter members see a preview
                </h3>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: '#78350f',
                    marginBottom: '1rem',
                  }}
                >
                  You are currently viewing a small, curated sample of firms. Upgrade to
                  Pro or Elite to unlock the full directory, deeper intel, and upcoming
                  auto match tools.
                </p>
                <Link
                  href="/membership"
                  style={{
                    display: 'inline-block',
                    padding: '0.6rem 1.5rem',
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
              </div>
            )}

            {/* Main content. Cards + Map */}
            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                gap: '2rem',
                alignItems: 'flex-start',
              }}
            >
              {/* Firm cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {displayedFirms.map((firm) => (
                  <article
                    key={firm.id}
                    style={{
                      borderRadius: '16px',
                      border: '1px solid #e5e7eb',
                      padding: '1.5rem',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow =
                        '0 12px 24px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow =
                        '0 4px 6px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 600,
                          marginBottom: '0.5rem',
                          color: '#111827',
                        }}
                      >
                        {firm.name}
                      </h3>

                      {firm.geographic_coverage && (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <strong>Coverage =</strong> {firm.geographic_coverage}
                        </p>
                      )}

                      {firm.industry_focus && (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <strong>Focus =</strong> {firm.industry_focus}
                        </p>
                      )}

                      {firm.categories && (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: '#4b5563',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <strong>Services =</strong>{' '}
                          {formatCategories(firm.categories)}
                        </p>
                      )}

                      {firm.pay_min != null && (
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: '#16a34a',
                            marginTop: '0.5rem',
                            fontWeight: 500,
                          }}
                        >
                          ${firm.pay_min}
                          {firm.pay_max != null && ` - $${firm.pay_max}`}
                          {firm.pay_type && ` ${firm.pay_type}`}
                        </p>
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
                          padding: '0.6rem 1.3rem',
                          borderRadius: '999px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View snapshot →
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
                          }}
                        >
                          Visit website
                        </a>
                      )}
                    </div>
                  </article>
                ))}

                {!displayedFirms.length && (
                  <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    No firms match your current filters.
                  </p>
                )}
              </div>

              {/* Interactive Map */}
              <aside
                style={{
                  position: 'sticky',
                  top: '2rem',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  padding: '1.25rem',
                  backgroundColor: '#f9fafb',
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
                    marginBottom: '1rem',
                  }}
                >
                  Pins show firms in your current view. Hover over pins to see details.
                  Zoom and pan to explore.
                </p>

                {GOOGLE_MAPS_KEY ? (
                  <div
                    id="google-map"
                    style={{
                      width: '100%',
                      height: '500px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid '#e5e7eb',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      borderRadius: '12px',
                      border: '1px dashed #d1d5db',
                      padding: '3rem 1.5rem',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      color: '#6b7280',
                      backgroundColor: 'white',
                      height: '500px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div>
                      <p style={{ marginBottom: '0.5rem' }}>Interactive map preview</p>
                      <p style={{ fontSize: '0.75rem' }}>
                        Configure NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY to enable
                      </p>
                    </div>
                  </div>
                )}
              </aside>
            </section>

            {isStarter && filteredFirms.length > displayedFirms.length && (
              <p
                style={{
                  marginTop: '1.5rem',
                  fontSize: '0.85rem',
                  color: '#6b7280',
                }}
              >
                Showing {displayedFirms.length} of {filteredFirms.length} curated firms
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
                You have full directory access. as new published firms are added to
                Supabase, they will appear here automatically.
              </p>
            )}
          </>
        )}
      </main>
    </>
  )
}
