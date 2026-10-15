import { createHash } from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

const EVENT = 'income_scenario_completed'
const VERSION = 'v1'
const SOURCE_PAGE = '/tools/income-calculator'
const SOURCE = 'income_scenarios'
const IDENTIFIER = /^[A-Za-z0-9:_-]{1,160}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STATES = new Set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '))
const EXPERIENCE_LEVELS = new Set(['new', 'intermediate', 'experienced', 'expert'])
const INSPECTION_TYPES = new Set([
  'Property Inspections',
  'Occupancy Verification',
  'Loss Draft Inspections',
  'REO/Foreclosure',
  'Insurance Claims',
  'Notary Services',
  'Appraisals',
  'Property Preservation',
  'Door Knocks',
  'Skip Tracing',
])

export type FreeOnboardingCompletionMode = 'disabled' | 'preview' | 'write'

export type FreeOnboardingCompletionStatus =
  | 'disabled'
  | 'pending'
  | 'withheld'
  | 'unavailable'
  | 'ready'
  | 'completed'
  | 'already_completed'

export interface FreeOnboardingCompletionResult {
  status: FreeOnboardingCompletionStatus
  reason: string
  completedAt: string | null
  attemptedWrites: 0 | 1
  confirmedWrites: 0 | 1
  activeCampaignMutationAllowed: false
}

interface FreeOnboardingProfileRow {
  id: string
  outseta_person_uid: string | null
  headline: string | null
  bio: string | null
  city: string | null
  state: string | null
  experience_level: string | null
  primary_services: string | null
  service_areas: unknown
  updated_at: string | null
  onboarding_completed_at: string | null
}

interface IncomeScenarioReceiptRow {
  id: string
  client_event_id: string | null
  event_name: string
  member_uid: string | null
  source_page: string | null
  source: string | null
  occurred_at: string
  event_data: unknown
}

interface ExactSnapshot<T> {
  coverage: 'complete' | 'unknown'
  rows: T[]
}

export interface FreeOnboardingCompletionStore {
  readProfiles(outsetaPersonUid: string): Promise<ExactSnapshot<FreeOnboardingProfileRow>>
  readIncomeReceipts(outsetaPersonUid: string, subscriptionUid: string): Promise<ExactSnapshot<IncomeScenarioReceiptRow>>
  compareAndSetCompletedAt(profileId: string, completedAt: string): Promise<'updated' | 'already_completed' | 'unknown'>
}

export interface ReconcileFreeOnboardingCompletionInput {
  mode: FreeOnboardingCompletionMode
  now: string
  outsetaPersonUid: string
  subscriptionUid: string
  planUid: string
  freePlanUid: string
}

function result(
  status: FreeOnboardingCompletionStatus,
  reason: string,
  completedAt: string | null = null,
  attemptedWrites: 0 | 1 = 0,
  confirmedWrites: 0 | 1 = 0,
): FreeOnboardingCompletionResult {
  return {
    status,
    reason,
    completedAt,
    attemptedWrites,
    confirmedWrites,
    activeCampaignMutationAllowed: false,
  }
}

function timestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function profileIsComplete(row: FreeOnboardingProfileRow) {
  return nonempty(row.headline)
    && nonempty(row.bio)
    && nonempty(row.city)
    && typeof row.state === 'string'
    && STATES.has(row.state.trim())
    && typeof row.experience_level === 'string'
    && EXPERIENCE_LEVELS.has(row.experience_level.trim())
    && nonempty(row.primary_services)
    && Array.isArray(row.service_areas)
    && row.service_areas.length > 0
    && row.service_areas.every(value => typeof value === 'string' && INSPECTION_TYPES.has(value))
}

function receiptKey(outsetaPersonUid: string, subscriptionUid: string) {
  const digest = createHash('sha256')
    .update(JSON.stringify([EVENT, VERSION, outsetaPersonUid, subscriptionUid]))
    .digest('hex')

  return `${EVENT}:${VERSION}:${digest}`
}

function validReceipt(row: IncomeScenarioReceiptRow, outsetaPersonUid: string, subscriptionUid: string, now: string) {
  if (!UUID.test(row.id)
    || row.client_event_id !== receiptKey(outsetaPersonUid, subscriptionUid)
    || row.event_name !== EVENT
    || row.member_uid !== outsetaPersonUid
    || row.source_page !== SOURCE_PAGE
    || row.source !== SOURCE
    || !timestamp(row.occurred_at)
    || Date.parse(row.occurred_at) > Date.parse(now)
    || !row.event_data
    || typeof row.event_data !== 'object'
    || Array.isArray(row.event_data)) return false

  const data = row.event_data as Record<string, unknown>
  return Object.keys(data).sort().join(',') === 'completionContract,lifecycleCycleId,source,sourcePage'
    && data.sourcePage === SOURCE_PAGE
    && data.source === SOURCE
    && data.completionContract === VERSION
    && data.lifecycleCycleId === subscriptionUid
}

export function getFreeOnboardingCompletionMode(value = process.env.FREE_ONBOARDING_COMPLETION_MODE): FreeOnboardingCompletionMode {
  return value === 'preview' || value === 'write' ? value : 'disabled'
}

/**
 * Joins the existing saved profile and current-cycle Income Scenarios receipt. The marker is
 * operational UI state only: it never establishes membership, marketing consent, AC eligibility,
 * or permission to write fields 193/194.
 */
