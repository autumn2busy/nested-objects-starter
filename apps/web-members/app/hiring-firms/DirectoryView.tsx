import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, LockKeyhole, Search } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { FieldHelperText, FieldLabel, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { StarRating } from '@/components/ui/StarRating'
import { US_STATES } from './constants'
import {
  DirectoryAnalytics,
  DirectoryLoginLink,
  DirectoryUpgradeLink,
  TrackFirmButton,
} from './DirectoryActions'

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

const SOURCE_OPTIONS = [
  { value: 'ALL', label: 'All Settings' },
  { value: 'Field Operations', label: 'Field Operations' },
  { value: 'Remote/Desk', label: 'Remote / Desk' },
  { value: 'Field + Desk', label: 'Field + Desk' },
  { value: 'Field + Drone', label: 'Field + Drone' },
  { value: 'On-Site + Remote', label: 'On-Site + Remote' },
  { value: 'Drive-by only', label: 'Drive-by only' },
] as const

const PAY_OPTIONS = [
  { value: 'ALL', label: 'Any Pay' },
  { value: '30', label: '$30+ / inspection' },
  { value: '50', label: '$50+ / inspection' },
  { value: '75', label: '$75+ / inspection' },
  { value: '100', label: '$100+ / inspection' },
] as const

const SORT_OPTIONS = [
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'pay_desc', label: 'Highest Pay' },
] as const

const NOTARY_QUICK_FILTERS = [
  { label: 'Signing services', href: '/hiring-firms?industry=Notary&search=signing' },
  { label: 'Title vendors', href: '/hiring-firms?industry=Notary&search=title' },
  { label: 'RON platforms', href: '/hiring-firms?industry=Notary&search=RON' },
  { label: 'Apostille / courier', href: '/hiring-firms?industry=Notary&search=apostille' },
  { label: 'Inspection add-ons', href: '/hiring-firms?industry=Notary&search=photo' },
] as const

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
  source: string | null
  compensation_structure: string | null
  client_reviews: string | null
  description: string | null
  services: string | null
}

export type DirectoryFilters = {
  state: string
  search: string
  rating: string
  industry: string
  source: string
  pay: string
  sort: string
}

export type DirectoryAccess = {
  isAuthenticated: boolean
  isFree: boolean
  isRestricted: boolean
  planUid: string | null
}

type DirectoryViewProps = {
  initialFirms: Firm[]
  totalCount: number
  page: number
  limit: number
  filters: DirectoryFilters
  access: DirectoryAccess
}

const FREE_VISIBLE_COUNT = 3
const FREE_TEASER_COUNT = 4

function hasDisplayValue(value: string | null | undefined) {
  if (value == null) return false
  const normalized = value.trim().toLowerCase()
  return normalized !== '' && !['n/a', 'na', 'none', 'null', '-', '--', 'unknown', 'tbd'].includes(normalized)
}

function getFirmInitials(name: string) {
  const words = name.trim().split(/\s+/)
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
}

