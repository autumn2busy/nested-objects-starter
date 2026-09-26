import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function load(relative) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const context = {
    exports: {},
    require: name => {
      if (name === 'node:crypto') return { createHash }
      throw new Error('Unexpected dependency: ' + name)
    },
    URL,
    Intl,
    AbortSignal,
    fetch: () => { throw new Error('Global fetch must not be used') },
  }
  vm.runInNewContext(code, context)
  return context.exports
}

const { deriveFreeJourneyStage, syncActiveCampaignFreeJourney } = load('../lib/active-campaign-free-journey.ts')
const now = '2026-09-21T12:00:00.000Z'
const member = '31800000-0000-4000-8000-000000000921'
const person = 'SyntheticPerson'
const account = 'SyntheticAccount'
const cycle = 'SyntheticCycle'
const eventName = 'lifecycle_email_consent_requested'
const purpose = 'free_onboarding_and_conversion_email'

function consentKey() {
  return `${eventName}:v1:${createHash('sha256').update(JSON.stringify([
    eventName, 'v1', person, cycle, purpose,
  ])).digest('hex')}`
}

function input() {
  const milestone = {
    memberId: member,
    lifecycleCycleId: cycle,
    sourceRecordId: 'conversion_events:31800000-0000-4000-8000-000000000922',
    occurredAt: '2026-09-20T12:00:00.000Z',
  }
  return {
    now,
    evidenceObservedAt: now,
    maxEvidenceAgeMs: 3 * 86_400_000,
    evidenceExpiresAt: '2026-09-23',
    membership: {
      canonicalMemberId: member,
      outsetaPersonUid: person,
      outsetaAccountUid: account,
      subscriptionUid: cycle,
      activeCampaignContactId: '41',
      email: 'member@example.com',
      sourceSystem: 'outseta',
      authoritative: true,
      identityState: 'verified',
      isCurrent: true,
      tier: 'free',
      lifecycle: 'active',
      memberSince: '2026-08-01T12:00:00.000Z',
      cycleStartedAt: '2026-08-01T12:00:00.000Z',
    },
    consentRequest: {
      clientEventId: consentKey(),
      eventName,
      memberUid: person,
      occurredAt: '2026-09-20T11:00:00.000Z',
      eventData: {
        sourcePage: '/welcome',
        source: 'member_consent',
        consentContract: 'v1',
        purpose,
        lifecycleCycleId: cycle,
      },
    },
    audienceTraits: [],
    profileInputs: { profile: true, geography: true, experience: true, inspectionTypes: true },
    incomeScenarioStatus: 'accepted',
    activation: { ...milestone, approved: true },
    onboardingCompletion: { ...milestone, sourceRecordId: 'derived:onboarding:synthetic' },
  }
}

function historicalInput() {
  const value = input()
  value.consentRequest = null
  value.historicalConsent = {
    evidenceType: 'owner_attested_historical_signup_permission',
    policyDecisionRef: 'issue-318:historical-signup-permission:2026-09-23',
    attestedAt: '2026-09-21T11:30:00.000Z',
    cohortCutoffAt: '2026-09-21T11:00:00.000Z',
    source: 'outseta_signup_form',
    purpose,
    outsetaPersonUid: person,
    outsetaAccountUid: account,
    subscriptionUid: cycle,
    memberSince: value.membership.memberSince,
    laterSuppression: {
      observedAt: '2026-09-21T11:45:00.000Z',
      outsetaHasUnsubscribed: false,
      activeCampaignBounced: false,
      activeCampaignDeleted: false,
      activeCampaignSuppressed: false,
    },
  }
  return value
}

const config = {
  apiUrl: 'https://synthetic.api-us1.com',
  apiKey: 'synthetic-key',
  consentListId: '44',
  consentFormId: '77',
  stageFieldId: '193',
  expiryFieldId: '194',
  accountTimeZone: 'America/Chicago',
}

const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
})

