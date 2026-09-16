import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

const require = createRequire(import.meta.url)
function load(path, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'react/jsx-runtime') return require(name)
    assert.ok(imports[name], `Unexpected dependency: ${name}`)
    return imports[name]
  } })
  return exports
}
const helper = load('../lib/intelligence-review-comparison.ts')
const { selectOperatingReviews, compareReviewItems } = helper
const { OperatingReviewComparison } = load('../app/(portal)/admin/intelligence-os/OperatingReviewComparison.tsx', {
  '@/lib/intelligence-review-comparison': helper,
})
const review = (id, changes = {}) => ({
  id, workflowName: 'weekly_operating_review', reviewDate: '2026-09-12', status: 'completed',
  executiveSummary: 'Invented review for local testing.', priorities: [], autumnDecisions: [],
  correlationId: `test-correlation-${id}`, ...changes,
})
const item = (fingerprint, changes = {}) => ({
  fingerprint, title: `Investigate ${fingerprint}`, summary: 'Inspect the evidence.', rank: 1, ...changes,
})
const plain = value => JSON.parse(JSON.stringify(value))
const render = props => renderToStaticMarkup(createElement(OperatingReviewComparison, props))

test('defaults to the most recent weekly review and a same-workflow reference without mutating input', () => {
  const reviews = [review('old', { reviewDate: '2026-09-10' }), review('daily', {
    workflowName: 'daily_business_health', reviewDate: '2026-09-13',
  }), review('new')]
  const before = JSON.stringify(reviews)
  const result = selectOperatingReviews(reviews)
  assert.equal(result.selected.id, 'new')
  assert.equal(result.reference.id, 'old')
  assert.equal(result.unavailable, null)
  assert.equal(JSON.stringify(reviews), before)
})

test('invalid explicit selection never silently falls back to another review', () => {
  const reviews = [review('a'), review('b')]
  for (const id of ['missing', 'https://outside.invalid/review', '<script>']) {
    assert.match(selectOperatingReviews(reviews, id, 'a').unavailable, /selected review/)
    assert.match(selectOperatingReviews(reviews, 'a', id).unavailable, /reference review/)
  }
})

test('same, mixed-workflow, reversed-date and unfinished reviews are not compared', () => {
  const reviews = [review('a'), review('old', { reviewDate: '2026-09-10' }),
    review('daily', { workflowName: 'daily_business_health' }), review('pending', { status: 'pending' })]
  assert.match(selectOperatingReviews(reviews, 'a', 'a').unavailable, /different/)
  assert.match(selectOperatingReviews(reviews, 'a', 'daily').unavailable, /same workflow/)
  assert.match(selectOperatingReviews(reviews, 'old', 'a').unavailable, /on or before/)
  assert.match(selectOperatingReviews(reviews, 'pending', 'a').unavailable, /completed or quiet/)
})

test('malformed and ambiguous duplicate reviews are excluded and missing evidence stays unavailable', () => {
  const result = selectOperatingReviews([null, {}, review('duplicate'), review('duplicate'),
    review('bad-date', { reviewDate: '2026-02-30' }), review('bad-items', { priorities: [null] }),
    review('valid')])
  assert.deepEqual(plain(result.reviews).map(value => value.id), ['valid'])
  assert.match(result.unavailable, /Two saved/)
  assert.equal(selectOperatingReviews(null).reviews.length, 0)
})

test('stable identities expose additions, changed content and reference-only entries', () => {
  const result = compareReviewItems([item('same'), item('edited'), item('removed')], [
    item('same'), item('edited', { summary: 'New evidence needs review.' }), item('added'),
  ], 'fingerprint')
  assert.deepEqual(plain(result.changes).map(value => [value.key, value.label]), [
    ['same', 'Unchanged'], ['edited', 'Changed'], ['added', 'Added'], ['removed', 'Only in reference'],
  ])
  assert.equal(result.unavailable, null)
})

test('ranking and evidence changes count but record key order and run correlation do not', () => {
  const before = item('a', { correlation: { correlationId: 'first' }, signalId: 'signal-first' })
  const after = { signalId: 'signal-next', correlation: { correlationId: 'next' }, ...item('a') }
  assert.equal(compareReviewItems([before], [after], 'fingerprint').changes[0].label, 'Unchanged')
  for (const change of [{ rank: 2 }, { evidenceReferences: [{ sourceSystem: 'synthetic' }] }]) {
    assert.equal(compareReviewItems([before], [item('a', change)], 'fingerprint').changes[0].label, 'Changed')
  }
})

test('matching uses identifiers rather than titles; ambiguous categories withhold change claims', () => {
  assert.equal(compareReviewItems([item('a')], [item('b', { title: 'Investigate a' })], 'fingerprint').changes.length, 2)
  for (const entries of [[{ title: 'Missing ID' }], [item('a'), item('a')]]) {
    const result = compareReviewItems(entries, [], 'fingerprint')
    assert.ok(result.unavailable)
    assert.equal(result.changes.length, 0)
  }
  const decision = { id: 'decision-1', title: 'Review evidence', actionId: null }
  assert.equal(compareReviewItems([decision], [{ ...decision, actionId: 'proposed-only' }], 'id').changes[0].label, 'Changed')
})

test('rendered comparison shows readable evidence, neutral changes and a GET-only form', () => {
  const html = render({ reviews: [
    review('before', { reviewDate: '2026-09-11', priorities: [item('removed')] }),
    review('after', { priorities: [item('new')], autumnDecisions: [{ id: 'decision', title: 'Review source', summary: 'Confirm source.' }] }),
  ], selectedId: 'after', referenceId: 'before' })
  for (const text of ['What changed between reviews?', 'Reference review', 'Selected review', 'Priority changes',
    'Decision prompt changes', 'Investigate new', 'Only in reference', 'not resolved', 'synthetic test reviews',
    'not approval records', 'test-correlation-after']) assert.ok(html.includes(text), text)
  assert.match(html, /method="GET"/)
  assert.match(html, /action="\/admin\/intelligence-os#review-comparison"/)
  assert.doesNotMatch(html, /method="POST"|formToken|x-intelligence-signature/)
})

test('rendering keeps quiet, same-date and empty comparisons accurate', () => {
  const html = render({ reviews: [review('a', { status: 'quiet' }), review('b', { status: 'quiet' })] })
  assert.match(html, /order within that day is not established/)
  assert.match(html, /Neither review contains items/)
  assert.doesNotMatch(html, /business improved|resolved successfully/)
  assert.match(render({ reviews: [] }), /Two saved reviews/)
})

test('stored text is escaped, while unknown identifiers show an unavailable state', () => {
  const reviews = [review('a'), review('b', { executiveSummary: '<script>alert(1)</script>' })]
  const html = render({ reviews })
  assert.ok(html.includes('&lt;script&gt;'))
  assert.doesNotMatch(html, /<script>/)
  assert.match(render({ reviews, selectedId: 'absent' }), /no longer in this snapshot/)
})
