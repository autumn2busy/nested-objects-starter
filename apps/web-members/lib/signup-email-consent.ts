import 'server-only'
import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { recordConversionEvent } from '@/lib/conversion-events'

export const SIGNUP_CONSENT_EVENT = 'lifecycle_email_consent_requested'
export const SIGNUP_CONSENT_VERSION = 'signup-v1'
export const SIGNUP_CONSENT_PURPOSE = 'free_onboarding_and_conversion_email'
export const SIGNUP_CONSENT_TEXT = 'Email me getting-started guidance and occasional membership offers from Nested Objects. I can unsubscribe anytime.'
export const SIGNUP_CONSENT_PROPERTY = 'NoLifecycleEmailRequested'
const MAX_REGISTRATION_SPAN_MS = 90_000
const MAX_CALLBACK_AGE_MS = 24 * 60 * 60 * 1000

type JsonObject = Record<string, unknown>
export type SignupConsentMetadata = {
  sourcePage: '/outseta/signup'
  source: 'outseta_signup_form'
  consentContract: 'signup-v1'
  purpose: typeof SIGNUP_CONSENT_PURPOSE
  lifecycleCycleId: string
  consentText: typeof SIGNUP_CONSENT_TEXT
  consentProperty: typeof SIGNUP_CONSENT_PROPERTY
  evidenceKind: 'signed_signup_callback'
  outsetaAccountUid: string
  registrationOccurredAt: string
  consentRequested: true
}
export type SignupConsentInput = {
  eventName: typeof SIGNUP_CONSENT_EVENT
  clientEventId: string
  memberUid: string
  occurredAt: string
  eventData: SignupConsentMetadata
}
type Decision = { status: 'accepted'; receipt: SignupConsentInput }
  | { status: 'ignored' | 'withheld'; reason: string }
export type ConsentRequestStatus = {
  status: 'recorded' | 'not_recorded' | 'unavailable'
  recorded: boolean
  source: 'signup' | 'welcome' | null
  confirmationRequired: true
}

