import type { Metadata } from 'next'
import { DirectoryView, type Firm } from './DirectoryView'
import { generatePageMetadata } from '@/lib/seo'
import { US_STATES } from './constants'

export const metadata: Metadata = generatePageMetadata({
  title: 'Firm Directory | Field Inspection & Notary Vendors',
  description: 'Browse verified firms hiring field inspectors, notaries, and appraisal professionals across the US.',
  path: '/directory',
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60
const PREVIEW_LIMIT = 6

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
    `categories.ilike.*${query}*`,
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

async function getFirms(
  page: number,
  limit: number,
  stateFilter: string,
  search: string,
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
        'rating_count',
        'verified_at',
        'phone',
        'email',
        'address',
        'latitude',
        'longitude',
      ].join(','),
    )
    params.set('is_published', 'eq.true')
    params.set('order', 'created_at.desc')
    params.set('limit', String(limit))
    params.set('offset', String(offset))

    const searchFilter = buildSearchOrFilter(search)
    const stateFilterValue = buildStateOrFilter(stateFilter)
    const andFilters = [stateFilterValue, searchFilter].filter(Boolean) as string[]
    if (andFilters.length > 0) {
      params.set('and', `(${andFilters.map((value) => `or(${value})`).join(',')})`)
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
  searchParams?: { page?: string; limit?: string; state?: string; search?: string }
}

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const page = parsePositiveInt(searchParams?.page, DEFAULT_PAGE)
  const limit = Math.min(parsePositiveInt(searchParams?.limit, DEFAULT_LIMIT), MAX_LIMIT)
  const stateFilter = searchParams?.state ?? 'ALL'
  const search = searchParams?.search ?? ''
  const { firms, totalCount } = await getFirms(page, limit, stateFilter, search)

  return (
    <DirectoryView
      initialFirms={firms}
      totalCount={totalCount}
      page={effectivePage}
      limit={effectiveLimit}
    />
  )
}
