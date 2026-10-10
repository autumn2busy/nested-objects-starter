import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const savedAt = '2026-10-10T10:40:00.000Z'
const person = 'SyntheticPerson'
const profile = { id: 'synthetic-profile', outseta_person_uid: person, updated_at: savedAt }

async function runPatch(options = {}) {
  const source = readFileSync(new URL('../app/api/profile/route.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const routed = []
  const logs = []
  const writes = []
  const updated = options.updated === undefined ? profile : options.updated
  const singleResults = [
    { data: profile, error: null },
    { data: updated, error: options.trustError ?? null },
  ]
  const maybeResults = [
    { data: { id: '', headline: '', outseta_person_uid: '', user_id: '', updated_at: '' }, error: null },
    { data: { id: profile.id }, error: null },
  ]
  const query = {
    select() { return this }, limit() { return this }, or() { return this }, eq() { return this },
    update(value) { writes.push(value); return this },
    maybeSingle() { return Promise.resolve(maybeResults.shift()) },
    single() { return Promise.resolve(singleResults.shift()) },
  }
  const exports = {}
  const schema = {
    PROFILE_CRITICAL_COLUMNS: [], PROFILE_GUARANTEED_COLUMNS: [],
    buildDegradedProfile() {}, buildFallbackProfileSchemaInfo() {}, buildProfileQueryColumns() {},
  }
  const modules = {
    'next/server': { NextResponse: { json: (value, init) => ({ value, status: init?.status ?? 200 }) } },
    '@/lib/auth-server': {
      getCurrentUser: async () => options.user ?? { sub: person, 'outseta:subscriptionUid': 'SyntheticCycle' },
      getOutsetaUserId: (user) => user.sub ?? user.Uid,
      PLAN_UIDS: { FREE: 'synthetic-free' },
    },
    '@/lib/supabase-server': { createServiceRoleClient: () => ({ from: () => query }) },
    '@/lib/trust-score': { calculateTrustScore: () => ({ total: 1, tier: 'new', breakdown: {} }) },
    '@/lib/free-onboarding-completion': { reconcileFreeOnboardingCompletionFromEnvironment: async () => {} },
    '@/lib/free-journey-operation-producer': {
      emitFreeJourneySourceEvent: async (event) => { routed.push(event); return { recoveryRequired: false } },
    },
    './schema': schema,
  }
  vm.runInNewContext(code, {
    exports, Date, Set, process: { env: {} },
    console: { error: (...args) => logs.push(args), warn() {} },
    require(name) { assert.ok(name in modules, `Unexpected module: ${name}`); return modules[name] },
  })
  const response = await exports.PATCH({ json: async () => ({ headline: 'Inspector' }) })
  return { response, routed, logs, writes }
}

test('profile journey routes only confirmed trust persistence with exact signed person and stored timestamp', async () => {
  const result = await runPatch()
  assert.equal(result.response.status, 200)
  assert.equal(result.writes.length, 2)
  assert.equal(result.routed.length, 1)
  assert.equal(result.routed[0].kind, 'profile_saved')
  assert.equal(result.routed[0].outsetaPersonUid, person)
  assert.equal(result.routed[0].subscriptionUid, 'SyntheticCycle')
  assert.equal(result.routed[0].occurredAt, savedAt)
})

test('trust write error or missing persistence receipt never emits a journey event', async () => {
  for (const options of [
    { trustError: { code: 'synthetic-write-failure' } },
    { updated: null },
    { updated: { ...profile, id: 'another-profile' } },
  ]) {
    const result = await runPatch(options)
    assert.equal(result.response.status, 200)
    assert.equal(result.routed.length, 0)
    assert.equal(result.logs.at(-1)[1].code, 'profile_trust_write_unconfirmed')
  }
})

test('mismatched or missing saved person never routes using an email or legacy identity fallback', async () => {
  for (const options of [
    { updated: { ...profile, outseta_person_uid: 'OtherPerson' } },
    { updated: { ...profile, outseta_person_uid: null } },
    { user: { Uid: person, email: 'synthetic@example.test', 'outseta:subscriptionUid': 'SyntheticCycle' } },
  ]) {
    const result = await runPatch(options)
    assert.equal(result.response.status, 200)
    assert.equal(result.routed.length, 0)
    assert.equal(result.logs.at(-1)[1].code, 'saved_profile_person_binding_unconfirmed')
  }
})