function object(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null
}
function identifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value)
}
// Outseta's documented full timestamps can omit the UTC suffix. Date-only
// values are insufficient to establish a fresh registration snapshot.
function timestamp(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(Z|[+-]\d{2}:\d{2})?$/.exec(value)
  if (!match) return null
  const [, year, month, day, hour, minute, second, zone] = match
  const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (calendar.getUTCFullYear() !== Number(year) || calendar.getUTCMonth() !== Number(month) - 1
    || calendar.getUTCDate() !== Number(day) || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return null
  const parsed = Date.parse(zone ? value : value + 'Z')
  return Number.isFinite(parsed) ? parsed : null
}
export function consentRequestId(version: 'v1' | 'signup-v1', personUid: string, subscriptionUid: string) {
  const digest = createHash('sha256').update(JSON.stringify([
    SIGNUP_CONSENT_EVENT, version, personUid, subscriptionUid, SIGNUP_CONSENT_PURPOSE,
  ])).digest('hex')
  return `${SIGNUP_CONSENT_EVENT}:${version}:${digest}`
}

/** Called only after authenticating the exact raw signup callback body. */
export function evaluateSignupConsent(payload: unknown, freePlanUid: string, now = Date.now()): Decision {
  const body = object(payload)
  const person = object(body?.Person), account = object(body?.Account), subscription = object(body?.Subscription)
  if (!person || !account || !subscription) return { status: 'withheld', reason: 'registration_bundle_required' }
  const choice = person[SIGNUP_CONSENT_PROPERTY]
  if (choice === false || choice === null || choice === undefined) return { status: 'ignored', reason: 'not_requested' }
  if (choice !== true) return { status: 'withheld', reason: 'affirmative_boolean_required' }
  const plan = object(subscription.Plan)
  if (!identifier(plan?.Uid)) return { status: 'withheld', reason: 'plan_unavailable' }
  if (plan.Uid !== freePlanUid) return { status: 'ignored', reason: 'outside_free_onboarding_scope' }
  if (!identifier(person.Uid) || !identifier(account.Uid) || !identifier(subscription.Uid)) {
    return { status: 'withheld', reason: 'identity_unavailable' }
  }
  if (account.IsDemo !== false) {
    return { status: 'withheld', reason: 'non_demo_registration_unavailable' }
  }
  const primary = Array.isArray(account.PersonAccount)
    ? account.PersonAccount.map(object).filter(link => link?.IsPrimary === true) : []
  if (primary.length !== 1 || object(primary[0]?.Person)?.Uid !== person.Uid
    || object(subscription.Account)?.Uid !== account.Uid) {
    return { status: 'withheld', reason: 'registration_identity_binding_conflict' }
  }
  const current = object(account.CurrentSubscription), latest = object(account.LatestSubscription)
  if ((current && current.Uid !== subscription.Uid) || (latest && latest.Uid !== subscription.Uid)
    || (object(primary[0]?.Account) && object(primary[0]?.Account)?.Uid !== account.Uid)) {
    return { status: 'withheld', reason: 'registration_identity_binding_conflict' }
  }
  const markers = [person, account, subscription, primary[0]]
  const created = markers.map(marker => timestamp(marker?.Created))
  const started = timestamp(subscription.StartDate)
  if (!Number.isFinite(now) || started === null || created.some(value => value === null)
    || markers.some((marker, index) => timestamp(marker?.Updated) !== created[index])) {
    return { status: 'withheld', reason: 'immutable_creation_chronology_unavailable' }
  }
  const times = [...created, started] as number[]
  const earliest = Math.min(...times), completed = Math.max(...times)
  if (completed > now || now - earliest > MAX_CALLBACK_AGE_MS || completed - earliest > MAX_REGISTRATION_SPAN_MS) {
    return { status: 'withheld', reason: 'not_a_fresh_registration' }
  }
  const occurredAt = new Date(completed).toISOString()
  return { status: 'accepted', receipt: {
    eventName: SIGNUP_CONSENT_EVENT,
    clientEventId: consentRequestId('signup-v1', person.Uid, subscription.Uid),
    memberUid: person.Uid, occurredAt,
    eventData: {
      sourcePage: '/outseta/signup', source: 'outseta_signup_form', consentContract: SIGNUP_CONSENT_VERSION,
      purpose: SIGNUP_CONSENT_PURPOSE, lifecycleCycleId: subscription.Uid,
      consentText: SIGNUP_CONSENT_TEXT, consentProperty: SIGNUP_CONSENT_PROPERTY,
      evidenceKind: 'signed_signup_callback', outsetaAccountUid: account.Uid,
      registrationOccurredAt: occurredAt, consentRequested: true,
    },
  } }
}

function validStoredReceipt(row: JsonObject, memberUid: string, subscriptionUid: string, now: number): 'signup' | 'welcome' | null {
  const data = object(row.event_data), occurredAt = timestamp(row.occurred_at)
  if (!data || row.member_uid !== memberUid || row.event_name !== SIGNUP_CONSENT_EVENT
    || data.lifecycleCycleId !== subscriptionUid || data.purpose !== SIGNUP_CONSENT_PURPOSE
    || occurredAt === null || occurredAt > now) return null
  const keys = Object.keys(data).sort().join(',')
  if (data.consentContract === 'v1' && row.client_event_id === consentRequestId('v1', memberUid, subscriptionUid)
    && keys === 'consentContract,lifecycleCycleId,purpose,source,sourcePage'
    && data.sourcePage === '/welcome' && data.source === 'member_consent') return 'welcome'
  if (data.consentContract === 'signup-v1' && row.client_event_id === consentRequestId('signup-v1', memberUid, subscriptionUid)
    && keys === 'consentContract,consentProperty,consentRequested,consentText,evidenceKind,lifecycleCycleId,outsetaAccountUid,purpose,registrationOccurredAt,source,sourcePage'
    && data.sourcePage === '/outseta/signup' && data.source === 'outseta_signup_form'
    && data.consentText === SIGNUP_CONSENT_TEXT && data.consentProperty === SIGNUP_CONSENT_PROPERTY
    && data.evidenceKind === 'signed_signup_callback' && identifier(data.outsetaAccountUid)
    && data.consentRequested === true && data.registrationOccurredAt === new Date(occurredAt).toISOString()) return 'signup'
  return null
}

export async function persistSignupConsent(supabase: SupabaseClient, receipt: SignupConsentInput) {
  if (validStoredReceipt({ client_event_id: receipt.clientEventId, event_name: receipt.eventName,
    member_uid: receipt.memberUid, occurred_at: receipt.occurredAt, event_data: receipt.eventData },
  receipt.memberUid, receipt.eventData.lifecycleCycleId, Date.now()) !== 'signup') {
    throw new Error('Invalid signup consent receipt')
  }
  await recordConversionEvent(supabase, receipt)
  const { data, error } = await supabase.from('conversion_events')
    .select('client_event_id,event_name,member_uid,occurred_at,event_data')
    .eq('client_event_id', receipt.clientEventId).eq('event_name', SIGNUP_CONSENT_EVENT)
    .eq('member_uid', receipt.memberUid).limit(1).single()
  if (error || !data || validStoredReceipt(data, receipt.memberUid, receipt.eventData.lifecycleCycleId, Date.now()) !== 'signup'
    || timestamp(data.occurred_at) !== timestamp(receipt.occurredAt)
    || data.event_data?.outsetaAccountUid !== receipt.eventData.outsetaAccountUid) {
    throw new Error('Signup consent persistence could not be verified')
  }
}

export async function readConsentRequestStatus(supabase: SupabaseClient, memberUid: string, subscriptionUid: string, now = Date.now()): Promise<ConsentRequestStatus> {
  const unavailable: ConsentRequestStatus = { status: 'unavailable', recorded: false, source: null, confirmationRequired: true }
  if (!identifier(memberUid) || !identifier(subscriptionUid) || !Number.isFinite(now)) return unavailable
  try {
    const ids = [consentRequestId('v1', memberUid, subscriptionUid), consentRequestId('signup-v1', memberUid, subscriptionUid)]
    const { data, error } = await supabase.from('conversion_events')
      .select('client_event_id,event_name,member_uid,occurred_at,event_data')
      .in('client_event_id', ids).eq('event_name', SIGNUP_CONSENT_EVENT).eq('member_uid', memberUid).limit(3)
    if (error || !Array.isArray(data) || data.length > 2) return unavailable
    let source: 'signup' | 'welcome' | null = null
    const seen = new Set<string>()
    for (const row of data) {
      if (!object(row) || !ids.includes(row.client_event_id) || seen.has(row.client_event_id)) return unavailable
      seen.add(row.client_event_id)
      const valid = validStoredReceipt(row, memberUid, subscriptionUid, now)
      if (!valid) return unavailable
      if (source !== 'signup') source = valid
    }
    return { status: source ? 'recorded' : 'not_recorded', recorded: Boolean(source), source, confirmationRequired: true }
  } catch { return unavailable }
}
