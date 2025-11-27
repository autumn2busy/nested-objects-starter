'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'

import { useAuth } from '@/components/auth-provider'
import { Card } from '@/components/ui/card'
import { FieldHelperText, FieldLabel, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type Firm = {
  id: string
  slug: string | null
  name: string
  url: string | null
  vendor_page_url: string | null
  logo_url: string | null
  geographic_coverage: string | null
  categories: any
  pay_min: number | null
  pay_max: number | null
  pay_type: string | null
  company_size: string | null
  industry_focus: string | null
  is_published?: boolean | null
  rating: number | null
  phone?: string | null
  email?: string | null
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
    <Card className="mb-6 border-border-subtle px-5 py-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-end">
        <div className="space-y-1">
          <FieldLabel htmlFor="state-filter">SERVICE AREA</FieldLabel>
          <Select
            id="state-filter"
            value={stateFilter}
            onChange={(e) => onStateChange(e.target.value)}
          >
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <FieldLabel htmlFor="keyword-filter">NAME / KEYWORD</FieldLabel>
          {isStarter ? (
            <div className="space-y-1">
              <Input
                id="keyword-filter"
                type="text"
                disabled
                tone="warning"
                placeholder="Search + advanced filters available on paid plans"
                className="cursor-not-allowed"
              />
              <FieldHelperText className="text-amber-800">
                Upgrade to Pro or higher to search by firm, service type, and region.{' '}
                <Link href="/membership" className="font-semibold text-amber-900 underline">
                  View plans
                </Link>
              </FieldHelperText>
            </div>
          ) : (
            <Input
              id="keyword-filter"
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Safeguard, mortgage, appraisal, BPO..."
            />
          )}
        </div>
      </div>

      <FieldHelperText className="mt-3">
        Tip. Many firms are national or multi-state, so start broad then narrow by state when you are ready.
      </FieldHelperText>
    </Card>
  )
}

/**
 * Cheap deterministic accent color so cards don’t all look the same
 * without going full Skittles.
 */
function getAccentColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 32%, 58%)`
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

type FirmCardProps = {
  firm: Firm
  isHovered: boolean
  onHover: () => void
  onBlur: () => void
}

function FirmCard({ firm, isHovered, onHover, onBlur }: FirmCardProps) {
  const accent = getAccentColor(firm.name)
  const payText =
    firm.pay_min != null || firm.pay_max != null
      ? [
          firm.pay_min != null ? `$${firm.pay_min}` : null,
          firm.pay_max != null ? `$${firm.pay_max}` : null,
        ]
          .filter(Boolean)
          .join(' - ') +
        (firm.pay_type ? ` ${firm.pay_type}` : '')
      : firm.pay_type || 'Shared with members inside the hub'

  const serviceRegion = firm.geographic_coverage || 'Service region not specified'
  const numericRating =
    typeof firm.rating === 'number' && firm.rating > 0 ? Math.round(firm.rating) : null

  const contactMethod = (() => {
    if (firm.email) return `Email · ${firm.email}`
    if (firm.phone) return `Call · ${firm.phone}`
    if (firm.vendor_page_url || firm.url)
      return `Website · ${firm.vendor_page_url ?? firm.url}`
    return 'Contact info shared on profile'
  })()

  return (
    <article
      className="flex h-full flex-col justify-between rounded-md border border-slate-300 px-6 py-5 transition-transform duration-150 hover:-translate-y-1"
      style={{
        // paper-like background: layered gradients + noise texture
        backgroundColor: '#f5efe1',
        backgroundImage:
          `linear-gradient(135deg, rgba(255,255,255,0.94), rgba(244,236,222,0.92)),` +
          ` radial-gradient(circle at 14% 18%, rgba(255,255,255,0.35), rgba(233,222,202,0)),` +
          ` radial-gradient(circle at 86% 6%, rgba(255,255,255,0.28), rgba(233,222,202,0)),` +
          ` url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0.3 0 0 0 0 0 0.3 0 0 0 0 0 0.3 0 0 0 0 0 0.5 0'/></filter><rect width='200' height='200' filter='url(%23noise)' opacity='0.05'/></svg>")`,
        backgroundBlendMode: 'overlay',
        // deeper, tighter shadow: looks like a card lifting off a surface
        boxShadow: isHovered
          ? '0 12px 20px rgba(15,23,42,0.25)'
          : '0 6px 12px rgba(15,23,42,0.15)',
      }}
      tabIndex={0}
      onMouseEnter={onHover}
      onMouseLeave={onBlur}
      onFocus={onHover}
      onBlur={onBlur}
    >
      {/* Top row: logo + name */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-4 sm:flex-nowrap">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50">
            {firm.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firm.logo_url}
                alt={`${firm.name} logo`}
                className="h-full w-full object-contain mix-blend-multiply"
              />
            ) : (
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-600">
                {getInitials(firm.name)}
              </span>
            )}
          </div>
          <div className="min-w-0 space-y-0.5 break-words">
            <h3 className="text-lg font-semibold leading-tight text-slate-900">{firm.name}</h3>
            {/* category label removed */}
          </div>
        </div>

  {/* SERVICE REGION + RATING — TWO COLUMNS, CLEAN, NO NUMBERS */}
