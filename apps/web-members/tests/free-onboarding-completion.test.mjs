import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

import ts from 'typescript'

function load() {
  const source = readFileSync(new URL('../lib/free-onboarding-completion.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const context = {
    exports: {},
    process: { env: {} },
    require(name) {
      if (name === 'node:crypto') return { createHash }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  }
  vm.runInNewContext(code, context)
  return context.exports
}

const {
  getFreeOnboardingCompletionMode,
  reconcileFreeOnboardingCompletion,
} = load()

const now = '2026-10-07T12:00:00.000Z'
const person = 'SyntheticPerson'
const cycle = 'SyntheticCycle'
const freePlan = 'SyntheticFreePlan'
const profileId = '31800000-0000-4000-8000-000000001007'
const receiptId = '31800000-0000-4000-8000-000000001008'
const event = 'income_scenario_completed'

function eventKey() {
  return `${event}:v1:${createHash('sha256').update(JSON.stringify([
    event, 'v1', person, cycle,
  ])).digest('hex')}`
}

function profile() {
  return {
    id: profileId,
    outseta_person_uid: person,
    headline: 'Field inspector',
    bio: 'Synthetic profile used only for a local test.',
    city: 'Atlanta',
    state: 'GA',
    experience_level: 'new',
    primary_services: 'Property Inspections',
    service_areas: ['Property Inspections'],
    updated_at: '2026-10-07T10:00:00.000Z',
    onboarding_completed_at: null,
  }
}

function receipt() {
  return {
    id: receiptId,
    client_event_id: eventKey(),
    event_name: event,
    member_uid: person,
    source_page: '/tools/income-calculator',
    source: 'income_scenarios',
    occurred_at: '2026-10-07T11:00:00.000Z',
    event_data: {
      sourcePage: '/tools/income-calculator',
      source: 'income_scenarios',
      completionContract: 'v1',
      lifecycleCycleId: cycle,
    },
  }
}

function input(mode = 'write') {
  return {
    mode,
    now,
    outsetaPersonUid: person,
    subscriptionUid: cycle,
    planUid: freePlan,
    freePlanUid: freePlan,
  }
}

function fixture({ profiles = [profile()], receipts = [receipt()], update = 'updated' } = {}) {
  const calls = []
  const store = {
    async readProfiles(requestedPerson) {
      calls.push(['profiles', requestedPerson])
      return { coverage: 'complete', rows: profiles }
    },
    async readIncomeReceipts(requestedPerson, requestedCycle) {
      calls.push(['receipts', requestedPerson, requestedCycle])
      return { coverage: 'complete', rows: receipts }
    },
    async compareAndSetCompletedAt(id, completedAt) {
      calls.push(['compare-and-set', id, completedAt])
      return update
    },
  }
  return { store, calls }
}

test('mode is fail-closed and disabled mode performs no source reads', async () => {
  assert.equal(getFreeOnboardingCompletionMode('preview'), 'preview')
  assert.equal(getFreeOnboardingCompletionMode('write'), 'write')
  for (const value of [undefined, '', 'enabled', 'production']) {
    assert.equal(getFreeOnboardingCompletionMode(value), 'disabled')
  }

  const f = fixture()
  const result = await reconcileFreeOnboardingCompletion(input('disabled'), f.store)
  assert.equal(result.status, 'disabled')
  assert.equal(result.attemptedWrites, 0)
  assert.deepEqual(f.calls, [])
})

test('preview joins exact current-cycle sources without writing or authorizing ActiveCampaign', async () => {
  const f = fixture()
  const result = await reconcileFreeOnboardingCompletion(input('preview'), f.store)
  assert.equal(result.status, 'ready')
  assert.equal(result.completedAt, '2026-10-07T11:00:00.000Z')
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.confirmedWrites, 0)
  assert.equal(result.activeCampaignMutationAllowed, false)
  assert.deepEqual(f.calls.map(call => call[0]), ['profiles', 'receipts'])
})

test('profile-first and calculation-first orders converge through one compare-and-set marker', async () => {
  const state = { profiles: [profile()], receipts: [], writes: 0 }
  const store = {
    async readProfiles() { return { coverage: 'complete', rows: structuredClone(state.profiles) } },
    async readIncomeReceipts() { return { coverage: 'complete', rows: structuredClone(state.receipts) } },
    async compareAndSetCompletedAt(_id, completedAt) {
      state.writes += 1
      if (state.profiles[0].onboarding_completed_at) return 'already_completed'
      state.profiles[0].onboarding_completed_at = completedAt
      return 'updated'
    },
  }

  assert.equal((await reconcileFreeOnboardingCompletion(input(), store)).reason, 'income_receipt_missing')
  state.receipts = [receipt()]
  assert.equal((await reconcileFreeOnboardingCompletion(input(), store)).status, 'completed')
  assert.equal((await reconcileFreeOnboardingCompletion(input(), store)).status, 'already_completed')
  assert.equal(state.writes, 1)

  state.profiles = [{ ...profile(), headline: null }]
  state.receipts = [receipt()]
  state.writes = 0
  assert.equal((await reconcileFreeOnboardingCompletion(input(), store)).reason, 'profile_incomplete')
  state.profiles = [profile()]
  assert.equal((await reconcileFreeOnboardingCompletion(input(), store)).status, 'completed')
  assert.equal(state.writes, 1)
})

test('wrong plan, ambiguous sources, invalid receipt and uncertain write fail closed', async () => {
  const paid = input(); paid.planUid = 'SyntheticPaidPlan'
  assert.equal((await reconcileFreeOnboardingCompletion(paid, fixture().store)).status, 'withheld')

  const duplicateProfile = fixture({ profiles: [profile(), profile()] })
  assert.equal((await reconcileFreeOnboardingCompletion(input(), duplicateProfile.store)).reason, 'profile_identity_ambiguous')

  const wrongCycleReceipt = receipt()
  wrongCycleReceipt.event_data.lifecycleCycleId = 'PreviousCycle'
  assert.equal((await reconcileFreeOnboardingCompletion(input(), fixture({ receipts: [wrongCycleReceipt] }).store)).reason, 'income_receipt_invalid')

  const unavailable = fixture({ update: 'unknown' })
  const result = await reconcileFreeOnboardingCompletion(input(), unavailable.store)
  assert.equal(result.status, 'unavailable')
  assert.equal(result.attemptedWrites, 1)
  assert.equal(result.confirmedWrites, 0)
  assert.equal(result.activeCampaignMutationAllowed, false)
})

test('application hooks preserve existing stores and remove the unconditional AC tag path', () => {
  const conversionRoute = readFileSync(new URL('../app/api/conversion-events/route.ts', import.meta.url), 'utf8')
  const profileRoute = readFileSync(new URL('../app/api/profile/route.ts', import.meta.url), 'utf8')
  const action = readFileSync(new URL('../actions/onboarding.ts', import.meta.url), 'utf8')
  const migration = readFileSync(new URL('../../../supabase/migrations/20261007120000_add_guarded_free_onboarding_completion.sql', import.meta.url), 'utf8')

  assert.match(conversionRoute, /recordConversionEvent[\s\S]+reconcileFreeOnboardingCompletionFromEnvironment/)
  assert.match(conversionRoute, /readConversionEventReceipt[\s\S]+emitFreeJourneySourceEvent/)
  assert.match(profileRoute, /\.from\('profiles'\)[\s\S]+reconcileFreeOnboardingCompletionFromEnvironment/)
  assert.match(profileRoute, /reconcileFreeOnboardingCompletionFromEnvironment[\s\S]+emitFreeJourneySourceEvent/)
  assert.doesNotMatch(action, /applyACContactTag|onboarding-complete/)
  assert.doesNotMatch(action, /\.update\(\{[\s\S]*onboarding_completed_at/)
  assert.match(migration, /ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz/)
  assert.doesNotMatch(migration, /CREATE\s+TRIGGER|ALTER\s+TABLE\s+public\.conversion_events|INSERT\s+INTO/i)
})
