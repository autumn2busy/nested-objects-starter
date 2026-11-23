import 'server-only'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import { PLAN_UIDS } from '@/lib/plan-config'
import { outsetaUtc } from '@/lib/directory-pass-payment'
import { createNonrecurringAcClient, type AcRequest } from '@/lib/active-campaign-nonrecurring-client'
import { requireNumericId, verifyAccountPerson, type NonrecurringMember } from '@/lib/nonrecurring-provider-reads'
import { readFreeCustomerScope, validateFreeCustomerRequest, type FreeCustomerRequest } from '@/lib/free-customer-scope'

type Row = Record<string, any>
// Deliberately created Pass QA identity. A genuine Free allowlist entry must also
// be reviewed for known test provenance; absence of an email marker is not proof.
const KNOWN_QA_ACCOUNT_UIDS = new Set(['Rm8ZJBE9'])
const SAFE_CODES = new Set([
  'free_customer_sync_disabled', 'production_only_operator', 'global_routing_mode_must_remain_unset',
  'invalid_free_customer_scope', 'free_customer_scope_expired_or_unbounded', 'invalid_free_customer_request',
  'invalid_ac_identity', 'missing_or_invalid_customer_configuration', 'invalid_provider_path',
  'provider_request_failed', 'forbidden_customer_operation', 'exact_existing_member_required',
  'allowlisted_primary_contact_required', 'offboarding_hold_read_unavailable', 'current_free_authority_required',
  'inactive_free_subscription', 'inactive_or_held_member', 'demo_or_known_qa_account',
  'stripe_linked_or_unknown_free_account', 'authoritative_member_identity_conflict', 'primary_membership_unverified',
  'existing_contact_required', 'contact_identity_conflict', 'stored_contact_conflict',
  'incomplete_ac_collection', 'duplicate_ac_rows', 'customer_identity_conflict',
  'customer_identity_or_legacy_connection_conflict', 'stored_customer_conflict', 'unreviewed_active_automation',
  'unreviewed_trigger_set', 'trigger_identity_conflict', 'unreviewed_field_trigger', 'unexpected_conversion_trigger',
  'incomplete_contact_history', 'active_or_unknown_contact_journey', 'identity_intent_read_unavailable',
  'prior_customer_intent_no_blind_retry', 'fresh_customer_preflight_required', 'customer_write_unconfirmed_no_replay',
  'post_write_hold_not_clear', 'profile_customer_link_conflict', 'profile_customer_readback_unverified',
])
export type FreeCustomerResult = {
  state: 'verified' | 'blocked' | 'uncertain'; code: string
  providerWrite: boolean; databaseWrite: boolean
}

/** Production Free authority for the first operator-only cohort, not paid purchases.
 * IsLivemode is not a general QA classifier when no Stripe customer exists.
 * All Stripe-linked Free accounts remain outside this initial bounded cohort.
 */
export function verifyFreeCustomerAuthority(account: Row, profile: Row, held: boolean, now: number) {
  const sub = account.CurrentSubscription
  if (profile.plan_uid !== PLAN_UIDS.FREE || profile.subscription_status !== 'active' ||
      account.AccountStage !== 2 || sub?.Plan?.Uid !== PLAN_UIDS.FREE ||
      sub?.Account?.Uid !== account.Uid || typeof sub?.Uid !== 'string' || !sub.Uid ||
      sub.Uid !== account.LatestSubscription?.Uid) throw Error('current_free_authority_required')
  if (sub.EndDate !== null || sub.ExpirationDate === undefined ||
      (sub.ExpirationDate !== null && Date.parse(outsetaUtc(sub.ExpirationDate)) <= now)) throw Error('inactive_free_subscription')
  if (held || (account.IsDeleted !== undefined && account.IsDeleted !== false) ||
      (account.IsArchived !== undefined && account.IsArchived !== false)) throw Error('inactive_or_held_member')
  if (account.IsDemo !== false || KNOWN_QA_ACCOUNT_UIDS.has(account.Uid) ||
      /(?:^|[+._-])qa(?:[+._@-]|$)|@example\.(?:com|invalid)$/i.test(profile.user_email)) throw Error('demo_or_known_qa_account')
  if (account.StripeId !== null || account.PaymentInformation !== null) throw Error('stripe_linked_or_unknown_free_account')
}

