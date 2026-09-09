import { z } from 'zod'
import type { CorrelationContext, MetricSnapshot, SourceReference } from '../contracts.js'
import { assertMetricSnapshot } from '../metrics.js'
import { stableUuid } from '../stable-id.js'

const VERSION = 'revenue-evidence-v1'
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,160}$/)
const time = z.string().datetime({ offset: true })
const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const coverage = z.enum(['complete', 'partial', 'unknown'])
const refund = z.object({
  refundRef: id, chargeRef: id, amountMinor: money,
  status: z.enum(['succeeded', 'pending', 'requires_action', 'failed', 'canceled']),
}).strict()
const charge = z.object({
  chargeRef: id, customerRef: id, stripeAccountRef: id, livemode: z.boolean(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.enum(['succeeded', 'pending', 'failed']), paid: z.boolean(), captured: z.boolean(),
  amountCapturedMinor: money,
  // Cumulative charge amounts cannot be assigned to one day after multiple captures.
  captureBasis: z.enum(['single_capture_verified', 'multiple_or_unknown']),
  // Explicit capture time from verified source evidence; NOT automatically Charge.created.
  capturedAt: time.nullable(),
  refundsCoverage: coverage, refunds: z.array(refund).max(500), disputed: z.boolean(),
  balance: z.object({
    balanceRef: id, status: z.enum(['pending', 'available']),
    currency: z.string().regex(/^[A-Z]{3}$/),
  }).strict().nullable(),
}).strict()
const account = z.object({
  accountRef: id, stripeCustomerRef: id, stripeAccountRef: id, livemode: z.boolean(),
  subscriptionRef: id, identityState: z.enum(['verified', 'unknown', 'conflict']),
  plan: z.enum(['free', 'pro', 'elite', 'agency', 'starter', 'founders', 'unknown']),
  subscriptionStatus: z.enum(['active', 'trialing', 'canceled', 'past_due', 'unknown']),
}).strict()
const allocation = z.object({
  allocationRef: id, chargeRef: id, accountRef: id, subscriptionRef: id, amountMinor: money,
  // A customer/email/metadata match or paid invoice alone is not commercial attribution.
  basis: z.enum(['verified_payment_allocation', 'metadata_only', 'unknown']),
}).strict()
const context = z.object({
  metricDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), now: time,
  maxSnapshotAgeMs: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  stripeAccountRef: id, livemode: z.boolean(), currency: z.string().regex(/^[A-Z]{3}$/),
  sourceKind: z.enum(['fixture', 'approved_read_only_export']),
  stripeApiVersion: z.string().regex(/^\d{4}-\d{2}-\d{2}(?:\.[a-z][a-z0-9_-]*)?$/),
  correlation: z.object({ correlationId: id, causationId: id.nullable(), traceId: id.nullable() }).strict(),
}).strict()
const snapshot = { coverage, observedAt: time, sourceRecordRef: id }
const stripeSnapshot = z.object({
  ...snapshot,
  // Completeness applies to this UTC capture-date cohort, including later refunds/disputes.
  captureDate: z.string(), rows: z.array(charge).max(5_000),
}).strict()
const outsetaSnapshot = z.object({ ...snapshot, rows: z.array(account).max(5_000) }).strict()
const allocationSnapshot = z.object({ ...snapshot, rows: z.array(allocation).max(10_000) }).strict()

export interface RevenueEvidenceInput {
  context: z.infer<typeof context>
  stripe: z.infer<typeof stripeSnapshot>
  outseta: z.infer<typeof outsetaSnapshot>
  allocations: z.infer<typeof allocationSnapshot>
}

export interface RevenueEvidenceResult {
  metrics: MetricSnapshot[]
  reasons: string[]
  payments: Array<{
    chargeRef: string
    balanceAvailability: 'pending' | 'available' | 'unknown'
    balanceCurrency: string | null
    outsetaAccountRef: string | null
    subscriptionStatus: string | null
  }>
  mutationAllowed: false
}

/**
 * Pure, bounded normalized evidence adapter: no provider SDK, fetch, store, scheduler or writer.
 * Calling this does not verify the source assertions or authorize a read. A future approved
 * collector must prove capture-date coverage, account/mode scope and payment allocations.
 * Gross/retained collections are NOT accounting revenue, bank payouts, MRR or upgrade events.
 */
