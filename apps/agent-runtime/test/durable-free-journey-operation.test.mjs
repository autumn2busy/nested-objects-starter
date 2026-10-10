import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'

import {
  FREE_JOURNEY_PRODUCTION_DESTINATION,
  FreeJourneyProductionDestinationError,
  InMemoryDurableWorkflowStore,
  assertFreeJourneyProductionDestination,
  loadFreeJourneyProductionDestination,
  runDurableFreeJourneyOperation,
  runFreeJourneyOperation,
} from '../dist/index.js'

const now = '2026-10-10T12:00:00.000Z'
const member = '31800000-0000-4000-8000-000000001010'
const person = 'SyntheticPerson'
const account = 'SyntheticAccount'
const cycle = 'SyntheticCycle'
const purpose = 'free_onboarding_and_conversion_email'
const hash = parts => createHash('sha256').update(JSON.stringify(parts)).digest('hex')
const snapshot = rows => ({ coverage: 'complete', observedAt: now, rows })

function sourceEvent() {
  const kind = 'day_30'
  return {
    contractVersion: 'free_journey_event_v1', kind, occurredAt: now,
    outsetaPersonUid: person, subscriptionUid: cycle,
    idempotencyKey: `free-journey:${kind}:${hash(['free_journey_event_v1', kind, person, cycle, now])}`,
  }
}

