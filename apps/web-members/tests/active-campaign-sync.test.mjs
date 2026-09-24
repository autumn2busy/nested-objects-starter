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
  const lists = [...(options.lists ?? [{ id: '701', contact: '1', list: '12', status: '2' }])]
  const customer = { id: '2', externalid: profile.outseta_person_uid, connectionid: '4', email: profile.email,
    acceptsMarketing: Object.hasOwn(options, 'acceptsMarketing') ? options.acceptsMarketing : '0', ...options.customer }
  const tags = [...(options.tags ?? ['plan-free', 'status-canceled'])].map((name, i) => ({
    id: String(501 + i), contact: '1', tag: tagId(name),
  }))
  const stored = { ac_contact_id: '1', ac_customer_id: '2', outseta_person_uid: profile.outseta_person_uid, outseta_account_id: profile.outseta_account_id, ...options.stored }
  const db = { from: () => {
    const query = { select: () => query, eq: () => query,
      single: async () => ({ data: stored, error: options.readError ?? null }),
      update: value => { writes.push(value); return { eq: async () => {
        if (!options.writeError && !options.writeNoop) Object.assign(stored, value)
        return { error: options.writeError ?? null }
      } } } }
    return query
  } }
  const fetch = async (url, init = {}) => {
    const req = { path: url.split('/api/3/')[1], method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : undefined, init }
    requests.push(req)
    const override = await options.intercept?.(req, { tags, customer, requests, lists })
    if (override) return override
    if (req.path === 'contact/sync') return response({ contact: { id: '1' } })
    if (req.path === 'contacts/1?include=contactLists') return response({
      contact: { id: '1', email: profile.email, bounced_hard: String(options.contact?.bounced_hard ?? '0'),
        bounced_soft: String(options.contact?.bounced_soft ?? '0'), deleted: String(options.contact?.deleted ?? '0'),
        contactLists: lists.map(item => String(item.id)) },
      contactLists: lists,
    })
    if (req.path === 'contactLists' && req.method === 'POST') {
      const relationship = { id: String(801 + lists.length), ...req.body.contactList, status: String(req.body.contactList.status) }
      lists.push(relationship)
      return response({ contactList: relationship }, 201)
    }
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
    '@/lib/env': { env: { acApiUrl: 'https://synthetic.invalid', acApiKey: 'synthetic', acConnectionId: '4',
      acEliteOpportunityListSyncEnabled: 'false', ...options.env } },
    '@/lib/supabase-admin': { createServiceRoleClient: () => db },
    '@/lib/active-campaign-sync-result': resultModule,
  }, { fetch })
  return { run: (overrides = {}) => sync.syncFullProfileDeepData({ ...profile, ...overrides }), requests, writes, tags, lists, customer }
}
const failed = (result, step, code) => result.steps.some(item => item.step === step && item.state === 'failed' && (!code || item.code === code))

function eliteProfile(overrides = {}) {
  const subscription = { Uid: 'elite-cycle', Plan: { Uid: 'NmdnNO90', Name: 'Elite' },
    StartDate: '2026-08-01T00:00:00.000Z', EndDate: null }
  const account = { Uid: profile.outseta_account_id, AccountStage: 3, IsDemo: false, IsLivemode: false,
    CurrentSubscription: subscription }
  const outseta_data = { Uid: profile.outseta_person_uid, Email: profile.email, HasUnsubscribed: false,
    PersonAccount: [{ IsPrimary: true, Account: account }] }
  return { subscription_tier: 'elite', subscription_status: 'active', plan_uid: 'NmdnNO90', plan_name: 'Elite',
    subscription_start_date: subscription.StartDate, subscription_end_date: null, outseta_data, ...overrides }
}

const listWrites = fixture => fixture.requests.filter(req => req.path === 'contactLists' && req.method === 'POST')

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

