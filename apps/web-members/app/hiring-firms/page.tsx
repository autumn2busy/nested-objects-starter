import type { Metadata } from 'next'
import Link from 'next/link'
import { DirectoryView } from './DirectoryView'
import type { Firm } from './DirectoryView'
import { generatePageMetadata } from '@/lib/seo'
import { US_STATES } from './constants'
import { ALL_STATE_SLUGS, STATE_MAP } from './state-data'
import { TESTIMONIALS, getAverageRating } from '@/lib/testimonials'

export const metadata: Metadata = generatePageMetadata({
  title: 'Firm Directory | Field Inspection & Notary Vendors',
  description: 'Browse verified firms hiring field inspectors, notaries, and appraisal professionals across the US.',
  path: '/hiring-firms',
})

const aggregateRatingSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nested Objects',
  url: 'https://members.nestedobjects.com',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: getAverageRating(),
    bestRating: 5,
    worstRating: 1,
    reviewCount: TESTIMONIALS.length,
  },
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60

type FirmResponse = {
  firms: Firm[]
  totalCount: number
}

type FirmIndexEntry = {
  slug: string
  name: string
  industry_focus: string | null
}

type StateIndexEntry = {
  slug: string
  label: string
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed
}

function isPublicFirmSlug(slug: string | null): slug is string {
  return Boolean(slug && /^[a-z0-9-]+$/.test(slug))
}

function sanitizeFilterValue(value: string) {
  return value.replace(/[(),]/g, ' ').trim()
}

function getStateLabel(stateCode: string) {
  return US_STATES.find((state) => state.code === stateCode)?.label ?? ''
}

function buildSearchOrFilter(search: string) {
  const query = sanitizeFilterValue(search)
  if (!query) return null
  return [
    `name.ilike.*${query}*`,
    `industry_focus.ilike.*${query}*`,
    `geographic_coverage.ilike.*${query}*`,
    `company_size.ilike.*${query}*`,
    `pay_type.ilike.*${query}*`,
  ].join(',')
}

function buildStateOrFilter(stateCode: string) {
  if (!stateCode || stateCode === 'ALL') return null
  const label = sanitizeFilterValue(getStateLabel(stateCode))
  const code = sanitizeFilterValue(stateCode)
  const parts = [
    label ? `geographic_coverage.ilike.*${label}*` : null,
    code ? `geographic_coverage.ilike.*${code}*` : null,
    'geographic_coverage.ilike.*national*',
    'geographic_coverage.ilike.*nationwide*',
    'geographic_coverage.ilike.*all 50*',
  ].filter(Boolean) as string[]
  return parts.length ? parts.join(',') : null
}

function buildIndustryOrFilter(industry: string) {
  if (!industry || industry === 'ALL') return null
  const q = sanitizeFilterValue(industry)
  // Some industry values use different separators, so match loosely
  return `industry_focus.ilike.*${q}*`
}

function buildSourceOrFilter(source: string) {
  if (!source || source === 'ALL') return null
  const q = sanitizeFilterValue(source)
  return `source.ilike.*${q}*`
}

async function getFirms(
  page: number,
  limit: number,
  stateFilter: string,
  search: string,
  ratingMin: string,
  industry: string,
  source: string,
  payMin: string,
  sortBy: string,
): Promise<FirmResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { firms: [], totalCount: 0 }

  try {
    const offset = (page - 1) * limit
    const params = new URLSearchParams()
    params.set(
      'select',
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
        'is_published',
        'rating',
        'contractor_rating',
        'rating_count',
        'verified_at',
        'phone',
        'email',
        'address',
        'latitude',
        'longitude',
        'source',
        'compensation_structure',
        'client_reviews',
        'description',
        'services',
      ].join(','),
    )
    params.set('is_published', 'eq.true')

    if (sortBy === 'name_asc') {
      params.set('order', 'name.asc')
    } else if (sortBy === 'name_desc') {
      params.set('order', 'name.desc.nullslast')
    } else if (sortBy === 'pay_desc') {
      params.set('order', 'pay_max.desc.nullslast,name.asc')
    } else if (sortBy === 'pay_asc') {
      params.set('order', 'pay_max.asc.nullsfirst,name.asc')
    } else {
      params.set('order', 'contractor_rating.desc.nullslast,name.asc')
    }

    // limit and offset are set below, conditionally based on pay filter

    // Rating filter — applied directly as a PostgREST param
    if (ratingMin && ratingMin !== 'ALL') {
      const minVal = parseFloat(ratingMin)
      if (!isNaN(minVal) && minVal > 0) {
        params.set('contractor_rating', `gte.${minVal}`)
      }
    }

    // Build AND-combined filters
    const searchFilter = buildSearchOrFilter(search)
    const stateFilterValue = buildStateOrFilter(stateFilter)
    const industryFilter = buildIndustryOrFilter(industry)
    const sourceFilter = buildSourceOrFilter(source)

    const andFilters: string[] = []
    if (stateFilterValue) andFilters.push(`or(${stateFilterValue})`)
    if (searchFilter) andFilters.push(`or(${searchFilter})`)
    if (industryFilter) andFilters.push(industryFilter)
    if (sourceFilter) andFilters.push(sourceFilter)

    // NOTE: pay_min/pay_max are stored as TEXT in the database, so PostgREST
    // does lexicographic comparison (e.g. "25" > "100"). We must filter
    // client-side after parsing pay values as numbers.
    const payMinFilter = (payMin && payMin !== 'ALL') ? parseFloat(payMin) : null

    // When pay filter is active, fetch ALL firms (skip pagination) so we can
    // filter numerically across the full dataset, then paginate in JS.
    if (!payMinFilter) {
      params.set('limit', String(limit))
      params.set('offset', String(offset))
    }

    if (andFilters.length > 0) {
      params.set('and', `(${andFilters.join(',')})`)
    }

    const url = `${SUPABASE_URL}/rest/v1/firms?${params.toString()}`

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'count=exact',
      },
      next: { tags: ['firms'] },
    })

    if (!res.ok) throw new Error('Failed to fetch firms')
    const contentRange = res.headers.get('content-range')
    const countFromHeader = contentRange
      ? Number.parseInt(contentRange.split('/')[1] ?? '', 10)
      : Number.NaN
    let firms = (await res.json()) as Firm[]

    // Apply pay range filter client-side (numeric comparison)
    if (payMinFilter && !isNaN(payMinFilter) && payMinFilter > 0) {
      firms = firms.filter(f => {
        const fMax = f.pay_max != null ? parseFloat(String(f.pay_max)) : null
        const fMin = f.pay_min != null ? parseFloat(String(f.pay_min)) : null
        // A firm matches if its max pay OR min pay reaches the threshold
        return (fMax != null && !isNaN(fMax) && fMax >= payMinFilter) ||
          (fMin != null && !isNaN(fMin) && fMin >= payMinFilter)
      })
      // Paginate filtered results in JS
      const totalFiltered = firms.length
      firms = firms.slice(offset, offset + limit)
      return { firms, totalCount: totalFiltered }
    }

    return {
      firms,
      totalCount: Number.isFinite(countFromHeader) ? countFromHeader : firms.length,
    }
  } catch (error) {
    console.error('Error fetching firms', error)
    return { firms: [], totalCount: 0 }
  }
}