function operation() {
  const event = sourceEvent()
  return {
    mode: 'write', executionPhase: 'operational', sourceEvent: event,
    now, maxEvidenceAgeMs: 2 * 86_400_000, evidenceExpiresAt: '2026-10-12',
    outsetaPersonUid: person, subscriptionUid: cycle,
    storedSources: {
      profiles: snapshot([{
        id: member, outseta_person_uid: person, outseta_account_id: account, ac_contact_id: '41',
        user_email: 'synthetic@example.com', email: 'synthetic@example.com',
        headline: 'Inspection services', bio: 'Synthetic profile', city: 'Atlanta', state: 'GA',
        experience_level: 'new', primary_services: 'Property Inspections',
        service_areas: ['Property Inspections'], updated_at: '2026-10-10T10:00:00.000Z',
      }]),
      completionEvents: snapshot([{
        id: '31800000-0000-4000-8000-000000001011',
        client_event_id: `income_scenario_completed:v1:${hash(['income_scenario_completed', 'v1', person, cycle])}`,
        event_name: 'income_scenario_completed', member_uid: person,
        source_page: '/tools/income-calculator', source: 'income_scenarios', occurred_at: '2026-10-10T10:30:00.000Z',
        event_data: { sourcePage: '/tools/income-calculator', source: 'income_scenarios', completionContract: 'v1', lifecycleCycleId: cycle },
      }]),
      consentRequests: snapshot([{
        id: '31800000-0000-4000-8000-000000001012',
        client_event_id: `lifecycle_email_consent_requested:v1:${hash(['lifecycle_email_consent_requested', 'v1', person, cycle, purpose])}`,
        event_name: 'lifecycle_email_consent_requested', member_uid: person,
        source_page: '/welcome', source: 'member_consent', occurred_at: '2026-10-10T09:30:00.000Z',
        event_data: { sourcePage: '/welcome', source: 'member_consent', consentContract: 'v1', purpose, lifecycleCycleId: cycle },
      }]),
      reads: [], reviewRef: 'issue318-durable-free-journey', mode: 'approved_live',
      mutationAllowed: false, attemptedWrites: 0,
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
      stageFieldId: '193', expiryFieldId: '194', automationId: '527', expectedAutomationStatus: 'active',
      accountTimeZone: 'America/New_York', timeoutMs: 5000,
    },
    writeApproval: {
      approvalRef: 'approved-durable-free-journey', approvedAt: '2026-10-10T11:59:00.000Z',
      expiresAt: '2026-10-10T12:30:00.000Z', sourceReviewRef: 'issue318-durable-free-journey',
      outsetaPersonUid: person, subscriptionUid: cycle, activeCampaignContactId: '41',
      allowedFieldIdsInOrder: ['194', '193'], executionPhase: 'operational', automationMustBeActive: true,
      sourceEventIdempotencyKey: event.idempotencyKey,
    },
  }
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
    if (path === 'automations/527') return response({ automation: { id: '527', status: '1' } })
    if (path === 'contacts/41/fieldValues') return response({ fieldValues: fields })
    if (path === 'fieldValues' && method === 'POST') {
      if (options.failField === body.fieldValue.field) return response({ message: 'synthetic failure' }, 503)
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

function context(store, fetch) {
  return {
    store, fetch, binding: FREE_JOURNEY_PRODUCTION_DESTINATION,
    runtimeVersion: 'test-runtime-v1', workflowRunId: 'synthetic-free-journey-workflow-run',
  }
}

test('Production destination requires the exact project, runtime and disabled-by-default executor gate', () => {
  const valid = {
    supabaseUrl: 'https://lzzghrjjsyzlvofpidis.supabase.co',
    configuredProjectRef: 'lzzghrjjsyzlvofpidis', runtimeEnvironment: 'production',
    vercelEnvironment: 'production', durableExecutorEnabled: 'true',
  }
  assert.deepEqual(assertFreeJourneyProductionDestination(valid), FREE_JOURNEY_PRODUCTION_DESTINATION)
  for (const changed of [
    { runtimeEnvironment: 'preview' }, { vercelEnvironment: 'preview' },
    { durableExecutorEnabled: 'false' }, { configuredProjectRef: 'wqstirwszdbsygstnvbn' },
  ]) assert.throws(() => assertFreeJourneyProductionDestination({ ...valid, ...changed }), FreeJourneyProductionDestinationError)

  const environment = {
    AGENT_RUNTIME_ENV: 'production', VERCEL_ENV: 'production',
    SUPABASE_URL: valid.supabaseUrl, FREE_JOURNEY_PRODUCTION_PROJECT_REF: valid.configuredProjectRef,
    FREE_JOURNEY_OPERATIONAL_MODE: 'write', FREE_JOURNEY_WRITE_ENABLED: 'true',
    FREE_JOURNEY_ACTIVE_527_ENABLED: 'true', FREE_JOURNEY_DURABLE_EXECUTOR_ENABLED: 'true',
  }
  assert.deepEqual(loadFreeJourneyProductionDestination(environment), FREE_JOURNEY_PRODUCTION_DESTINATION)
  for (const gate of [
    'FREE_JOURNEY_OPERATIONAL_MODE', 'FREE_JOURNEY_WRITE_ENABLED',
    'FREE_JOURNEY_ACTIVE_527_ENABLED', 'FREE_JOURNEY_DURABLE_EXECUTOR_ENABLED',
  ]) assert.throws(() => loadFreeJourneyProductionDestination({ ...environment, [gate]: 'false' }),
    FreeJourneyProductionDestinationError)
})

test('durable execution claims 194 then 193 and reuses a completed result without duplicate writes', async () => {
  const store = new InMemoryDurableWorkflowStore(FREE_JOURNEY_PRODUCTION_DESTINATION, () => new Date(now))
  const p = provider()
  const first = await runDurableFreeJourneyOperation(operation(), context(store, p.fetch))
  assert.equal(first.state, 'completed')
  assert.equal(first.recoveryRequired, false)
  assert.equal(first.attemptedWrites, 2)
  assert.equal(first.confirmedWrites, 2)
  assert.deepEqual(p.requests.filter(request => request.method === 'POST')
    .map(request => request.body.fieldValue.field), ['194', '193'])

  const repeated = await runDurableFreeJourneyOperation(operation(), context(store, p.fetch))
  assert.equal(repeated.state, 'reused')
  assert.equal(repeated.confirmedWrites, 2)
  assert.deepEqual(p.requests.filter(request => request.method === 'POST')
    .map(request => request.body.fieldValue.field), ['194', '193'])
})

test('an unapproved durable destination blocks provider reads and writes', async () => {
  const different = { ...FREE_JOURNEY_PRODUCTION_DESTINATION, destinationFingerprint: '0'.repeat(64) }
  const store = new InMemoryDurableWorkflowStore(different, () => new Date(now))
  const p = provider()
  const result = await runDurableFreeJourneyOperation(operation(), context(store, p.fetch))
  assert.equal(result.state, 'held')
  assert.deepEqual(result.reasons, ['durable_destination_not_approved'])
  assert.equal(p.requests.length, 0)
})

test('an unconfirmed 194 response blocks 193 and cannot be automatically retried', async () => {
  let clock = Date.parse(now)
  const store = new InMemoryDurableWorkflowStore(FREE_JOURNEY_PRODUCTION_DESTINATION, () => new Date(clock))
  const p = provider({ failField: '194' })
  const first = await runDurableFreeJourneyOperation(operation(), context(store, p.fetch))
  assert.equal(first.state, 'recovery_required')
  assert.equal(first.automaticRetry, false)
  assert.equal(first.confirmedWrites, 0)
  assert.deepEqual(p.requests.filter(request => request.method === 'POST')
    .map(request => request.body.fieldValue.field), ['194'])

  clock += 301_000
  const afterLease = await runDurableFreeJourneyOperation(operation(), context(store, p.fetch))
  assert.equal(afterLease.state, 'exhausted')
  assert.equal(afterLease.automaticRetry, false)
  assert.deepEqual(p.requests.filter(request => request.method === 'POST')
    .map(request => request.body.fieldValue.field), ['194'])
})

test('lost durable completion response reuses confirmed 194 before writing 193', async () => {
  let clock = Date.parse(now)
  class LostCompletionStore extends InMemoryDurableWorkflowStore {
    lost = true
    async completeStep(input) {
      const saved = await super.completeStep(input)
      if (this.lost && input.stepKey === 'activecampaign-field-194') {
        this.lost = false
        throw new Error('synthetic response loss after commit')
      }
      return saved
    }
  }
  const store = new LostCompletionStore(FREE_JOURNEY_PRODUCTION_DESTINATION, () => new Date(clock))
  const p = provider()
  const first = await runDurableFreeJourneyOperation(operation(), context(store, p.fetch))
  assert.equal(first.state, 'recovery_required')
  assert.deepEqual(p.requests.filter(request => request.method === 'POST')
    .map(request => request.body.fieldValue.field), ['194'])

  clock += 301_000
  const reconciled = await runDurableFreeJourneyOperation(operation(), context(store, p.fetch))
  assert.equal(reconciled.state, 'completed')
  assert.equal(reconciled.recoveryRequired, false)
  assert.deepEqual(p.requests.filter(request => request.method === 'POST')
    .map(request => request.body.fieldValue.field), ['194', '193'])
})

test('unexpected stored output fields are withheld from durable result reuse', async () => {
  class UnexpectedOutputStore extends InMemoryDurableWorkflowStore {
    async completeRun(input) {
      return super.completeRun({ ...input, output: { ...input.output, rawEmail: 'do-not-return@example.com' } })
    }
  }
  const store = new UnexpectedOutputStore(FREE_JOURNEY_PRODUCTION_DESTINATION, () => new Date(now))
  const p = provider()
  const result = await runDurableFreeJourneyOperation(operation(), context(store, p.fetch))
  assert.equal(result.state, 'recovery_required')
  assert.equal(result.recoveryRequired, true)
  assert.equal('rawEmail' in result, false)
})

test('a stage-only write is blocked unless a fresh read confirms field 194', async () => {
  const p = provider()
  const result = await runFreeJourneyOperation({ ...operation(), writeStep: 'stage' }, p.fetch)
  assert.equal(result.status, 'withheld')
  assert.equal(result.steps.at(-1).code, 'expiry_not_confirmed')
  assert.equal(p.requests.some(request => request.method !== 'GET'), false)
})
