'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { FirmCard } from '@/components/FirmCard'
import { useAuth } from '@/components/auth-provider'
import { Firm } from '@/lib/directory'

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
  const [hoveredFirmId, setHoveredFirmId] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  
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

  // Initialize and update map
  useEffect(() => {
    if (!mapLoaded || !window.google || displayedFirms.length === 0) return

    // Initialize map only once
    if (!mapRef.current) {
      const mapElement = document.getElementById('google-map')
      if (mapElement) {
        mapRef.current = new window.google.maps.Map(mapElement, {
          zoom: 4,
          center: { lat: 39.8283, lng: -98.5795 }, // Center of US
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })
      }
    }

    // Clear old markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Geocode and add markers
    const geocoder = new window.google.maps.Geocoder()
    const bounds = new window.google.maps.LatLngBounds()
    let geocodedCount = 0

    displayedFirms.forEach((firm) => {
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

          // Info window on hover
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 220px;">
                <strong style="font-size: 14px;">${firm.name}</strong><br/>
                <span style="font-size: 12px; color: #666;">${address}</span>
              </div>
            `
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

          // Fit bounds only after ALL markers are geocoded
          geocodedCount++
          if (geocodedCount === displayedFirms.filter(f => buildAddress(f)).length) {
            mapRef.current.fitBounds(bounds)
            
            // Prevent over-zooming for single marker
            const listener = window.google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
              if (mapRef.current.getZoom() > 15) {
                mapRef.current.setZoom(15)
              }
            })
          }
        }
      })
    })
  }, [displayedFirms, mapLoaded])

  // Logged out view
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
      {/* Load Google Maps */}
      {GOOGLE_MAPS_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`}
          strategy="afterInteractive"
          onLoad={() => setMapLoaded(true)}
        />
      )}

      <main className="mx-auto max-w-screen-xl px-6 py-8 font-sans">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">DIRECTORY</p>
              <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Firms hiring field inspectors</h1>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/dashboard" className="text-blue-600 hover:underline">
                ← Back to dashboard
              </Link>
              <Link href="/membership" className="text-slate-600 hover:underline">
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
            <section className="mb-6 flex flex-wrap items-end gap-6">
              <div className="min-w-[220px] flex-1 space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Filter by service area
                </label>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                >
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[280px] flex-[1.4] space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Search by name or keyword
                </label>
                {isStarter ? (
                  <div className="relative w-full">
                    <input
                      type="text"
                      disabled
                      placeholder="Search/filter available on paid plans"
                      className="w-full cursor-not-allowed rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 shadow-inner"
                    />
                    <div className="absolute left-0 top-full mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm">
                      🔒 Upgrade to Pro or higher to unlock search and advanced filtering.{' '}
                      <Link href="/membership" className="font-semibold text-orange-600 underline">
                        View plans
                      </Link>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Try Safeguard, SoFi, mortgage, appraisal..."
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                )}
              </div>

              <p className="flex-1 text-sm text-slate-600">
                Tip: many firms are national or multi-state, so start here then narrow down if needed.
              </p>
            </section>

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
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#92400e' }}>
                  Starter members see a preview
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#78350f', marginBottom: '1rem' }}>
                  You are currently viewing a small sample of firms that match your filter. Upgrade to Pro or Elite to unlock the full directory, deeper intel, and upcoming auto-assign tools.
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

            {/* Main content: Cards + Map */}
            <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              {/* Firm cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {displayedFirms.map((firm) => {
                  const firmAddress = buildAddress(firm)

                  return (
                    <FirmCard
                      key={firm.id}
                      firm={firm}
                      address={firmAddress}
                      categories={formatCategories(firm.categories)}
                      isActive={hoveredFirmId === firm.id}
                      onHover={() => setHoveredFirmId(firm.id)}
                      onLeave={() =>
                        setHoveredFirmId((current) => (current === firm.id ? null : current))
                      }
                      onFocus={() => setHoveredFirmId(firm.id)}
                      onBlur={() =>
                        setHoveredFirmId((current) => (current === firm.id ? null : current))
                      }
                    />
                  )
                })}
              </div>

              {/* Interactive Map */}
              <aside className="sticky top-8 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <h2 className="mt-0 text-lg font-semibold text-slate-900">Map preview</h2>

                <p className="mb-4 mt-0 text-sm text-slate-600">
                  Pins show firms in your current filter. Hover over pins to see details. Zoom and pan to explore.
                </p>

                {GOOGLE_MAPS_KEY ? (
                  <div
                    id="google-map"
                    className="h-[500px] w-full overflow-hidden border border-slate-200 bg-white shadow-inner"
                  />
                ) : (
                  <div className="flex h-[500px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
                    <div>
                      <p className="mb-2">Interactive map preview</p>
                      <p className="text-xs">Configure NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY to enable</p>
                    </div>
                  </div>
                )}
              </aside>
            </section>

            {isStarter && filteredFirms.length > displayedFirms.length && (
              <p className="mt-6 text-sm text-slate-600">
                Showing {displayedFirms.length} of {filteredFirms.length} matching firms
                on the Starter preview.
              </p>
            )}

            {isProOrHigher && (
              <p className="mt-6 text-sm text-slate-600">
                You have full directory access. As new published firms are added to
                Supabase, they will appear here automatically.
              </p>
            )}
          </>
        )}
      </main>

    </>
  )
}