export async function reconcileFreeOnboardingCompletion(
  input: ReconcileFreeOnboardingCompletionInput,
  store: FreeOnboardingCompletionStore,
): Promise<FreeOnboardingCompletionResult> {
  if (input.mode === 'disabled') return result('disabled', 'mode_disabled')
  if (!timestamp(input.now)
    || !IDENTIFIER.test(input.outsetaPersonUid)
    || !IDENTIFIER.test(input.subscriptionUid)
    || input.planUid !== input.freePlanUid) return result('withheld', 'current_free_session_unverified')

  const profiles = await store.readProfiles(input.outsetaPersonUid)
  if (profiles.coverage !== 'complete') return result('unavailable', 'profile_lookup_unavailable')
  if (profiles.rows.length === 0) return result('pending', 'profile_missing')
  if (profiles.rows.length !== 1) return result('withheld', 'profile_identity_ambiguous')

  const profile = profiles.rows[0]!
  if (!UUID.test(profile.id)
    || profile.outseta_person_uid !== input.outsetaPersonUid
    || !timestamp(profile.updated_at)
    || Date.parse(profile.updated_at) > Date.parse(input.now)) {
    return result('withheld', 'profile_identity_or_chronology_invalid')
  }
  if (!profileIsComplete(profile)) return result('pending', 'profile_incomplete')

  const receipts = await store.readIncomeReceipts(input.outsetaPersonUid, input.subscriptionUid)
  if (receipts.coverage !== 'complete') return result('unavailable', 'income_receipt_lookup_unavailable')
  if (receipts.rows.length === 0) return result('pending', 'income_receipt_missing')
  if (receipts.rows.length !== 1) return result('withheld', 'income_receipt_ambiguous')

  const receipt = receipts.rows[0]!
  if (!validReceipt(receipt, input.outsetaPersonUid, input.subscriptionUid, input.now)) {
    return result('withheld', 'income_receipt_invalid')
  }

  const completedAt = new Date(Math.max(Date.parse(profile.updated_at), Date.parse(receipt.occurred_at))).toISOString()
  if (profile.onboarding_completed_at !== null) {
    return timestamp(profile.onboarding_completed_at)
      ? result('already_completed', 'verified_sources_marker_present', profile.onboarding_completed_at)
      : result('withheld', 'completion_marker_invalid')
  }
  if (input.mode === 'preview') return result('ready', 'verified_sources_ready', completedAt)

  const update = await store.compareAndSetCompletedAt(profile.id, completedAt)
  if (update === 'updated') return result('completed', 'completion_marker_recorded', completedAt, 1, 1)
  if (update === 'already_completed') return result('already_completed', 'completion_marker_won_by_concurrent_request', completedAt, 1, 1)
  return result('unavailable', 'completion_marker_unconfirmed', completedAt, 1, 0)
}

export function createSupabaseFreeOnboardingCompletionStore(
  supabase: SupabaseClient,
): FreeOnboardingCompletionStore {
  return {
    async readProfiles(outsetaPersonUid) {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('id,outseta_person_uid,headline,bio,city,state,experience_level,primary_services,service_areas,updated_at,onboarding_completed_at', { count: 'exact' })
        .eq('outseta_person_uid', outsetaPersonUid)
        .limit(2)

      if (error || count === null || count !== data?.length) return { coverage: 'unknown', rows: [] }
      return { coverage: 'complete', rows: data as FreeOnboardingProfileRow[] }
    },

    async readIncomeReceipts(outsetaPersonUid, subscriptionUid) {
      const { data, error, count } = await supabase
        .from('conversion_events')
        .select('id,client_event_id,event_name,member_uid,source_page,source,occurred_at,event_data', { count: 'exact' })
        .eq('member_uid', outsetaPersonUid)
        .eq('event_name', EVENT)
        .eq('event_data->>lifecycleCycleId', subscriptionUid)
        .limit(2)

      if (error || count === null || count !== data?.length) return { coverage: 'unknown', rows: [] }
      return { coverage: 'complete', rows: data as IncomeScenarioReceiptRow[] }
    },

    async compareAndSetCompletedAt(profileId, completedAt) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ onboarding_completed_at: completedAt })
        .eq('id', profileId)
        .is('onboarding_completed_at', null)
        .select('id,onboarding_completed_at')

      if (error) return 'unknown'
      if (data?.length === 1
        && data[0]?.id === profileId
        && data[0]?.onboarding_completed_at === completedAt) return 'updated'
      if (data?.length) return 'unknown'

      const { data: existing, error: readError, count } = await supabase
        .from('profiles')
        .select('id,onboarding_completed_at', { count: 'exact' })
        .eq('id', profileId)
        .limit(2)

      return !readError
        && count === 1
        && existing?.length === 1
        && existing[0]?.id === profileId
        && timestamp(existing[0]?.onboarding_completed_at)
        ? 'already_completed'
        : 'unknown'
    },
  }
}

export async function reconcileFreeOnboardingCompletionFromEnvironment(input: {
  supabase: SupabaseClient
  outsetaPersonUid: string | null | undefined
  subscriptionUid: string | null | undefined
  planUid: string | null | undefined
  freePlanUid: string
  now?: string
}) {
  const mode = getFreeOnboardingCompletionMode()
  if (!input.outsetaPersonUid || !input.subscriptionUid || !input.planUid) {
    return result(mode === 'disabled' ? 'disabled' : 'withheld', 'stable_session_identity_unavailable')
  }

  try {
    return await reconcileFreeOnboardingCompletion({
      mode,
      now: input.now ?? new Date().toISOString(),
      outsetaPersonUid: input.outsetaPersonUid,
      subscriptionUid: input.subscriptionUid,
      planUid: input.planUid,
      freePlanUid: input.freePlanUid,
    }, createSupabaseFreeOnboardingCompletionStore(input.supabase))
  } catch {
    return result('unavailable', 'completion_reconciliation_unavailable')
  }
}
