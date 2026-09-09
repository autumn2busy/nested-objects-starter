import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'

import { adaptIncomeScenarioMilestone, evaluateMarketingJourneys } from '../dist/index.js'

const now = '2026-09-08T12:00:00.000Z'
const memberId = '31800000-0000-4000-8000-000000000901'
const rowId = '31800000-0000-4000-8000-000000000902'
const person = 'SyntheticPerson'
const cycle = 'SyntheticSubscription'
const key = (subject = person, subscription = cycle) => 'income_scenario_completed:v1:' + createHash('sha256')
  .update(JSON.stringify(['income_scenario_completed', 'v1', subject, subscription])).digest('hex')
const snapshot = rows => ({ coverage: 'complete', observedAt: now, rows })
function input() {
  return {
    outsetaPersonUid: person, now, maxSnapshotAgeMs: 300_000,
    profiles: snapshot([{ id: memberId, outseta_person_uid: person }]),
    currentMemberships: snapshot([{
      sourceSystem: 'outseta', authoritative: true, identityState: 'verified', isCurrent: true,
      sourceRecordId: cycle, outsetaPersonUid: person, subscriptionUid: cycle,
      memberSince: '2026-01-01T12:00:00.000Z', cycleStartedAt: '2026-01-02T12:00:00.000Z',
    }]),
    completionEvents: snapshot([{
      id: rowId, client_event_id: key(), event_name: 'income_scenario_completed', member_uid: person,
      source_page: '/tools/income-calculator', source: 'income_scenarios', occurred_at: '2026-06-01T12:00:00.000Z',
      event_data: {
        sourcePage: '/tools/income-calculator', source: 'income_scenarios', completionContract: 'v1', lifecycleCycleId: cycle,
      },
    }]),
  }
}
const event = value => value.completionEvents.rows[0]
const membership = value => value.currentMemberships.rows[0]
function withheld(value, reason) {
  const result = adaptIncomeScenarioMilestone(value)
  assert.equal(result.status, 'withheld')
  assert.equal(result.evidence, null)
  assert.equal(result.mutationAllowed, false)
  assert.ok(result.reasons.includes(reason), `${reason}: ${JSON.stringify(result.reasons)}`)
}

test('actual receipt projects only canonical member, current cycle, row reference and server occurrence time', () => {
  const value = input()
  const before = structuredClone(value)
  assert.deepEqual(adaptIncomeScenarioMilestone(value), {
    status: 'accepted', mutationAllowed: false, reasons: [], evidence: {
      memberId, lifecycleCycleId: cycle, sourceRecordId: `conversion_events:${rowId}`, occurredAt: event(value).occurred_at,
    },
  })
  assert.deepEqual(value, before)
  assert.deepEqual(adaptIncomeScenarioMilestone(value), adaptIncomeScenarioMilestone(value))
})

test('exact unique person link is required; email/account/user/anonymous fallback and duplicates are withheld', () => {
  for (const change of [
    value => { value.profiles.rows[0].outseta_person_uid = undefined },
    value => { value.profiles.rows[0].outseta_person_uid = person.toLowerCase() },
    value => { value.profiles.rows[0].id = 'not-a-real-profile-row-id' },
    value => { value.profiles.rows[0] = { id: memberId, user_id: person, outseta_account_id: person, email: person } },
  ]) {
    const value = input(); change(value)
    withheld(value, 'profile_subject_unresolved')
  }
  for (const name of ['profiles', 'currentMemberships', 'completionEvents']) {
    for (const rows of [[], [input()[name].rows[0], input()[name].rows[0]]]) {
      const value = input(); value[name].rows = rows
      const prefix = { profiles: 'profiles', currentMemberships: 'membership', completionEvents: 'receipt' }[name]
      withheld(value, `${prefix}_lookup_missing_or_ambiguous`)
    }
  }
})

