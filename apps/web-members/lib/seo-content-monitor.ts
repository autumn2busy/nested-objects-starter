import { SignJWT, importPKCS8 } from 'jose'
import { getAllBlogPosts } from '@/lib/blog'
import { SITE_URL } from '@/lib/seo'

type SourceStatus = 'configured' | 'missing_config' | 'error'

type SourceRun = {
  name: string
  status: SourceStatus
  detail: string
  count?: number
}

type SearchConsoleRow = {
  query: string
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

type Ga4Row = {
  dimension: string
  metric: number
  source: 'pagePath' | 'eventName'
}

type PageSpeedRow = {
  url: string
  strategy: 'mobile' | 'desktop'
  performanceScore: number | null
  opportunities: string[]
}

export type SeoContentOpportunity = {
  id: string
  title: string
  angle: string
  category: 'field-inspection' | 'property-preservation' | 'firm-growth' | 'route-operations'
  priority: 'high' | 'medium' | 'low'
  score: number
  recommendedSurface: 'blog_supporting_article' | 'role_page_refresh' | 'tool_page_support' | 'directory_support'
  workflowStatus: 'candidate'
  targetKeywords: string[]
  internalLinks: { label: string; href: string }[]
  rationale: string
  sourceSignals: string[]
}

export type SeoContentMonitorReport = {
  generatedAt: string
  cadence: 'weekly'
  workflowBoundary: string
  dataSources: SourceRun[]
  opportunities: SeoContentOpportunity[]
}

const SEARCH_CONSOLE_ENDPOINT = 'https://searchconsole.googleapis.com/webmasters/v3/sites'
const GA4_ENDPOINT = 'https://analyticsdata.googleapis.com/v1beta'
const PAGE_SPEED_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_API_TIMEOUT_MS = 10_000
const PAGE_SPEED_TIMEOUT_MS = 15_000
const SOURCE_TIMEOUT_MS = 30_000
const PAGE_SPEED_STRATEGIC_URL_LIMIT = 3

const STRATEGIC_URLS = [
  '/roles/mobile-notary',
  '/hiring-firms',
  '/tools',
  '/roles/mortgage-field-inspector',
  '/roles/insurance-loss-control',
  '/guides/how-to-become-a-field-inspector',
] as const

const FALLBACK_OPPORTUNITIES: SeoContentOpportunity[] = [
  {
    id: 'fallback-mobile-notary-signing-services',
    title: 'How Mobile Notaries Can Choose Signing Services Without Wasting Upload Time',
    angle:
      'Explain how to compare signing services by territory fit, document package complexity, scan-back expectations, payment timing, and vendor portal friction.',
    category: 'firm-growth',
    priority: 'high',
    score: 83,
    recommendedSurface: 'blog_supporting_article',
    workflowStatus: 'candidate',
    targetKeywords: ['mobile notary signing services', 'signing agent companies', 'notary vendor applications'],
    internalLinks: [
      { label: 'Mobile notary role page', href: '/roles/mobile-notary' },
      { label: 'Hiring firm directory', href: '/hiring-firms?industry=Notary' },
      { label: 'Route tool preview', href: '/tools' },
    ],
    rationale:
      'The new notary pillar needs supporting content that answers vendor-selection questions without duplicating the pillar page.',
    sourceSignals: ['notary pillar launched', 'directory has notary filters', 'calculator supports route economics'],
  },
  {
    id: 'fallback-ron-platform-requirements',
    title: 'RON Platform Requirements for Mobile Notaries and Signing Agents',
    angle:
      'Cover remote online notarization readiness, state-by-state caveats, ID verification, technology requirements, and when RON complements route work.',
    category: 'field-inspection',
    priority: 'medium',
    score: 76,
    recommendedSurface: 'blog_supporting_article',
    workflowStatus: 'candidate',
    targetKeywords: ['RON platform requirements', 'remote online notarization platform', 'online notary requirements'],
    internalLinks: [
      { label: 'Mobile notary role page', href: '/roles/mobile-notary' },
      { label: 'RON directory filter', href: '/hiring-firms?industry=Notary&search=RON' },
    ],
    rationale:
      'RON is a distinct notary research path and deserves supporting content that links back to the canonical notary page.',
    sourceSignals: ['notary quick filter exists', 'RON is a notary-specific directory category'],
  },
  {
    id: 'fallback-notary-inspection-route-stack',
    title: 'How to Stack Notary Signings With Field Inspection and Photo Assignments',
    angle:
      'Show how notaries can add nearby inspection, photo, courier, and occupancy tasks without creating second trips or scope confusion.',
    category: 'route-operations',
    priority: 'high',
    score: 81,
    recommendedSurface: 'blog_supporting_article',
    workflowStatus: 'candidate',
    targetKeywords: ['notary route income', 'notary and field inspection work', 'signing agent side work'],
    internalLinks: [
      { label: 'Route tool preview', href: '/tools' },
      { label: 'Hiring firm directory', href: '/hiring-firms' },
    ],
    rationale:
      'This bridges notary visibility with Nested Objects route economics and firm-intel positioning.',
    sourceSignals: ['route calculator launched', 'field add-on directory filter exists'],
  },
  {
    id: 'fallback-insurance-loss-control-requirements',
    title: 'Insurance Loss Control Inspection Requirements: What New Contractors Should Know',
    angle:
      'Explain photos, safety observations, interview boundaries, commercial property expectations, and how loss-control differs from mortgage inspection.',
    category: 'field-inspection',
    priority: 'medium',
    score: 72,
    recommendedSurface: 'blog_supporting_article',
    workflowStatus: 'candidate',
    targetKeywords: ['insurance loss control inspection requirements', 'loss control inspector contractor', 'insurance inspection jobs'],
    internalLinks: [
      { label: 'Insurance loss control role page', href: '/roles/insurance-loss-control' },
      { label: 'Hiring firm directory', href: '/hiring-firms?industry=Insurance' },
    ],
    rationale:
      'Insurance inspection questions are adjacent to the core field-inspection audience and can support the existing role page.',
    sourceSignals: ['role page exists', 'insurance directory filter exists'],
  },
]

function todayIso() {
  return new Date().toISOString()
}

function normalizePrivateKey(value?: string) {
  return value?.replace(/\\n/g, '\n')
}

function hasOAuthCredentials() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  )
}

