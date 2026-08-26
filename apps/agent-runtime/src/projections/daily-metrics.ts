import type { CorrelationContext, MetricDomain, MetricSnapshot, SourceReference } from '../contracts.js'
import type { ConversionEventSourceRow, ProfileSourceRow } from './member-projection.js'

export interface BuildDailyMetricsInput {
  metricDate: string
  profiles: ProfileSourceRow[]
  conversionEvents: ConversionEventSourceRow[]
  correlation: CorrelationContext
  sourceRunId?: string | null
  observedAt?: string
}

export function buildDailyBusinessMetrics(input: BuildDailyMetricsInput): MetricSnapshot[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.metricDate)) throw new Error('metricDate must use YYYY-MM-DD')
  const observedAt = input.observedAt ?? new Date().toISOString()
  const events = deduplicateEvents(input.conversionEvents.filter((event) => event.occurred_at.slice(0, 10) === input.metricDate))
  const sourceRefs: SourceReference[] = [{
    sourceSystem: 'supabase',
    sourceType: 'conversion_events_daily_slice',
    sourceId: input.metricDate,
    observedAt,
    metadata: { eventCount: events.length },
  }]
  const metrics: MetricSnapshot[] = []
  const count = (name: string) => events.filter((event) => event.event_name === name).length
  const addCount = (metricName: string, domain: MetricDomain, value: number, eventNames: string[], dimensions: Record<string, unknown> = {}) => {
    metrics.push(knownMetric(input, observedAt, sourceRefs, metricName, domain, value, 'count', {
      eventNames,
      dimensions,
      observedRecords: value,
    }))
  }

  const signups = canonicalSignupEvents(events.filter((event) => event.event_name === 'signup_completed'))
  for (const tier of ['free', 'pro', 'elite', 'starter', 'founders', 'agency', 'unknown'] as const) {
    const value = signups.filter((event) => normalizeTier(event.plan_name ?? event.event_data?.plan) === tier).length
    addCount(`members.new.${tier}`, 'growth', value, ['signup_completed'], { tier })
  }

  addCount('subscriptions.created.confirmed', 'revenue', count('subscription_created'), ['subscription_created'])
  addCount('subscriptions.upgraded.confirmed', 'revenue', count('subscription_upgraded'), ['subscription_upgraded'])
  addCount('purchases.confirmed', 'revenue', count('purchase'), ['purchase'])
  addCount('product.directory_views', 'product', count('directory_viewed'), ['directory_viewed'])
  addCount('product.firm_views', 'product', count('firm_view'), ['firm_view'])
  addCount('product.paywall_hits', 'product', count('paywall_hit'), ['paywall_hit'])
  addCount('product.upgrade_clicks', 'growth', count('upgrade_clicked'), ['upgrade_clicked'])
  addCount('product.profile_completions', 'product', count('profile_completed'), ['profile_completed'])
  addCount('training.starts', 'product', count('training_started'), ['training_started'])
  addCount('training.completions', 'product', count('training_completed'), ['training_completed'])

  const activeTrials = input.profiles.filter((profile) => normalizeStatus(profile.subscription_status) === 'trialing').length
  metrics.push(knownMetric(input, observedAt, [{
    sourceSystem: 'supabase',
    sourceType: 'profiles_snapshot',
    sourceId: input.metricDate,
    observedAt,
    metadata: { profileCount: input.profiles.length },
  }], 'members.active_trials.snapshot', 'revenue', activeTrials, 'count', {
    observedRecords: input.profiles.length,
    dimensions: { snapshot: true },
  }))

  metrics.push(unknownMetric(input, observedAt, 'revenue.mrr', 'revenue', 'Authoritative billing-grade recurring revenue amounts are not available in profiles or conversion_events.'))
  metrics.push(unknownMetric(input, observedAt, 'revenue.arr', 'revenue', 'Authoritative billing-grade recurring revenue amounts are not available in profiles or conversion_events.'))
  metrics.push(unknownMetric(input, observedAt, 'members.cancellations', 'revenue', 'No authoritative cancellation event is available in the Phase C input contract yet.'))

  return metrics
}