test('only independent verified current Outseta truth establishes the cycle', () => {
  for (const changes of [
    { sourceSystem: 'supabase_profiles' }, { sourceSystem: 'activecampaign' }, { sourceSystem: 'stripe' },
    { authoritative: false }, { identityState: 'conflict' }, { identityState: 'unknown' }, { isCurrent: false },
    { outsetaPersonUid: 'AnotherPerson' }, { subscriptionUid: '' }, { subscriptionUid: null },
    { sourceRecordId: '' }, { memberSince: null }, { cycleStartedAt: null },
  ]) {
    const value = input(); Object.assign(membership(value), changes)
    withheld(value, 'current_outseta_cycle_unverified')
  }
})

test('old or wrong-person receipts and malformed or cross-cycle keys never qualify', () => {
  for (const changes of [
    { member_uid: person.toLowerCase() }, { member_uid: 'AnotherPerson' },
    { event_data: { ...event(input()).event_data, lifecycleCycleId: 'PreviousSubscription' } },
  ]) {
    const value = input(); Object.assign(event(value), changes)
    withheld(value, 'receipt_member_or_cycle_mismatch')
  }
  for (const client_event_id of ['', key('AnotherPerson'), key(person, 'PreviousSubscription'), key().toUpperCase(), 'browser-click']) {
    const value = input(); event(value).client_event_id = client_event_id
    withheld(value, 'receipt_key_mismatch')
  }
})

test('fixed stored event contract rejects generic completion, wrong metadata, extra data and browser success responses', () => {
  for (const changes of [
    { id: '' }, { id: 'browser-generated-receipt' },
    { event_name: 'tool_used' }, { event_name: 'profile_completed' }, { event_name: 'onboarding_completed' },
    { source: 'browser' }, { source_page: '/welcome' },
    { event_data: null }, { event_data: [] }, { event_data: {} },
    { event_data: { ...event(input()).event_data, source: 'browser' } },
    { event_data: { ...event(input()).event_data, sourcePage: '/welcome' } },
    { event_data: { ...event(input()).event_data, completionContract: 'v2' } },
    { event_data: { ...event(input()).event_data, income: 1000 } },
    { event_data: { ...event(input()).event_data, email: 'synthetic@example.invalid' } },
  ]) {
    const value = input(); Object.assign(event(value), changes)
    withheld(value, 'completion_receipt_contract_invalid')
  }
  const value = input(); value.completionEvents.rows = [{ recorded: true }]
  withheld(value, 'completion_receipt_contract_invalid')
})

test('all three lookups require complete, fresh source observations under explicit policy', () => {
  for (const [name, prefix] of [['profiles', 'profiles'], ['currentMemberships', 'membership'], ['completionEvents', 'receipt']]) {
    for (const coverage of ['partial', 'unknown', undefined]) {
      const value = input(); value[name].coverage = coverage
      withheld(value, `${prefix}_lookup_incomplete`)
    }
    for (const observedAt of ['2026-09-08T11:54:59.999Z', '2026-09-08T12:00:00.001Z']) {
      const value = input(); value[name].observedAt = observedAt
      withheld(value, `${prefix}_lookup_stale_or_future`)
    }
    const value = input(); value[name].observedAt = 'yesterday'
    withheld(value, `${prefix}_lookup_time_invalid`)
  }
  for (const changes of [
    { now: 'yesterday' }, { now: '2026-02-30T12:00:00Z' }, { outsetaPersonUid: '  SyntheticPerson' },
    { outsetaPersonUid: 'synthetic@example.invalid' }, { maxSnapshotAgeMs: undefined },
    { maxSnapshotAgeMs: 0 }, { maxSnapshotAgeMs: -1 }, { maxSnapshotAgeMs: Infinity }, { maxSnapshotAgeMs: NaN },
  ]) withheld({ ...input(), ...changes }, 'invalid_observation_context')
})

