import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { runFreeJourneyOperation } from '../dist/operations/free-journey-operation.js'

const now = '2026-10-07T12:00:00.000Z'
const member = '31800000-0000-4000-8000-000000001007'
const receiptId = '31800000-0000-4000-8000-000000001008'
const consentId = '31800000-0000-4000-8000-000000001009'
const person = 'SyntheticPerson'
const account = 'SyntheticAccount'
const cycle = 'SyntheticCycle'
const purpose = 'free_onboarding_and_conversion_email'
const hash = parts => createHash('sha256').update(JSON.stringify(parts)).digest('hex')
const snapshot = rows => ({ coverage: 'complete', observedAt: now, rows })

function operation(mode = 'preview') {
  return {
    mode,
    now,
    maxEvidenceAgeMs: 2 * 86_400_000,
    evidenceExpiresAt: '2026-10-08',
    outsetaPersonUid: person,
    subscriptionUid: cycle,
    storedSources: {
      profiles: snapshot([{
        id: member, outseta_person_uid: person, headline: 'Inspection services', bio: 'Synthetic profile',
        city: 'Atlanta', state: 'GA', experience_level: 'new', primary_services: 'Property Inspections',
        service_areas: ['Property Inspections'], updated_at: '2026-10-07T10:00:00.000Z',
      }]),
      completionEvents: snapshot([{
        id: receiptId,
        client_event_id: `income_scenario_completed:v1:${hash(['income_scenario_completed', 'v1', person, cycle])}`,
        event_name: 'income_scenario_completed', member_uid: person,
        source_page: '/tools/income-calculator', source: 'income_scenarios', occurred_at: '2026-10-07T10:30:00.000Z',
        event_data: { sourcePage: '/tools/income-calculator', source: 'income_scenarios', completionContract: 'v1', lifecycleCycleId: cycle },
      }]),
      consentRequests: snapshot([{
        id: consentId,
        client_event_id: `lifecycle_email_consent_requested:v1:${hash(['lifecycle_email_consent_requested', 'v1', person, cycle, purpose])}`,
        event_name: 'lifecycle_email_consent_requested', member_uid: person,
        source_page: '/welcome', source: 'member_consent', occurred_at: '2026-10-07T09:30:00.000Z',
        event_data: { sourcePage: '/welcome', source: 'member_consent', consentContract: 'v1', purpose, lifecycleCycleId: cycle },
      }]),
      reads: [
        { resource: 'profile', reason: 'exact_filtered_lookup' },
        { resource: 'income', reason: 'exact_filtered_lookup' },
        { resource: 'consent_request', reason: 'exact_filtered_lookup' },
      ],
      reviewRef: 'issue318-one-member-preview', mode: 'approved_live', mutationAllowed: false, attemptedWrites: 0,
    },
    external: {
      identities: snapshot([{
        canonicalMemberId: member, outsetaPersonUid: person, outsetaAccountUid: account,
        subscriptionUid: cycle, activeCampaignContactId: '41', identityState: 'verified',
      }]),
      memberships: snapshot([{
        sourceSystem: 'outseta', authoritative: true, isCurrent: true, identityState: 'verified',
        sourceRecordId: cycle, outsetaPersonUid: person, outsetaAccountUid: account, subscriptionUid: cycle,
        tier: 'free', lifecycle: 'active', memberSince: '2026-08-01T12:00:00.000Z', cycleStartedAt: '2026-08-01T12:00:00.000Z',
      }]),
      audience: snapshot([{ activeCampaignContactId: '41', internal: false, coworker: false, test: false, demo: false, hiringFirm: false }]),
      contacts: snapshot([{ id: '41', email: 'synthetic@example.com', bounced_hard: '0', bounced_soft: '0', deleted: '0' }]),
      contactLists: snapshot([{ contact: '41', list: '34', form: '90', status: '1' }]),
      consentAsset: { purpose, listId: '34', formId: '90', doubleOptInVerified: true, observedAt: now },
    },
    activeCampaign: {
      apiUrl: 'https://synthetic.api-us1.com', apiKey: 'synthetic-key', consentListId: '34', consentFormId: '90',
      stageFieldId: '193', expiryFieldId: '194', automationId: '527', accountTimeZone: 'America/New_York', timeoutMs: 5000,
    },
  }
}

function sourceEvent(kind = 'profile_saved', occurredAt = now) {
  return {
    contractVersion: 'free_journey_event_v1',
    kind,
    occurredAt,
    outsetaPersonUid: person,
    subscriptionUid: cycle,
    idempotencyKey: `free-journey:${kind}:${hash([
      'free_journey_event_v1', kind, person, cycle, occurredAt,
    ])}`,
  }
}

function operationalOperation(mode = 'preview', kind = 'profile_saved') {
  const value = operation(mode)
  value.executionPhase = 'operational'
  value.sourceEvent = sourceEvent(kind)
  value.activeCampaign.expectedAutomationStatus = 'active'
  return value
}

