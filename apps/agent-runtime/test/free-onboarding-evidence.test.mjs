import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { adaptFreeOnboardingCompletion, classifyMarketingContact, evaluateMarketingJourneys } from '../dist/index.js'

const now = '2026-09-09T12:00:00.000Z'
const member = '31800000-0000-4000-8000-000000000911'
const eventId = '31800000-0000-4000-8000-000000000912'
const person = 'SyntheticPerson'
const cycle = 'SyntheticCycle'
const snapshot = rows => ({ coverage: 'complete', observedAt: now, rows })
function input() {
  return {
    outsetaPersonUid: person, now, maxSnapshotAgeMs: 300000,
    profiles: snapshot([{
      id: member, outseta_person_uid: person, headline: 'Inspection services', bio: 'Synthetic profile',
      city: 'Atlanta', state: 'GA', experience_level: 'new', primary_services: 'Property Inspections',
      service_areas: ['Property Inspections'], updated_at: '2026-09-08T12:00:00.000Z',
    }]),
    currentMemberships: snapshot([{
      sourceSystem: 'outseta', authoritative: true, identityState: 'verified', isCurrent: true,
      sourceRecordId: cycle, outsetaPersonUid: person, subscriptionUid: cycle,
      memberSince: '2026-08-01T12:00:00.000Z', cycleStartedAt: '2026-08-01T12:00:00.000Z',
    }]),
    completionEvents: snapshot([{
      id: eventId, client_event_id: 'income_scenario_completed:v1:' + createHash('sha256')
        .update(JSON.stringify(['income_scenario_completed', 'v1', person, cycle])).digest('hex'),
      event_name: 'income_scenario_completed', member_uid: person,
      source_page: '/tools/income-calculator', source: 'income_scenarios', occurred_at: '2026-09-07T12:00:00.000Z',
      event_data: { sourcePage: '/tools/income-calculator', source: 'income_scenarios', completionContract: 'v1', lifecycleCycleId: cycle },
    }]),
  }
}

test('saved profile and the existing verified receipt derive current completion without retaining profile content', () => {
  const value = input(), before = structuredClone(value), result = adaptFreeOnboardingCompletion(value)
  assert.equal(result.status, 'complete')
  assert.equal(result.mutationAllowed, false)
  assert.equal(result.onboardingCompletion.memberId, member)
  assert.equal(result.onboardingCompletion.lifecycleCycleId, cycle)
  assert.equal(result.onboardingCompletion.occurredAt, value.profiles.rows[0].updated_at)
  assert.match(result.onboardingCompletion.sourceRecordId, /^derived:onboarding:profiles:/)
  assert.equal(result.activation.sourceRecordId, 'conversion_events:' + eventId)
  assert.deepEqual(result.profileInputs, { profile: true, geography: true, experience: true, inspectionTypes: true })
  assert(!/Atlanta|Synthetic profile|Inspection services/.test(JSON.stringify(result)))
  assert.deepEqual(value, before)
})

test('geography comes from city/state, not the misleadingly named service_areas field', () => {
  const value = input(); value.profiles.rows[0].city = null
  const result = adaptFreeOnboardingCompletion(value)
  assert.equal(result.status, 'incomplete')
  assert.equal(result.profileInputs.geography, false)
  assert.equal(result.profileInputs.inspectionTypes, true)
  assert.equal(result.onboardingCompletion, null)
})

test('missing schema columns are unknown, while explicitly empty saved inputs are incomplete', () => {
  for (const field of ['headline','bio','city','state','experience_level','primary_services','service_areas','updated_at']) {
    const value = input(); delete value.profiles.rows[0][field]
    assert.equal(adaptFreeOnboardingCompletion(value).status, 'withheld', field)
  }
  for (const [field, empty] of [['headline',' '],['bio',null],['city',''],['state','ZZ'],['experience_level',''],['primary_services',null],['service_areas',[]],['service_areas',['Fulton County']]]) {
    const value = input(); value.profiles.rows[0][field] = empty
    assert.equal(adaptFreeOnboardingCompletion(value).status, 'incomplete', field)
  }
})