function fixture(options = {}) {
  const requests = []
  const stored = [...(options.fieldValues ?? [])]
  let nextId = 900
  const fetch = async (url, init = {}) => {
    const path = url.split('/api/3/')[1]
    const request = {
      path,
      method: init.method ?? 'GET',
      body: init.body ? JSON.parse(init.body) : undefined,
      init,
    }
    requests.push(request)
    const overridden = await options.intercept?.(request, stored)
    if (overridden) return overridden
    if (path === 'contacts/41') return response({ contact: {
      id: '41', email: 'member@example.com', bounced_hard: '0', bounced_soft: '0', deleted: '0',
      ...(options.contact ?? {}),
    } })
    if (path === 'contacts/41/contactLists') return response({ contactLists:
      options.contactLists ?? [{ id: '501', contact: '41', list: '44', form: '77', status: '1' }],
    })
    if (path === 'contacts/41/fieldValues') return response({ fieldValues: stored })
    if (path === 'fieldValues' && request.method === 'POST') {
      const created = { id: String(++nextId), ...request.body.fieldValue }
      stored.push(created)
      return response({ fieldValue: created }, 201)
    }
    if (path.startsWith('fieldValues/') && request.method === 'PUT') {
      const id = path.split('/')[1]
      const existing = stored.find(item => String(item.id) === id)
      Object.assign(existing, request.body.fieldValue)
      return response({ fieldValue: { id, ...existing } })
    }
    if (path.startsWith('fieldValues/') && request.method === 'GET') {
      const id = path.split('/')[1]
      return response({ fieldValue: stored.find(item => String(item.id) === id) })
    }
    throw new Error('Unexpected request: ' + request.method + ' ' + path)
  }
  return { requests, stored, run: (value = input(), settings = config) => syncActiveCampaignFreeJourney(value, settings, fetch) }
}

test('missing writer configuration performs no provider reads or writes', async () => {
  const f = fixture()
  const result = await f.run(input(), { ...config, consentListId: '' })
  assert.equal(result.status, 'withheld')
  assert.equal(result.desiredStage, null)
  assert.equal(result.attemptedWrites, 0)
  assert.equal(f.requests.length, 0)
})

test('missing or invalid current-cycle consent receipt cannot be replaced by list membership', async () => {
  for (const mutate of [
    value => { value.consentRequest = null },
    value => { value.consentRequest.clientEventId = 'wrong' },
    value => { value.consentRequest.eventData.lifecycleCycleId = 'OldCycle' },
    value => { value.consentRequest.eventData.purpose = 'generic_marketing' },
  ]) {
    const value = input(); mutate(value)
    const f = fixture()
    const result = await f.run(value)
    assert.equal(result.status, 'withheld')
    assert.equal(result.attemptedWrites, 0)
    assert.equal(f.requests.length, 0)
  }
})

test('stage derivation separates profile, calculation, onboarding and conversion gates', () => {
  const profile = input(); profile.profileInputs.geography = false
  assert.equal(deriveFreeJourneyStage(profile), 'profile_needed')

  const calculation = input()
  calculation.incomeScenarioStatus = 'missing'; calculation.activation = null; calculation.onboardingCompletion = null
  assert.equal(deriveFreeJourneyStage(calculation), 'calculation_needed')

  const young = input(); young.membership.memberSince = '2026-09-10T12:00:00.000Z'; young.membership.cycleStartedAt = young.membership.memberSince
  assert.equal(deriveFreeJourneyStage(young), 'onboarding_complete')

  const trial = input(); trial.membership.lifecycle = 'trialing'
  assert.equal(deriveFreeJourneyStage(trial), 'onboarding_complete')
  assert.equal(deriveFreeJourneyStage(input()), 'conversion_eligible')

  const paid = input(); paid.membership.tier = 'pro'
  assert.equal(deriveFreeJourneyStage(paid), 'withheld')
  const unknown = input(); unknown.profileInputs.profile = null
  assert.equal(deriveFreeJourneyStage(unknown), 'withheld')
})

test('confirmed scoped double opt-in writes expiry before the trigger field and verifies both', async () => {
  const f = fixture()
  const result = await f.run()
  assert.equal(result.status, 'updated')
  assert.equal(result.desiredStage, 'conversion_eligible')
  assert.equal(result.attemptedWrites, 2)
  assert.equal(result.confirmedWrites, 2)
  assert.equal(result.consentProvenance, 'current_cycle_doi')
  const posts = f.requests.filter(item => item.method === 'POST')
  assert.deepEqual(posts.map(item => item.body.fieldValue.field), ['194', '193'])
  assert.equal(f.requests.some(item => item.path === 'contactLists' || (item.path.includes('contactLists') && item.method !== 'GET')), false)
  assert.equal(f.requests.some(item => item.path.includes('contactAutomations')), false)
  assert(f.requests.every(item => item.init.redirect === 'error' && item.init.signal instanceof AbortSignal))
})