async function getFirmIndex(): Promise<FirmIndexEntry[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []

  try {
    const params = new URLSearchParams()
    params.set('select', 'slug,name,industry_focus')
    params.set('is_published', 'eq.true')
    params.set('order', 'name.asc')
    params.set('limit', '1000')

    const res = await fetch(`${SUPABASE_URL}/rest/v1/firms?${params.toString()}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { tags: ['firms'] },
    })

    if (!res.ok) throw new Error('Failed to fetch firm index')
    const rows = (await res.json()) as {
      slug: string | null
      name: string | null
      industry_focus: string | null
    }[]

    return rows
      .filter((firm): firm is FirmIndexEntry => isPublicFirmSlug(firm.slug) && Boolean(firm.name))
      .map((firm) => ({
        slug: firm.slug,
        name: firm.name,
        industry_focus: firm.industry_focus,
      }))
  } catch (error) {
    console.error('Error fetching firm index', error)
    return []
  }
}

function getStateIndex(): StateIndexEntry[] {
  return ALL_STATE_SLUGS
    .map((slug) => STATE_MAP[slug])
    .filter(Boolean)
    .map((state) => ({ slug: state.slug, label: state.label }))
}

function DirectoryCrawlIndex({
  firms,
  states,
}: {
  firms: FirmIndexEntry[]
  states: StateIndexEntry[]
}) {
  return (
    <section className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Firm index
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Browse published hiring profiles
            </h2>
            <div className="mt-5 grid gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {firms.map((firm) => (
                <Link
                  key={firm.slug}
                  href={`/firms/${firm.slug}`}
                  className="group border-b border-slate-100 py-2 text-sm"
                >
                  <span className="font-semibold text-slate-800 group-hover:text-brand">
                    {firm.name}
                  </span>
                  {firm.industry_focus && (
                    <span className="block truncate text-xs text-slate-500">
                      {firm.industry_focus}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              State index
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Browse by service area
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {states.map((state) => (
                <Link
                  key={state.slug}
                  href={`/hiring-firms/${state.slug}`}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
                >
                  {state.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

type DirectoryPageProps = {
  searchParams: Promise<{
    page?: string
    limit?: string
    state?: string
    search?: string
    rating?: string
    industry?: string
    source?: string
    pay?: string
    sort?: string
  }>
}

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const params = await searchParams
  const page = parsePositiveInt(params?.page, DEFAULT_PAGE)
  const limit = Math.min(parsePositiveInt(params?.limit, DEFAULT_LIMIT), MAX_LIMIT)
  const stateFilter = params?.state ?? 'ALL'
  const search = params?.search ?? ''
  const ratingMin = params?.rating ?? 'ALL'
  const industry = params?.industry ?? 'ALL'
  const source = params?.source ?? 'ALL'
  const pay = params?.pay ?? 'ALL'
  const sort = params?.sort ?? 'rating_desc'
  const [{ firms, totalCount }, firmIndex] = await Promise.all([
    getFirms(page, limit, stateFilter, search, ratingMin, industry, source, pay, sort),
    getFirmIndex(),
  ])
  const stateIndex = getStateIndex()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }}
      />
      <DirectoryView
        initialFirms={firms}
        totalCount={totalCount}
        page={page}
        limit={limit}
      />
      <DirectoryCrawlIndex firms={firmIndex} states={stateIndex} />
    </>
  )
}