function provider(options = {}) {
  const requests = []
  const fields = []
  let next = 900
  const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body })
  const fetch = async (url, init = {}) => {
    const path = url.split('/api/3/')[1]
    const method = init.method ?? 'GET'
    const body = init.body ? JSON.parse(init.body) : undefined
    requests.push({ path, method, body })
    if (path === 'contacts/41') return response({ contact: {
      id: '41', email: 'synthetic@example.com', bounced_hard: '0', bounced_soft: '0', deleted: '0',
    } })
    if (path === 'contacts/41/contactLists') return response({ contactLists: [{ contact: '41', list: '34', form: '90', status: '1' }] })
    if (path === 'automations/527') return response({ automation: { id: '527', status: options.automationStatus ?? '2' } })
    if (path === 'contacts/41/fieldValues') return response({ fieldValues: fields })
    if (path === 'fieldValues' && method === 'POST') {
      const created = { id: String(++next), ...body.fieldValue }
      fields.push(created)
      return response({ fieldValue: created }, 201)
    }
    if (path.startsWith('fieldValues/') && method === 'GET') {
      return response({ fieldValue: fields.find(value => value.id === path.split('/')[1]) })
    }
    throw new Error(`Unexpected ${method} ${path}`)
  }
  return { requests, fields, fetch }
}

test('single-subject preview performs exact provider GETs and returns a sanitized zero-write plan', async () => {
  const p = provider()
  const result = await runFreeJourneyOperation(operation(), p.fetch)
  assert.equal(result.status, 'ready')
  assert.equal(result.sourceStatus, 'ready_for_writer_review')
  assert.equal(result.desiredStage, 'conversion_eligible')
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.confirmedWrites, 0)
  assert.deepEqual(p.requests.map(value => value.method), ['GET', 'GET', 'GET', 'GET'])
  assert.deepEqual(result.steps.slice(-2).map(value => value.code), ['would_create', 'would_create'])
  assert(!/Synthetic|synthetic@example|31800000/.test(JSON.stringify(result)))
})

test('write mode requires an exact unexpired approval before any provider request', async () => {
  const p = provider()
  const result = await runFreeJourneyOperation(operation('write'), p.fetch)
  assert.equal(result.status, 'withheld')
  assert.deepEqual(result.reasons, ['write_approval_missing_or_invalid'])
  assert.equal(result.attemptedWrites, 0)
  assert.equal(p.requests.length, 0)
})

test('exact write approval preserves expiry-before-stage ordering and confirmed readback', async () => {
  const value = operation('write')
  value.writeApproval = {
    approvalRef: 'autumn-approved-one-member-cycle',
    approvedAt: '2026-10-07T11:59:00.000Z',
    expiresAt: '2026-10-07T12:30:00.000Z',
    sourceReviewRef: value.storedSources.reviewRef,
    outsetaPersonUid: person,
    subscriptionUid: cycle,
    activeCampaignContactId: '41',
    allowedFieldIdsInOrder: ['194', '193'],
    automationMustRemainInactive: true,
  }
  const p = provider()
  const result = await runFreeJourneyOperation(value, p.fetch)
  assert.equal(result.status, 'updated')
  assert.equal(result.attemptedWrites, 2)
  assert.equal(result.confirmedWrites, 2)
  assert.deepEqual(p.requests.filter(value => value.method === 'POST').map(value => value.body.fieldValue.field), ['194', '193'])
  assert.equal(p.requests.some(value => value.path.includes('contactAutomations')), false)
})

test('operational events preserve signup, profile, calculation and day-30 stage semantics while 527 is active', async () => {
  const cases = [
    ['signup', 'profile_needed', value => {
      value.storedSources.profiles.rows[0].city = null
      value.storedSources.completionEvents.rows = []
    }],
    ['profile_saved', 'calculation_needed', value => { value.storedSources.completionEvents.rows = [] }],
    ['income_scenario_completed', 'onboarding_complete', value => {
      value.external.memberships.rows[0].memberSince = '2026-10-01T12:00:00.000Z'
      value.external.memberships.rows[0].cycleStartedAt = '2026-10-01T12:00:00.000Z'
    }],
    ['day_30', 'conversion_eligible', () => {}],
  ]
  for (const [kind, expectedStage, mutate] of cases) {
    const value = operationalOperation('preview', kind)
    mutate(value)
    const p = provider({ automationStatus: '1' })
    const result = await runFreeJourneyOperation(value, p.fetch)
    assert.equal(result.status, 'ready', kind)
    assert.equal(result.desiredStage, expectedStage, kind)
    assert.equal(result.steps.find(step => step.step === 'automation_state')?.code, 'active_confirmed')
    assert.equal(p.requests.some(request => request.method !== 'GET'), false)
  }
})

