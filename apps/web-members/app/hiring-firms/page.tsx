import type { Metadata } from 'next'
import Link from 'next/link'
import { DirectoryView } from './DirectoryView'
import type { DirectoryAccess, DirectoryFilters, Firm } from './DirectoryView'
import { generatePageMetadata, getFAQPageSchema } from '@/lib/seo'
import { US_STATES } from './constants'
import { ALL_STATE_SLUGS, STATE_MAP, TOP_STATES } from './state-data'
import { TESTIMONIALS, getAverageRating } from '@/lib/testimonials'
import { getCurrentUser } from '@/lib/auth-server'
import { PLAN_UIDS } from '@/lib/plan-config'

export const metadata: Metadata = generatePageMetadata({
  title: 'Field Inspection Companies Hiring | Firm Directory',
  description: 'Compare field inspection companies, mortgage field service firms, mobile notary vendors, and property preservation firms hiring independent contractors across the US.',
  path: '/hiring-firms',
})

const directoryFaqs = [
  {
    question: 'What companies hire field inspectors?',
    answer:
      'Mortgage field service companies, insurance loss control firms, property preservation vendors, appraisal support companies, signing services, and national vendor networks hire field inspectors and mobile contractors. Nested Objects helps compare those firms by service area, role fit, pay clues, and onboarding expectations.',
  },
  {
    question: 'How do I find field inspection companies hiring near me?',
    answer:
      'Start with your state directory, then compare national firms that list nationwide or all-50-state coverage. Shortlist companies that match your counties, assignment type, equipment, schedule, and comfort with appointments or route-based work.',
  },
  {
    question: 'Which field inspection firms are best for beginners?',
    answer:
      'Beginner-friendly firms usually explain onboarding steps clearly, offer simple exterior or occupancy assignments, provide realistic photo standards, and do not require specialized equipment before the work is explained. Always verify pay timing, revision rules, and active local volume before applying.',
  },
  {
    question: 'How many inspection firms should I apply to?',
    answer:
      'Most independent contractors should compare several firms instead of relying on one portal. A practical starting shortlist is five to ten companies across mortgage field inspection, loss control, preservation, notary, and appraisal support lanes.',
  },
  {
    question: 'What should I compare before applying to a firm?',
    answer:
      'Compare service area, order type, pay structure, trip fees, revision policy, equipment requirements, background checks, payment timing, contractor feedback, and whether the firm has enough work near your route to justify onboarding.',
  },
]

const directoryAnswerBlocks = [
  {
    title: 'Best first step',
    body: 'Choose your state, then build a shortlist of firms that cover your counties plus national companies with verified nationwide coverage.',
  },
  {
    title: 'Best firms for beginners',
    body: 'Look for clear onboarding, simple photo assignments, realistic turnaround times, and low-friction requirements before taking specialty or appointment-heavy work.',
  },
  {
    title: 'Best route-fit signal',
    body: 'A good firm match names your service area, explains assignment types, and gives enough pay or revision detail to estimate whether the route is worth driving.',
  },
  {
    title: 'Best way to compare pay',
    body: 'Do not compare only the posted fee. Net pay depends on distance, density, trip fees, photo requirements, revision risk, and payment timing.',
  },
]

const directoryWorkTypes = [
  {
    title: 'Mortgage field inspection companies',
    href: '/roles/mortgage-field-inspector',
    body: 'Best for occupancy checks, exterior photos, property condition notes, lender status checks, and route-based mortgage field service work.',
  },
  {
    title: 'Insurance loss control firms',
    href: '/roles/insurance-loss-control',
    body: 'Best for underwriting surveys, appointment-based visits, measurements, hazard notes, and residential or commercial risk documentation.',
  },
  {
    title: 'Mobile notary and signing vendors',
    href: '/roles/mobile-notary',
    body: 'Best for commissioned notaries comparing signing services, title vendors, RON platforms, scan-back rules, and route-compatible add-ons.',
  },
  {
    title: 'Property preservation vendors',
    href: '/roles/asset-preservation',
    body: 'Best for vacant property checks, preservation documentation, before-and-after photos, securing notes, debris, and REO support lanes.',
  },
]

const directoryComparisonChecks = [
  'Does the firm cover your state, metro, counties, or route radius right now?',
  'Are assignment types clear: occupancy, exterior photos, loss control, notary, preservation, appraisal support, or specialty surveys?',
  'Can you estimate net pay after mileage, print costs, gear, appointment windows, and revision risk?',
  'Are onboarding requirements reasonable before you upload personal documents or sensitive credentials?',
  'Do contractor notes, reviews, or profile details suggest fair communication and predictable payment timing?',
]