test('no profile tag, welcome completion, partial receipt lookup or old-cycle receipt supplies completion', () => {
  for (const mutate of [
    v => { v.completionEvents.rows = [] },
    v => { v.completionEvents.coverage = 'partial' },
    v => { v.completionEvents.rows[0].event_data.lifecycleCycleId = 'OldCycle' },
    v => { v.profiles.rows.push({...v.profiles.rows[0]}) },
    v => { v.profiles.rows[0].outseta_person_uid = 'DifferentPerson' },
    v => { v.currentMemberships.rows[0].identityState = 'conflict' },
    v => { v.profiles.observedAt = '2026-09-08T12:00:00.000Z' },
  ]) {
    const value = input(); mutate(value)
    value.profiles.rows[0].onboarding_completed_at = now
    value.profiles.rows[0].tag = 'onboarding-complete'
    const result = adaptFreeOnboardingCompletion(value)
    assert.equal(result.status, 'withheld')
    assert.equal(result.onboardingCompletion, null)
  }
})

test('profile version must be observed and belong to this membership cycle', () => {
  for (const date of ['2026-07-31T12:00:00.000Z','2026-09-10T12:00:00.000Z']) {
    const value = input(); value.profiles.rows[0].updated_at = date
    assert.deepEqual(adaptFreeOnboardingCompletion(value).reasons, ['saved_profile_chronology_unverified'])
  }
})

test('calculation after the profile save becomes the derived completion date', () => {
  const value = input(); value.completionEvents.rows[0].occurred_at = now
  assert.equal(adaptFreeOnboardingCompletion(value).onboardingCompletion.occurredAt, now)
})

test('derived completion feeds existing eligibility without bypassing age, consent or paid-member exclusions', () => {
  for (const [age, consent, tier, expected] of [
    [29,'granted','free',false], [30,'granted','free',true],
    [30,'denied','free',false], [30,'granted','starter',false],
  ]) {
    const value = input()
    const memberSince = new Date(Date.parse(now) - age * 86400000).toISOString()
    Object.assign(value.currentMemberships.rows[0], {memberSince, cycleStartedAt: memberSince})
    const evidence = adaptFreeOnboardingCompletion(value)
    assert.equal(evidence.status, 'complete')
    const classification = classifyMarketingContact({
      contact: {contactId:'synthetic-ac',email:'member@example.com',tagNames:['WIX'],listNames:[],customFields:{},createdAt:memberSince,updatedAt:now,lastOpenAt:null,lastClickAt:null,lastSiteVisitAt:null,bounced:false,unsubscribed:consent==='denied',marketingConsent:consent},
      membership: {memberId:member,activeCampaignContactId:'synthetic-ac',sourceSystem:'outseta',membershipTier:tier,membershipStatus:'active',authoritative:true},
      config: {internalDomains:[],now}, correlation: {correlationId:member,causationId:null,traceId:'synthetic-onboarding'},
    })
    const decisions = evaluateMarketingJourneys({
      classification, now, memberSince, paidSince:null, lifecycleCycleId:cycle,
      onboarding:'complete',onboardingChannel:'marketing_email',onboardingCompletion:evidence.onboardingCompletion,
      activation:evidence.activation,profileInputs:evidence.profileInputs,expressedNeed:'pro',offerApproved:true,
      trialEligible:false,serviceDeliveryAllowed:true,meaningfulInactivityDays:null,
      history:{complete:true,activeJourneys:[],enrollmentKeys:[],lastPromotionalAt:null,lastServiceAt:null},
    })
    assert.equal(decisions.find(d=>d.journey==='free_to_pro').eligible, expected)
    assert(decisions.every(d=>d.mutationAllowed===false))
  }
})