function knownMetric(
  input: BuildDailyMetricsInput,
  observedAt: string,
  sourceRefs: SourceReference[],
  metricName: string,
  domain: MetricDomain,
  value: number,
  unit: string,
  metadata: { eventNames?: string[]; dimensions?: Record<string, unknown>; observedRecords?: number },
): MetricSnapshot {
  return {
    metricDate: input.metricDate,
    metricName,
    domain,
    scopeKey: 'global',
    dimensions: metadata.dimensions ?? {},
    value,
    valueState: 'known',
    unit,
    numerator: null,
    denominator: null,
    observedRecords: metadata.observedRecords ?? null,
    expectedRecords: null,
    completeness: 1,
    confidence: 1,
    sourceSystem: 'supabase',
    sourceRunId: input.sourceRunId ?? null,
    sourceRefs,
    provenance: { eventNames: metadata.eventNames ?? [], projectionVersion: 'phase-c-v1' },
    idempotencyKey: `metric:${input.metricDate}:${metricName}:global:${input.sourceRunId ?? 'none'}`,
    observedAt,
    correlation: input.correlation,
  }
}

function unknownMetric(
  input: BuildDailyMetricsInput,
  observedAt: string,
  metricName: string,
  domain: MetricDomain,
  reason: string,
): MetricSnapshot {
  return {
    metricDate: input.metricDate,
    metricName,
    domain,
    scopeKey: 'global',
    dimensions: {},
    value: null,
    valueState: 'unknown',
    unit: 'USD',
    numerator: null,
    denominator: null,
    observedRecords: null,
    expectedRecords: null,
    completeness: 0,
    confidence: 0,
    sourceSystem: 'authority-gap',
    sourceRunId: input.sourceRunId ?? null,
    sourceRefs: [],
    provenance: { reason, projectionVersion: 'phase-c-v1' },
    idempotencyKey: `metric:${input.metricDate}:${metricName}:global:${input.sourceRunId ?? 'none'}`,
    observedAt,
    correlation: input.correlation,
  }
}

function normalizeTier(value: unknown): string {
  const text = typeof value === 'string' ? value.toLowerCase() : ''
  if (text.includes('elite')) return 'elite'
  if (text.includes('pro')) return 'pro'
  if (text.includes('founder')) return 'founders'
  if (text.includes('starter') || text.includes('directory')) return 'starter'
  if (text.includes('agency')) return 'agency'
  if (text.includes('free')) return 'free'
  return 'unknown'
}

function normalizeStatus(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase().replace(/\s+/g, '_') : 'unknown'
}

function deduplicateEvents(events: ConversionEventSourceRow[]): ConversionEventSourceRow[] {
  const seen = new Set<string>()
  return events.filter((event) => {
    const key = event.client_event_id?.trim() || event.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function canonicalSignupEvents(events: ConversionEventSourceRow[]): ConversionEventSourceRow[] {
  const actors = new Map<string, ConversionEventSourceRow>()
  for (const event of events) {
    const key = event.member_uid?.trim()
      ? `member:${event.member_uid.trim()}`
      : event.member_email?.trim()
        ? `email:${event.member_email.trim().toLowerCase()}`
        : event.anonymous_id?.trim()
          ? `anonymous:${event.anonymous_id.trim()}`
          : `event:${event.id}`
    const existing = actors.get(key)
    const authoritative = event.source === 'outseta' || event.source_page === 'outseta_webhook'
    const existingAuthoritative = existing?.source === 'outseta' || existing?.source_page === 'outseta_webhook'
    if (!existing || (authoritative && !existingAuthoritative)) actors.set(key, event)
  }
  return [...actors.values()]
}
