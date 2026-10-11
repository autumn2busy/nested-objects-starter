import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const now = Date.parse('2026-09-03T12:00:00.000Z')
class FixedDate extends Date {
  static now() { return now }
}

function load(relativePath, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, Date: FixedDate, URLSearchParams, Intl, process: { env: {} },
    require(name) {
      if (name === 'react/jsx-runtime') return require(name)
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import: ${name}`)
    },
  })
  return exports
}

const plans = load('../lib/plan-config.ts')
const funnel = load('../lib/conversion-funnel.ts', { './plan-config': plans })
const reportQuery = load('../lib/conversion-report-query.ts')
const paymentUnavailable = (members, reason) => ({ status: 'unavailable', reason, members, matchedMembers: 0,
  recordedPaidMembers: 0, trialingMembers: 0, pastDueMembers: 0, refundedMembers: 0, unknownMembers: members })
const signup = {
  id: 'synthetic-signup', event_name: 'signup_completed', anonymous_id: null,
  member_uid: 'synthetic-member', member_email: 'fixture@example.com',
  plan_uid: plans.PLAN_UIDS.FREE, plan_name: 'Free', source_page: '/welcome',
  source: 'fixture', reason: null, utm_source: null, utm_medium: null, utm_campaign: null,
  occurred_at: '2026-09-01T12:00:00.000Z', event_data: {},
}

export function pageFixture({ isAdmin = true, data = [signup], error = null, count = data.length, payment = null } = {}) {
  const queries = []
  const paymentCalls = []
  const query = {
    select(...args) { queries.push(['select', ...args]); return this },
    gte(...args) { queries.push(['gte', ...args]); return this },
    lt(...args) { queries.push(['lt', ...args]); return this },
    order(...args) { queries.push(['order', ...args]); return this },
    range(start, end) { queries.push(['range', start, end]); return Promise.resolve({ data: start === 0 ? data : [], error, count }) },
  }
  const page = load('../app/(portal)/admin/conversion-funnel/page.tsx', {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/navigation': { redirect: destination => { throw new Error(`redirect:${destination}`) } },
    '@/lib/conversion-admin-auth': { getConversionAdminSession: async () => ({ isAdmin }) },
    '@/lib/conversion-funnel': funnel,
    '@/lib/conversion-report-query': reportQuery,
    '@/lib/conversion-payment-report': {
      unavailablePaymentReport: paymentUnavailable,
      readConversionPaymentReport: async (...args) => { paymentCalls.push(args); return payment || paymentUnavailable(args[0].length, 'Fixture billing unavailable.') },
    },
    '@/lib/supabase-admin': {
      createServiceRoleClient: () => ({ from(table) {
        queries.push(['from', table]);
        if (table === 'profiles') return { select() { return this }, in() { return this },
          limit: async () => ({ data: [{ outseta_person_uid: 'synthetic-member', outseta_account_id: 'fixtureAccount' }], error: null }) }
        return query
      } }),
    },
  })
  return {
    queries,
    paymentCalls,
    render: async searchParams => renderToStaticMarkup(await page.default({ searchParams })),
  }
}

test('non-admin users are redirected before any conversion data query', async () => {
  const fixture = pageFixture({ isAdmin: false })
  await assert.rejects(fixture.render(), /redirect:\/profile/)
  assert.equal(fixture.queries.length, 0)
  assert.equal(fixture.paymentCalls.length, 0)
})

test('the 14-day window is queried and preserved when applying filters', async () => {
  const fixture = pageFixture()
  const html = await fixture.render({ days: '14' })
  assert.deepEqual(fixture.queries.find(([name]) => name === 'gte'), ['gte', 'occurred_at', '2026-08-13T12:00:00.000Z'])
  assert.deepEqual(fixture.queries.find(([name]) => name === 'lt'), ['lt', 'occurred_at', '2026-09-03T12:00:00.000Z'])
  assert.equal(fixture.queries.find(([name]) => name === 'select')[2].count, 'exact')
  assert.deepEqual(fixture.queries.find(([name]) => name === 'range'), ['range', 0, 499])
  assert.match(html, /type="hidden" name="days" value="14"/)
  assert.match(html, />14 days<\/a>/)
})

test('observed lifecycle signals are not presented as settled payments or sequential loss', async () => {
  const fixture = pageFixture({ data: [signup, {
    ...signup, id: 'synthetic-plan-change', event_name: 'purchase',
    occurred_at: '2026-09-02T12:00:00.000Z', plan_name: 'Pro',
  }] })
  const html = await fixture.render()
  assert.match(html, /Collection coverage is unverified/)
  assert.match(html, /Members with recorded payment<\/p><p[^>]*>Unknown<\/p>/)
  assert.match(html, /Unverified lifecycle events; may include trials/)
  assert.match(html, /Missing signals do not prove abandonment/)
  assert.doesNotMatch(html, /Largest visible leak|Stage-by-stage drop-off|Paid conversions|Members to recover|\d+% of (?:signups|this signup cohort)/)
})

test('a database response cap is visible even when below the requested limit', async () => {
  const html = await pageFixture({ count: 1_500 }).render()
  assert.match(html, /Only 1 of 1,500 matching events were returned/)
  assert.match(html, /Counts below cover this partial result/)
})

test('query errors show unavailable observations instead of zero signups or payment rates', async () => {
  const html = await pageFixture({ data: [], error: { message: 'fixture failure' }, count: null }).render()
  assert.match(html, /Conversion observations are unavailable/)
  assert.match(html, /Observed signup identities<\/p><p[^>]*>Unavailable<\/p>/)
  assert.match(html, /Member observations are unavailable because the event query failed/)
  assert.doesNotMatch(html, /No recorded signups match|No signups|Apply the conversion_events Supabase migration/)
})
test('complete billing evidence is shown separately from paid-plan signals', async () => {
  const payment = { status: 'complete', members: 1, matchedMembers: 1, recordedPaidMembers: 0,
    trialingMembers: 1, pastDueMembers: 0, refundedMembers: 0, unknownMembers: 0 }
  const fixture = pageFixture({ payment })
  const html = await fixture.render()
  assert.match(html, /Members with recorded payment<\/p><p[^>]*>0<\/p>/)
  assert.match(html, /1 on a paid-plan trial/)
  assert.match(html, /Plan-change events, zero-dollar invoices/)
  assert.equal(fixture.paymentCalls.length, 1)
})
test('partial billing evidence is not presented as a complete zero-payment outcome', async () => {
  const html = await pageFixture({ payment: { status: 'partial', members: 1, matchedMembers: 0,
    recordedPaidMembers: 0, trialingMembers: 0, pastDueMembers: 0, refundedMembers: 0,
    unknownMembers: 1, reason: 'Unmatched account fixture.' } }).render()
  assert.match(html, /Members with recorded payment<\/p><p[^>]*>Unknown<\/p>/)
  assert.match(html, /Recorded payments are a lower bound/)
})
test('partial or failed conversion reads do not initiate provider billing reads', async () => {
  for (const fixture of [pageFixture({ count: 1500 }), pageFixture({ error: { message: 'fixture' } })]) {
    await fixture.render()
    assert.equal(fixture.paymentCalls.length, 0)
  }
})
