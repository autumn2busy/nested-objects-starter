'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import FilterBar from '@/components/FilterBar'
import type { Firm } from '@/lib/directory'

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

function FirmCard({ firm, isHovered, onBlur, onHover }: FirmCardProps) {
  const firmAddress = buildAddress(firm)

  return (
    <article
      className={`relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-md outline-none transition duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 ${
        isHovered ? '-translate-y-1.5 scale-[1.01] shadow-xl ring-2 ring-blue-500/30 ring-offset-1' : ''
      }`}
      tabIndex={0}
      onMouseEnter={onHover}
      onMouseLeave={onBlur}
      onFocus={onHover}
      onBlur={onBlur}
    >
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-400/5 to-transparent opacity-0 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : ''
        }`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Verified firm</p>
          <h3 className="text-lg font-bold text-slate-900">{firm.name}</h3>
          {firm.industry_focus && <p className="text-sm font-medium text-blue-700">{firm.industry_focus}</p>}
        </div>

        {firm.url && (
          <a
            href={firm.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Visit website ↗
          </a>
        )}
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2">
        {firm.geographic_coverage && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="block text-xs font-medium text-slate-600">Coverage</span>
            <strong className="block text-sm text-slate-900">{firm.geographic_coverage}</strong>
          </div>
        )}

        {firm.categories && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="block text-xs font-medium text-slate-600">Services</span>
            <strong className="block text-sm text-slate-900">{formatCategories(firm.categories)}</strong>
          </div>
        )}
      </div>

      {firm.pay_min != null && (
        <p className="relative text-sm font-semibold text-emerald-700">
          ${firm.pay_min}
          {firm.pay_max != null && ` - $${firm.pay_max}`}
          {firm.pay_type && ` ${firm.pay_type}`}
        </p>
      )}

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-slate-700">
          {firmAddress ? <p>{firmAddress}</p> : <p>Regional or national coverage</p>}
          {firm.company_size && <p className="text-xs text-slate-500">Team size: {firm.company_size}</p>}
        </div>

        <Link
          href={`/firms/${firm.slug ?? firm.id}`}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          View snapshot →
        </Link>
      </div>
    </article>
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
        Pins show firms in your current filter. Hover over pins to see details. Zoom and pan to explore.
      </p>

      {googleMapsKey ? (
        <div id="google-map" className="h-[500px] w-full overflow-hidden rounded-xl border border-slate-200" />
      ) : (
        <div className="flex h-[500px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center text-sm text-slate-500">
          <div>
            <p className="mb-2 font-medium text-slate-700">Interactive map preview</p>
            <p className="text-xs text-slate-500">Configure NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY to enable</p>
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
  const [serviceAreaFilter, setServiceAreaFilter] = useState<string>('ALL')
  const [addressStateFilter, setAddressStateFilter] = useState<string>('ALL')
  const [cityFilter, setCityFilter] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [ratingThreshold, setRatingThreshold] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [payMin, setPayMin] = useState<string>('')
  const [payMax, setPayMax] = useState<string>('')
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
            'rating',
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

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()

    firms.forEach((firm) => {
      const parts = formatCategories(firm.categories)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

      parts.forEach((part) => set.add(part))
    })

    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [firms])

  const matchesStateFilter = (firm: Firm) => {
    if (serviceAreaFilter === 'ALL') return true
    if (!firm.geographic_coverage) return false

    const coverage = firm.geographic_coverage.toLowerCase()
    const selected = US_STATES.find((s) => s.code === serviceAreaFilter)
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

  const matchesCity = (firm: Firm) => {
    if (!cityFilter.trim()) return true
    const normalizedCity = cityFilter.trim().toLowerCase()
    return (firm.address_city ?? '').toLowerCase().includes(normalizedCity)
  }

  const matchesAddressState = (firm: Firm) => {
    if (addressStateFilter === 'ALL') return true
    return (firm.address_state ?? '').toLowerCase() === addressStateFilter.toLowerCase()
  }

  const matchesRating = (firm: Firm) => {
    if (!ratingThreshold) return true
    if (firm.rating == null) return false
    return firm.rating >= Number(ratingThreshold)
  }

  const matchesCategory = (firm: Firm) => {
    if (!categoryFilter) return true
    const categories = formatCategories(firm.categories)
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)

    return categories.includes(categoryFilter.toLowerCase())
  }

  const matchesPayRange = (firm: Firm) => {
    const parseBound = (value: string) => {
      if (!value.trim()) return null
      const numericValue = Number(value)
      return Number.isFinite(numericValue) ? numericValue : null
    }

    const min = parseBound(payMin)
    const max = parseBound(payMax)

    if (min == null && max == null) return true

    const firmMin = firm.pay_min ?? firm.pay_max ?? null
    const firmMax = firm.pay_max ?? firm.pay_min ?? null

    if (min != null && firmMax != null && firmMax < min) return false
    if (max != null && firmMin != null && firmMin > max) return false
    return true
  }

  const filteredFirms = firms
    .filter(matchesStateFilter)
    .filter(matchesSearch)
    .filter(matchesCity)
    .filter(matchesAddressState)
    .filter(matchesRating)
    .filter(matchesCategory)
    .filter(matchesPayRange)
  const displayedFirms = isStarter ? filteredFirms.slice(0, 5) : filteredFirms

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
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Directory</p>
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
              keyword={search}
              onKeywordChange={setSearch}
              serviceArea={serviceAreaFilter}
              onServiceAreaChange={setServiceAreaFilter}
              city={cityFilter}
              onCityChange={setCityFilter}
              addressState={addressStateFilter}
              onAddressStateChange={setAddressStateFilter}
              ratingThreshold={ratingThreshold}
              onRatingThresholdChange={setRatingThreshold}
              category={categoryFilter}
              onCategoryChange={setCategoryFilter}
              payMin={payMin}
              payMax={payMax}
              onPayMinChange={setPayMin}
              onPayMaxChange={setPayMax}
              isStarter={isStarter}
              categories={categoryOptions}
              stateOptions={US_STATES}
            />
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
              <div className="mt-5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-amber-900">Starter members see a preview</h3>
                <p className="mt-2 text-sm text-amber-800">
                  You are currently viewing a small sample of firms that match your filter. Upgrade to Pro or Elite to unlock the
                  full directory, deeper intel, and upcoming auto-assign tools.
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {displayedFirms.map((firm) => (
                  <FirmCard
                    key={firm.id}
                    firm={firm}
                    isHovered={hoveredFirmId === firm.id}
                    onHover={() => setHoveredFirmId(firm.id)}
                    onBlur={() => setHoveredFirmId((current) => (current === firm.id ? null : current))}
                  />
                ))}
              </div>

              <MapPreview googleMapsKey={GOOGLE_MAPS_KEY} />
            </section>

            {isStarter && filteredFirms.length > displayedFirms.length && (
              <p className="mt-4 text-sm text-slate-600">
                Showing {displayedFirms.length} of {filteredFirms.length} matching firms on the Starter preview.
              </p>
            )}

            {isProOrHigher && (
              <p className="mt-4 text-sm text-slate-600">
                You have full directory access. As new published firms are added to Supabase, they will appear here automatically.
              </p>
            )}
          </>
        )}
      </main>

      <style jsx>{`
        .directory-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          gap: 2rem;
          align-items: flex-start;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .firm-card {
          position: relative;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          background: linear-gradient(145deg, #ffffff, #f8fafc);
          box-shadow: 0 8px 16px rgba(17, 24, 39, 0.06);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease,
            outline 0.2s ease;
          outline: 2px solid transparent;
        }

        .firm-card:focus-visible {
          outline: 2px solid rgba(37, 99, 235, 0.3);
          outline-offset: 2px;
        }

        .card-stripe {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: linear-gradient(120deg, rgba(37, 99, 235, 0.08), rgba(14, 165, 233, 0.04));
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .firm-card.is-hovered .card-stripe {
          opacity: 1;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .card-label {
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6b7280;
          margin: 0 0 0.2rem 0;
        }

        .card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.15rem 0;
        }

        .card-subtitle {
          font-size: 0.9rem;
          color: #1d4ed8;
          margin: 0;
        }

        .card-website {
          font-size: 0.85rem;
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }

        .card-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
        }

        .detail-pill {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.65rem 0.75rem;
          background: #f8fafc;
        }

        .detail-label {
          display: block;
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.2rem;
        }

        .detail-value {
          font-size: 0.95rem;
          color: #111827;
        }

        .pay-rate {
          font-size: 0.95rem;
          color: #15803d;
          font-weight: 600;
          margin: 0.2rem 0 0;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .card-contact {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .card-address {
          margin: 0;
          font-size: 0.9rem;
          color: #4b5563;
        }

        .card-meta {
          margin: 0;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .card-button {
          display: inline-block;
          padding: 0.65rem 1.3rem;
          border-radius: 999px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          white-space: nowrap;
        }

        .card-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 26px rgba(37, 99, 235, 0.28);
        }

        .firm-card.is-hovered {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 18px 32px rgba(17, 24, 39, 0.12);
          border-color: #2563eb;
          outline: 2px solid rgba(37, 99, 235, 0.18);
        }

        .map-card {
          position: sticky;
          top: 2rem;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          padding: 1.25rem;
          background-color: #f9fafb;
        }

        @media (max-width: 1180px) {
          .cards-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }

        @media (max-width: 1024px) {
          .directory-layout {
            grid-template-columns: 1fr;
          }

          .map-card {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
          }

          .card-button {
            width: 100%;
            text-align: center;
          }
        }

        @media (max-width: 640px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }

          .firm-card {
            padding: 1.25rem;
          }
        }
      `}</style>
    </>
  )
}