<div className="grid grid-cols-2 w-full text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 gap-4 mt-2">

  {/* LEFT COL — SERVICE REGION */}
  <div className="text-left">
    <p className="text-slate-900">Service region</p>
    <p className="mt-0.5 text-xs normal-case text-slate-700 break-words">
      {serviceRegion}
    </p>
  </div>

  {/* RIGHT COL — RATING ONLY STARS */}
  <div className="text-right">
    <p className="text-slate-900">Rating</p>

    <div className="mt-0.5 flex justify-end">
      {numericRating ? (
        <div className="flex text-[13px] text-amber-500">
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={index}>{index < numericRating ? '★' : '☆'}</span>
          ))}
        </div>
      ) : (
        <span className="text-[11px] normal-case text-slate-500">
          Not yet rated
        </span>
      )}
    </div>
  </div>
</div>


      {/* middle: pay + contact */}
      <div className="mt-5 grid grid-cols-1 gap-4 border-y border-dashed border-slate-200 py-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Compensation
          </p>
          <p className="break-words text-sm font-semibold text-emerald-800">{payText}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Primary contact
          </p>
          <p className="break-words text-sm font-semibold text-slate-900">{contactMethod}</p>
        </div>
      </div>

      <Link
        href={`/firms/${firm.slug ?? firm.id}`}
        className="border border-slate-900 bg-slate-900 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-white"
      >
        VIEW PROFILE
      </Link>
    </article>
  )
}

type MapPreviewProps = {
  googleMapsKey: string
}

function MapPreview({ googleMapsKey }: MapPreviewProps) {
  return (
    <aside className="sticky top-8 border border-slate-200 bg-slate-50 px-4 py-4 text-sm shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Map preview</h2>
      <p className="mb-3 mt-1 text-xs text-slate-600">
        Pins show firms in your current filter. Hover to see details, click for more info.
      </p>

      {googleMapsKey ? (
        <div id="google-map" className="h-[480px] w-full border border-slate-200" />
      ) : (
        <div className="flex h-[480px] items-center justify-center border border-dashed border-slate-300 bg-white px-4 text-center text-xs text-slate-500">
          Configure NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY to enable the live map.
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
            'vendor_page_url',
            'logo_url',
            'geographic_coverage',
            'categories',
            'pay_min',
            'pay_max',
            'pay_type',
            'company_size',
            'industry_focus',
            'rating',
            'phone',
            'email',
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
  const displayedFirms = isStarter ? filteredFirms.slice(0, 6) : filteredFirms

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
            window.location.href = '/firms/${firm.slug ?? firm.id}'
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
        <h1 className="text-3xl font-bold text-slate-900">Firm directory</h1>
        <p className="mb-6 mt-2 text-base text-slate-700">
          Log in to browse firms hiring field professionals.
        </p>
        <a
          href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
          className="inline-flex items-center border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold tracking-[0.16em] text-white"
        >
          LOGIN TO VIEW DIRECTORY
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
        <header className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              DIRECTORY
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">
              Firms hiring field inspectors
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold tracking-[0.16em]">
            <Link href="/dashboard" className="text-slate-700 hover:text-slate-900">
              ← BACK TO DASHBOARD
            </Link>
            <Link href="/membership" className="text-slate-700 hover:text-slate-900">
              MEMBERSHIP &amp; PRICING
            </Link>
          </div>
        </header>

        {loadingFirms && <p className="text-sm text-slate-700">Loading firms…</p>}
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

            {isStarter && (
              <div className="mb-6 border border-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <h3 className="text-sm font-semibold">Starter members see a preview.</h3>
                <p className="mt-1 text-xs">
                  You are viewing a small sample of firms that match your filter. Upgrade to Pro or
                  higher to unlock the full directory and deeper intel.
                </p>
                <Link
                  href="/membership"
                  className="mt-3 inline-flex border border-amber-900 bg-amber-900 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-white"
                >
                  UPGRADE FOR FULL ACCESS
                </Link>
              </div>
            )}

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              {/* Cards */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

              {/* Map */}
              <MapPreview googleMapsKey={GOOGLE_MAPS_KEY} />
            </section>

            {isStarter && filteredFirms.length > displayedFirms.length && (
              <p className="mt-4 text-xs text-slate-600">
                Showing {displayedFirms.length} of {filteredFirms.length} matching firms on the
                Starter preview.
              </p>
            )}

            {isProOrHigher && (
              <p className="mt-4 text-xs text-slate-600">
                You have full directory access. As new published firms are added, they will appear
                here automatically.
              </p>
            )}
          </>
        )}
      </main>
    </>
  )
}
