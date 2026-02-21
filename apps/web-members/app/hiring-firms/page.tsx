'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useAuth } from '@/components/auth-provider'
import { Card } from '@/components/ui/card'
import { FieldHelperText, FieldLabel, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { StarRating } from '@/components/ui/StarRating'
import { FirmLogo } from '@/components/ui/FirmLogo'
import { US_STATES } from './constants'

// ─── Industry focus options (based on actual data distribution) ──

const INDUSTRY_OPTIONS = [
  { value: 'ALL', label: 'All Industries' },
  { value: 'Mortgage', label: 'Mortgage Field Services' },
  { value: 'Insurance', label: 'Insurance & Loss Control' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Engineering', label: 'Engineering & Infrastructure' },
  { value: 'Preservation', label: 'Property Preservation & REO' },
  { value: 'Appraisal', label: 'Appraisal & Valuation' },
  { value: 'Mystery', label: 'Mystery Shopping & Audits' },
  { value: 'Notary', label: 'Notary & Signing' },
  { value: 'AI', label: 'AI & Data Services' },
  { value: 'Staffing', label: 'Staffing & Workforce' },
  { value: 'Medical', label: 'Medical & Logistics' },
  { value: 'Energy', label: 'Energy & Utilities' },
] as const

const RATING_OPTIONS = [
  { value: 'ALL', label: 'All Ratings' },
  { value: '4', label: '4+ Stars' },
  { value: '3.5', label: '3.5+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
] as const

// ─── Types ──────────────────────────────────────────────────────

export type Firm = {
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
  contractor_rating: number | null
  rating_count?: number | null
  verified_at?: string | null
  phone: string | null
  email: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
}

// ─── Filter Bar ─────────────────────────────────────────────────

type FilterBarProps = {
  stateFilter: string
  search: string
  ratingFilter: string
  industryFilter: string
  isFree: boolean
  isAuthenticated: boolean
  onStateChange: (value: string) => void
  onSearchChange: (value: string) => void
  onRatingChange: (value: string) => void
  onIndustryChange: (value: string) => void
}

function FilterBar({
  stateFilter,
  search,
  ratingFilter,
  industryFilter,
  isFree,
  isAuthenticated,
  onSearchChange,
  onStateChange,
  onRatingChange,
  onIndustryChange,
}: FilterBarProps) {
  return (
    <Card className="mb-6 border-border-subtle px-5 py-4 shadow-sm">
      {/* Row 1: State + Search */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-end">
        <div className="space-y-1">
          <FieldLabel htmlFor="state-filter">SERVICE AREA</FieldLabel>
          {isFree ? (
            <Select disabled value="ALL">
              <option value="ALL">All States (Upgrade to filter)</option>
            </Select>
          ) : (
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
          )}
        </div>

        <div className="space-y-1">
          <FieldLabel htmlFor="keyword-filter">NAME / KEYWORD</FieldLabel>
          {isFree ? (
            <div className="space-y-1">
              <Input
                id="keyword-filter"
                type="text"
                disabled
                tone="warning"
                placeholder={!isAuthenticated ? "Login to search..." : "Search + filters available on paid plans"}
                className="cursor-not-allowed"
              />
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

      {/* Row 2: Rating + Industry */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 md:items-end">
        <div className="space-y-1">
          <FieldLabel htmlFor="rating-filter">MINIMUM RATING</FieldLabel>
          {isFree ? (
            <Select disabled value="ALL">
              <option value="ALL">All Ratings (Upgrade to filter)</option>
            </Select>
          ) : (
            <Select
              id="rating-filter"
              value={ratingFilter}
              onChange={(e) => onRatingChange(e.target.value)}
            >
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          )}
        </div>

        <div className="space-y-1">
          <FieldLabel htmlFor="industry-filter">INDUSTRY FOCUS</FieldLabel>
          {isFree ? (
            <Select disabled value="ALL">
              <option value="ALL">All Industries (Upgrade to filter)</option>
            </Select>
          ) : (
            <Select
              id="industry-filter"
              value={industryFilter}
              onChange={(e) => onIndustryChange(e.target.value)}
            >
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {isFree ? (
        <FieldHelperText className="mt-3 text-amber-800">
          {!isAuthenticated ? 'Log in' : 'Upgrade to Starter or higher'} to unlock all filters and search the full directory.{' '}
          <Link href="/membership-pricing" className="font-semibold text-amber-900 underline">
            View plans
          </Link>
        </FieldHelperText>
      ) : (
        <FieldHelperText className="mt-3">
          Tip. Many firms are national or multi-state, so start broad then narrow by state when you are ready.
        </FieldHelperText>
      )}
    </Card>
  )
}

// ─── Firm Card ──────────────────────────────────────────────────

type FirmCardProps = {
  firm: Firm
  isHovered: boolean
  onHover: () => void
  onBlur: () => void
}

function FirmCard({ firm, isHovered, onHover, onBlur }: FirmCardProps) {
  const payText =
    firm.pay_min != null || firm.pay_max != null
      ? [
        firm.pay_min != null ? `$${Math.round(Number(firm.pay_min))}` : null,
        firm.pay_max != null ? `$${Math.round(Number(firm.pay_max))}` : null,
      ]
        .filter(Boolean)
        .join(' – ') +
      (firm.pay_type ? ` ${firm.pay_type}` : '')
      : firm.pay_type || 'Shared with members inside the hub'

  const serviceRegion = firm.geographic_coverage || 'Service region not specified'

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
        backgroundColor: '#f5efe1',
        backgroundImage:
          `linear-gradient(135deg, rgba(255,255,255,0.94), rgba(244,236,222,0.92)),` +
          ` radial-gradient(circle at 14% 18%, rgba(255,255,255,0.35), rgba(233,222,202,0)),` +
          ` radial-gradient(circle at 86% 6%, rgba(255,255,255,0.28), rgba(233,222,202,0)),` +
          ` url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0.3 0 0 0 0 0 0.3 0 0 0 0 0 0.3 0 0 0 0 0 0.5 0'/></filter><rect width='200' height='200' filter='url(%23noise)' opacity='0.05'/></svg>")`,
        backgroundBlendMode: 'overlay',
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-4 sm:flex-nowrap">
          <FirmLogo
            name={firm.name}
            logoUrl={firm.logo_url}
            websiteUrl={firm.url}
            size="md"
            className="shrink-0"
          />
          <div className="min-w-0 space-y-0.5 break-words">
            <h3 className="text-lg font-semibold leading-tight text-slate-900">{firm.name}</h3>
            <div className="flex items-center gap-2">
              {firm.verified_at ? (
                <VerifiedBadge date={firm.verified_at} />
              ) : (
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <BadgeCheck className="w-3 h-3" />
                  <span>Directory Listed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        <div className="text-left">
          <p className="text-slate-900">Service region</p>
          <p className="mt-0.5 text-xs normal-case text-slate-700 break-words">
            {serviceRegion}
          </p>
        </div>

        <div className="text-right">
          <p className="text-slate-900">Rating</p>
          <div className="mt-0.5 flex items-center justify-end">
            <StarRating
              rating={Number(firm.contractor_rating) || 0}
              count={firm.rating_count ?? undefined}
              showCount={!!firm.rating_count}
              className={firm.contractor_rating ? "" : "opacity-60 grayscale"}
            />
            {firm.contractor_rating && !firm.rating_count && (
              <span className="ml-1.5 text-xs text-slate-500 font-medium">
                {Number(firm.contractor_rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

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
        className="mt-4 border border-slate-900 bg-slate-900 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-white text-center block"
      >
        VIEW PROFILE
      </Link>
    </article>
  )
}

// ─── Directory View ─────────────────────────────────────────────

interface DirectoryViewProps {
  initialFirms: Firm[]
  totalCount: number
  page: number
  limit: number
}

export function DirectoryView({ initialFirms, totalCount, page, limit }: DirectoryViewProps) {
  const { isAuthenticated, planUid, isLoading } = useAuth()
  const [stateFilter, setStateFilter] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')
  const [ratingFilter, setRatingFilter] = useState<string>('ALL')
  const [industryFilter, setIndustryFilter] = useState<string>('ALL')
  const [hoveredFirmId, setHoveredFirmId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const firms = initialFirms

  const urlStateFilter = searchParams?.get('state') ?? 'ALL'
  const urlSearch = searchParams?.get('search') ?? ''
  const urlRating = searchParams?.get('rating') ?? 'ALL'
  const urlIndustry = searchParams?.get('industry') ?? 'ALL'

  useEffect(() => {
    setStateFilter(urlStateFilter)
    setSearch(urlSearch)
    setRatingFilter(urlRating)
    setIndustryFilter(urlIndustry)
  }, [urlSearch, urlStateFilter, urlRating, urlIndustry])

  const isGuest = !isAuthenticated
  const isFree = planUid === 'L9nbKV9Z'
  const isRestricted = isGuest || isFree

  // Safeguard: If a guest/free user tries to use URL params to filter, redirect
  useEffect(() => {
    if (!isLoading && isRestricted && (
      urlStateFilter !== 'ALL' || urlSearch.trim() !== '' ||
      urlRating !== 'ALL' || urlIndustry !== 'ALL'
    )) {
      router.replace('/hiring-firms')
    }
  }, [isLoading, isRestricted, urlStateFilter, urlSearch, urlRating, urlIndustry, router])

  const isProOrHigher = !!planUid && !isRestricted

  const displayedFirms = isGuest ? [] : isFree ? firms.slice(0, 6) : firms
  const totalPages = Math.max(1, Math.ceil(totalCount / limit))
  const startIndex = totalCount === 0 ? 0 : (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, totalCount)
  const canGoBack = page > 1
  const canGoForward = page < totalPages

  // Build URL with all current filters
  const buildUrl = (overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    const nextState = overrides.state ?? stateFilter
    const nextSearch = overrides.search ?? search
    const nextRating = overrides.rating ?? ratingFilter
    const nextIndustry = overrides.industry ?? industryFilter
    const nextPage = overrides.page ?? '1'

    if (nextState && nextState !== 'ALL') params.set('state', nextState)
    if (nextSearch.trim()) params.set('search', nextSearch.trim())
    if (nextRating && nextRating !== 'ALL') params.set('rating', nextRating)
    if (nextIndustry && nextIndustry !== 'ALL') params.set('industry', nextIndustry)
    params.set('page', nextPage)
    params.set('limit', String(limit))

    const query = params.toString()
    return query ? `/hiring-firms?${query}` : '/hiring-firms'
  }

  const paginationHref = useMemo(() => {
    return (nextPage: number) => buildUrl({ page: String(nextPage) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, search, stateFilter, ratingFilter, industryFilter, searchParams])

  const handleStateChange = (value: string) => {
    setStateFilter(value)
    router.push(buildUrl({ state: value }))
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    router.push(buildUrl({ search: value }))
  }

  const handleRatingChange = (value: string) => {
    setRatingFilter(value)
    router.push(buildUrl({ rating: value }))
  }

  const handleIndustryChange = (value: string) => {
    setIndustryFilter(value)
    router.push(buildUrl({ industry: value }))
  }

  const handlePageChange = (nextPage: number) => {
    router.push(paginationHref(nextPage))
  }

  // Active filter count (for showing "clear filters" hint)
  const activeFilterCount = [
    stateFilter !== 'ALL',
    search.trim() !== '',
    ratingFilter !== 'ALL',
    industryFilter !== 'ALL',
  ].filter(Boolean).length

  return (
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
          <Link href="/inspector-dashboard" className="text-slate-700 hover:text-slate-900">
            ← BACK TO DASHBOARD
          </Link>
          <Link href="/membership-pricing" className="text-slate-700 hover:text-slate-900">
            MEMBERSHIP & PRICING
          </Link>
        </div>
      </header>

      <FilterBar
        stateFilter={stateFilter}
        search={search}
        ratingFilter={ratingFilter}
        industryFilter={industryFilter}
        isFree={isRestricted}
        isAuthenticated={isAuthenticated}
        onSearchChange={handleSearchChange}
        onStateChange={handleStateChange}
        onRatingChange={handleRatingChange}
        onIndustryChange={handleIndustryChange}
      />

      {/* Active filters summary */}
      {!isRestricted && activeFilterCount > 0 && (
        <div className="mb-4 flex items-center gap-3 text-xs text-slate-600">
          <span className="font-semibold">{totalCount} firm{totalCount !== 1 ? 's' : ''} match your filters</span>
          <button
            type="button"
            onClick={() => router.push('/hiring-firms')}
            className="font-semibold text-brand underline hover:text-brand/80"
          >
            Clear all filters
          </button>
        </div>
      )}

      {isRestricted && (
        <div className="mb-6 border border-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <h3 className="text-sm font-semibold">
            {isGuest ? 'Guest access is restricted.' : 'Free members see a preview.'}
          </h3>
          <p className="mt-1 text-xs">
            {isGuest
              ? 'Log in to view hiring firms. Full directory access is available on paid tiers.'
              : 'You are viewing a small sample of firms that match your filter. Upgrade to Starter or higher to unlock the full directory and deeper intel.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {!isAuthenticated ? (
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                className="mt-3 inline-flex border border-amber-900 bg-amber-900 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-white"
              >
                LOGIN FOR FULL ACCESS
              </a>
            ) : (
              <Link
                href="/membership-pricing"
                className="mt-3 inline-flex border border-amber-900 bg-amber-900 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-white"
              >
                UPGRADE FOR FULL ACCESS
              </Link>
            )}
          </div>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {displayedFirms.length === 0 && !isRestricted && (
            <div className="col-span-full rounded-md border border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">No firms match your filters</p>
              <p className="mt-1 text-xs text-slate-500">Try broadening your search or clearing a filter.</p>
              <button
                type="button"
                onClick={() => router.push('/hiring-firms')}
                className="mt-3 inline-flex border border-slate-900 bg-slate-900 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-white"
              >
                CLEAR FILTERS
              </button>
            </div>
          )}
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
          <div className="w-full border border-slate-200 bg-white relative h-48">
            <Image
              src="/hiring-firms-map.jpg"
              alt="Map of US Service Coverage"
              fill
              sizes="(min-width: 1024px) 300px, 100vw"
              className="object-cover"
            />
          </div>
        </aside>
      </section>

      {totalPages > 1 && !isRestricted && (
        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-4 text-xs font-semibold tracking-[0.16em] text-slate-500 sm:flex-row sm:items-center">
          <span className="text-[11px] uppercase">
            Showing {startIndex}-{endIndex} of {totalCount}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={!canGoBack}
              className="border border-slate-300 px-3 py-2 text-[11px] text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              ← Prev
            </button>
            <span className="text-[11px] uppercase text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={!canGoForward}
              className="border border-slate-300 px-3 py-2 text-[11px] text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {isFree && firms.length > displayedFirms.length && (
        <p className="mt-4 text-xs text-slate-600">
          Showing {displayedFirms.length} of {firms.length} matching firms on the Free
          preview.
        </p>
      )}

      {isProOrHigher && (
        <p className="mt-4 text-xs text-slate-600">
          You have full directory access. As new published firms are added, they will appear
          here automatically.
        </p>
      )}
    </main>
  )
}