const directoryFaqSchema = getFAQPageSchema(directoryFaqs)

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
const FREE_VISIBLE_COUNT = 3
const FREE_TEASER_COUNT = 4

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
    `services.ilike.*${query}*`,
    `description.ilike.*${query}*`,
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

function sanitizeFreePreviewFirms(firms: Firm[]) {
  return firms.map((firm, index) => {
    if (index < FREE_VISIBLE_COUNT) return firm

    return {
      ...firm,
      url: null,
      vendor_page_url: null,
      pay_min: null,
      pay_max: null,
      pay_type: null,
      phone: null,
      email: null,
      address: null,
      compensation_structure: null,
      client_reviews: null,
    }
  })
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

function DirectoryRankingHub({ states }: { states: StateIndexEntry[] }) {
  const topStateLinks = TOP_STATES
    .map((slug) => STATE_MAP[slug])
    .filter(Boolean)
    .slice(0, 10)

  return (
    <section className="border-y border-slate-200 bg-slate-50 px-4 py-10 [content-visibility:auto] [contain-intrinsic-size:0_980px] sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
              Field inspection companies
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Compare firms before you apply, upload documents, or accept route work.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Nested Objects organizes mortgage field service companies, insurance loss control firms,
              mobile notary vendors, property preservation networks, and appraisal support firms so
              contractors can compare the real fit before spending time in vendor portals.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/tools"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-copper hover:text-brand-copper"
              >
                Preview income tool
              </Link>
              <Link
                href="/inspector-resource-center/firm-intel"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-copper hover:text-brand-copper"
              >
                Learn how firm intel works
              </Link>
              <Link
                href="/membership-pricing"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-copper hover:text-brand-copper"
              >
                Compare Free vs Pro
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {directoryAnswerBlocks.map((item) => (
              <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {directoryWorkTypes.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-copper/60 hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-slate-950 group-hover:text-brand-copper">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              <span className="mt-3 inline-flex text-xs font-semibold text-brand-copper">
                Read role guide
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
              Compare before applying
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              Five checks every contractor should run on a firm profile
            </h3>
            <ul className="mt-5 space-y-3">
              {directoryComparisonChecks.map((check) => (
                <li key={check} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">
              Popular state searches
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              Start with states where field-service demand is easier to compare.
            </h3>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {topStateLinks.map((state) => (
                <Link
                  key={state.slug}
                  href={`/hiring-firms/${state.slug}`}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-copper hover:text-brand-copper"
                >
                  {state.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              The full index includes {states.length} state pages for field inspection, notary,
              loss control, preservation, and appraisal support research.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
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
  const user = await getCurrentUser()
  const planUid = user?.['outseta:planUid'] ?? null
  const isGuest = !user
  const isFree = planUid === PLAN_UIDS.FREE
  const isRestricted = isGuest || isFree

  const page = isRestricted ? DEFAULT_PAGE : parsePositiveInt(params?.page, DEFAULT_PAGE)
  const limit = isRestricted
      ? FREE_VISIBLE_COUNT + FREE_TEASER_COUNT
      : Math.min(parsePositiveInt(params?.limit, DEFAULT_LIMIT), MAX_LIMIT)
  const stateFilter = isRestricted ? 'ALL' : params?.state ?? 'ALL'
  const search = isRestricted ? '' : params?.search ?? ''
  const ratingMin = isRestricted ? 'ALL' : params?.rating ?? 'ALL'
  const industry = isRestricted ? 'ALL' : params?.industry ?? 'ALL'
  const source = isRestricted ? 'ALL' : params?.source ?? 'ALL'
  const pay = isRestricted ? 'ALL' : params?.pay ?? 'ALL'
  const sort = isRestricted ? 'rating_desc' : params?.sort ?? 'rating_desc'
  const { firms, totalCount } = await getFirms(
    page,
    limit,
    stateFilter,
    search,
    ratingMin,
    industry,
    source,
    pay,
    sort,
  )
  const directoryFirms = isGuest ? [] : isFree ? sanitizeFreePreviewFirms(firms) : firms
  const stateIndex = getStateIndex()
  const filters: DirectoryFilters = {
    state: stateFilter,
    search,
    rating: ratingMin,
    industry,
    source,
    pay,
    sort,
  }
  const access: DirectoryAccess = {
    isAuthenticated: !isGuest,
    isFree,
    isRestricted,
    planUid,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(directoryFaqSchema) }}
      />
      <DirectoryView
        initialFirms={directoryFirms}
        totalCount={totalCount}
        page={page}
        limit={limit}
        filters={filters}
        access={access}
      />
      <DirectoryRankingHub states={stateIndex} />
    </>
  )
}