test('receipt chronology is server-based and old valid completion does not expire merely because 30 days passed', () => {
  assert.equal(adaptIncomeScenarioMilestone(input()).status, 'accepted')
  for (const occurred_at of ['2025-12-31T12:00:00.000Z', '2026-01-01T18:00:00.000Z', '2026-09-08T12:00:00.001Z']) {
    const value = input(); event(value).occurred_at = occurred_at
    withheld(value, 'receipt_chronology_invalid')
  }
  const invalid = input(); event(invalid).occurred_at = 'last week'
  withheld(invalid, 'completion_receipt_contract_invalid')
  const predatesReceipt = input()
  event(predatesReceipt).occurred_at = '2026-09-08T11:59:00.000Z'
  predatesReceipt.completionEvents.observedAt = '2026-09-08T11:58:00.000Z'
  withheld(predatesReceipt, 'receipt_chronology_invalid')
})

test('a person joining an existing Agency subscription qualifies only after both independent authority dates', () => {
  const value = input()
  membership(value).cycleStartedAt = '2025-12-01T12:00:00.000Z'
  assert.equal(adaptIncomeScenarioMilestone(value).status, 'accepted')
  event(value).occurred_at = '2025-12-15T12:00:00.000Z'
  withheld(value, 'receipt_chronology_invalid')
  for (const field of ['memberSince', 'cycleStartedAt']) {
    const predatesAuthority = input()
    predatesAuthority.currentMemberships.observedAt = '2026-09-08T11:58:00.000Z'
    membership(predatesAuthority)[field] = '2026-09-08T11:59:00.000Z'
    event(predatesAuthority).occurred_at = now
    withheld(predatesAuthority, 'receipt_chronology_invalid')
  }
})

test('source fields and identifiers beyond the four evidence fields never leak into output or rejection reasons', () => {
  const value = input()
  value.profiles.rows[0].email = 'private@example.invalid'
  event(value).member_email = 'private@example.invalid'
  event(value).anonymous_id = 'private-anonymous-reference'
  const result = adaptIncomeScenarioMilestone(value)
  assert.equal(result.status, 'accepted')
  assert.equal(JSON.stringify(result).includes('private'), false)
  event(value).event_data.privateIncome = 99999
  const rejected = adaptIncomeScenarioMilestone(value)
  assert.equal(rejected.status, 'withheld')
  assert.equal(JSON.stringify(rejected).includes('99999'), false)
  assert.equal(JSON.stringify(rejected).includes('private'), false)
})

test('accepted calculator evidence alone cannot graduate onboarding or permit a promotional journey', () => {
  const activation = adaptIncomeScenarioMilestone(input()).evidence
  const decisions = evaluateMarketingJourneys({
    classification: { canonicalMemberId: memberId, membershipTruthState: 'known', audienceTraits: [],
      consent: 'granted', lifecycle: 'active', membershipTier: 'free' },
    now, memberSince: membership(input()).memberSince, paidSince: null, lifecycleCycleId: cycle,
    activation: { ...activation, approved: true }, onboarding: 'unknown', onboardingChannel: 'in_app',
    onboardingCompletion: null, profileInputs: { profile: null, geography: null, experience: null, inspectionTypes: null },
    expressedNeed: 'pro', offerApproved: true, trialEligible: true, serviceDeliveryAllowed: true, meaningfulInactivityDays: 100,
    history: { complete: true, activeJourneys: [], enrollmentKeys: [], lastPromotionalAt: null, lastServiceAt: null },
  })
  for (const name of ['free_to_pro', 'free_to_elite', 'trial_offer', 'reengagement', 'win_back']) {
    const decision = decisions.find(item => item.journey === name)
    assert.equal(decision.eligible, false)
    assert.equal(decision.mutationAllowed, false)
    assert.ok(decision.reasons.includes('onboarding_incomplete_or_unknown'))
    assert.ok(decision.reasons.includes('profile_inputs_incomplete'))
  }
})