test('retired migration and launch tags are not added to future contacts or removed from historical contacts', async () => {
  const retired = ['antigravity-subscription', 'launch-2026-03-01']
  const future = fixture({ tags: [] })
  await future.run()
  for (const name of retired) {
    assert.equal(future.requests.some(req => req.path.startsWith('tags?') &&
      new URL('https://synthetic.invalid/api/3/' + req.path).searchParams.get('search') === name), false)
    assert.equal(future.requests.some(req => req.path === 'contactTags' && req.method === 'POST' &&
      req.body.contactTag.tag === tagId(name)), false)
  }

  const historical = fixture({ tags: [...retired, 'plan-free', 'status-canceled'] })
  await historical.run()
  for (const name of retired) {
    assert.equal(historical.tags.some(tag => tag.tag === tagId(name)), true)
  }
  assert.equal(historical.requests.some(req => req.method === 'DELETE' &&
    ['contactTags/501', 'contactTags/502'].includes(req.path)), false)
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

const eliteFixture = options => fixture({ env: { acEliteOpportunityListSyncEnabled: 'true' }, ...options })
const opportunityStep = (result, state, code) => result.steps.some(item => item.step === 'opportunity_list' && item.state === state && item.code === code)
const accountOf = input => input.outseta_data.PersonAccount[0].Account

test('Elite feature remains disabled by default without additional list reads or writes', async () => {
  const f = fixture()
  const result = await f.run(eliteProfile())
  assert.equal(opportunityStep(result, 'skipped', 'feature_disabled'), true)
  assert.equal(f.requests.some(req => req.path.includes('contactLists')), false)
})

test('verified Elite adds only list 33 once, reuses active membership and preserves other lists', async () => {
  const f = eliteFixture()
  const original = JSON.stringify(f.lists)
  const first = await f.run(eliteProfile())
  assert.equal(failed(first, 'opportunity_list'), false)
  assert.equal(listWrites(f).length, 1)
  assert.equal(JSON.stringify(listWrites(f)[0].body), JSON.stringify({ contactList: { contact: '1', list: '33', status: 1 } }))
  assert.equal(JSON.stringify(f.lists.slice(0, 1)), original)
  const second = await f.run(eliteProfile())
  assert.equal(opportunityStep(second, 'skipped', 'already_active'), true)
  assert.equal(listWrites(f).length, 1)
  assert.equal(f.requests.some(req => /campaign|automation/i.test(req.path)), false)
})

test('account-centric event requires the exact person relationship and permits non-demo test-mode membership', async () => {
  const p = eliteProfile()
  const person = p.outseta_data
  const account = accountOf(p)
  p.outseta_data = { ...account, PersonAccount: [{ Person: { Uid: person.Uid, Email: person.Email, HasUnsubscribed: false } }] }
  const f = eliteFixture()
  await f.run(p)
  assert.equal(listWrites(f).length, 1)
})

for (const [name, mutate] of [
  ['non-Elite projection', p => { p.subscription_tier = 'pro' }],
  ['wrong authoritative plan', p => { accountOf(p).CurrentSubscription.Plan.Uid = 'other' }],
  ['past due', p => { p.subscription_status = 'past_due' }],
  ['unknown stage', p => { delete accountOf(p).AccountStage }],
  ['stage conflicts with active projection', p => { accountOf(p).AccountStage = 5 }],
  ['missing subscription', p => { delete accountOf(p).CurrentSubscription }],
  ['missing start', p => { delete accountOf(p).CurrentSubscription.StartDate }],
  ['future start', p => { accountOf(p).CurrentSubscription.StartDate = '2999-01-01' }],
  ['invalid start', p => { accountOf(p).CurrentSubscription.StartDate = 'invalid' }],
  ['expired', p => { accountOf(p).CurrentSubscription.EndDate = '2020-01-01' }],
  ['unsubscribed', p => { p.outseta_data.HasUnsubscribed = true }],
  ['unknown permission', p => { delete p.outseta_data.HasUnsubscribed }],
  ['demo', p => { accountOf(p).IsDemo = true }],
  ['unknown demo state', p => { delete accountOf(p).IsDemo }],
  ['wrong email', p => { p.outseta_data.Email = 'other@example.com' }],
  ['wrong person', p => { p.outseta_data.Uid = 'other' }],
  ['wrong account', p => { accountOf(p).Uid = 'other' }],
  ['ambiguous account relationship', p => { p.outseta_data.PersonAccount.push(p.outseta_data.PersonAccount[0]) }],
]) {
  test('Elite enrollment holds ' + name, async () => {
    const p = eliteProfile()
    mutate(p)
    const f = eliteFixture()
    const result = await f.run(p)
    assert.equal(result.steps.some(item => item.step === 'opportunity_list' && item.state === 'skipped'), true)
    assert.equal(f.requests.some(req => req.path.includes('contactLists')), false)
  })
}

test('cancelling Elite requires an explicit future EndDate; renewal or projected end alone does not authorize', async () => {
  for (const explicitEnd of [false, true]) {
    const p = eliteProfile({ subscription_status: 'canceled', subscription_end_date: '2999-01-01' })
    accountOf(p).AccountStage = 4
    accountOf(p).CurrentSubscription.RenewalDate = '2999-01-01'
    accountOf(p).CurrentSubscription.EndDate = explicitEnd ? '2999-01-01' : null
    const f = eliteFixture()
    await f.run(p)
    assert.equal(listWrites(f).length, explicitEnd ? 1 : 0)
  }
})

for (const status of ['0', '2', '3', 'unknown', null]) {
  test('Elite list 33 status ' + status + ' is preserved without reactivation', async () => {
    const f = eliteFixture({ lists: [{ id: '702', contact: '1', list: '33', status }] })
    const before = JSON.stringify(f.lists)
    const result = await f.run(eliteProfile())
    assert.equal(opportunityStep(result, 'skipped', 'suppression_preserved'), true)
    assert.equal(listWrites(f).length, 0)
    assert.equal(JSON.stringify(f.lists), before)
  })
}

for (const field of ['bounced_hard', 'bounced_soft', 'deleted']) {
  test('Elite contact ' + field + ' suppresses subscription', async () => {
    const f = eliteFixture({ contact: { [field]: '1' } })
    const result = await f.run(eliteProfile())
    assert.equal(opportunityStep(result, 'skipped', 'suppression_preserved'), true)
    assert.equal(listWrites(f).length, 0)
  })
}

for (const fault of ['delivery_unknown', 'partial_lists', 'duplicate_list', 'wrong_contact', 'wrong_email']) {
  test('Elite list read holds ' + fault, async () => {
    const f = eliteFixture({ intercept: req => {
      if (req.path !== 'contacts/1?include=contactLists') return
      const contact = { id: '1', email: profile.email, bounced_hard: '0', bounced_soft: '0', deleted: '0', contactLists: [] }
      const rows = []
      if (fault === 'delivery_unknown') delete contact.bounced_hard
      if (fault === 'partial_lists') contact.contactLists = ['701']
      if (fault === 'duplicate_list') {
        rows.push({ id: '701', contact: '1', list: '33', status: '1' }, { id: '702', contact: '1', list: '33', status: '2' })
        contact.contactLists = ['701', '702']
      }
      if (fault === 'wrong_contact') contact.id = '99'
      if (fault === 'wrong_email') contact.email = 'other@example.com'
      return response({ contact, contactLists: rows })
    } })
    const result = await f.run(eliteProfile())
    assert.equal(failed(result, 'opportunity_list_read'), true)
    assert.equal(listWrites(f).length, 0)
  })
}

for (const committed of [false, true]) {
  test('uncertain list write uses exact positive readback and never retries; committed=' + committed, async () => {
    const f = eliteFixture({ intercept: (req, { lists }) => {
      if (req.path !== 'contactLists' || req.method !== 'POST') return
      if (committed) lists.push({ id: '801', contact: '1', list: '33', status: '1' })
      throw new Error('synthetic transport uncertainty')
    } })
    const result = await f.run(eliteProfile())
    assert.equal(failed(result, 'opportunity_list'), !committed)
    assert.equal(listWrites(f).length, 1)
    assert.equal(result.automaticRetry, false)
  })
}

for (const fault of ['http', 'receipt_mismatch', 'readback_missing']) {
  test('unconfirmed list write ' + fault + ' is reported without retry', async () => {
    const f = eliteFixture({ intercept: req => {
      if (req.path !== 'contactLists' || req.method !== 'POST') return
      if (fault === 'http') return response({}, 503)
      return response({ contactList: { id: '801', contact: fault === 'receipt_mismatch' ? '99' : '1', list: '33', status: '1' } }, 201)
    } })
    const result = await f.run(eliteProfile())
    assert.equal(failed(result, 'opportunity_list'), true)
    assert.equal(listWrites(f).length, 1)
    assert.equal(result.automaticRetry, false)
  })
}

test('conflicting saved contact stays held across two events without overwriting identity', async () => {
  const f = eliteFixture({ stored: { ac_contact_id: '99' } })
  for (let event = 0; event < 2; event++) {
    const result = await f.run(eliteProfile())
    assert.equal(failed(result, 'contact', 'contact_identity_conflict'), true)
  }
  assert.equal(f.writes.length, 0)
  assert.equal(listWrites(f).length, 0)
})

for (const writeNoop of [true, false]) {
  test('new contact link requires exact persisted readback; zero-row=' + writeNoop, async () => {
    const f = eliteFixture({ stored: { ac_contact_id: null }, writeNoop })
    const result = await f.run(eliteProfile())
    assert.equal(failed(result, 'contact_link', 'profile_link_readback_unconfirmed'), writeNoop)
    assert.equal(listWrites(f).length, writeNoop ? 0 : 1)
    assert.equal(opportunityStep(result, 'blocked', 'stable_contact_link_unconfirmed'), writeNoop)
  })
}

test('saved account mismatch cannot authorize the additional list subscription', async () => {
  const f = eliteFixture({ stored: { outseta_account_id: 'other-account' } })
  const result = await f.run(eliteProfile())
  assert.equal(opportunityStep(result, 'blocked', 'stable_contact_link_unconfirmed'), true)
  assert.equal(listWrites(f).length, 0)
})
