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
  }, console: { log() {}, warn() {}, error() {} }, process: { env: { NODE_ENV: 'test' } }, URL, AbortSignal, ...extras }
  vm.runInNewContext(code, context)
  return context.exports
}
const resultModule = load('../lib/active-campaign-sync-result.ts')
const profile = { outseta_person_uid: 'person-fixture', outseta_account_id: 'account-fixture',
  user_email: 'synthetic@example.com', email: 'synthetic@example.com', subscription_tier: 'pro',
  subscription_status: 'active', plan_uid: 'plan-fixture', plan_name: 'Pro',
  subscription_start_date: '2026-09-01T00:00:00.000Z', outseta_data: {} }
const tagNames = ['plan-pro', 'status-active', 'antigravity-subscription', 'launch-2026-03-01', 'plan-free', 'status-canceled']
const tagId = name => String(101 + tagNames.indexOf(name))
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data })

function fixture(options = {}) {
  const requests = []
  const writes = []
  const lists = [...(options.lists ?? [{ list: '12', status: '2' }])]
  const customer = { id: '2', externalid: profile.outseta_person_uid, connectionid: '4', email: profile.email,
    acceptsMarketing: Object.hasOwn(options, 'acceptsMarketing') ? options.acceptsMarketing : '0', ...options.customer }
  const tags = [...(options.tags ?? ['plan-free', 'status-canceled'])].map((name, i) => ({
    id: String(501 + i), contact: '1', tag: tagId(name),
  }))
  const stored = { ac_contact_id: '1', ac_customer_id: '2', outseta_person_uid: profile.outseta_person_uid, ...options.stored }
  const db = { from: () => {
    const query = { select: () => query, eq: () => query,
      single: async () => ({ data: stored, error: options.readError ?? null }),
      update: value => { writes.push(value); return { eq: async () => ({ error: options.writeError ?? null }) } } }
    return query
  } }
  const fetch = async (url, init = {}) => {
    const req = { path: url.split('/api/3/')[1], method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : undefined, init }
    requests.push(req)
    const override = await options.intercept?.(req, { tags, customer, requests })
    if (override) return override
    if (req.path === 'contact/sync') return response({ contact: { id: '1' } })
    if (req.path === 'ecomCustomers/2') return response({ ecomCustomer: customer })
    if (req.path.startsWith('ecomCustomers?')) return response({ ecomCustomers: options.newCustomer ? [] : [customer], meta: { total: options.newCustomer ? '0' : '1' } })
    if (req.path === 'ecomCustomers') return response({ ecomCustomer: { id: '2', ...req.body.ecomCustomer } }, 201)
    if (req.path.startsWith('contacts/1/contactTags')) return response({ contactTags: tags, tags: tagNames.map(name => ({ id: tagId(name), tag: name })) })
    if (req.path.startsWith('tags?')) {
      const name = new URL(url).searchParams.get('search')
      return response({ tags: [{ id: tagId(name), tag: name }], meta: { total: '1' } })
    }
    if (req.path === 'contactTags' && req.method === 'POST') {
      const association = { id: String(601 + tags.length), ...req.body.contactTag }
      tags.push(association)
      return response({ contactTag: association }, 201)
    }
    if (req.path.startsWith('contactTags/') && req.method === 'DELETE') {
      tags.splice(tags.findIndex(tag => tag.id === req.path.split('/')[1]), 1)
      return response({}, 204)
    }
    if (req.path === 'ecomOrders') return response({ ecomOrder: { id: '3' } })
    if (req.path === 'ecom/graphql') return response({ data: { bulkUpsertRecurringPayments: { recordId: 'receipt-fixture' } } })
    if (req.path === 'contacts/1/fieldValues') return response({ fieldValues: [{ id: '9', field: '187', contact: '1', value: '2026-08-01' }] })
    if (req.path === 'fieldValues/9') return response({ fieldValue: { id: '9', ...req.body.fieldValue } })
    throw new Error('Unexpected request: ' + req.path)
  }
  const sync = load('../lib/active-campaign-deep-data.ts', {
    '@/lib/env': { env: { acApiUrl: 'https://synthetic.invalid', acApiKey: 'synthetic', acConnectionId: '4', ...options.env } },
    '@/lib/supabase-admin': { createServiceRoleClient: () => db },
    '@/lib/active-campaign-sync-result': resultModule,
  }, { fetch })
  return { run: (overrides = {}) => sync.syncFullProfileDeepData({ ...profile, ...overrides }), requests, writes, tags, lists, customer }
}
const failed = (result, step, code) => result.steps.some(item => item.step === step && item.state === 'failed' && (!code || item.code === code))

