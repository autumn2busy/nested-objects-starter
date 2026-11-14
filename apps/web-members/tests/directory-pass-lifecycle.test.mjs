import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function load(relative, modules = {}, environment = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const context = { exports: {}, require: name => {
    if (!(name in modules)) throw new Error('Unexpected dependency: ' + name)
    return modules[name]
  }, console: { log() {}, warn() {}, error() {} }, process: { env: { NODE_ENV: 'test', ...environment } } }
  vm.runInNewContext(code, context)
  return context.exports
}
const planConfig = load('../lib/plan-config.ts')
const configuredUid = 'PassFixture199'
const billing = (uid = configuredUid) => load('../lib/outseta-plan-billing.ts', { '@/lib/plan-config': planConfig }, { NEXT_PUBLIC_OUTSETA_DIRECTORY_PASS_PLAN_UID: uid })
const planBilling = billing()
const lifecycle = load('../lib/free-to-pro-lifecycle.ts', { '@/lib/outseta-plan-billing': planBilling })

test('exact configured UID identifies a $199 nonrecurring twelve-month product independently of its name', () => {
  for (const name of ['Directory Pass', 'Starter', 'Pro', undefined]) assert.equal(planBilling.mapOutsetaPlanTier(name, configuredUid), 'directory_pass')
  assert.equal(lifecycle.getPlanValue('directory_pass'), 199)
  assert.deepEqual(JSON.parse(JSON.stringify(planBilling.DIRECTORY_PASS_BILLING)), { amount: 199, currency: 'USD', renewalTerm: 4, expiresAfterMonths: 12, recurring: false })
})

test('legacy plan UIDs retain their tiers even when labels are missing or misleading', () => {
  const expected = { FREE: 'free', STARTER: 'starter', FOUNDERS: 'founders', PRO: 'pro', ELITE: 'elite', AGENCY: 'agency' }
  for (const [name, uid] of Object.entries(planConfig.PLAN_UIDS)) {
    assert.equal(planBilling.mapOutsetaPlanTier(undefined, uid), expected[name])
    assert.equal(planBilling.mapOutsetaPlanTier('Directory Pass', uid), expected[name])
    assert.equal(billing(uid).isConfiguredDirectoryPass(uid), false)
  }
  assert.equal(lifecycle.getPlanValue('starter'), 99)
  assert.equal(lifecycle.getPlanValue('pro'), 49)
  assert.equal(lifecycle.getPlanValue('elite'), 97)
})

test('missing, malformed and mismatched Pass UID configuration never falls back to Starter or Free', () => {
  for (const uid of ['', 'bad-uid', 'OtherUid']) {
    assert.equal(billing(uid).isConfiguredDirectoryPass(configuredUid), false)
    assert.throws(() => billing(uid).mapOutsetaPlanTier('Directory Pass', configuredUid), /does not match/)
  }
})

test('Pass projection uses actual expiration or earlier termination, never renewal or an invented date', () => {
  const subscription = { Plan: { Uid: configuredUid }, ExpirationDate: '2027-11-14T15:00:00', EndDate: null, RenewalDate: '2026-12-14T15:00:00' }
  assert.equal(planBilling.outsetaSubscriptionEndDate(subscription), subscription.ExpirationDate)
  assert.equal(planBilling.outsetaSubscriptionEndDate({ ...subscription, EndDate: '2027-01-01T00:00:00Z' }), '2027-01-01T00:00:00Z')
  assert.equal(planBilling.outsetaSubscriptionEndDate({ ...subscription, EndDate: '2028-01-01T00:00:00Z' }), subscription.ExpirationDate)
  for (const expiration of [undefined, null, '', 'invalid', '2027-11-14']) assert.equal(planBilling.outsetaSubscriptionEndDate({ ...subscription, ExpirationDate: expiration }), null)
  assert.equal(planBilling.outsetaSubscriptionEndDate({ ...subscription, EndDate: 'invalid' }), null)
  assert.equal(planBilling.outsetaSubscriptionEndDate({ ...subscription, Plan: { Uid: planConfig.PLAN_UIDS.STARTER } }), subscription.RenewalDate)
})

