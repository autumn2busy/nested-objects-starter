import { z } from 'zod'
import type { MetricSnapshot, SourceReference } from '../contracts.js'
import { stableUuid } from '../stable-id.js'

const ADAPTER = 'revenue-evidence-v1'
const VERSION = 'revenue-snapshot-selection-v1'
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,160}$/)
const time = z.string().datetime({ offset: true })
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const kind = z.enum(['fixture', 'approved_read_only_export'])
const reference = z.object({
  sourceSystem: z.enum(['stripe', 'outseta', 'stripe_outseta']),
  sourceType: z.literal(ADAPTER), sourceId: id, observedAt: time,
  metadata: z.object({ sourceKind: kind }).strict(),
}).strict()
const observation = z.object({
  metricDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metricName: z.enum(['revenue.stripe_collections.gross', 'revenue.stripe_collections.retained',
    'revenue.membership_collections.gross', 'revenue.mrr', 'revenue.arr']),
  domain: z.literal('revenue'), scopeKey: z.string().regex(/^stripe:[a-zA-Z0-9_-]{1,160}:(live|test)$/),
  dimensions: z.object({ currency: z.string().regex(/^[A-Z]{3}$/), sourceKind: kind,
    cohort: z.literal('utc_capture_date') }).strict(),
  value: count.nullable(), valueState: z.enum(['known', 'unknown']), unit: z.string(),
  numerator: z.null(), denominator: z.null(), observedRecords: count.nullable(), expectedRecords: z.null(),
  completeness: z.union([z.literal(0), z.literal(1)]), confidence: z.union([z.literal(0), z.literal(1)]),
  sourceSystem: z.enum(['stripe', 'stripe+outseta', 'authority-gap']), sourceRunId: z.null(),
  sourceRefs: z.array(reference).max(3),
  provenance: z.object({
    adapterVersion: z.literal(ADAPTER), evidenceRevision: z.string().uuid(), sourceKind: kind,
    stripeApiVersion: z.string().regex(/^\d{4}-\d{2}-\d{2}(?:\.[a-z][a-z0-9_-]*)?$/),
    reasons: z.array(z.string().regex(/^[a-z0-9_]{1,160}$/)).max(100),
    interpretation: z.string().min(1).max(1000), recurringRevenuePolicy: z.literal('not_defined'),
  }).strict(),
  idempotencyKey: z.string().regex(/^metric:[a-f0-9-]{36}$/), observedAt: time.nullable(),
  correlation: z.object({ correlationId: id, causationId: id.nullable(), traceId: id.nullable() }).strict(),
}).strict()

export type RevenueSnapshotSelectionReason = 'latest_observation' | 'latest_unknown'
  | 'unknown_observation_time' | 'conflicting_immutable_observation' | 'conflicting_latest_observations' | 'stale_latest_observation'
  | 'future_latest_observation'

export interface RevenueSnapshotSelectionInput {
  observations: MetricSnapshot[]
  now: string
  maxSnapshotAgeMs: number
}

export interface RevenueSnapshotSelectionResult {
  metrics: MetricSnapshot[]
  selections: Array<{ groupKey: string; reason: RevenueSnapshotSelectionReason }>
  reasons: string[]
  mutationAllowed: false
}

/**
 * Pure selection of immutable adapter observations, not a store, reader or proof of live truth.
 * Never sum revisions. Null as-of observations cannot safely be ordered, so they withhold the
 * entire group. An empty input is absent evidence, not a complete zero-collection observation.
 * The returned decision views carry selection provenance; they are not new adapter snapshots.
 */