for (const status of ['0', '1', '2', '3', 'unknown', null]) {
  test('membership sync preserves list status ' + status + ' and existing ecommerce consent', async () => {
    const f = fixture({ lists: [{ list: '12', status }, { list: '21', status: '2' }], acceptsMarketing: status })
    const before = JSON.stringify({ lists: f.lists, customer: f.customer })
    const result = await f.run()
    assert.equal(result.recoveryRequired, false)
    assert.equal(result.status, 'submitted')
    assert.equal(f.requests.some(req => req.path.startsWith('contactLists')), false)
    assert.equal(f.requests.some(req => req.method !== 'GET' && req.path.startsWith('ecomCustomers')), false)
    assert.equal(JSON.stringify({ lists: f.lists, customer: f.customer }), before)
  })
}

test('new customer is created without granting marketing permission; no list is added', async () => {
  const f = fixture({ stored: { ac_customer_id: null }, newCustomer: true, lists: [] })
  const result = await f.run()
  assert.equal(result.recoveryRequired, false)
  assert.equal(f.requests.find(req => req.path === 'ecomCustomers').body.ecomCustomer.acceptsMarketing, 0)
  assert.equal(f.requests.some(req => req.path.startsWith('contactLists')), false)
})

test('existing customer found by stable external ID is reused without changing consent', async () => {
  const f = fixture({ stored: { ac_customer_id: null }, acceptsMarketing: '1' })
  await f.run()
  assert.equal(f.requests.filter(req => req.path === 'ecomCustomers').length, 0)
  assert.equal(f.requests.some(req => req.path.includes('filters[email]')), false)
  assert.equal(JSON.stringify(f.writes), JSON.stringify([{ ac_customer_id: '2' }]))
})

for (const fault of ['http', 'invalid_json', 'transport', 'identity', 'incomplete', 'ambiguous']) {
  test('customer ' + fault + ' failure is explicit; tags continue and customer-dependent mirrors stop', async () => {
    const f = fixture({ stored: { ac_customer_id: null }, intercept: req => {
      if (!req.path.startsWith('ecomCustomers')) return
      if (fault === 'http') return response({ message: profile.email }, 503)
      if (fault === 'invalid_json') return { ok: true, status: 200, json: async () => { throw new Error(profile.email) } }
      if (fault === 'transport') throw new Error(profile.email)
      if (fault === 'identity') return response({ ecomCustomers: [{ id: '2', externalid: 'other', connectionid: '4' }], meta: { total: '1' } })
      if (fault === 'incomplete') return response({ ecomCustomers: [] })
      return response({ ecomCustomers: [{ id: '2' }, { id: '3' }], meta: { total: '2' } })
    } })
    const result = await f.run()
    assert.equal(result.status, 'partial')
    assert.equal(failed(result, 'customer'), true)
    assert.equal(result.steps.some(item => item.step === 'tag_plan' && item.state === 'succeeded'), true)
    assert.equal(f.requests.some(req => ['ecomOrders', 'ecom/graphql'].includes(req.path)), false)
    assert.equal(result.automaticRetry, false)
    assert.equal(JSON.stringify(result).includes(profile.email), false)
    assert.equal(f.requests.filter(req => req.path.startsWith('ecomCustomers')).length, 1)
  })
}

test('contact HTTP failure cannot be mistaken for success even when error body contains an ID', async () => {
  const f = fixture({ intercept: req => req.path === 'contact/sync' ? response({ contact: { id: '1' } }, 429) : undefined })
  const result = await f.run()
  assert.equal(failed(result, 'contact', 'http_error'), true)
  assert.equal(result.status, 'failed')
  assert.equal(f.requests.length, 1)
})

test('stored contact mismatch is withheld and stable link is not overwritten', async () => {
  const f = fixture({ stored: { ac_contact_id: '99' } })
  const result = await f.run()
  assert.equal(failed(result, 'contact', 'contact_identity_conflict'), true)
  assert.equal(f.requests.length, 1)
  assert.equal(f.writes.length, 0)
})

test('failed projection lookup prevents side effects instead of fabricating membership context', async () => {
  const f = fixture({ readError: { code: 'unavailable', message: profile.email } })
  const result = await f.run()
  assert.equal(failed(result, 'profile_context', 'profile_read_failed'), true)
  assert.equal(f.requests.length, 0)
})

test('customer linked to an outdated email is withheld even when its external ID matches', async () => {
  const f = fixture({ customer: { email: 'outdated@example.com' } })
  const result = await f.run()
  assert.equal(failed(result, 'customer', 'customer_contact_link_conflict'), true)
  assert.equal(f.requests.some(req => req.path === 'ecomOrders'), false)
  assert.equal(f.requests.some(req => req.method !== 'GET' && req.path.startsWith('ecomCustomers')), false)
})

