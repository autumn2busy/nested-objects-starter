import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('homepage defines one buyer, one bounded outcome, and no nationwide marketplace claim', async () => {
  const source = await read('../app/page.tsx')

  assert.match(source, /regional mortgage and property field-service firms/i)
  assert.match(source, /coverage-feasibility memo/i)
  assert.match(source, /not a live\s+nationwide inspector network/i)
  assert.match(source, /No public inspector directory/i)
  assert.doesNotMatch(source, /2,400\+|50 States|98%|24-hour average|460\+ firms/i)
})

test('inspector route exposes no sample profiles, ratings, contacts, or availability', async () => {
  const source = await read('../app/inspectors/page.tsx')

  assert.match(source, /There is no public inspector directory/i)
  assert.match(source, /affirmative consent/i)
  assert.doesNotMatch(source, /Marcus Davis|Sarah Kim|completionRate|reviews:|turnaround:/i)
})

test('coverage request is an owner-assisted email brief, not a dead job form or payment flow', async () => {
  const source = await read('../app/post-a-job/page.tsx')

  assert.match(source, /does not post a job, charge a card, publish a request, notify inspectors, or collect information/i)
  assert.match(source, /mailto:support@nestedobjects\.com/i)
  assert.match(source, /proposed validation terms/i)
  assert.doesNotMatch(source, /<form|Submit Job Posting|first posting is free/i)
})

test('dashboard route makes its unlaunched state explicit and displays no invented activity', async () => {
  const source = await read('../app/dashboard/page.tsx')

  assert.match(source, /firm dashboard is not launched/i)
  assert.match(source, /does not display firm accounts, inspector records, job activity/i)
  assert.doesNotMatch(source, /JOB-1042|99\.2%|Inspectors Engaged|Welcome back/i)
})

test('global firm navigation does not present browse, post, or dashboard capabilities as live', async () => {
  const source = await read('../app/layout.tsx')

  assert.match(source, /Pilot Scope/)
  assert.match(source, /Coverage Request/)
  assert.match(source, /Inspector member login/)
  assert.doesNotMatch(source, />Browse Inspectors<|>Post a Job<|>Dashboard</)
})
