import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function load(relative, modules = {}, extras = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const context = { exports: {}, require: name => {
    if (!(name in modules)) throw new Error('Unexpected dependency: ' + name)
    return modules[name]
  }, console: { log() {}, warn() {}, error() {} }, process: { env: { NODE_ENV: 'test' } }, ...extras }
  vm.runInNewContext(code, context)
  return context.exports
}
const mapping = load('../lib/outseta-billing-stage.ts')

test('Outseta numeric stages match the documented billing lifecycle without a label', () => {
  for (const [stage, expected] of [[2,'trialing'],[3,'active'],[4,'canceled'],[5,'canceled'],[6,'canceled'],[7,'past_due'],[8,'trialing']]) {
    assert.equal(mapping.mapOutsetaBillingStage(stage), expected)
  }
  assert.equal(mapping.mapOutsetaBillingStage(6, 'Trial Expired'), 'canceled')
  assert.equal(mapping.mapOutsetaBillingStage(7, 'Past due'), 'past_due')
})

test('missing, unrecognized, and contradictory billing evidence is unknown rather than active', () => {
  for (const args of [[], [1], [99], [undefined, 'inactive'], [3, 'Past due'], [7, 'Subscribing'], [undefined, 'unknown']]) {
    assert.equal(mapping.mapOutsetaBillingStage(...args), null)
  }
  assert.equal(mapping.mapOutsetaBillingStage(undefined, 'Subscribing'), 'active')
})

test('real webhook mapping passes correct statuses to sync and preserves stored state on a plan-light update', async () => {
  for (const [stage, expected] of [[3,'active'], [7,'past_due'], [6,'canceled'], [undefined,null]]) {
    let written
    let synchronized
    const existing = { id: 'synthetic-profile', user_email: 'synthetic@example.com',
      outseta_updated_at: '2026-09-01T00:00:00.000Z', outseta_account_id: 'synthetic-account',
      subscription_tier: 'pro', subscription_status: 'past_due', plan_uid: 'rQVqlLm6', plan_name: 'Pro',
      subscription_start_date: '2026-08-01T00:00:00.000Z' }
    const db = { from: () => {
      let updating = false
      const query = { select: () => query, eq: () => query,
        update: payload => { written = payload; updating = true; return query },
        single: async () => ({ data: updating ? { id: existing.id } : existing, error: null }) }
      return query
    } }
    const route = load('../app/api/webhooks/outseta/route.ts', {
      'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
      '@supabase/supabase-js': { createClient: () => db },
      crypto: { default: { randomUUID: () => 'synthetic-request' } },
      '@/lib/security': { verifyOutsetaSignature: () => true },
      '@/lib/free-to-pro-lifecycle': { buildPaidLifecycleDecision: () => ({ shouldTrack: false, reason: 'fixture' }) },
      '@/lib/conversion-events': { recordConversionEvent: async () => { throw new Error('Unexpected conversion write') } },
      '@/lib/outseta-billing-stage': mapping,
      '@/lib/active-campaign-deep-data': { syncFullProfileDeepData: async profile => { synchronized = profile; return { status: 'succeeded', recoveryRequired: false, automaticRetry: false, steps: [], logs: [] } } },
      '@/lib/ac-event-tracking': {},
    }, { process: { env: { NODE_ENV: 'test', SUPABASE_URL: 'synthetic', SUPABASE_SERVICE_ROLE_KEY: 'synthetic' } } })
    const person = { Uid: 'synthetic-person', Email: 'synthetic@example.com', Updated: '2026-09-06T12:00:00.000Z',
      PersonAccount: stage === undefined ? [] : [{ IsPrimary: true, Account: { Uid: 'synthetic-account', AccountStage: stage,
        CurrentSubscription: { Plan: { Uid: 'rQVqlLm6', Name: 'Pro' } } } }] }
    const response = await route.POST({ text: async () => JSON.stringify(person), headers: { get: () => '' } })
    assert.equal(response.status, 200)
    assert.equal(synchronized.subscription_status, expected)
    if (expected === null) assert.equal('subscription_status' in written, false)
    else assert.equal(written.subscription_status, expected)
  }
})

test('unknown lifecycle does not write ACTIVE recurring payment or replace existing status tags', async () => {
  const requests = []
  const query = { select: () => query, eq: () => query, single: async () => ({ data: {ac_contact_id:'1', ac_customer_id:'2'}, error:null }) }
  const sync = load('../lib/active-campaign-deep-data.ts', {
    '@/lib/env': { env: { acApiUrl:'https://synthetic.invalid', acApiKey:'synthetic', acConnectionId:'4' } },
    '@/lib/supabase-admin': { createServiceRoleClient: () => ({ from: () => query }) },
    '@/lib/active-campaign-sync-result': load('../lib/active-campaign-sync-result.ts'),
  }, { AbortSignal, fetch: async (url, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : null
    requests.push({ url, method: options.method ?? 'GET', body })
    let data = {}
    if (url.endsWith('/contact/sync')) data = {contact:{id:'1'}}
    else if (url.endsWith('/ecomCustomers/2')) data = {ecomCustomer:{id:'2', externalid:'synthetic-person', connectionid:'4', email:'synthetic@example.com'}}
    else if (url.includes('/contactTags?')) data = {contactTags:[{id:'10',contact:'1',tag:'805'}],tags:[{id:'805',tag:'status-past_due'}]}
    else if (url.includes('/tags?search=')) data = {tags:[{id:'11',tag:decodeURIComponent(url.split('search=')[1].split('&')[0])}]}
    else if (url.endsWith('/contactTags')) data = {contactTag:{id:'12', ...body.contactTag}}
    else if (url.endsWith('/ecomOrders')) data = {ecomOrder:{id:'3'}}
    return {ok:true,status:200,json:async()=>data}
  } })
  const result = await sync.syncFullProfileDeepData({ outseta_person_uid:'synthetic-person', outseta_account_id:'synthetic-account',
    user_email:'synthetic@example.com', email:'synthetic@example.com', subscription_tier:'pro',
    subscription_status:null, plan_uid:'rQVqlLm6', plan_name:'Pro', outseta_data:{} })
  assert.equal(requests.some(r=>r.url.endsWith('/ecom/graphql')), false)
  assert.equal(result.recoveryRequired, false)
  assert.equal(requests.some(r=>r.url.endsWith('/ecomOrders')), true)
  assert.equal(requests.some(r=>r.method==='DELETE'), false)
  assert.equal(requests.some(r=>r.url.includes('search=status-')), false)
  assert.equal(requests.some(r=>r.url.endsWith('/contactLists')), false) // Membership never supplies marketing opt-in.
})