test('operational write requires exact event-bound authorization and active automation readback', async () => {
  const value = operationalOperation('write', 'income_scenario_completed')
  value.writeApproval = {
    approvalRef: 'autumn-approved-operational-contract',
    approvedAt: '2026-10-07T11:59:00.000Z',
    expiresAt: '2026-10-07T12:30:00.000Z',
    sourceReviewRef: value.storedSources.reviewRef,
    outsetaPersonUid: person,
    subscriptionUid: cycle,
    activeCampaignContactId: '41',
    allowedFieldIdsInOrder: ['194', '193'],
    executionPhase: 'operational',
    automationMustBeActive: true,
    sourceEventIdempotencyKey: value.sourceEvent.idempotencyKey,
  }
  const p = provider({ automationStatus: '1' })
  const result = await runFreeJourneyOperation(value, p.fetch)
  assert.equal(result.status, 'updated')
  assert.deepEqual(p.requests.filter(request => request.method === 'POST')
    .map(request => request.body.fieldValue.field), ['194', '193'])
  assert.equal(p.requests.some(request => request.path.includes('contactAutomations')), false)
})

test('operational events fail closed on inactive 527, event tampering and approval mismatch', async () => {
  const inactive = operationalOperation()
  const inactiveProvider = provider({ automationStatus: '2' })
  const inactiveResult = await runFreeJourneyOperation(inactive, inactiveProvider.fetch)
  assert.equal(inactiveResult.status, 'withheld')
  assert.equal(inactiveResult.steps.at(-1).code, 'automation_not_active')
  assert.equal(inactiveProvider.requests.some(request => request.path.includes('fieldValues')), false)

  for (const mutate of [
    value => { value.sourceEvent.idempotencyKey = 'free-journey:profile_saved:tampered' },
    value => { value.sourceEvent.subscriptionUid = 'OtherCycle' },
    value => { value.sourceEvent.occurredAt = '2026-10-07T12:01:00.000Z' },
  ]) {
    const value = operationalOperation(); mutate(value)
    const p = provider({ automationStatus: '1' })
    const result = await runFreeJourneyOperation(value, p.fetch)
    assert.equal(result.status, 'withheld')
    assert.equal(result.attemptedWrites, 0)
    assert.equal(p.requests.length, 0)
  }

  const unapproved = operationalOperation('write')
  unapproved.writeApproval = {
    approvalRef: 'wrong-phase', approvedAt: '2026-10-07T11:59:00.000Z', expiresAt: '2026-10-07T12:30:00.000Z',
    sourceReviewRef: unapproved.storedSources.reviewRef, outsetaPersonUid: person, subscriptionUid: cycle,
    activeCampaignContactId: '41', allowedFieldIdsInOrder: ['194', '193'], automationMustRemainInactive: true,
  }
  const p = provider({ automationStatus: '1' })
  const result = await runFreeJourneyOperation(unapproved, p.fetch)
  assert.equal(result.status, 'withheld')
  assert.deepEqual(result.reasons, ['write_approval_missing_or_invalid'])
  assert.equal(p.requests.length, 0)
})

test('excluded test audience is withheld before provider access', async () => {
  const value = operation()
  value.external.audience.rows[0].test = true
  const p = provider()
  const result = await runFreeJourneyOperation(value, p.fetch)
  assert.equal(result.status, 'withheld')
  assert.deepEqual(result.reasons, ['excluded_audience'])
  assert.equal(p.requests.length, 0)
})

test('CLI defaults to preview and requires two independent write-mode gates', () => {
  const source = readFileSync(new URL('../scripts/run-free-journey-preactivation.mjs', import.meta.url), 'utf8')
  assert.match(source, /argument\('mode'\) \|\| 'preview'/)
  assert.match(source, /FREE_JOURNEY_OPERATION_MODE !== 'write'/)
  assert.match(source, /FREE_JOURNEY_WRITE_ENABLED !== 'true'/)
  assert.doesNotMatch(source, /console\.log\([^\n]*(payload|policy|external|writeApproval)/)
})

test('operational CLI stays event-bound, active-527-only and disabled behind three write gates', () => {
  const source = readFileSync(new URL('../scripts/run-free-journey-operational.mjs', import.meta.url), 'utf8')
  assert.match(source, /executionPhase: 'operational'/)
  assert.match(source, /expectedAutomationStatus: 'active'/)
  assert.match(source, /FREE_JOURNEY_OPERATIONAL_MODE !== 'write'/)
  assert.match(source, /FREE_JOURNEY_WRITE_ENABLED !== 'true'/)
  assert.match(source, /FREE_JOURNEY_ACTIVE_527_ENABLED !== 'true'/)
  assert.doesNotMatch(source, /setInterval|setTimeout|contactAutomations|console\.log\([^\n]*(payload|policy|external|writeApproval)/)
})
