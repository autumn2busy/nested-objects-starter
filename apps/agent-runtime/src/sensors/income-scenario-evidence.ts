import { createHash } from 'node:crypto'
import { z } from 'zod'

import type { ConversionEventSourceRow, ProfileSourceRow } from '../projections/member-projection.js'
import type { JourneyMilestoneEvidence } from './marketing-eligibility.js'

const EVENT = 'income_scenario_completed'
const VERSION = 'v1'
const PAGE = '/tools/income-calculator'
const SOURCE = 'income_scenarios'
const timestamp = z.string().datetime({ offset: true })
const identifier = z.string().min(1).max(160).refine((value) => (
  value === value.trim() && !/[\s@\u0000-\u001f]/.test(value)
))

/** A complete, bounded lookup for the requested person/current cycle, not a first page. */
export interface MilestoneReadSnapshot<Row> {
  coverage: 'complete' | 'partial' | 'unknown'
  observedAt: string
  rows: readonly Row[]
}

/** Must come from independently verified current Outseta truth, never profile/AC plan mirrors. */
export interface IncomeScenarioCycleTruth {
  sourceSystem: string
  authoritative: boolean
  identityState: 'verified' | 'conflict' | 'unknown'
  isCurrent: boolean
  sourceRecordId: string
  outsetaPersonUid: string
  subscriptionUid: string
  memberSince: string
  cycleStartedAt: string
}

export interface IncomeScenarioEvidenceInput {
  outsetaPersonUid: string
  profiles: MilestoneReadSnapshot<Pick<ProfileSourceRow, 'id' | 'outseta_person_uid'>>
  currentMemberships: MilestoneReadSnapshot<IncomeScenarioCycleTruth>
  // An approved server-side conversion_events read; an HTTP recorded:true response is not a row.
  completionEvents: MilestoneReadSnapshot<ConversionEventSourceRow>
  now: string
  // Explicit caller policy; this pure adapter does not invent or enable a live-source freshness SLA.
  maxSnapshotAgeMs: number
}

export interface IncomeScenarioEvidenceResult {
  status: 'accepted' | 'withheld'
  evidence: JourneyMilestoneEvidence | null
  reasons: string[]
  mutationAllowed: false
}

const profileSchema = z.object({ id: z.string().uuid(), outseta_person_uid: identifier })
const cycleSchema = z.object({
  sourceSystem: z.literal('outseta'), authoritative: z.literal(true),
  identityState: z.literal('verified'), isCurrent: z.literal(true),
  sourceRecordId: z.string().trim().min(1).max(255),
  outsetaPersonUid: identifier, subscriptionUid: identifier,
  memberSince: timestamp, cycleStartedAt: timestamp,
})
const eventSchema = z.object({
  id: z.string().uuid(), client_event_id: z.string(),
  event_name: z.literal(EVENT), member_uid: identifier,
  source_page: z.literal(PAGE), source: z.literal(SOURCE), occurred_at: timestamp,
  event_data: z.object({
    sourcePage: z.literal(PAGE), source: z.literal(SOURCE),
    completionContract: z.literal(VERSION), lifecycleCycleId: identifier,
  }).strict(),
})

/** Pure receipt-to-evidence projection. No reads, writes, enrollment, or onboarding aggregation. */
export function adaptIncomeScenarioMilestone(input: IncomeScenarioEvidenceInput): IncomeScenarioEvidenceResult {
  const withhold = (reason: string): IncomeScenarioEvidenceResult => ({
    status: 'withheld', evidence: null, reasons: [reason], mutationAllowed: false,
  })
  if (!input || !identifier.safeParse(input.outsetaPersonUid).success
    || !timestamp.safeParse(input.now).success
    || !Number.isFinite(input.maxSnapshotAgeMs) || input.maxSnapshotAgeMs <= 0) {
    return withhold('invalid_observation_context')
  }
  const now = Date.parse(input.now)
  for (const [name, snapshot] of [
    ['profiles', input.profiles], ['membership', input.currentMemberships], ['receipt', input.completionEvents],
  ] as const) {
    if (!snapshot || snapshot.coverage !== 'complete' || !Array.isArray(snapshot.rows)) {
      return withhold(`${name}_lookup_incomplete`)
    }
    if (!timestamp.safeParse(snapshot.observedAt).success) return withhold(`${name}_lookup_time_invalid`)
    const age = now - Date.parse(snapshot.observedAt)
    if (age < 0 || age > input.maxSnapshotAgeMs) return withhold(`${name}_lookup_stale_or_future`)
    // Do not silently choose a row from ambiguous or conflicting lookup results.
    if (snapshot.rows.length !== 1) return withhold(`${name}_lookup_missing_or_ambiguous`)
  }

  const profileResult = profileSchema.safeParse(input.profiles.rows[0])
  if (!profileResult.success || profileResult.data.outseta_person_uid !== input.outsetaPersonUid) {
    return withhold('profile_subject_unresolved')
  }
  const cycleResult = cycleSchema.safeParse(input.currentMemberships.rows[0])
  if (!cycleResult.success || cycleResult.data.outsetaPersonUid !== input.outsetaPersonUid) {
    return withhold('current_outseta_cycle_unverified')
  }
  const eventResult = eventSchema.safeParse(input.completionEvents.rows[0])
  if (!eventResult.success) return withhold('completion_receipt_contract_invalid')
  const profile = profileResult.data
  const cycle = cycleResult.data
  const event = eventResult.data
  if (event.member_uid !== input.outsetaPersonUid || event.event_data.lifecycleCycleId !== cycle.subscriptionUid) {
    return withhold('receipt_member_or_cycle_mismatch')
  }
  const expectedKey = `${EVENT}:${VERSION}:${createHash('sha256').update(JSON.stringify([
    EVENT, VERSION, input.outsetaPersonUid, cycle.subscriptionUid,
  ])).digest('hex')}`
  if (event.client_event_id !== expectedKey) return withhold('receipt_key_mismatch')

  const occurredAt = Date.parse(event.occurred_at)
  const memberSince = Date.parse(cycle.memberSince)
  const cycleStartedAt = Date.parse(cycle.cycleStartedAt)
  // A person may join an existing Agency subscription; neither authority date implies the other.
  if (occurredAt < memberSince || occurredAt < cycleStartedAt || occurredAt > now
    || occurredAt > Date.parse(input.completionEvents.observedAt)
    || memberSince > Date.parse(input.currentMemberships.observedAt)
    || cycleStartedAt > Date.parse(input.currentMemberships.observedAt)) {
    return withhold('receipt_chronology_invalid')
  }
  return {
    status: 'accepted',
    evidence: {
      memberId: profile.id,
      lifecycleCycleId: cycle.subscriptionUid,
      sourceRecordId: `conversion_events:${event.id}`,
      occurredAt: event.occurred_at,
    },
    reasons: [], mutationAllowed: false,
  }
}