function hasServiceAccountCredentials() {
  return Boolean(process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
}

function seconds(ms: number) {
  return Math.round(ms / 1000)
}

function isAbortError(error: unknown) {
  return error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('aborted'))
}

function describeFetchError(error: unknown, sourceName: string, timeoutMs: number) {
  if (isAbortError(error)) return `${sourceName} timed out after ${seconds(timeoutMs)} seconds.`
  return error instanceof Error ? error.message : `Unknown ${sourceName} error.`
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = GOOGLE_API_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

type SourceResult<T> = { rows: T[]; source: SourceRun }
type GoogleAuthMode = 'oauth' | 'service_account'
type GoogleAccessTokenResult =
  | { token: string; mode: GoogleAuthMode; error?: never }
  | { token: null; mode: GoogleAuthMode | 'none'; error: string }

async function withSourceTimeout<T>(
  sourceName: string,
  run: () => Promise<SourceResult<T>>,
  timeoutMs = SOURCE_TIMEOUT_MS,
): Promise<SourceResult<T>> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      run(),
      new Promise<SourceResult<T>>((resolve) => {
        timeout = setTimeout(() => {
          resolve({
            rows: [],
            source: {
              name: sourceName,
              status: 'error',
              detail: `${sourceName} exceeded ${seconds(timeoutMs)} seconds; returning a partial monitor report.`,
            },
          })
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function getGoogleErrorDetail(response: Response) {
  const text = await response.text().catch(() => '')
  if (!text) return ''

  try {
    const data = JSON.parse(text) as {
      error?: string | { message?: string; status?: string }
      error_description?: string
    }
    if (typeof data.error === 'string') return [data.error, data.error_description].filter(Boolean).join(' - ')
    return [data.error?.status, data.error?.message].filter(Boolean).join(': ')
  } catch {
    return text.slice(0, 240)
  }
}

async function getGoogleOAuthAccessToken(): Promise<GoogleAccessTokenResult> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim()

  if (!clientId || !clientSecret || !refreshToken) {
    return { token: null, mode: 'oauth', error: 'OAuth credentials are not fully configured.' }
  }

  const response = await fetchWithTimeout(
    GOOGLE_TOKEN_ENDPOINT,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    },
    GOOGLE_API_TIMEOUT_MS,
  )

  if (!response.ok) {
    const detail = await getGoogleErrorDetail(response)
    return {
      token: null,
      mode: 'oauth',
      error: `OAuth token exchange returned ${response.status}${detail ? `: ${detail}` : ''}.`,
    }
  }
  const data = (await response.json()) as { access_token?: string }
  if (!data.access_token) return { token: null, mode: 'oauth', error: 'OAuth token response did not include access_token.' }

  return { token: data.access_token, mode: 'oauth' }
}

async function getGoogleServiceAccountAccessToken(scopes: string[]): Promise<GoogleAccessTokenResult> {
  const email = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY)

  if (!email || !privateKey) {
    return { token: null, mode: 'service_account', error: 'Service-account credentials are not fully configured.' }
  }

  const key = await importPKCS8(privateKey, 'RS256')
  const now = Math.floor(Date.now() / 1000)
  const jwt = await new SignJWT({
    scope: scopes.join(' '),
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(email)
    .setAudience(GOOGLE_TOKEN_ENDPOINT)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key)

  const response = await fetchWithTimeout(
    GOOGLE_TOKEN_ENDPOINT,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    },
    GOOGLE_API_TIMEOUT_MS,
  )

  if (!response.ok) {
    const detail = await getGoogleErrorDetail(response)
    return {
      token: null,
      mode: 'service_account',
      error: `Service-account token exchange returned ${response.status}${detail ? `: ${detail}` : ''}.`,
    }
  }
  const data = (await response.json()) as { access_token?: string }
  if (!data.access_token) {
    return { token: null, mode: 'service_account', error: 'Service-account token response did not include access_token.' }
  }

  return { token: data.access_token, mode: 'service_account' }
}

async function getGoogleAccessToken(scopes: string[]): Promise<GoogleAccessTokenResult> {
  if (hasOAuthCredentials()) {
    return getGoogleOAuthAccessToken()
  }

  if (hasServiceAccountCredentials()) {
    return getGoogleServiceAccountAccessToken(scopes)
  }

  return { token: null, mode: 'none', error: 'No Google OAuth or service-account credentials are configured.' }
}

function googleAuthConfigDetail(sourceName: 'Google Search Console' | 'GA4') {
  const oauthEnv =
    'GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN'
  const serviceAccountEnv = 'GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY'

  if (sourceName === 'GA4') {
    return `Set GA4_PROPERTY_ID plus ${oauthEnv}. Service-account fallback uses ${serviceAccountEnv} if that account can be granted Analytics access.`
  }

  return `Set ${oauthEnv}. Service-account fallback uses ${serviceAccountEnv} if that account can be granted Search Console access.`
}

function getDateRange(days = 28) {
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 3)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - days)

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

async function fetchSearchConsoleRows(): Promise<{ rows: SearchConsoleRow[]; source: SourceRun }> {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || process.env.SEARCH_CONSOLE_SITE_URL || SITE_URL

  if (!hasOAuthCredentials() && !hasServiceAccountCredentials()) {
    return {
      rows: [],
      source: {
        name: 'Google Search Console',
        status: 'missing_config',
        detail: googleAuthConfigDetail('Google Search Console'),
      },
    }
  }

  try {
    const auth = await getGoogleAccessToken(['https://www.googleapis.com/auth/webmasters.readonly'])
    if (!auth.token) {
      return {
        rows: [],
        source: {
          name: 'Google Search Console',
          status: 'error',
          detail: `Could not obtain Google access token using ${auth.mode} auth: ${auth.error}`,
        },
      }
    }

    const { startDate, endDate } = getDateRange()
    const response = await fetchWithTimeout(
      `${SEARCH_CONSOLE_ENDPOINT}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['query', 'page'],
          rowLimit: 250,
        }),
        cache: 'no-store',
      },
      GOOGLE_API_TIMEOUT_MS,
    )

    if (!response.ok) {
      const detail = await getGoogleErrorDetail(response)
      return {
        rows: [],
        source: {
          name: 'Google Search Console',
          status: 'error',
          detail: `Search Console returned ${response.status} using ${auth.mode} auth for ${siteUrl}.${detail ? ` Google said: ${detail}` : ''}`,
        },
      }
    }

    const data = (await response.json()) as {
      rows?: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }[]
    }
    const rows = (data.rows || [])
      .map((row) => ({
        query: row.keys?.[0] || '',
        page: row.keys?.[1] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }))
      .filter((row) => row.query)

    return {
      rows,
      source: {
        name: 'Google Search Console',
        status: 'configured',
        detail: `Pulled ${rows.length} query/page rows for ${startDate} to ${endDate} using ${auth.mode} auth.`,
        count: rows.length,
      },
    }
  } catch (error) {
    return {
      rows: [],
      source: {
        name: 'Google Search Console',
        status: 'error',
        detail: describeFetchError(error, 'Search Console', GOOGLE_API_TIMEOUT_MS),
      },
    }
  }
}

async function fetchGa4Rows(): Promise<{ rows: Ga4Row[]; source: SourceRun }> {
  const propertyId = process.env.GA4_PROPERTY_ID || process.env.GOOGLE_ANALYTICS_PROPERTY_ID

  if (!propertyId || (!hasOAuthCredentials() && !hasServiceAccountCredentials())) {
    return {
      rows: [],
      source: {
        name: 'GA4',
        status: 'missing_config',
        detail: googleAuthConfigDetail('GA4'),
      },
    }
  }

  try {
    const auth = await getGoogleAccessToken(['https://www.googleapis.com/auth/analytics.readonly'])
    if (!auth.token) {
      return {
        rows: [],
        source: {
          name: 'GA4',
          status: 'error',
          detail: `Could not obtain Google access token using ${auth.mode} auth: ${auth.error}`,
        },
      }
    }

    const { startDate, endDate } = getDateRange()
    const [pagesResponse, eventsResponse] = await Promise.all([
      fetchWithTimeout(`${GA4_ENDPOINT}/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          limit: 100,
        }),
        cache: 'no-store',
      }),
      fetchWithTimeout(`${GA4_ENDPOINT}/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          limit: 100,
        }),
        cache: 'no-store',
      }),
    ])

    if (!pagesResponse.ok || !eventsResponse.ok) {
      const pageDetail = pagesResponse.ok ? '' : await getGoogleErrorDetail(pagesResponse)
      const eventDetail = eventsResponse.ok ? '' : await getGoogleErrorDetail(eventsResponse)
      const detail = [pageDetail, eventDetail].filter(Boolean).join(' | ')
      return {
        rows: [],
        source: {
          name: 'GA4',
          status: 'error',
          detail: `GA4 returned ${pagesResponse.status}/${eventsResponse.status} using ${auth.mode} auth for property ${propertyId}.${detail ? ` Google said: ${detail}` : ''}`,
        },
      }
    }

    const pageData = (await pagesResponse.json()) as { rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[] }
    const eventData = (await eventsResponse.json()) as { rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[] }
    const rows: Ga4Row[] = [
      ...(pageData.rows || []).map((row) => ({
        dimension: row.dimensionValues?.[0]?.value || '',
        metric: Number(row.metricValues?.[0]?.value || 0),
        source: 'pagePath' as const,
      })),
      ...(eventData.rows || []).map((row) => ({
        dimension: row.dimensionValues?.[0]?.value || '',
        metric: Number(row.metricValues?.[0]?.value || 0),
        source: 'eventName' as const,
      })),
    ].filter((row) => row.dimension)

    return {
      rows,
      source: {
        name: 'GA4',
        status: 'configured',
        detail: `Pulled ${rows.length} page/event rows for ${startDate} to ${endDate} using ${auth.mode} auth.`,
        count: rows.length,
      },
    }
  } catch (error) {
    return {
      rows: [],
      source: {
        name: 'GA4',
        status: 'error',
        detail: describeFetchError(error, 'GA4', GOOGLE_API_TIMEOUT_MS),
      },
    }
  }
}

async function fetchPageSpeedItem(item: { url: string; strategy: 'mobile' | 'desktop' }) {
  const apiKey = process.env.PAGESPEED_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY
  if (!apiKey) return null

  const params = new URLSearchParams({
    url: item.url,
    strategy: item.strategy,
    key: apiKey,
  })
  const response = await fetchWithTimeout(`${PAGE_SPEED_ENDPOINT}?${params.toString()}`, { cache: 'no-store' }, PAGE_SPEED_TIMEOUT_MS)
  if (!response.ok) return null

  const data = (await response.json()) as {
    lighthouseResult?: {
      categories?: { performance?: { score?: number } }
      audits?: Record<string, { title?: string; score?: number | null }>
    }
  }
  const audits = data.lighthouseResult?.audits || {}
  const opportunities = Object.values(audits)
    .filter((audit) => audit.score != null && audit.score < 0.9 && audit.title)
    .slice(0, 3)
    .map((audit) => audit.title as string)

  return {
    url: item.url,
    strategy: item.strategy,
    performanceScore:
      typeof data.lighthouseResult?.categories?.performance?.score === 'number'
        ? Math.round(data.lighthouseResult.categories.performance.score * 100)
        : null,
    opportunities,
  } satisfies PageSpeedRow
}

async function fetchPageSpeedRows(): Promise<{ rows: PageSpeedRow[]; source: SourceRun }> {
  const apiKey = process.env.PAGESPEED_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY
  if (!apiKey) {
    return {
      rows: [],
      source: {
        name: 'PageSpeed Insights',
        status: 'missing_config',
        detail: 'Set PAGESPEED_API_KEY to include mobile/desktop opportunity signals.',
      },
    }
  }

  try {
    const urls = STRATEGIC_URLS.slice(0, PAGE_SPEED_STRATEGIC_URL_LIMIT).flatMap((path) =>
      (['mobile', 'desktop'] as const).map((strategy) => ({ url: `${SITE_URL}${path}`, strategy })),
    )

    const results = await Promise.allSettled(urls.map((item) => fetchPageSpeedItem(item)))
    const rows = results
      .filter((result): result is PromiseFulfilledResult<PageSpeedRow | null> => result.status === 'fulfilled')
      .map((result) => result.value)
      .filter((row): row is PageSpeedRow => Boolean(row))
    const failedCount = results.length - rows.length

    return {
      rows,
      source: {
        name: 'PageSpeed Insights',
        status: 'configured',
        detail: `Pulled ${rows.length} of ${urls.length} PageSpeed checks for strategic URLs.${failedCount ? ` ${failedCount} timed out or failed.` : ''}`,
        count: rows.length,
      },
    }
  } catch (error) {
    return {
      rows: [],
      source: {
        name: 'PageSpeed Insights',
        status: 'error',
        detail: describeFetchError(error, 'PageSpeed Insights', PAGE_SPEED_TIMEOUT_MS),
      },
    }
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function hasExistingCoverage(query: string) {
  const normalized = query.toLowerCase()
  return getAllBlogPosts().some((post) => {
    const haystack = [post.title, post.description, post.excerpt, ...post.keywords, ...post.tags].join(' ').toLowerCase()
    return haystack.includes(normalized) || normalized.includes(post.title.toLowerCase().slice(0, 32))
  })
}

function categoryForQuery(query: string): SeoContentOpportunity['category'] {
  const lower = query.toLowerCase()
  if (lower.includes('preservation') || lower.includes('reo') || lower.includes('winterization')) return 'property-preservation'
  if (lower.includes('route') || lower.includes('pay') || lower.includes('mileage') || lower.includes('income')) return 'route-operations'
  if (lower.includes('company') || lower.includes('vendor') || lower.includes('signing service')) return 'firm-growth'
  return 'field-inspection'
}

function linksForQuery(query: string): SeoContentOpportunity['internalLinks'] {
  const lower = query.toLowerCase()
  if (lower.includes('notary') || lower.includes('signing') || lower.includes('ron')) {
    return [
      { label: 'Mobile notary role page', href: '/roles/mobile-notary' },
      { label: 'Notary directory filter', href: '/hiring-firms?industry=Notary' },
      { label: 'Route tool preview', href: '/tools' },
    ]
  }
  if (lower.includes('insurance') || lower.includes('loss control')) {
    return [
      { label: 'Insurance loss control role page', href: '/roles/insurance-loss-control' },
      { label: 'Insurance directory filter', href: '/hiring-firms?industry=Insurance' },
    ]
  }
  if (lower.includes('preservation') || lower.includes('reo')) {
    return [
      { label: 'Asset preservation role page', href: '/roles/asset-preservation' },
      { label: 'Hiring firm directory', href: '/hiring-firms?industry=Preservation' },
    ]
  }
  return [
    { label: 'Mortgage field inspector role page', href: '/roles/mortgage-field-inspector' },
    { label: 'Hiring firm directory', href: '/hiring-firms' },
    { label: 'Income tool preview', href: '/tools' },
  ]
}

function opportunityFromSearchRow(row: SearchConsoleRow): SeoContentOpportunity | null {
  if (row.impressions < 20 || hasExistingCoverage(row.query)) return null

  const weakCtr = row.ctr < 0.02 && row.impressions >= 50
  const strikingDistance = row.position >= 4 && row.position <= 30
  if (!weakCtr && !strikingDistance) return null

  const score = Math.round(Math.min(95, 55 + Math.log10(row.impressions + 1) * 12 + Math.max(0, 30 - row.position)))
  const priority = score >= 82 ? 'high' : score >= 68 ? 'medium' : 'low'

  return {
    id: `gsc-${slugify(row.query)}`,
    title: `Answer "${row.query}" with a focused supporting article`,
    angle:
      'Create a concise member-side article that answers the query directly, adds field-service context, and links back to the relevant role/tool/directory surface.',
    category: categoryForQuery(row.query),
    priority,
    score,
    recommendedSurface: 'blog_supporting_article',
    workflowStatus: 'candidate',
    targetKeywords: [row.query],
    internalLinks: linksForQuery(row.query),
    rationale: `Search Console shows ${row.impressions} impressions, ${row.clicks} clicks, ${(row.ctr * 100).toFixed(1)}% CTR, and average position ${row.position.toFixed(1)}.`,
    sourceSignals: [`GSC query: ${row.query}`, `Landing page: ${row.page || 'not provided'}`],
  }
}

function opportunitiesFromGa4(rows: Ga4Row[]): SeoContentOpportunity[] {
  const pageRows = rows.filter((row) => row.source === 'pagePath')
  const eventRows = rows.filter((row) => row.source === 'eventName')
  const result: SeoContentOpportunity[] = []

  const notaryDemand = pageRows.find((row) => row.dimension.includes('/roles/mobile-notary') || row.dimension.includes('/tools/notary-route-calculator'))
  if (notaryDemand && notaryDemand.metric >= 10) {
    result.push({
      id: 'ga4-notary-path-demand',
      title: 'Expand notary route and vendor questions from production demand',
      angle:
        'Use real notary page/calculator engagement to choose the next supporting article, prioritizing route economics and vendor selection.',
      category: 'route-operations',
      priority: notaryDemand.metric >= 50 ? 'high' : 'medium',
      score: Math.min(90, 64 + Math.round(notaryDemand.metric / 4)),
      recommendedSurface: 'blog_supporting_article',
      workflowStatus: 'candidate',
      targetKeywords: ['notary route income', 'notary signing service pay', 'mobile notary vendor applications'],
      internalLinks: [
        { label: 'Mobile notary role page', href: '/roles/mobile-notary' },
        { label: 'Route tool preview', href: '/tools' },
        { label: 'Hiring firm directory', href: '/hiring-firms?industry=Notary' },
      ],
      rationale: `GA4 shows ${notaryDemand.metric} views on notary-specific paths in the lookback window.`,
      sourceSignals: [`GA4 pagePath: ${notaryDemand.dimension}`],
    })
  }

  const directoryEvents = eventRows.find((row) => row.dimension === 'directory_viewed')
  if (directoryEvents && directoryEvents.metric >= 20) {
    result.push({
      id: 'ga4-directory-viewed-content',
      title: 'Create content around how members should use the firm directory',
      angle:
        'Turn directory engagement into an educational article about filtering firms, comparing pay signals, and saving application targets.',
      category: 'firm-growth',
      priority: directoryEvents.metric >= 75 ? 'high' : 'medium',
      score: Math.min(88, 60 + Math.round(directoryEvents.metric / 5)),
      recommendedSurface: 'directory_support',
      workflowStatus: 'candidate',
      targetKeywords: ['field inspection companies to apply to', 'how to compare inspection vendors'],
      internalLinks: [
        { label: 'Hiring firm directory', href: '/hiring-firms' },
        { label: 'Company tracker preview', href: '/tools' },
      ],
      rationale: `GA4 recorded ${directoryEvents.metric} directory_viewed events.`,
      sourceSignals: ['GA4 event: directory_viewed'],
    })
  }

  return result
}

function opportunitiesFromPageSpeed(rows: PageSpeedRow[]): SeoContentOpportunity[] {
  return rows
    .filter((row) => row.strategy === 'mobile' && row.performanceScore != null && row.performanceScore < 70)
    .slice(0, 3)
    .map((row) => ({
      id: `psi-${slugify(row.url)}`,
      title: `Improve mobile answer experience for ${new URL(row.url).pathname}`,
      angle:
        'Treat this as a content UX opportunity: keep the primary answer, CTA, and internal links visible quickly on mobile before adding more supporting content.',
      category: 'route-operations' as const,
      priority: row.performanceScore && row.performanceScore < 60 ? 'high' : 'medium',
      score: row.performanceScore ? 100 - row.performanceScore : 70,
      recommendedSurface: 'role_page_refresh' as const,
      workflowStatus: 'candidate' as const,
      targetKeywords: [],
      internalLinks: [{ label: 'Affected page', href: new URL(row.url).pathname }],
      rationale: `PageSpeed mobile score is ${row.performanceScore}. Top opportunities: ${row.opportunities.join('; ') || 'none returned'}.`,
      sourceSignals: [`PSI mobile: ${row.url}`],
    }))
}

function mergeOpportunities(opportunities: SeoContentOpportunity[]) {
  const byId = new Map<string, SeoContentOpportunity>()

  for (const opportunity of opportunities) {
    const existing = byId.get(opportunity.id)
    if (!existing || opportunity.score > existing.score) {
      byId.set(opportunity.id, opportunity)
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
}

export async function runSeoContentMonitor(): Promise<SeoContentMonitorReport> {
  const [searchConsole, ga4, pageSpeed] = await Promise.all([
    withSourceTimeout('Google Search Console', fetchSearchConsoleRows),
    withSourceTimeout('GA4', fetchGa4Rows),
    withSourceTimeout('PageSpeed Insights', fetchPageSpeedRows),
  ])

  const searchOpportunities = searchConsole.rows
    .map(opportunityFromSearchRow)
    .filter(Boolean) as SeoContentOpportunity[]

  const opportunities = mergeOpportunities([
    ...searchOpportunities,
    ...opportunitiesFromGa4(ga4.rows),
    ...opportunitiesFromPageSpeed(pageSpeed.rows),
    ...FALLBACK_OPPORTUNITIES,
  ])

  return {
    generatedAt: todayIso(),
    cadence: 'weekly',
    workflowBoundary:
      'This monitor only creates topic candidates. Posts must still be drafted, reviewed at /blog/review, approved, and allowed into sitemap through the existing blog workflow.',
    dataSources: [
      searchConsole.source,
      ga4.source,
      pageSpeed.source,
      {
        name: 'Existing blog registry',
        status: 'configured',
        detail: `Checked ${getAllBlogPosts().length} registered posts to reduce duplicate recommendations.`,
        count: getAllBlogPosts().length,
      },
    ],
    opportunities,
  }
}