export function selectRevenueSnapshots(input: RevenueSnapshotSelectionInput): RevenueSnapshotSelectionResult {
  const now = Date.parse(time.parse(input.now))
  z.number().int().positive().max(Number.MAX_SAFE_INTEGER).parse(input.maxSnapshotAgeMs)
  const observations = z.array(observation).max(5_000).parse(input.observations)
  const groups = new Map<string, MetricSnapshot[]>()
  for (const item of observations) {
    validateAdapterObservation(item)
    const groupKey = JSON.stringify([item.metricDate, item.metricName, item.scopeKey,
      item.dimensions.currency, item.dimensions.sourceKind, item.dimensions.cohort])
    const group = groups.get(groupKey) ?? []
    group.push(item)
    groups.set(groupKey, group)
  }
  const metrics: MetricSnapshot[] = []
  const selections: RevenueSnapshotSelectionResult['selections'] = []
  for (const [groupKey, group] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    // Correlation records may differ for an otherwise identical replay; they do not add money.
    const byFinancial = new Map<string, MetricSnapshot>()
    for (const item of group) {
      const fingerprint = financialFingerprint(item)
      const previous = byFinancial.get(fingerprint)
      if (!previous || canonical(item).localeCompare(canonical(previous)) < 0) byFinancial.set(fingerprint, item)
    }
    const unique = [...byFinancial.entries()]
      .sort(([a], [b]) => a.localeCompare(b)).map(([, item]) => item)
    const untimed = unique.some((item) => item.observedAt === null)
    const newestTime = Math.max(...unique.map((item) => item.observedAt === null ? -Infinity : Date.parse(item.observedAt)))
    const latest = unique.filter((item) => item.observedAt !== null && Date.parse(item.observedAt) === newestTime)
    const template = (latest[0] ?? unique[0])!
    let reason: RevenueSnapshotSelectionReason = 'latest_observation'
    if (untimed) reason = 'unknown_observation_time'
    else if (new Set(unique.map((item) => item.idempotencyKey)).size !== unique.length) reason = 'conflicting_immutable_observation'
    else if (latest.length !== 1) reason = 'conflicting_latest_observations'
    else if (newestTime > now) reason = 'future_latest_observation'
    else if (now - newestTime > input.maxSnapshotAgeMs
      || template.sourceRefs.some((ref) => now - Date.parse(ref.observedAt!) > input.maxSnapshotAgeMs)) reason = 'stale_latest_observation'
    else if (template.valueState === 'unknown') reason = 'latest_unknown'

    const selected = structuredClone(template)
    const withheld = reason !== 'latest_observation' && reason !== 'latest_unknown'
    if (withheld) {
      selected.value = null
      selected.valueState = 'unknown'
      selected.completeness = 0
      selected.confidence = 0
      selected.observedRecords = null
      // Unknown ordering cannot inherit a timestamp from an older, apparently healthy record.
      selected.observedAt = untimed ? null : template.observedAt
      selected.sourceRefs = uniqueReferences(unique.flatMap((item) => item.sourceRefs))
      selected.idempotencyKey = `metric:${stableUuid(VERSION, JSON.stringify([groupKey, reason,
        ...unique.map(financialFingerprint)]))}`
    }
    selected.provenance = {
      ...selected.provenance,
      selection: {
        version: VERSION, reason,
        evidenceRevisions: [...new Set(unique.map((item) => String(item.provenance.evidenceRevision)))].sort(),
        inputIdempotencyKeys: [...new Set(unique.map((item) => item.idempotencyKey))].sort(),
      },
    }
    metrics.push(selected)
    selections.push({ groupKey, reason })
  }
  return { metrics, selections,
    reasons: observations.length === 0 ? ['no_observations'] : [...new Set(selections.map((item) => item.reason))].sort(),
    mutationAllowed: false }
}

function validateAdapterObservation(item: z.infer<typeof observation>): void {
  const dayStart = Date.parse(`${item.metricDate}T00:00:00.000Z`)
  const stripeOnly = item.metricName.startsWith('revenue.stripe_collections.')
  const recurring = item.metricName === 'revenue.mrr' || item.metricName === 'revenue.arr'
  const known = item.valueState === 'known'
  const refs = item.sourceRefs
  const latestRef = refs.length === 0 ? null : Math.max(...refs.map((ref) => Date.parse(ref.observedAt)))
  const key = `metric:${stableUuid(ADAPTER, JSON.stringify([item.metricDate, item.metricName, item.scopeKey,
    item.dimensions.currency, item.dimensions.sourceKind, item.provenance.evidenceRevision]))}`
  if (!Number.isFinite(dayStart) || new Date(dayStart).toISOString().slice(0, 10) !== item.metricDate
    || item.unit !== `${item.dimensions.currency}_minor`
    || item.provenance.sourceKind !== item.dimensions.sourceKind
    || item.sourceSystem !== (stripeOnly ? 'stripe' : recurring ? 'authority-gap' : 'stripe+outseta')
    || item.idempotencyKey !== key
    || known !== (item.value !== null) || item.confidence !== (known ? 1 : 0) || item.completeness !== (known ? 1 : 0)
    || (recurring && known)
    || new Set(refs.map((ref) => ref.sourceSystem)).size !== refs.length
    || refs.some((ref) => ref.metadata.sourceKind !== item.dimensions.sourceKind)
    || (stripeOnly && refs.some((ref) => ref.sourceSystem !== 'stripe'))
    || (item.observedAt === null ? latestRef !== null : Date.parse(item.observedAt) !== latestRef)
    || (known && (refs.length !== (stripeOnly ? 1 : 3) || item.observedRecords === null
      || refs.some((ref) => Date.parse(ref.observedAt) < dayStart + 86_400_000)))) {
    throw new Error('Invalid revenue adapter observation')
  }
}

function financialFingerprint(item: MetricSnapshot): string {
  const { correlation: _correlation, ...financial } = item
  return canonical(financial)
}

function uniqueReferences(refs: SourceReference[]): SourceReference[] {
  return [...new Map(refs.map((ref) => [canonical(ref), ref])).entries()]
    .sort(([a], [b]) => a.localeCompare(b)).map(([, ref]) => structuredClone(ref))
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(canonical).sort())
  if (value !== null && typeof value === 'object') return JSON.stringify(Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  return JSON.stringify(value)
}