test('a zero-or-multiple-row profile error does not authorize an email fallback', async () => {
  const f = fixture({ readError: { code: 'PGRST116' } })
  const result = await f.run()
  assert.equal(result.status, 'failed')
  assert.equal(failed(result, 'profile_context'), true)
  assert.equal(f.requests.length, 0)
})

test('an unavailable stored customer is not replaced by an email-only match', async () => {
  const f = fixture({ intercept: req => req.path === 'ecomCustomers/2' ? response({}, 404) : undefined })
  const result = await f.run()
  assert.equal(failed(result, 'customer', 'http_error'), true)
  assert.equal(f.requests.filter(req => req.path.startsWith('ecomCustomers')).length, 1)
})

test('duplicate-order validation is resolved only through an exact customer/connection/external ID match', async () => {
  for (const customerid of ['2', '99']) {
    const f = fixture({ intercept: req => {
      if (req.path === 'ecomOrders') return response({}, 400)
      if (req.path.startsWith('ecomOrders?')) return response({ ecomOrders: [{ id: '3', externalid: 'account-fixture-plan-fixture', connectionid: '4', customerid }], meta: { total: '1' } })
    } })
    const result = await f.run()
    assert.equal(failed(result, 'order'), customerid !== '2')
    assert.equal(f.requests.filter(req => req.path === 'ecomOrders').length, 1)
  }
})

test('failed link persistence is reported after a successful contact upsert', async () => {
  const f = fixture({ stored: { ac_contact_id: null }, writeError: { message: profile.email } })
  const result = await f.run()
  assert.equal(failed(result, 'contact_link', 'profile_write_failed'), true)
  assert.equal(result.recoveryRequired, true)
})

test('replacement failure preserves its old dimension while independent status repair continues', async () => {
  const f = fixture({ intercept: req => req.path === 'contactTags' && req.body.contactTag.tag === tagId('plan-pro')
    ? response({ message: profile.email }, 503) : undefined })
  const result = await f.run()
  assert.equal(failed(result, 'tag_plan', 'http_error'), true)
  assert.equal(f.tags.some(tag => tag.tag === tagId('plan-free')), true)
  assert.equal(f.tags.some(tag => tag.tag === tagId('status-canceled')), false)
})

test('422 is not treated as already applied without exact positive readback', async () => {
  const f = fixture({ intercept: req => req.path === 'contactTags' && req.body.contactTag.tag === tagId('plan-pro')
    ? response({ errors: [{ title: 'invalid' }] }, 422) : undefined })
  const result = await f.run()
  assert.equal(failed(result, 'tag_plan', 'tag_association_unconfirmed'), true)
  assert.equal(f.tags.some(tag => tag.tag === tagId('plan-free')), true)
})

test('422 concurrent exact association readback succeeds without retrying the write', async () => {
  const f = fixture({ intercept: (req, { tags }) => {
    if (req.path === 'contactTags' && req.body.contactTag.tag === tagId('plan-pro')) {
      tags.push({ id: '999', ...req.body.contactTag })
      return response({}, 422)
    }
  } })
  const result = await f.run()
  assert.equal(failed(result, 'tag_plan'), false)
  assert.equal(f.requests.filter(req => req.path === 'contactTags' && req.body.contactTag.tag === tagId('plan-pro')).length, 1)
})

test('replacement is confirmed before removal; redelivery does not reapply observed tags', async () => {
  const f = fixture()
  await f.run()
  for (const name of ['plan-pro', 'status-active']) {
    const add = f.requests.findIndex(req => req.path === 'contactTags' && req.body.contactTag.tag === tagId(name))
    const removal = f.requests.findIndex(req => req.method === 'DELETE' && req.path === 'contactTags/' + (name === 'plan-pro' ? '501' : '502'))
    assert.ok(add >= 0 && removal > add)
  }
  const before = f.requests.length
  await f.run()
  assert.equal(f.requests.slice(before).some(req => req.path === 'contactTags' && req.method === 'POST'), false)
})

test('failed removal reports partial cleanup without removing the replacement', async () => {
  const f = fixture({ intercept: req => req.method === 'DELETE' ? response({}, 503) : undefined })
  const result = await f.run()
  assert.equal(failed(result, 'tag_plan_cleanup'), true)
  assert.equal(f.tags.some(tag => tag.tag === tagId('plan-pro')), true)
  assert.equal(f.tags.some(tag => tag.tag === tagId('plan-free')), true)
})

test('tag read failure never triggers blind deletion or a claim of complete cleanup', async () => {
  const f = fixture({ intercept: req => req.path.startsWith('contacts/1/contactTags') ? response({}, 503) : undefined })
  const result = await f.run()
  assert.equal(failed(result, 'tag_read'), true)
  assert.equal(f.requests.some(req => req.method === 'DELETE'), false)
})