function getFirmColor(name: string) {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-amber-500',
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

function buildDirectoryUrl(filters: DirectoryFilters, limit: number, overrides: Partial<DirectoryFilters & { page: string }> = {}) {
  const params = new URLSearchParams()
  const next = { ...filters, ...overrides }

  if (next.state && next.state !== 'ALL') params.set('state', next.state)
  if (next.search?.trim()) params.set('search', next.search.trim())
  if (next.rating && next.rating !== 'ALL') params.set('rating', next.rating)
  if (next.industry && next.industry !== 'ALL') params.set('industry', next.industry)
  if (next.source && next.source !== 'ALL') params.set('source', next.source)
  if (next.pay && next.pay !== 'ALL') params.set('pay', next.pay)
  if (next.sort && next.sort !== 'rating_desc') params.set('sort', next.sort)
  if (overrides.page && overrides.page !== '1') params.set('page', overrides.page)
  params.set('limit', String(limit))

  const query = params.toString()
  return query ? `/hiring-firms?${query}` : '/hiring-firms'
}

function FilterBar({
  filters,
  access,
}: {
  filters: DirectoryFilters
  access: DirectoryAccess
}) {
  const disabled = access.isRestricted

  return (
    <Card className="mb-6 border-border-subtle px-5 py-4 shadow-sm">
      <form action="/hiring-firms" className="space-y-4">
        <input type="hidden" name="limit" value="24" />
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-end">
          <div className="space-y-1">
            <FieldLabel htmlFor="state-filter">SERVICE AREA</FieldLabel>
            <Select id="state-filter" name="state" defaultValue={disabled ? 'ALL' : filters.state} disabled={disabled}>
              {disabled && <option value="ALL">All States (Upgrade to filter)</option>}
              {!disabled &&
                US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.label}
                  </option>
                ))}
            </Select>
          </div>

          <div className="space-y-1">
            <FieldLabel htmlFor="keyword-filter">NAME / KEYWORD</FieldLabel>
            <Input
              id="keyword-filter"
              name="search"
              type="text"
              defaultValue={disabled ? '' : filters.search}
              disabled={disabled}
              tone={disabled ? 'warning' : 'default'}
              placeholder={
                !access.isAuthenticated
                  ? 'Login to search...'
                  : disabled
                    ? 'Search + filters available on paid plans'
                    : 'Snapdocs, signing, RON, appraisal, BPO...'
              }
              className={disabled ? 'cursor-not-allowed' : undefined}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:items-end lg:grid-cols-5">
          <div className="space-y-1">
            <FieldLabel htmlFor="rating-filter">MINIMUM RATING</FieldLabel>
            <Select id="rating-filter" name="rating" defaultValue={disabled ? 'ALL' : filters.rating} disabled={disabled}>
              {(disabled ? [{ value: 'ALL', label: 'All Ratings (Upgrade)' }] : RATING_OPTIONS).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <FieldLabel htmlFor="pay-filter">PAY RANGE</FieldLabel>
            <Select id="pay-filter" name="pay" defaultValue={disabled ? 'ALL' : filters.pay} disabled={disabled}>
              {(disabled ? [{ value: 'ALL', label: 'All Pay (Upgrade)' }] : PAY_OPTIONS).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <FieldLabel htmlFor="industry-filter">INDUSTRY FOCUS</FieldLabel>
            <Select id="industry-filter" name="industry" defaultValue={disabled ? 'ALL' : filters.industry} disabled={disabled}>
              {(disabled ? [{ value: 'ALL', label: 'All Industries (Upgrade)' }] : INDUSTRY_OPTIONS).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <FieldLabel htmlFor="source-filter">WORK SETTING</FieldLabel>
            <Select id="source-filter" name="source" defaultValue={disabled ? 'ALL' : filters.source} disabled={disabled}>
              {(disabled ? [{ value: 'ALL', label: 'All Settings (Upgrade)' }] : SOURCE_OPTIONS).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="col-span-2 space-y-1 md:col-span-1">
            <FieldLabel htmlFor="sort-filter">SORT BY</FieldLabel>
            <Select id="sort-filter" name="sort" defaultValue={disabled ? 'rating_desc' : filters.sort} disabled={disabled}>
              {(disabled ? [{ value: 'rating_desc', label: 'Highest Rated (Upgrade)' }] : SORT_OPTIONS).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {disabled ? (
            <FieldHelperText className="text-amber-800">
              {!access.isAuthenticated ? 'Log in' : 'Upgrade to Pro or higher'} to unlock all filters and search the full directory.
            </FieldHelperText>
          ) : (
            <FieldHelperText>
              Tip. Many firms are national or multi-state, so start broad then narrow by state when you are ready.
            </FieldHelperText>
          )}

          {disabled ? (
            <DirectoryUpgradeLink
              source="filter_gate"
              planUid={access.planUid}
              className="inline-flex justify-center rounded-md border border-amber-900 px-4 py-2 text-xs font-semibold text-amber-900"
              eventData={{ isAuthenticated: access.isAuthenticated }}
            >
              View plans
            </DirectoryUpgradeLink>
          ) : (
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white"
            >
              APPLY FILTERS
            </button>
          )}
        </div>
      </form>
    </Card>
  )
}

function NotaryDirectoryPanel({ access }: { access: DirectoryAccess }) {
  return (
    <section className="mb-6 rounded-md border border-brand-copper/25 bg-brand-sand px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-brand-copper">
            Mobile notary and signing-agent search
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Compare signing services, RON platforms, title vendors, and nearby field add-ons.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Shortlist vendor programs before uploading credentials, then track the firms that fit your route and pay floor.
          </p>
        </div>
        <Link
          href="/tools/notary-route-calculator"
          className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
        >
          Calculate route pay
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {NOTARY_QUICK_FILTERS.map((filter) => (
          <Link
            key={filter.label}
            href={filter.href}
            className="rounded-full border border-brand-copper/30 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-brand-copper hover:text-brand-copper"
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {access.isRestricted && (
        <p className="mt-3 text-xs text-amber-800">
          {access.isAuthenticated ? 'Upgrade' : 'Log in'} to use notary filters against the full directory.
        </p>
      )}
    </section>
  )
}

function FirmCard({ firm, canTrack }: { firm: Firm; canTrack: boolean }) {
  const email = hasDisplayValue(firm.email) ? firm.email : null
  const phone = hasDisplayValue(firm.phone) ? firm.phone : null
  const vendorPageUrl = hasDisplayValue(firm.vendor_page_url) ? firm.vendor_page_url : null
  const websiteUrl = hasDisplayValue(firm.url) ? firm.url : null
  const source = hasDisplayValue(firm.source) ? firm.source : null
  const payText =
    firm.pay_min != null || firm.pay_max != null
      ? [
        firm.pay_min != null ? `$${Math.round(Number(firm.pay_min))}` : null,
        firm.pay_max != null ? `$${Math.round(Number(firm.pay_max))}` : null,
      ]
        .filter(Boolean)
        .join(' - ') + (firm.pay_type ? ` ${firm.pay_type}` : '')
      : firm.pay_type || 'Shared with members inside the hub'

  const serviceRegion = firm.geographic_coverage || 'Service region not specified'
  const compensationDetails = firm.compensation_structure || payText
  const workSetting = source || 'Work setting not specified'
  const contactMethod = (() => {
    if (email) return `Email - ${email}`
    if (phone) return `Call - ${phone}`
    if (vendorPageUrl || websiteUrl) return `Website - ${vendorPageUrl ?? websiteUrl}`
    return 'Contact info shared on profile'
  })()

  return (
    <article
      className="flex h-full flex-col justify-between rounded-md border border-slate-300 px-6 py-5 shadow-[0_6px_12px_rgba(15,23,42,0.15)] transition-transform duration-150 hover:-translate-y-1 hover:shadow-[0_12px_20px_rgba(15,23,42,0.25)]"
      style={{
        backgroundColor: '#f5efe1',
        backgroundImage:
          'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(244,236,222,0.92)), radial-gradient(circle at 14% 18%, rgba(255,255,255,0.35), rgba(233,222,202,0)), radial-gradient(circle at 86% 6%, rgba(255,255,255,0.28), rgba(233,222,202,0))',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-4 sm:flex-nowrap">
          <div
            className={`${getFirmColor(firm.name)} flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm`}
            title={firm.name}
          >
            {getFirmInitials(firm.name)}
          </div>
          <div className="min-w-0 space-y-0.5 break-words">
            <h3 className="text-lg font-semibold leading-tight text-slate-900">{firm.name}</h3>
            {firm.verified_at ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                <BadgeCheck className="h-3.5 w-3.5" />
                <span>Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <BadgeCheck className="h-3 w-3" />
                <span>Directory Listed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-slate-700">
        {firm.description || 'No description provided.'}
      </p>

      {firm.services && (
        <p className="mt-2 text-xs font-medium text-slate-600">
          <span className="text-slate-400">Services:</span> {firm.services}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        <div className="text-left">
          <p className="text-slate-900">Service region</p>
          <p className="mt-0.5 break-words text-xs normal-case text-slate-700">{serviceRegion}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-900">Work Setting</p>
          <p className="mt-0.5 break-words text-xs normal-case text-slate-700">{workSetting}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        <p className="text-slate-900">Rating</p>
        <div className="flex items-center justify-end">
          <StarRating
            rating={Number(firm.contractor_rating) || 0}
            count={firm.rating_count ?? undefined}
            showCount={!!firm.rating_count}
            className={firm.contractor_rating ? '' : 'opacity-60 grayscale'}
          />
          {firm.contractor_rating && !firm.rating_count && (
            <span className="ml-1.5 text-xs font-medium text-slate-500">
              {Number(firm.contractor_rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 border-y border-dashed border-slate-200 py-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Compensation</p>
          <p className="break-words text-sm font-semibold text-emerald-800">{payText}</p>
          {compensationDetails !== payText && (
            <p className="mt-1 line-clamp-2 text-xs font-normal normal-case leading-snug text-slate-600">
              {compensationDetails}
            </p>
          )}
        </div>
        <div className="space-y-1 sm:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Primary contact</p>
          <p className="break-words text-sm font-semibold text-slate-900">{contactMethod}</p>
          {firm.client_reviews && (
            <p className="mt-2 line-clamp-2 border-l-2 border-slate-200 pl-2 text-left text-xs font-normal italic normal-case text-slate-600">
              &quot;{firm.client_reviews}&quot;
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/firms/${firm.slug ?? firm.id}`}
          className="block flex-1 border border-slate-900 bg-slate-900 px-4 py-2 text-center text-[11px] font-semibold tracking-[0.16em] text-white"
        >
          VIEW PROFILE
        </Link>
        {canTrack && <TrackFirmButton firm={firm} />}
      </div>
    </article>
  )
}

function TeaserCard({ firm }: { firm: Firm }) {
  return (
    <div
      className="relative flex h-full select-none flex-col justify-between overflow-hidden rounded-md border border-slate-300 px-6 py-5"
      style={{
        backgroundColor: '#f5efe1',
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(244,236,222,0.92))',
      }}
      aria-hidden="true"
    >
      <div className="pointer-events-none blur-[7px]">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-slate-300" />
          <div className="space-y-1">
            <div className="text-lg font-semibold text-slate-900">{firm.name}</div>
            <div className="text-[10px] text-slate-400">Verified Firm</div>
          </div>
        </div>
        <div className="mt-4 text-xs leading-relaxed text-slate-700">
          {firm.description?.slice(0, 120) || 'Hiring inspectors and field service professionals nationwide...'}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-600">
          <span>{firm.geographic_coverage || 'Multiple states'}</span>
          <span>{firm.pay_max ? `Up to $${Math.round(Number(firm.pay_max))}` : '$$ - $$$'}</span>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
        <div className="rounded-lg bg-slate-900/90 px-4 py-2 text-center shadow-lg">
          <LockKeyhole className="mx-auto h-5 w-5 text-amber-400" />
          <p className="mt-1 text-xs font-semibold text-white">Upgrade to view</p>
        </div>
      </div>
    </div>
  )
}

export function DirectoryView({ initialFirms, totalCount, page, limit, filters, access }: DirectoryViewProps) {
  const firms = initialFirms
  const accessLevel = !access.isAuthenticated ? 'guest' : access.isFree ? 'free' : 'pro_or_higher'
  const displayedFirms = !access.isAuthenticated ? [] : access.isFree ? firms.slice(0, FREE_VISIBLE_COUNT) : firms
  const teaserFirms = access.isFree ? firms.slice(FREE_VISIBLE_COUNT, FREE_VISIBLE_COUNT + FREE_TEASER_COUNT) : []
  const totalPages = Math.max(1, Math.ceil(totalCount / limit))
  const startIndex = totalCount === 0 ? 0 : (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, totalCount)
  const canGoBack = page > 1
  const canGoForward = page < totalPages
  const activeFilterCount = [
    filters.state !== 'ALL',
    filters.search.trim() !== '',
    filters.rating !== 'ALL',
    filters.industry !== 'ALL',
    filters.source !== 'ALL',
    filters.pay !== 'ALL',
  ].filter(Boolean).length

  return (
    <main className="no-drag no-select mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
      <DirectoryAnalytics
        accessLevel={accessLevel}
        planUid={access.planUid}
        totalCount={totalCount}
        visibleCount={displayedFirms.length}
        teaserCount={teaserFirms.length}
      />

      <header className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">DIRECTORY</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">
            Firms hiring inspectors, notaries, and route pros
          </h1>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold tracking-[0.16em]">
          <Link href="/inspector-dashboard" className="text-slate-700 hover:text-slate-900">
            &lt;- BACK TO DASHBOARD
          </Link>
          <DirectoryUpgradeLink
            source="header"
            planUid={access.planUid}
            className="text-slate-700 hover:text-slate-900"
            eventData={{ isAuthenticated: access.isAuthenticated }}
          >
            MEMBERSHIP & PRICING
          </DirectoryUpgradeLink>
        </div>
      </header>

      <NotaryDirectoryPanel access={access} />

      <FilterBar filters={filters} access={access} />

      {!access.isRestricted && activeFilterCount > 0 && (
        <div className="mb-4 flex items-center gap-3 text-xs text-slate-600">
          <span className="font-semibold">
            {totalCount} firm{totalCount !== 1 ? 's' : ''} match your filters
          </span>
          <Link href="/hiring-firms" className="font-semibold text-brand underline hover:text-brand/80">
            Clear all filters
          </Link>
        </div>
      )}

      {access.isRestricted && (
        <div className="mb-6 border border-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <h2 className="text-sm font-semibold">
            {!access.isAuthenticated ? 'Guest access is restricted.' : 'Free members see a preview.'}
          </h2>
          <p className="mt-1 text-xs">
            {!access.isAuthenticated
              ? 'Log in to view hiring firms. Full directory access is available on paid tiers.'
              : 'You are viewing a small sample of firms. Upgrade to Pro or higher to unlock the full directory and deeper intel.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {!access.isAuthenticated ? (
              <DirectoryLoginLink className="mt-3 inline-flex border border-amber-900 bg-amber-900 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-white">
                LOGIN FOR FULL ACCESS
              </DirectoryLoginLink>
            ) : (
              <DirectoryUpgradeLink
                source="access_banner"
                planUid={access.planUid}
                className="mt-3 inline-flex border border-amber-900 bg-amber-900 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-white"
                eventData={{ feature: 'directory_preview_limit' }}
              >
                UPGRADE FOR FULL ACCESS
              </DirectoryUpgradeLink>
            )}
          </div>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {displayedFirms.length === 0 && !access.isRestricted && (
            <div className="col-span-full rounded-md border border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <Search className="mx-auto h-6 w-6 text-slate-400" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-slate-700">No firms match your filters</p>
              <p className="mt-1 text-xs text-slate-500">Try broadening your search or clearing a filter.</p>
              <Link
                href="/hiring-firms"
                className="mt-3 inline-flex border border-slate-900 bg-slate-900 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-white"
              >
                CLEAR FILTERS
              </Link>
            </div>
          )}

          {displayedFirms.map((firm) => (
            <FirmCard key={firm.id} firm={firm} canTrack={access.isAuthenticated} />
          ))}

          {teaserFirms.map((firm) => (
            <TeaserCard key={`teaser-${firm.id}`} firm={firm} />
          ))}

          {teaserFirms.length > 0 && (
            <div className="col-span-full rounded-md border-2 border-dashed border-amber-400 bg-amber-50/80 px-6 py-8 text-center">
              <p className="text-lg font-bold text-slate-900">{totalCount - FREE_VISIBLE_COUNT}+ more firms are waiting</p>
              <p className="mt-2 text-sm text-slate-600">
                You are seeing {FREE_VISIBLE_COUNT} of {totalCount} verified firms. Unlock the full directory with pay rates,
                contact info, and AI-powered firm matching.
              </p>
              <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <DirectoryUpgradeLink
                  source="blurred_teasers"
                  planUid={access.planUid}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  eventData={{
                    visibleCount: FREE_VISIBLE_COUNT,
                    teaserCount: teaserFirms.length,
                    totalCount,
                  }}
                >
                  See Plans & Unlock Directory
                  <span aria-hidden="true">-&gt;</span>
                </DirectoryUpgradeLink>
                <span className="text-xs text-slate-500">Starting at $37/year</span>
              </div>
            </div>
          )}
        </div>

        <aside className="hidden h-fit border border-slate-200 bg-slate-50 px-4 py-4 text-sm shadow-sm lg:sticky lg:top-8 lg:block">
          <h2 className="text-sm font-semibold text-slate-900">Map view</h2>
          <p className="mb-3 mt-1 text-xs text-slate-600">
            Firms operate nationwide. Check specific service areas in the listing details.
          </p>
          <div className="relative h-48 w-full border border-slate-200 bg-white">
            <Image
              src="/hiring-firms-map.jpg"
              alt="Map of US Service Coverage"
              fill
              sizes="300px"
              className="object-cover"
            />
          </div>
        </aside>
      </section>

      {totalPages > 1 && !access.isRestricted && (
        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-4 text-xs font-semibold tracking-[0.16em] text-slate-500 sm:flex-row sm:items-center">
          <span className="text-[11px] uppercase">
            Showing {startIndex}-{endIndex} of {totalCount}
          </span>
          <div className="flex items-center gap-3">
            {canGoBack ? (
              <Link
                href={buildDirectoryUrl(filters, limit, { page: String(page - 1) })}
                className="border border-slate-300 px-3 py-2 text-[11px] text-slate-700"
                aria-label="Previous page"
              >
                &lt;- Prev
              </Link>
            ) : (
              <span className="cursor-not-allowed border border-slate-300 px-3 py-2 text-[11px] text-slate-400">
                &lt;- Prev
              </span>
            )}
            <span className="text-[11px] uppercase text-slate-500">
              Page {page} of {totalPages}
            </span>
            {canGoForward ? (
              <Link
                href={buildDirectoryUrl(filters, limit, { page: String(page + 1) })}
                className="border border-slate-300 px-3 py-2 text-[11px] text-slate-700"
                aria-label="Next page"
              >
                Next -&gt;
              </Link>
            ) : (
              <span className="cursor-not-allowed border border-slate-300 px-3 py-2 text-[11px] text-slate-400">
                Next -&gt;
              </span>
            )}
          </div>
        </div>
      )}

      {access.isFree && firms.length > displayedFirms.length && (
        <p className="mt-4 text-xs text-slate-600">
          Showing {displayedFirms.length} of {totalCount} verified firms on the Free preview. Upgrade to unlock them all.
        </p>
      )}

      {!access.isRestricted && (
        <p className="mt-4 text-xs text-slate-600">
          You have full directory access. As new published firms are added, they will appear here automatically.
        </p>
      )}
    </main>
  )
}