export function adaptRevenueEvidence(input: RevenueEvidenceInput): RevenueEvidenceResult {
  const c = context.parse(input.context)
  const dayStart = Date.parse(`${c.metricDate}T00:00:00.000Z`)
  if (!Number.isFinite(dayStart) || new Date(dayStart).toISOString().slice(0, 10) !== c.metricDate
    || dayStart > Date.parse(c.now)) throw new Error('Invalid revenue evidence date')
  const reasons = new Set<string>()
  const payments: RevenueEvidenceResult['payments'] = []
  const stripe = stripeSnapshot.safeParse(input.stripe)
  const outseta = outsetaSnapshot.safeParse(input.outseta)
  const allocations = allocationSnapshot.safeParse(input.allocations)
  const fresh = (value: z.infer<typeof outsetaSnapshot> | z.infer<typeof stripeSnapshot> | z.infer<typeof allocationSnapshot>): boolean => {
    const age = Date.parse(c.now) - Date.parse(value.observedAt)
    return value.coverage === 'complete' && age >= 0 && age <= c.maxSnapshotAgeMs
  }
  let gross: number | null = null
  let retained: number | null = null
  let membership: number | null = null
  let observedRecords: number | null = null
  const sourceRefs: SourceReference[] = []
  const sourceRef = (system: string, ref: string, observedAt: string): SourceReference => ({
    sourceSystem: system, sourceType: VERSION, sourceId: ref, observedAt,
    metadata: { sourceKind: c.sourceKind },
  })

  if (!stripe.success || !fresh(stripe.data) || stripe.data.captureDate !== c.metricDate
    || Date.parse(stripe.data.observedAt) < dayStart + 86_400_000) {
    reasons.add('stripe_snapshot_invalid_incomplete_stale_or_open_day')
  } else {
    sourceRefs.push(sourceRef('stripe', stripe.data.sourceRecordRef, stripe.data.observedAt))
    const charges = deduplicate(stripe.data.rows, (row) => row.chargeRef)
    if (!charges) reasons.add('conflicting_charge_snapshots')
    else {
      gross = 0
      retained = 0
      observedRecords = charges.length
      let membershipReady = outseta.success && fresh(outseta.data) && allocations.success && fresh(allocations.data)
        && Date.parse(outseta.data.observedAt) >= dayStart + 86_400_000
        && Date.parse(allocations.data.observedAt) >= dayStart + 86_400_000
      const accounts = outseta.success ? deduplicate(outseta.data.rows, (row) => row.accountRef) : null
      const links = allocations.success ? deduplicate(allocations.data.rows, (row) => row.allocationRef) : null
      membershipReady = membershipReady && accounts !== null && links !== null
      if (!membershipReady) reasons.add('membership_sources_invalid_incomplete_stale_or_conflicting')
      if (membershipReady && outseta.success && allocations.success) {
        sourceRefs.push(sourceRef('outseta', outseta.data.sourceRecordRef, outseta.data.observedAt))
        sourceRefs.push(sourceRef('stripe_outseta', allocations.data.sourceRecordRef, allocations.data.observedAt))
      }
      membership = membershipReady ? 0 : null
      // An orphan allocation invalidates the claimed complete commercial reconciliation.
      if (links?.some((link) => !charges.some((row) => row.chargeRef === link.chargeRef))) {
        membership = null
        reasons.add('orphan_payment_allocation')
      }
      const refundOwners = new Map<string, string>()
      for (const row of charges) {
        if (row.stripeAccountRef !== c.stripeAccountRef || row.livemode !== c.livemode || row.currency !== c.currency
          || (row.amountCapturedMinor > 0 && (!row.captured || !row.paid || row.status !== 'succeeded'
            || row.captureBasis !== 'single_capture_verified'))
          || (row.amountCapturedMinor > 0 && (!row.capturedAt || Date.parse(row.capturedAt) < dayStart
            || Date.parse(row.capturedAt) >= dayStart + 86_400_000))) {
          reasons.add('charge_scope_or_capture_conflict')
          gross = null
          retained = null
          membership = null
          continue
        }
        const collected = row.status === 'succeeded' && row.paid && row.captured && row.amountCapturedMinor > 0
        const rowLinks = links?.filter((link) => link.chargeRef === row.chargeRef) ?? []
        if (!collected) {
          if (rowLinks.length > 0) { membership = null; reasons.add('allocation_without_collected_payment') }
          continue
        }
        gross = add(gross, row.amountCapturedMinor)
        const refunds = deduplicate(row.refunds, (item) => item.refundRef)
        for (const item of row.refunds) {
          const previousOwner = refundOwners.get(item.refundRef)
          if (previousOwner && previousOwner !== row.chargeRef) {
            retained = null
            reasons.add('refund_reused_across_charges')
          }
          refundOwners.set(item.refundRef, row.chargeRef)
        }
        const refundTotal = refunds?.filter((item) => item.status === 'succeeded')
          .reduce<number | null>((sum, item) => add(sum, item.amountMinor), 0) ?? null
        if (row.disputed || row.refundsCoverage !== 'complete' || !refunds
          || refunds.some((item) => item.chargeRef !== row.chargeRef || ['pending', 'requires_action'].includes(item.status))
          || refundTotal === null || refundTotal > row.amountCapturedMinor) {
          retained = null
          reasons.add('refund_or_dispute_reconciliation_required')
        } else retained = add(retained, row.amountCapturedMinor - refundTotal)

        const candidates = accounts?.filter((item) => item.stripeCustomerRef === row.customerRef) ?? []
        const match = candidates.length === 1 ? candidates[0] : undefined
        const matched = membershipReady && match?.identityState === 'verified'
          && match.stripeAccountRef === c.stripeAccountRef && match.livemode === c.livemode
        const allocated = rowLinks.reduce<number | null>((sum, link) => add(sum, link.amountMinor), 0)
        const attributed = matched && rowLinks.length > 0 && allocated !== null && allocated <= row.amountCapturedMinor
          && rowLinks.every((link) => link.basis === 'verified_payment_allocation'
            && link.accountRef === match.accountRef && link.subscriptionRef === match.subscriptionRef && link.amountMinor > 0)
        if (attributed) membership = add(membership, allocated)
        else { membership = null; reasons.add('membership_payment_attribution_unresolved') }
        payments.push({
          chargeRef: row.chargeRef, balanceAvailability: row.balance?.status ?? 'unknown',
          balanceCurrency: row.balance?.currency ?? null,
          outsetaAccountRef: attributed ? match.accountRef : null,
          subscriptionStatus: attributed ? match.subscriptionStatus : null,
        })
      }
      if (gross === null || retained === null || membership === null) reasons.add('some_totals_withheld')
    }
  }
  // Recurring revenue needs a separately approved recurring-subscription calculation policy.
  const values = [
    ['revenue.stripe_collections.gross', gross],
    ['revenue.stripe_collections.retained', retained],
    ['revenue.membership_collections.gross', membership],
    ['revenue.mrr', null], ['revenue.arr', null],
  ] as const
  const scopeKey = `stripe:${c.stripeAccountRef}:${c.livemode ? 'live' : 'test'}`
  // Immutable observation revision: a later refund or an older replay must not overwrite
  // another as-of snapshot under the projection store's idempotency-key upsert.
  const evidenceRevision = stableUuid(VERSION, canonical({
    stripe: stripe.success ? stripe.data : null,
    outseta: outseta.success ? outseta.data : null,
    allocations: allocations.success ? allocations.data : null,
    reasons: [...reasons].sort(),
  }))
  const metrics = values.map(([metricName, value]): MetricSnapshot => {
    const stripeOnly = metricName.startsWith('revenue.stripe_collections.')
    const refs = stripeOnly ? sourceRefs.filter((ref) => ref.sourceSystem === 'stripe') : sourceRefs
    const observedAt = refs.map((ref) => ref.observedAt!).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) ?? null
    const metric: MetricSnapshot = {
      metricDate: c.metricDate, metricName, domain: 'revenue', scopeKey,
      dimensions: { currency: c.currency, sourceKind: c.sourceKind, cohort: 'utc_capture_date' },
      value, valueState: value === null ? 'unknown' : 'known', unit: `${c.currency}_minor`,
      numerator: null, denominator: null, observedRecords, expectedRecords: null,
      completeness: value === null ? 0 : 1, confidence: value === null ? 0 : 1,
      sourceSystem: stripeOnly ? 'stripe' : metricName.startsWith('revenue.membership') ? 'stripe+outseta' : 'authority-gap',
      sourceRunId: null, sourceRefs: refs,
      provenance: {
        adapterVersion: VERSION, evidenceRevision, sourceKind: c.sourceKind, stripeApiVersion: c.stripeApiVersion,
        reasons: [...reasons].sort(),
        interpretation: 'Capture-date cohort; retained subtracts successful refunds as of observation, excludes fees and withholds disputes. Not net cash, accounting revenue, bank payouts or upgrades.',
        recurringRevenuePolicy: 'not_defined',
      },
      idempotencyKey: `metric:${stableUuid(VERSION, JSON.stringify([c.metricDate, metricName, scopeKey, c.currency, c.sourceKind, evidenceRevision]))}`,
      observedAt, correlation: c.correlation as CorrelationContext,
    }
    assertMetricSnapshot(metric)
    return metric
  })
  return { metrics, reasons: [...reasons].sort(), payments: payments.sort((a, b) => a.chargeRef.localeCompare(b.chargeRef)), mutationAllowed: false }
}

function add(total: number | null, value: number): number | null {
  if (total === null) return null
  const sum = total + value
  return Number.isSafeInteger(sum) ? sum : null
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify([...new Set(value.map(canonical))].sort())
  if (value !== null && typeof value === 'object') return JSON.stringify(Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  return JSON.stringify(value)
}

function deduplicate<T>(rows: T[], key: (row: T) => string): T[] | null {
  const unique = new Map<string, T>()
  for (const row of rows) {
    const previous = unique.get(key(row))
    if (previous && canonical(previous) !== canonical(row)) return null
    unique.set(key(row), row)
  }
  return [...unique.values()].sort((a, b) => key(a).localeCompare(key(b)))
}
