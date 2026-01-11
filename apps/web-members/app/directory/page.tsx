'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { BadgeCheck } from 'lucide-react'

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
  phone: string | null
  email: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
}


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const US_STATES = [
  // ... (states list remains)

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
  return firm.address || ''
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

  // numeric rating 0–5 for stars (rounded, clamped)
  const numericRating =
    typeof firm.rating === 'number'
      ? Math.min(5, Math.max(0, Math.round(firm.rating)))
      : null

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
            {/* Tech-Forward "Verified" Badge */}
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <BadgeCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified by AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICE REGION + RATING — TWO COLUMNS */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        {/* LEFT: Service region */}
        <div className="text-left">
          <p className="text-slate-900">Service region</p>
          <p className="mt-0.5 text-xs normal-case text-slate-700 break-words">
            {serviceRegion}
          </p>
        </div>

        {/* RIGHT: Rating with stars only */}
        <div className="text-right">
          <p className="text-slate-900">Rating</p>
          <div className="mt-0.5 flex justify-end">
            {numericRating !== null ? (
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
          <p className="break-words text-sm font-semibold text-slate-900">
            {contactMethod}
          </p>
        </div>
      </div>

      <Link
        href={`/firms/${firm.slug ?? firm.id}`}
        className="mt-4 border border-slate-900 bg-slate-900 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-white"
      >
        VIEW PROFILE
      </Link>
    </article>
  )
}

// MapPreview removed in favor of static image


export default function DirectoryPage() {
  const { isAuthenticated, isLoading, planUid } = useAuth()

  const [firms, setFirms] = useState<Firm[]>([])
  const [loadingFirms, setLoadingFirms] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stateFilter, setStateFilter] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')
  const [hoveredFirmId, setHoveredFirmId] = useState<string | null>(null)

  // Optimize: Debounce search to prevent rapid firing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFirms(search, stateFilter)
    }, 400) // 400ms debounce
    return () => clearTimeout(timer)
  }, [search, stateFilter])

  async function fetchFirms(searchTerm: string, stateTerm: string) {
    setLoadingFirms(true)
    setError(null)

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing Supabase env vars')
      setError('Directory is temporarily unavailable.')
      setLoadingFirms(false)
      return
    }

    try {
      // Build query dynamically
      let url = `${SUPABASE_URL}/rest/v1/firms?select=id,slug,name,url,vendor_page_url,logo_url,geographic_coverage,categories,pay_min,pay_max,pay_type,company_size,industry_focus,rating,phone,email,is_published,address,latitude,longitude&is_published=eq.true&order=name.asc`

      // 1. State Filter
      if (stateTerm !== 'ALL') {
        // Using a simple ILIKE for state coverage check
        // Note: Logic matches the client-side logic roughly (contains code or full label)
        // A more robust way would be full-text search or JSONB tags, but ilike is sufficient for now.
        const selectedState = US_STATES.find(s => s.code === stateTerm)
        const label = selectedState?.label || ''

        // OR operator syntax in PostgREST is like: &or=(col.eq.val,col.eq.other)
        // We want geographic_coverage to contain 'Nationwide' OR 'National' OR the state Code OR the state Label
        // Simplify: Just check if it contains the state code or 'Nation'
        // For PostgREST, simple ILIKE is easier: &geographic_coverage=ilike.*pattern*
        // But we have multiple conditions. Let's start simple: Filter by code if specific.

        // Using a loose filter: if coverage has the code or label. 
        // Since we can't easily do complex ORs without logic changes, let's filter by the specific Code if provided.
        // And always include "Nationwide" firms? 
        // For now, let's perform a broad server search and let client refine if needed, OR just push a query.

        // PostgREST simple filter: geographic_coverage ILIKE %Code%
        url += `&geographic_coverage=ilike.*${stateTerm}*`
      }

      // 2. Keyword Search
      if (searchTerm.trim()) {
        const q = encodeURIComponent(searchTerm.trim())
        // Search name, industry, or coverage
        // PostgREST "or" syntax: or=(name.ilike.*q*,industry_focus.ilike.*q*)
        url += `&or=(name.ilike.*${q}*,industry_focus.ilike.*${q}*,categories.ilike.*${q}*)`
      }

      // Limit response size if we are on starter (optimization)? 
      // Actually, standard limit is fine. 
      url += '&limit=100' // Cap at 100 results for performance

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

      // Client-side fallback for complex "Nationwide" logic if needed, 
      // but for now we replace the filtered list directly.
      setFirms(data)
    } catch (err) {
      console.error('Error loading firms', err)
      setError(err instanceof Error ? err.message : 'Unknown error while loading firms')
    } finally {
      setLoadingFirms(false)
    }
  }

  // Effect for initial load removed (handled by debounce effect with initial values)

  const isStarter = planUid === 'L9nbKV9Z'
  const isProOrHigher = !!planUid && !isStarter

  // No longer need client-side "matchesStateFilter" or "matchesSearch" 
  // because we trust the server results.

  const displayedFirms = isStarter ? firms.slice(0, 6) : firms


  // Map state removed


  // CollectionPage Schema (Dataset)
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Directory of Field Inspection Firms',
    description: 'Live, AI-verified database of firms hiring field inspectors, notaries, and realtors.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: displayedFirms.map((firm, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Organization',
          name: firm.name,
          url: `https://nested-objects-starter.vercel.app/firms/${firm.slug ?? firm.id}`,
          image: firm.logo_url,
          areaServed: firm.geographic_coverage
        }
      }))
    }
  }

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
      <Script
        id="directory-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Replaced Google Maps Script with Static Image logic (Cleaned up) */}

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
              MEMBERSHIP & PRICING
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

              {/* Static Map Image */}
              <aside className="sticky top-8 border border-slate-200 bg-slate-50 px-4 py-4 text-sm shadow-sm h-fit">
                <h2 className="text-sm font-semibold text-slate-900">Map view</h2>
                <p className="mb-3 mt-1 text-xs text-slate-600">
                  Firms operate nationwide. Check specific service areas in the listing details.
                </p>
                <div className="w-full border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/directory-map.jpg"
                    alt="Map of US Service Coverage"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </aside>
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