/** Dedicated customer-only operator. Never calls the generic Free/Pass reconciler.
 * Verify is GET-only; apply permits one ecomCustomers POST guarded by the existing
 * durable customer intent, followed by exact GET and narrow profile-link CAS.
 */
export async function reconcileOneFreeCustomer(input: FreeCustomerRequest,
  options: { fetcher?: typeof fetch; now?: () => number } = {}): Promise<FreeCustomerResult> {
  const result: FreeCustomerResult = { state: 'blocked', code: 'verification_incomplete', providerWrite: false, databaseWrite: false }
  try {
    const clock = options.now || Date.now, fetcher = options.fetcher || fetch
    const started = clock(), scope = readFreeCustomerScope(process.env, started)
    validateFreeCustomerRequest(input, scope, started)
    const connectionId = requireNumericId(process.env.AC_CONNECTION_ID)
    const apiUrl = new URL(process.env.AC_API_URL || '')
    const outsetaKey = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY
    if (apiUrl.origin !== 'https://awilliams.api-us1.com' || apiUrl.pathname !== '/' ||
        !process.env.AC_API_KEY || !outsetaKey || !process.env.OUTSETA_API_SECRET) throw Error('missing_or_invalid_customer_configuration')
    const request = async (origin: string, path: string, headers: Record<string, string>, method = 'GET', body?: unknown) => {
      if (path.startsWith('/') || path.includes('://') || path.includes('..')) throw Error('invalid_provider_path')
      const response = await fetcher(origin + path, { method, redirect: 'error', cache: 'no-store',
        headers: { ...headers, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
      if (!response.ok) throw Error('provider_request_failed')
      return response.json()
    }
    const outseta = (path: string) => request('https://nested-objects.outseta.com/api/v1/', path,
      { Authorization: `Outseta ${outsetaKey}:${process.env.OUTSETA_API_SECRET}` })
    const ac: AcRequest = (path, method = 'GET', body) => {
      if (method !== 'GET' && (scope.mode !== 'apply' || method !== 'POST' || path !== 'ecomCustomers')) throw Error('forbidden_customer_operation')
      return request('https://awilliams.api-us1.com/api/3/', path, { 'Api-Token': process.env.AC_API_KEY! }, method, body)
    }
    const db = createServiceRoleClient(), client = createNonrecurringAcClient(ac, connectionId)
    const assertFresh = () => {
      const now = clock(), current = readFreeCustomerScope(process.env, now)
      validateFreeCustomerRequest(input, current, now)
      if (JSON.stringify(current) !== JSON.stringify(scope) || now - started > 60_000 || now < started) throw Error('fresh_customer_preflight_required')
    }
    const profileRead = await db.from('profiles').select('id,user_email,outseta_person_uid,outseta_account_id,plan_uid,subscription_status,ac_contact_id,ac_customer_id')
      .eq('outseta_account_id', scope.accountUid).limit(2)
    if (profileRead.error || profileRead.data?.length !== 1) throw Error('exact_existing_member_required')
    const profile = profileRead.data[0]
    if (profile.outseta_account_id !== scope.accountUid || profile.outseta_person_uid !== scope.personUid || String(profile.ac_contact_id) !== scope.acContactId ||
        typeof profile.user_email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.user_email)) throw Error('allowlisted_primary_contact_required')
    const member: NonrecurringMember = { personUid: scope.personUid, accountUid: scope.accountUid,
      email: profile.user_email.trim().toLowerCase(), acContactId: scope.acContactId,
      acCustomerId: profile.ac_customer_id ? requireNumericId(profile.ac_customer_id) : null }
    const holdQuery = () => db.from('member_offboarding_holds').select('account_uid,person_uid,released_at')
      .or(`account_uid.eq.${scope.accountUid},person_uid.eq.${scope.personUid}`).is('released_at', null).limit(1)
    const [account, person, holds] = await Promise.all([
      outseta(`crm/accounts/${scope.accountUid}?donotlog=1&fields=Uid,IsDemo,IsLivemode,IsDeleted,IsArchived,AccountStage,StripeId,PaymentInformation.CustomerToken,PersonAccount.IsPrimary,PersonAccount.Person.Uid,CurrentSubscription.Uid,CurrentSubscription.Plan.Uid,CurrentSubscription.Account.Uid,CurrentSubscription.EndDate,CurrentSubscription.ExpirationDate,LatestSubscription.Uid`),
      outseta(`crm/people/${scope.personUid}?donotlog=1&fields=Uid,Email,PersonAccount.IsPrimary,PersonAccount.Account.Uid`), holdQuery(),
    ])
    if (holds.error || !Array.isArray(holds.data)) throw Error('offboarding_hold_read_unavailable')
    verifyAccountPerson(account, person, member)
    verifyFreeCustomerAuthority(account, profile, holds.data.length > 0, clock())
    const contactId = await client.findContact(member)
    if (contactId !== scope.acContactId) throw Error('existing_contact_required')
    const customerId = await client.findCustomer(member)
    await client.noEmailPreflight(contactId)
    assertFresh()
    if (customerId) return { ...result, state: member.acCustomerId === customerId ? 'verified' : 'blocked',
      code: member.acCustomerId === customerId ? 'existing_free_customer_readback_only' : 'existing_customer_link_requires_review' }
    const intents = await db.from('ac_nonrecurring_identity_intents').select('person_uid')
      .eq('connection_id', connectionId).eq('person_uid', scope.personUid).eq('kind', 'customer').limit(2)
    if (intents.error || !Array.isArray(intents.data)) throw Error('identity_intent_read_unavailable')
    if (intents.data.length) throw Error('prior_customer_intent_no_blind_retry')
    assertFresh()
    if (scope.mode === 'verify') return { ...result, state: 'verified', code: 'eligible_free_customer_would_create_no_write' }
    // Unique(connection, person, kind) makes concurrent/replayed requests lose before POST.
    const claimed = await db.from('ac_nonrecurring_identity_intents').insert({ connection_id: connectionId,
      person_uid: scope.personUid, account_uid: scope.accountUid, kind: 'customer' }).select('person_uid').single()
    if (claimed.error || !claimed.data) throw Error('prior_customer_intent_no_blind_retry')
    result.databaseWrite = true
    assertFresh()
    result.providerWrite = true
    try { await client.createCustomer(member) } catch { /* Independent exact GET determines an uncertain write. */ }
    const created = await client.findCustomer(member)
    if (!created) throw Error('customer_write_unconfirmed_no_replay')
    await client.noEmailPreflight(contactId)
    const currentHolds = await holdQuery()
    if (currentHolds.error || !Array.isArray(currentHolds.data) || currentHolds.data.length) throw Error('post_write_hold_not_clear')
    assertFresh()
    const saved = await db.from('profiles').update({ ac_customer_id: created })
      .eq('id', profile.id).eq('outseta_account_id', scope.accountUid).eq('outseta_person_uid', scope.personUid)
      .eq('ac_contact_id', scope.acContactId).eq('plan_uid', PLAN_UIDS.FREE).eq('subscription_status', 'active')
      .is('ac_customer_id', null).select('ac_customer_id').single()
    if (saved.error || String(saved.data?.ac_customer_id) !== created) throw Error('profile_customer_link_conflict')
    const linked = await db.from('profiles').select('ac_customer_id,ac_contact_id,outseta_account_id,outseta_person_uid')
      .eq('id', profile.id).single()
    if (linked.error || String(linked.data?.ac_customer_id) !== created || String(linked.data?.ac_contact_id) !== scope.acContactId ||
        linked.data?.outseta_account_id !== scope.accountUid || linked.data?.outseta_person_uid !== scope.personUid) throw Error('profile_customer_readback_unverified')
    return { ...result, state: 'verified', code: 'free_customer_created_and_linked' }
  } catch (error) {
    const code = error instanceof Error && SAFE_CODES.has(error.message) ? error.message : 'customer_verification_unavailable'
    return { ...result, state: result.providerWrite || result.databaseWrite ? 'uncertain' : 'blocked', code }
  }
}
