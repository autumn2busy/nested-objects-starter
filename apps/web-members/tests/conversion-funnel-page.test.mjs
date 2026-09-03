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
    exports, Date: FixedDate, URLSearchParams, Intl,
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
const signup = {
  id: 'synthetic-signup', event_name: 'signup_completed', anonymous_id: null,
  member_uid: 'synthetic-member', member_email: 'fixture@example.com',
  plan_uid: plans.PLAN_UIDS.FREE, plan_name: 'Free', source_page: '/welcome',
  source: 'fixture', reason: null, utm_source: null, utm_medium: null, utm_campaign: null,
  occurred_at: '2026-09-01T12:00:00.000Z', event_data: {},
}

function pageFixture({ isAdmin = true, data = [signup], error = null, count = data.length } = {}) {
  const queries = []
  const query = {
    select(...args) { queries.push(['select', ...args]); return this },
    gte(...args) { queries.push(['gte', ...args]); return this },
    order(...args) { queries.push(['order', ...args]); return this },
    limit(...args) { queries.push(['limit', ...args]); return Promise.resolve({ data, error, count }) },
  }
  const page = load('../app/(portal)/admin/conversion-funnel/page.tsx', {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/navigation': { redirect: destination => { throw new Error(`redirect:${destination}`) } },
    '@/lib/conversion-admin-auth': { getConversionAdminSession: async () => ({ isAdmin }) },
    '@/lib/conversion-funnel': funnel,
    '@/lib/supabase-admin': {
      createServiceRoleClient: () => ({ from(table) { queries.push(['from', table]); return query } }),
    },
  })
  return {
    queries,
    render: async searchParams => renderToStaticMarkup(await page.default({ searchParams })),
  }
}

test('non-admin users are redirected before any conversion data query', async () => {
  const fixture = pageFixture({ isAdmin: false })
  await assert.rejects(fixture.render(), /redirect:\/profile/)
  assert.equal(fixture.queries.length, 0)
})

test('the 14-day window is queried and preserved when applying filters', async () => {
  const fixture = pageFixture()
  const html = await fixture.render({ days: '14' })
  assert.deepEqual(fixture.queries.find(([name]) => name === 'gte'), ['gte', 'occurred_at', '2026-08-20T12:00:00.000Z'])
  assert.equal(fixture.queries.find(([name]) => name === 'select')[2].count, 'exact')
  assert.deepEqual(fixture.queries.find(([name]) => name === 'limit'), ['limit', 20_000])
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
  assert.match(html, /Payment outcome<\/p><p[^>]*>Unknown<\/p>/)
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