test('failed tag search cannot create another tag', async () => {
  const f = fixture({ intercept: req => req.path.startsWith('tags?') ? response({}, 503) : undefined })
  await f.run()
  assert.equal(f.requests.some(req => req.path === 'tags' && req.method === 'POST'), false)
})

for (const receipt of [{ errors: [{ message: 'private provider text' }] }, { data: { bulkUpsertRecurringPayments: [] } }, { data: { bulkUpsertRecurringPayments: {} } }]) {
  test('GraphQL error or missing receipt is failed, not a completed recurring mirror', async () => {
    const f = fixture({ intercept: req => req.path === 'ecom/graphql' ? response(receipt) : undefined })
    const result = await f.run()
    assert.equal(failed(result, 'recurring'), true)
    assert.equal(f.requests.some(req => req.path.includes('fieldValues')), false)
    assert.equal(JSON.stringify(result).includes('private provider text'), false)
  })
}

test('order failure is reported while the independent recurring submission still runs', async () => {
  const f = fixture({ intercept: req => req.path === 'ecomOrders' ? response({}, 503) : undefined })
  const result = await f.run()
  assert.equal(failed(result, 'order'), true)
  assert.equal(result.steps.some(item => item.step === 'recurring' && item.state === 'submitted'), true)
})

test('incomplete renewal field lookup prevents blind field creation', async () => {
  const f = fixture({ intercept: req => req.path === 'contacts/1/fieldValues' ? response({ fieldValues: [] }) : undefined })
  const result = await f.run()
  assert.equal(failed(result, 'renewal_field', 'field_lookup_incomplete'), true)
  assert.equal(f.requests.some(req => req.path === 'fieldValues' && req.method === 'POST'), false)
})

test('missing configuration is a failed sync with no requests', async () => {
  const f = fixture({ env: { acApiKey: '' } })
  const result = await f.run()
  assert.equal(result.status, 'failed')
  assert.equal(f.requests.length, 0)
})

test('requests reject redirects and have bounded waits without write retries', async () => {
  const f = fixture()
  await f.run()
  for (const req of f.requests) {
    assert.equal(req.init.redirect, 'error')
    assert.ok(req.init.signal instanceof AbortSignal)
  }
})

test('real webhook reports failed AC sync separately from the saved projection and does not request a whole-event retry', async () => {
  for (const throws of [false, true]) {
    let attempts = 0
    const errors = []
    const db = { from: () => {
      const query = { select: () => query, eq: () => query, update: () => query,
        single: async () => ({ data: { id: 'profile-fixture', user_email: profile.email, outseta_updated_at: '2026-08-01' }, error: null }) }
      return query
    } }
    const route = load('../app/api/webhooks/outseta/route.ts', {
      'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
      '@supabase/supabase-js': { createClient: () => db },
      crypto: { default: { randomUUID: () => 'request-fixture' } },
      '@/lib/security': { verifyOutsetaSignature: () => true },
      '@/lib/free-to-pro-lifecycle': { buildPaidLifecycleDecision: () => ({ shouldTrack: false, reason: 'unchanged' }) },
      '@/lib/conversion-events': { recordConversionEvent: async () => { throw new Error('Unexpected conversion write') } },
      '@/lib/outseta-billing-stage': load('../lib/outseta-billing-stage.ts'),
      '@/lib/active-campaign-deep-data': { syncFullProfileDeepData: async () => {
        attempts++
        if (throws) throw new Error('private provider payload')
        return { status: 'partial', recoveryRequired: true, automaticRetry: false, steps: [{ step: 'customer', state: 'failed', code: 'http_error', httpStatus: 503 }], logs: [] }
      } },
      '@/lib/ac-event-tracking': {},
    }, { process: { env: { NODE_ENV: 'test', SUPABASE_URL: 'synthetic', SUPABASE_SERVICE_ROLE_KEY: 'synthetic' } },
      console: { log() {}, warn() {}, error: (...args) => errors.push(args) } })
    const result = await route.POST({ text: async () => JSON.stringify({ Uid: profile.outseta_person_uid, Email: profile.email, Updated: '2026-09-06' }), headers: { get: () => '' } })
    assert.equal(result.status, 200)
    assert.equal(result.body.success, false)
    assert.equal(result.body.profileSynced, true)
    assert.equal(result.body.acSync.recoveryRequired, true)
    assert.equal(attempts, 1)
    assert.equal(JSON.stringify(errors).includes('private provider payload'), false)
    assert.equal(JSON.stringify(result.body.acSync).includes('private provider payload'), false)
  }
})