test('Pass membership transitions emit neither purchase nor recurring subscription events without payment evidence', () => {
  for (const previousTier of ['free', 'starter', 'directory_pass']) for (const operation of ['insert', 'update']) {
    const result = lifecycle.buildPaidLifecycleDecision({ operation,
      previous: { subscription_tier: previousTier, plan_uid: 'old-plan' },
      current: { subscription_tier: 'directory_pass', plan_uid: configuredUid, plan_name: 'Directory Pass' } })
    assert.equal(result.shouldTrack, false)
    assert.equal(result.reason, 'one_time_payment_evidence_required')
    assert.equal(result.purchasePayload, undefined)
    assert.equal(result.subscriptionEvent, undefined)
  }
  const legacy = lifecycle.buildPaidLifecycleDecision({ operation: 'insert', current: { subscription_tier: 'starter', plan_uid: planConfig.PLAN_UIDS.STARTER, plan_name: 'Starter' } })
  assert.equal(legacy.shouldTrack, true)
  assert.equal(legacy.purchasePayload.value, 99)
})

async function webhook(payload, stored = {}) {
  let written, synchronized, routingCount = 0
  const existing = { id: 'synthetic-profile', user_email: 'synthetic@example.invalid', outseta_updated_at: '2026-01-01T00:00:00Z', subscription_tier: 'free', ...stored }
  const db = { from: () => { let updating = false; const q = { select: () => q, eq: () => q,
    update: value => { written = value; updating = true; return q },
    single: async () => ({ data: updating ? { id: existing.id } : existing, error: null }) }; return q } }
  const unexpected = () => { throw Error('Unexpected purchase/subscription tracking') }
  const route = load('../app/api/webhooks/outseta/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
    '@supabase/supabase-js': { createClient: () => db }, crypto: { default: { randomUUID: () => 'synthetic-request' } },
    '@/lib/security': { verifyOutsetaSignature: () => true }, '@/lib/outseta-plan-billing': planBilling,
    '@/lib/outseta-billing-stage': load('../lib/outseta-billing-stage.ts'), '@/lib/free-to-pro-lifecycle': lifecycle,
    '@/lib/conversion-events': { recordConversionEvent: unexpected },
    '@/lib/free-journey-operation-producer': { emitFreeJourneySourceEvent: async () => { routingCount++; return { recoveryRequired: false } } },
    '@/lib/active-campaign-deep-data': { syncFullProfileDeepData: async p => { synchronized = p; return { status: 'succeeded', recoveryRequired: false, automaticRetry: false, steps: [], logs: [] } } },
    '@/lib/ac-event-tracking': { trackPurchase: unexpected, trackSubscriptionCreated: unexpected, trackSubscriptionUpgraded: unexpected },
  }, { SUPABASE_URL: 'synthetic', SUPABASE_SERVICE_ROLE_KEY: 'synthetic' })
  const response = await route.POST({ text: async () => JSON.stringify(payload), headers: { get: () => '' } })
  return { response, written, synchronized, routingCount }
}

for (const shape of ['person', 'account']) test(shape + ' webhook persists distinct tier, true access expiry and one-time renewal enum without Free journey routing', async () => {
  const person = { Uid: 'synthetic-person', Email: 'synthetic@example.invalid', Updated: '2026-11-14T15:00:00Z' }
  const account = { Uid: 'synthetic-account', AccountStage: 3, AccountStageLabel: 'Subscribing',
    CurrentSubscription: { Uid: 'synthetic-pass-cycle', BillingRenewalTerm: 4, StartDate: '2026-11-14T15:00:00Z', ExpirationDate: '2027-11-14T15:00:00Z',
      RenewalDate: '2026-12-14T15:00:00Z', Plan: { Uid: configuredUid, Name: 'Directory Pass', OneTimeRate: 199, ExpiresAfterMonths: 12 } } }
  const payload = shape === 'person' ? { ...person, PersonAccount: [{ IsPrimary: true, Account: account }] } : { ...account, PersonAccount: [{ IsPrimary: true, Person: person }] }
  const result = await webhook(payload)
  assert.equal(result.response.status, 200)
  assert.equal(result.written.subscription_tier, 'directory_pass')
  assert.equal(result.written.subscription_end_date, '2027-11-14T15:00:00Z')
  assert.equal(result.written.billing_renewal_term, 4)
  assert.equal(result.synchronized.subscription_tier, 'directory_pass')
  assert.equal(result.routingCount, 0)
})

test('plan-light webhook corrects an exact Pass UID stored under the old Starter projection', async () => {
  const result = await webhook({ Uid: 'synthetic-person', Email: 'synthetic@example.invalid', Updated: '2026-11-14T15:00:00Z' },
    { subscription_tier: 'starter', plan_uid: configuredUid, plan_name: 'Directory Pass', billing_renewal_term: 4, subscription_end_date: '2027-11-14T15:00:00Z' })
  assert.equal(result.response.status, 200)
  assert.equal(result.written.subscription_tier, 'directory_pass')
  assert.equal(result.routingCount, 0)
})
