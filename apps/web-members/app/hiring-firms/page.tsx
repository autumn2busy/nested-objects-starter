import type { Metadata } from 'next'
import { DirectoryView } from './DirectoryView'
import type { Firm } from './DirectoryView'
import { generatePageMetadata } from '@/lib/seo'
import { US_STATES } from './constants'

export const metadata: Metadata = generatePageMetadata({
  title: 'Firm Directory | Field Inspection & Notary Vendors',
  description: 'Browse verified firms hiring field inspectors, notaries, and appraisal professionals across the US.',
  path: '/hiring-firms',
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60

type FirmResponse = {
  firms: Firm[]
  totalCount: number
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed
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

    params.set('limit', String(limit))
    params.set('offset', String(offset))

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

    if (payMin && payMin !== 'ALL') {
      const minVal = parseFloat(payMin)
      if (!isNaN(minVal) && minVal > 0) {
        andFilters.push(`or(pay_max.gte.${minVal},pay_min.gte.${minVal})`)
      }
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
      next: { revalidate: 300 },
    })

    if (!res.ok) throw new Error('Failed to fetch firms')
    const contentRange = res.headers.get('content-range')
    const countFromHeader = contentRange
      ? Number.parseInt(contentRange.split('/')[1] ?? '', 10)
      : Number.NaN
    const firms = (await res.json()) as Firm[]

    return {
      firms,
      totalCount: Number.isFinite(countFromHeader) ? countFromHeader : firms.length,
    }
  } catch (error) {
    console.error('Error fetching firms', error)
    return { firms: [], totalCount: 0 }
  }
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
  const { firms, totalCount } = await getFirms(page, limit, stateFilter, search, ratingMin, industry, source, pay, sort)

  return (
    <DirectoryView
      initialFirms={firms}
      totalCount={totalCount}
      page={page}
      limit={limit}
    />
  )
}