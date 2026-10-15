/** Campaign attribution shared by the public and member sites. Never forwards identity or calculator inputs. */
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
export const GA4_ACQUISITION_FIELDS = [
  'source_page', 'entry_page', 'cta_source', 'reason', 'target_plan', 'current_plan', 'widget_mode', 'is_authenticated',
  ...UTM_KEYS, ...UTM_KEYS.map(key => `first_${key}`), ...UTM_KEYS.map(key => `last_${key}`),
] as const
type Attribution = Record<string, string>
const FIRST_KEY = 'ac_utm_first_touch'
const LAST_KEY = 'ac_utm_last_touch'

function safeValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  // Campaign labels, not emails, links, tokens, free-form objects or phone numbers.
  if (!text || text.length > 160 || /[@<>\r\n]|https?:|\b\d[\d ()+.-]{7,}\d\b/i.test(text)) return undefined
  return text
}

export function safePage(value: unknown): string | undefined {
  const text = safeValue(value)
  if (!text) return undefined
  const path = text.split(/[?#]/)[0]
  if (/^\/(?:firms|members|profiles)\//.test(path)) return `/${path.split('/')[1]}/[id]`
  if (/^\/(?:api|admin|inspector-dashboard|profile)(?:\/|$)/.test(path)) return undefined
  return path
}

function sanitize(value: unknown): Attribution {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const input = value as Record<string, unknown>
  const output: Attribution = {}
  for (const key of UTM_KEYS) {
    const text = safeValue(input[key])
    if (text) output[key] = text
  }
  const page = safePage(input.landing_page)
  if (page) output.landing_page = page
  return output
}

function read(name: 'localStorage' | 'sessionStorage', key: string): Attribution {
  if (typeof window === 'undefined') return {}
  try { return sanitize(JSON.parse(window[name].getItem(key) || '{}')) } catch { return {} }
}

function write(name: 'localStorage' | 'sessionStorage', key: string, value: Attribution) {
  try { window[name].setItem(key, JSON.stringify(value)) } catch { /* Storage denial must not block navigation. */ }
}

export function currentAttribution(): Attribution {
  if (typeof window === 'undefined') return {}
  const query = new URLSearchParams(window.location.search)
  const input: Record<string, unknown> = { landing_page: query.get('entry_page') || window.location.pathname }
  for (const key of UTM_KEYS) input[key] = query.get(key)
  return sanitize(input)
}

export function captureJourneyAttribution(): void {
  if (typeof window === 'undefined') return
  const current = currentAttribution()
  const first = read('sessionStorage', FIRST_KEY)
  if (!first.landing_page && Object.keys(first).length === 0) {
    const query = new URLSearchParams(window.location.search)
    const inherited: Attribution = {}
    for (const key of UTM_KEYS) {
      const value = safeValue(query.get(`first_${key}`))
      if (value) inherited[key] = value
    }
    // Carry the original campaign across owned host handoffs; never replace an existing first touch.
    write('sessionStorage', FIRST_KEY, Object.keys(inherited).length ? { ...inherited, landing_page: current.landing_page } : current)
  }
  const hasCampaign = UTM_KEYS.some(key => current[key])
  if (hasCampaign || Object.keys(read('localStorage', LAST_KEY)).length === 0) write('localStorage', LAST_KEY, current)
}

export function journeyAttribution() {
  captureJourneyAttribution()
  const current = currentAttribution()
  const first = read('sessionStorage', FIRST_KEY)
  const last = read('localStorage', LAST_KEY)
  // A new URL campaign wins as a whole; never mix partial UTMs from two campaigns.
  const campaign = UTM_KEYS.some(key => current[key]) ? current : last
  const context: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    if (campaign[key]) context[key] = campaign[key]
    if (first[key]) context[`first_${key}`] = first[key]
    if (last[key]) context[`last_${key}`] = last[key]
  }
  if (first.landing_page) context.landing_page = first.landing_page
  return context
}

/** Decorate only owned cross-site marketing handoffs and hosted registration. No internal UTMs or billing/login changes. */
export function decorateAcquisitionUrl(href: string, source?: string): string {
  if (typeof window === 'undefined') return href
  try {
    const origin = window.location.origin
    const destination = new URL(href, origin)
    if (destination.protocol !== 'https:') return href
    const isMemberHandoff = destination.hostname === 'members.nestedobjects.com' && destination.origin !== origin
    const isRegistration = destination.hostname === 'nested-objects.outseta.com'
      && destination.pathname === '/auth' && destination.searchParams.get('widgetMode') === 'register'
    if (!isMemberHandoff && !isRegistration) return href
    const attribution = journeyAttribution()
    const destinationHasCampaign = UTM_KEYS.some(key => destination.searchParams.has(key))
    for (const key of UTM_KEYS) {
      // Explicit campaign on a destination takes precedence over the current campaign.
      if (!destinationHasCampaign && attribution[key]) destination.searchParams.set(key, attribution[key])
    }
    for (const key of UTM_KEYS) {
      const first = safeValue(attribution[`first_${key}`])
      if (first && !destination.searchParams.has(`first_${key}`)) destination.searchParams.set(`first_${key}`, first)
    }
    const entry = safePage(attribution.landing_page || window.location.pathname)
    if (entry && !destination.searchParams.has('entry_page')) destination.searchParams.set('entry_page', entry)
    const label = safeValue(source) || safePage(window.location.pathname)
    if (label && !destination.searchParams.has('source')) destination.searchParams.set('source', label)
    return destination.href
  } catch { return href }
}

/** Every key is reset so GTM's persistent data-layer model cannot leak a previous CTA's plan/UTMs into the next event. */
export function acquisitionGa4Data(input: Record<string, unknown> = {}): Record<string, string | boolean | null> {
  const output: Record<string, string | boolean | null> = Object.fromEntries(GA4_ACQUISITION_FIELDS.map(key => [key, null]))
  output.source_page = safePage(input.sourcePage) || safePage(typeof window === 'undefined' ? undefined : window.location.pathname) || null
  output.entry_page = safePage(input.landing_page) || null
  for (const key of [...UTM_KEYS, ...UTM_KEYS.map(key => `first_${key}`), ...UTM_KEYS.map(key => `last_${key}`)]) {
    output[key] = safeValue(input[key]) || null
  }
  output.cta_source = safeValue(input.source) || null
  output.reason = safeValue(input.reason) || null
  const plans = new Set(['free', 'pro', 'elite', 'agency', 'starter', 'founders', 'member', 'anonymous', 'unknown'])
  const plan = (value: unknown) => typeof value === 'string' && plans.has(value.toLowerCase()) ? value.toLowerCase() : null
  output.target_plan = plan(input.targetPlan ?? input.plan)
  output.current_plan = plan(input.currentPlan ?? input.fromPlan)
  output.widget_mode = ['register', 'register_redirect', 'profile_plan_change', 'login'].includes(String(input.mode)) ? String(input.mode) : null
  output.is_authenticated = typeof input.isAuthenticated === 'boolean' ? input.isAuthenticated : null
  return output
}

export function isIntentPage(path: string): boolean {
  return ['/', '/membership-pricing', '/pricing', '/hiring-firms', '/tools', '/guides', '/welcome'].includes(path)
    || path.startsWith('/guides/') || path.startsWith('/hiring-firms/')
    || path === '/inspector-resource-center' || path.startsWith('/inspector-resource-center/readiness-guides')
}

export function decorateJourneyLinks(): void {
  for (const anchor of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
    decorateAnchor(anchor)
  }
}

function decorateAnchor(anchor: HTMLAnchorElement) {
  const current = anchor.getAttribute('href') || ''
  const original = current === anchor.dataset.acquisitionDecorated
    ? anchor.dataset.acquisitionHref || current : current
  const decorated = decorateAcquisitionUrl(original, anchor.dataset.ctaPlacement || anchor.dataset.acquisitionSource)
  if (decorated !== current) {
    anchor.dataset.acquisitionHref = original
    anchor.dataset.acquisitionDecorated = decorated
    anchor.href = decorated
  }
  return { original, decorated }
}

export function decorateJourneyClick(event: Event): void {
  const target = event.target
  if (!(target instanceof Element)) return
  const anchor = target.closest<HTMLAnchorElement>('a[href]')
  if (!anchor) return
  const { original, decorated } = decorateAnchor(anchor)
  if ((event.type === 'click' || event.type === 'auxclick') && decorated !== original) {
    const analytics = window as Window & { dataLayer?: Array<Record<string, unknown>> }
    analytics.dataLayer = analytics.dataLayer || []
    analytics.dataLayer.push({ event: 'acquisition_cta_click', acquisition: acquisitionGa4Data({
      ...journeyAttribution(), sourcePage: window.location.pathname,
      source: anchor.dataset.ctaPlacement || anchor.dataset.acquisitionSource || window.location.pathname,
    }) })
  }
}