test('owner-attested historical signup permission has distinct preview-only provenance', async () => {
  const f = fixture()
  const result = await f.run(historicalInput(), {
    ...config,
    historicalConsentDecisionRef: 'issue-318:historical-signup-permission:2026-09-23',
  })
  assert.equal(result.status, 'withheld')
  assert.equal(result.desiredStage, 'conversion_eligible')
  assert.equal(result.consentProvenance, 'historical_owner_attestation')
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.confirmedWrites, 0)
  assert.equal(result.steps.at(-1).code, 'historical_consent_preview_only')
  assert.equal(f.requests.length, 0)
})

test('historical permission requires suppression evidence at or after the attestation', async () => {
  const value = historicalInput()
  value.historicalConsent.attestedAt = '2026-09-21T11:59:00.000Z'
  value.historicalConsent.laterSuppression.observedAt = '2026-09-21T11:58:00.000Z'
  const f = fixture()
  const result = await f.run(value, { ...config,
    historicalConsentDecisionRef: value.historicalConsent.policyDecisionRef })
  assert.equal(result.status, 'withheld')
  assert.equal(result.desiredStage, null)
  assert.equal(result.consentProvenance, null)
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.confirmedWrites, 0)
  assert.equal(f.requests.length, 0)
})

test('historical permission rejects fabricated provenance, stale suppression and mixed DOI evidence', async () => {
  for (const mutate of [
    value => { value.historicalConsent.policyDecisionRef = 'unapproved-decision' },
    value => { value.historicalConsent.outsetaPersonUid = 'DifferentPerson' },
    value => { value.historicalConsent.purpose = 'generic_marketing' },
    value => { value.historicalConsent.laterSuppression.observedAt = '2026-09-17T11:45:00.000Z' },
    value => { value.historicalConsent.laterSuppression.activeCampaignSuppressed = true },
    value => { value.consentRequest = input().consentRequest },
  ]) {
    const value = historicalInput(); mutate(value)
    const f = fixture()
    const result = await f.run(value, {
      ...config,
      historicalConsentDecisionRef: 'issue-318:historical-signup-permission:2026-09-23',
    })
    assert.equal(result.status, 'withheld')
    assert.equal(result.desiredStage, null)
    assert.equal(result.consentProvenance, null)
    assert.equal(result.attemptedWrites, 0)
    assert.equal(f.requests.length, 0)
  }
})

test('unconfirmed, unsubscribed, wrong-form, bounced or deleted contacts remain untouched', async () => {
  const cases = [
    { contactLists: [{ contact: '41', list: '44', form: '77', status: '0' }] },
    { contactLists: [{ contact: '41', list: '44', form: '77', status: '2' }] },
    { contactLists: [{ contact: '41', list: '44', form: '88', status: '1' }] },
    { contact: { bounced_hard: '1' } },
    { contact: { deleted: '1' } },
  ]
  for (const options of cases) {
    const f = fixture(options)
    const result = await f.run()
    assert.equal(result.status, 'withheld')
    assert.equal(result.attemptedWrites, 0)
    assert.equal(f.requests.some(item => item.method !== 'GET'), false)
  }
})

test('stable contact identity and clean delivery fields are required before list or field reads', async () => {
  for (const contact of [
    { id: '99' },
    { email: 'different@example.com' },
    { bounced_soft: undefined },
  ]) {
    const f = fixture({ contact })
    const result = await f.run()
    assert.equal(result.status, 'failed')
    assert.equal(f.requests.length, 1)
    assert.equal(result.attemptedWrites, 0)
  }
})

