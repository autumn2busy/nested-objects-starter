'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'

import { useAuth } from '@/components/auth-provider'

type Firm = {
  id: string
  slug: string | null
  name: string
  url: string | null
  logo_url: string | null
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

const BRAND_ACCENT_PALETTE = [
  '#0f172a', // slate
  '#1d4ed8', // blue
  '#0f766e', // teal
  '#7c3aed', // violet
  '#b91c1c', // red
  '#b45309', // amber
  '#15803d', // green
  '#db2777', // pink
]

function getBrandAccent(name: string) {
  if (!name) return BRAND_ACCENT_PALETTE[0]
  const hash = name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return BRAND_ACCENT_PALETTE[hash % BRAND_ACCENT_PALETTE.length]
}

function formatCategories(categories: any): string {
  if (!categories) return ''
  if (Array.isArray(categories)) return categories.join(', ')
  if (typeof categories === 'string') return categories
  return String(categories)
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

function formatPayRange(firm: Firm): string | null {
  const hasMin = firm.pay_min != null
  const hasMax = firm.pay_max != null

  if (!hasMin && !hasMax) return null

  const min = hasMin ? `$${firm.pay_min}` : ''
  const max = hasMax ? `$${firm.pay_max}` : ''

  const range = min && max ? `${min} - ${max}` : min || max
  const type = firm.pay_type ? ` ${firm.pay_type}` : ''

  return `${range}${type}`
}

declare global {
  interface Window {
    google: any
  }
}

type FilterBarProps = {
  stateFilter: string
  search: string
  isStarter: boolean
  onStateChange: (value: string) => void
  onSearchChange: (value: string) => void
}

function FilterBar({
  stateFilter,
  search,
  isStarter,
  onSearchChange,
  onStateChange,
}: FilterBarProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="state-filter">
            Filter by service area
          </label>
          <select
            id="state-filter"
            value={stateFilter}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 xl:col-span-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="keyword-filter">
            Search directory
          </label>
          {isStarter ? (
            <div className="space-y-2">
              <input
                id="keyword-filter"
                type="text"
                disabled
                placeholder="Search/filter available on paid plans"
                className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-inner"
              />
              <p className="flex items-center gap-2 text-xs text-amber-800">
                <span role="img" aria-label="locked">
                  🔒
                </span>
                Upgrade to Pro or higher to unlock search and advanced filtering.
                <Link href="/membership" className="font-semibold text-orange-600 underline">
                  View plans
                </Link>
              </p>
            </div>
          ) : (
            <input
              id="keyword-filter"
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Try Safeguard, SoFi, mortgage, appraisal..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Tip: many firms are national or multi-state, so start here then narrow down if needed.
      </p>
    </section>
  )
}

type FirmCardProps = {
  firm: Firm
  isHovered: boolean
  onHover: () => void
  onBlur: () => void
}

/**
 * Business-card style firm card.
 * Only shows: logo, name, coverage, pay range, website + snapshot CTA.
 */
function FirmCard({ firm, isHovered, onBlur, onHover }: FirmCardProps) {
  const firmAddress = buildAddress(firm)
  const payRange = formatPayRange(firm)
  const accent = getBrandAccent(firm.name)

  return (
    <div
      className={`relative h-full rounded-2xl p-[1px] shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition-transform duration-200 ${
        isHovered ? 'translate-y-[-6px] shadow-[0_24px_55px_rgba(15,23,42,0.32)]' : ''
      }`}
      style={{
        background: `linear-gradient(135deg, ${accent}, #0f172a)`,
      }}
      tabIndex={0}
      onMouseEnter={onHover}
      onMouseLeave={onBlur}
      onFocus={onHover}
      onBlur={onBlur}
    >
      <article className="flex h-full flex-col justify-between rounded-[1.1rem] bg-white/95 px-4 py-4 backdrop-blur">
        {/* Top: logo + name */}
        <div className="flex gap-3">
          <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200">
            {firm.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firm.logo_url}
                alt={`${firm.name} logo`}
                className="max-h-16 max-w-full object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-sm font-semibold text-slate-500">
                {firm.name?.charAt(0) ?? '?'}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col">
            <h3 className="text-base font-semibold leading-snug text-slate-900">
              {firm.name}
            </h3>

            <div className="mt-2 space-y-1 text-xs">
              <p className="text-slate-600">
                <span className="font-semibold text-slate-700">Coverage area.</span>{' '}
                <span className="text-slate-800">
                  {firm.geographic_coverage || 'Not listed'}
                </span>
              </p>

              {payRange && (
                <p className="text-emerald-700">
                  <span className="font-semibold text-emerald-800">Pay range.</span>{' '}
                  <span>{payRange}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: address hint + CTAs */}
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {firmAddress ? (
            <p className="line-clamp-1">{firmAddress}</p>
          ) : (
            <p className="italic text-slate-500">Regional or national coverage</p>
          )}

          <div className="flex flex-wrap gap-2">
            {firm.url && (
              <a
                href={firm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Visit website
              </a>
            )}

            <Link
              href={`/firms/${firm.slug ?? firm.id}`}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              View snapshot
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}

type MapPreviewProps = {
  googleMapsKey: string
}

function MapPreview({ googleMapsKey }: MapPreviewProps) {
  return (
    <aside className="sticky top-8 h-full rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Map preview</h2>
      <p className="mb-4 mt-1 text-sm text-slate-600">
        Pins show firms in your current filter. Hover over pins to see details. Zoom and pan to
        explore.
      </p>

      {googleMapsKey ? (
        <div id="google-map" className="h-[500px] w-full overflow-hidden rounded-xl border border-slate-200" />
      ) : (
        <div className="flex h-[500px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center text-sm text-slate-500">
          <div>
            <p className="mb-2 font-medium text-slate-700">Interactive map preview</p>
            <p className="text-xs text-slate-500">
              Configure NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY to enable
            </p>
          </div>
        </div>
      )}
    </aside>
  )
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
            'logo_url',
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
        setError(err instanceof Error ? err.message : 'Unknown error while loading firms')
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
  const displayedFirms = isStarter ? filteredFirms.slice(0, 8) : filteredFirms

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
          if (geocodedCount === displayedFirms.filter((f) => buildAddress(f)).length) {
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
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Firm Directory</h1>
        <p className="mb-6 mt-2 text-base text-slate-700">
          Log in to browse firms hiring field professionals.
        </p>
        <a
          href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
          className="inline-flex items-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-500"
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

      <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Directory
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Firms hiring field inspectors</h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
              ← Back to dashboard
            </Link>
            <Link href="/membership" className="text-slate-600 hover:text-slate-800">
              Membership and pricing
            </Link>
          </div>
        </header>

        {loadingFirms && <p className="text-slate-700">Loading firms…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loadingFirms && !error && (
          <>
            <FilterBar
              stateFilter={stateFilter}
              search={search}
              isStarter={isStarter}
              onSearchChange={setSearch}
              onStateChange={setStateFilter}
            />

            {/* Starter upgrade banner */}
            {isStarter && (
              <div className="mt-5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-amber-900">
                  Starter members see a preview
                </h3>
                <p className="mt-2 text-sm text-amber-800">
                  You are currently viewing a small sample of firms that match your filter. Upgrade
                  to Pro or Elite to unlock the full directory, deeper intel, and upcoming
                  auto-assign tools.
                </p>
                <Link
                  href="/membership"
                  className="mt-4 inline-flex items-center rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-amber-600"
                >
                  Upgrade for full access
                </Link>
              </div>
            )}

            <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,_1.4fr)_minmax(0,_1fr)]">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3">
                {displayedFirms.map((firm) => (
                  <FirmCard
                    key={firm.id}
                    firm={firm}
                    isHovered={hoveredFirmId === firm.id}
                    onHover={() => setHoveredFirmId(firm.id)}
                    onBlur={() =>
                      setHoveredFirmId((current) => (current === firm.id ? null : current))
                    }
                  />
                ))}
              </div>

              <MapPreview googleMapsKey={GOOGLE_MAPS_KEY} />
            </section>

            {isStarter && filteredFirms.length > displayedFirms.length && (
              <p className="mt-4 text-sm text-slate-600">
                Showing {displayedFirms.length} of {filteredFirms.length} matching firms on the
                Starter preview.
              </p>
            )}

            {isProOrHigher && (
              <p className="mt-4 text-sm text-slate-600">
                You have full directory access. As new published firms are added to Supabase, they
                will appear here automatically.
              </p>
            )}
          </>
        )}
      </main>
    </>
  )
}