test('ambiguous list or field relationships fail closed without mutation', async () => {
  const duplicateLists = fixture({ contactLists: [
    { contact: '41', list: '44', form: '77', status: '1' },
    { contact: '41', list: '44', form: '77', status: '1' },
  ] })
  assert.equal((await duplicateLists.run()).status, 'withheld')
  assert.equal(duplicateLists.requests.some(item => item.method !== 'GET'), false)

  const duplicateFields = fixture({ fieldValues: [
    { id: '1', contact: '41', field: '193', value: 'profile_needed' },
    { id: '2', contact: '41', field: '193', value: 'profile_needed' },
  ] })
  assert.equal((await duplicateFields.run()).status, 'failed')
  assert.equal(duplicateFields.requests.some(item => item.method !== 'GET'), false)
})

test('current values produce an idempotent no-op', async () => {
  const f = fixture({ fieldValues: [
    { id: '1', contact: '41', field: '193', value: 'conversion_eligible' },
    { id: '2', contact: '41', field: '194', value: '2026-09-23' },
  ] })
  const result = await f.run()
  assert.equal(result.status, 'unchanged')
  assert.equal(result.attemptedWrites, 0)
  assert.equal(f.requests.some(item => item.method !== 'GET'), false)
})

test('partial stage failure is explicit, is not retried, and leaves automation/list endpoints untouched', async () => {
  let stageAttempts = 0
  const f = fixture({ intercept: request => {
    if (request.path === 'fieldValues' && request.method === 'POST' && request.body.fieldValue.field === '193') {
      stageAttempts += 1
      return response({}, 503)
    }
  } })
  const result = await f.run()
  assert.equal(result.status, 'partial')
  assert.equal(result.recoveryRequired, true)
  assert.equal(result.automaticRetry, false)
  assert.equal(result.attemptedWrites, 2)
  assert.equal(result.confirmedWrites, 1)
  assert.equal(stageAttempts, 1)
  assert.equal(f.requests.some(item => item.path === 'contactLists' || item.path.includes('contactAutomations')), false)
})

test('stale snapshots and unsupported expiry never reach ActiveCampaign', async () => {
  for (const mutate of [
    value => { value.evidenceObservedAt = '2026-09-17T12:00:00.000Z' },
    value => { value.evidenceExpiresAt = '2026-09-21' },
    value => { value.membership.identityState = 'unknown' },
    value => { value.membership.activeCampaignContactId = 'email@example.com' },
  ]) {
    const value = input(); mutate(value)
    const f = fixture()
    const result = await f.run(value)
    assert.equal(result.status, 'withheld')
    assert.equal(f.requests.length, 0)
  }
})
test('canonical profile-version plus receipt references are accepted without broadening identity IDs', async () => {
  const value = input();
  const ref = `derived:onboarding:profiles:${member}@2026-09-20T11:00:00.000Z+conversion_events:31800000-0000-4000-8000-000000000922`;
  value.onboardingCompletion.sourceRecordId = ref;
  assert.equal(deriveFreeJourneyStage(value), 'conversion_eligible');
  const f = fixture();
  const written = await f.run(value);
  assert.equal(written.status, 'updated');
  assert.equal(written.desiredStage, 'conversion_eligible');
  assert.equal(written.confirmedWrites, 2);
  value.membership.lifecycle = 'trialing';
  assert.equal(deriveFreeJourneyStage(value), 'onboarding_complete');
  for (const key of ['outsetaPersonUid', 'outsetaAccountUid', 'subscriptionUid']) {
    const invalid = input(); invalid.membership[key] = 'member@example.com';
    const f = fixture();
    assert.equal((await f.run(invalid)).status, 'withheld');
    assert.equal(f.requests.length, 0);
  }
});

test('derived references reject wrong members, dates, arbitrary at-signs and injected content', () => {
  const ref = `derived:onboarding:profiles:${member}@2026-09-20T11:00:00.000Z+conversion_events:31800000-0000-4000-8000-000000000922`;
  for (const sourceRecordId of [
    ref.replace(member, '31800000-0000-4000-8000-000000000999'),
    ref.replace('2026-09-20T11:00:00.000Z', '2026-09-22T11:00:00.000Z'),
    ref.replace('2026-09-20T11:00:00.000Z', 'not-a-date'),
    ref.replace('conversion_events:', 'untrusted_events:'),
    ref + '\n', ref + '?email=member@example.com', 'member@example.com',
  ]) {
    const value = input(); value.onboardingCompletion.sourceRecordId = sourceRecordId;
    assert.equal(deriveFreeJourneyStage(value), 'withheld', sourceRecordId);
  }
});
