import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PreviewAuthenticationError,
  PreviewPersistenceDisabledError,
  PreviewRequestValidationError,
  PreviewRuntimeConfigurationError,
  authenticatePreviewRequest,
  evaluatePreviewRequest,
  loadPreviewRuntimeConfiguration,
  parsePreviewEvaluationRequest,
  previewHealthSnapshot,
} from '../dist/index.js'

const token = 'phase-c2-preview-token-with-more-than-32-characters'
const fixedNow = '2026-08-26T12:00:00.000Z'
const memberId = '31800000-0001-5000-8000-000000000001'
const eventId = '31800000-0002-5000-8000-000000000002'
const correlationId = '31800000-0003-5000-8000-000000000003'

function previewEnvironment(overrides = {}) {
  return {
    AGENT_RUNTIME_ENV: 'preview',
    AGENT_RUNTIME_MODE: 'dry_run',
    AGENT_MUTATIONS_ENABLED: 'false',
    AGENT_MODEL_EXECUTION_ENABLED: 'false',
    AGENT_WORKFLOW_PROVIDER: 'in_memory',
    AGENT_PREVIEW_API_TOKEN: token,
    AGENT_PREVIEW_SYNTHETIC_ONLY: 'true',
    AGENT_PREVIEW_PERSISTENCE_ENABLED: 'false',
    AGENT_RUNTIME_VERSION: 'phase-c2-v1',
    ...overrides,
  }
}

function validPayload(overrides = {}) {
  return {
    idempotencyKey: 'phase-c2:synthetic-evaluation:2026-08-26',
    correlationId,
    metricDate: '2026-08-26',
    persist: false,
    profiles: [{
      id: memberId,
      outseta_person_uid: 'synthetic-outseta-person',
      outseta_account_id: 'synthetic-outseta-account',
      user_email: 'member@example.invalid',
      subscription_tier: 'pro',
      subscription_status: 'active',
      plan_uid: 'synthetic-pro-plan',
      plan_name: 'Pro',
      created_at: '2026-08-20T12:00:00.000Z',
      updated_at: fixedNow,
      state: 'ZZ',
      service_areas: ['Synthetic service area'],
      primary_services: ['Synthetic mortgage field inspections'],
      training_modules_completed: 2,
      training_modules_total: 8,
      is_published: true,
      phone: null,
    }],
    conversionEvents: [{
      id: eventId,
      client_event_id: 'synthetic-event-delivery-1',
      event_name: 'signup_completed',
      anonymous_id: 'synthetic-anonymous-1',
      session_id: 'synthetic-session-1',
      member_uid: 'synthetic-outseta-person',
      member_email: 'member@example.invalid',
      plan_uid: 'synthetic-pro-plan',
      plan_name: 'Pro',
      source: 'synthetic-preview',
      occurred_at: '2026-08-20T12:00:00.000Z',
    }],
    activeCampaignContacts: [{
      contactId: 'synthetic-contact-1',
      email: 'member@example.invalid',
      tagNames: ['Synthetic Plan: Pro'],
      listNames: ['Synthetic Nested Objects Members'],
      customFields: {},
      createdAt: '2026-08-20T12:00:00.000Z',
      updatedAt: fixedNow,
      lastOpenAt: fixedNow,
      lastClickAt: null,
      lastSiteVisitAt: null,
      bounced: false,
      unsubscribed: false,
    }],
    activeCampaignAssets: [{
      assetType: 'automation',
      externalId: 'synthetic-automation-1',
      name: 'Synthetic Nested Objects Member Welcome',
      active: true,
    }],
    marketingConfig: {
      internalDomains: ['internal.example.invalid'],
      approvedInternalMemberEmails: [],
      coldTagPatterns: ['cold'],
      wixTagPatterns: ['wix'],
      testPatterns: ['test'],
      staleAfterDays: 90,
      now: fixedNow,
    },
    productAccessByMemberId: {
      [memberId]: {
        memberId,
        accessTier: 'pro',
        accessStatus: 'active',
        directoryAccess: true,
        observedAt: fixedNow,
      },
    },
    activeCampaignMirrorByMemberId: {
      [memberId]: {
        contactId: 'synthetic-contact-1',
        planName: 'Pro',
        lifecycleStatus: 'active',
        onboardingEnteredAt: fixedNow,
        observedAt: fixedNow,
      },
    },
    ...overrides,
  }
}

test('preview runtime is fail-closed and rejects production or non-dry-run execution', () => {
  const configuration = loadPreviewRuntimeConfiguration(previewEnvironment())
  assert.equal(configuration.runtime.environment, 'preview')
  assert.equal(configuration.persistenceEnabled, false)
  assert.equal(configuration.runtime.model, null)

  assert.throws(
    () => loadPreviewRuntimeConfiguration(previewEnvironment({ VERCEL_ENV: 'production' })),
    PreviewRuntimeConfigurationError,
  )
  assert.throws(
    () => loadPreviewRuntimeConfiguration(previewEnvironment({ AGENT_RUNTIME_MODE: 'observe_only' })),
    PreviewRuntimeConfigurationError,
  )
  assert.throws(
    () => loadPreviewRuntimeConfiguration(previewEnvironment({ AGENT_MODEL_EXECUTION_ENABLED: 'true', OPENAI_API_KEY: 'test-key', OPENAI_AGENT_MODEL: 'test-model' })),
    PreviewRuntimeConfigurationError,
  )
})

test('preview authentication requires the configured bearer secret', () => {
  const request = new Request('https://runtime.example.invalid/api/preview/evaluate', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
  authenticatePreviewRequest(request, token)

  assert.throws(
    () => authenticatePreviewRequest(new Request('https://runtime.example.invalid'), token),
    PreviewAuthenticationError,
  )
  assert.throws(
    () => authenticatePreviewRequest(new Request('https://runtime.example.invalid', {
      headers: { authorization: 'Bearer wrong-token' },
    }), token),
    PreviewAuthenticationError,
  )
})

test('preview contract rejects real contact data and non-synthetic external identifiers', () => {
  assert.throws(
    () => parsePreviewEvaluationRequest(validPayload({
      profiles: [{ ...validPayload().profiles[0], user_email: 'real@example.com' }],
    })),
    PreviewRequestValidationError,
  )
  assert.throws(
    () => parsePreviewEvaluationRequest(validPayload({
      profiles: [{ ...validPayload().profiles[0], phone: '555-0100' }],
    })),
    PreviewRequestValidationError,
  )
  assert.throws(
    () => parsePreviewEvaluationRequest(validPayload({
      activeCampaignContacts: [{ ...validPayload().activeCampaignContacts[0], contactId: '12345' }],
    })),
    PreviewRequestValidationError,
  )
  assert.throws(
    () => parsePreviewEvaluationRequest(validPayload({
      activeCampaignContacts: [{
        ...validPayload().activeCampaignContacts[0],
        customFields: { phone: '404-555-0100' },
      }],
    })),
    PreviewRequestValidationError,
  )
  assert.throws(
    () => parsePreviewEvaluationRequest(validPayload({
      activeCampaignMirrorByMemberId: {
        [memberId]: {
          ...validPayload().activeCampaignMirrorByMemberId[memberId],
          contactId: 'real-activecampaign-contact-id',
        },
      },
    })),
    PreviewRequestValidationError,
  )
})

test('preview contract rejects production member and Outseta identifiers', () => {
  const realLookingMemberId = '8e0f0af1-3b42-4abc-9af7-5c379b920e01'

  assert.throws(
    () => parsePreviewEvaluationRequest(validPayload({
      profiles: [{ ...validPayload().profiles[0], id: realLookingMemberId }],
      productAccessByMemberId: {},
      activeCampaignMirrorByMemberId: {},
    })),
    PreviewRequestValidationError,
  )
  assert.throws(
    () => parsePreviewEvaluationRequest(validPayload({
      profiles: [{ ...validPayload().profiles[0], outseta_person_uid: 'real-outseta-person-uid' }],
    })),
    PreviewRequestValidationError,
  )
  assert.throws(
    () => parsePreviewEvaluationRequest(validPayload({
      conversionEvents: [{ ...validPayload().conversionEvents[0], member_uid: 'real-outseta-person-uid' }],
    })),
    PreviewRequestValidationError,
  )
  assert.throws(
    () => parsePreviewEvaluationRequest(validPayload({
      profiles: [{ ...validPayload().profiles[0], state: 'GA' }],
    })),
    PreviewRequestValidationError,
  )
})

test('dry-run preview returns aggregate intelligence without returning PII or external IDs', async () => {
  const configuration = loadPreviewRuntimeConfiguration(previewEnvironment())
  const first = await evaluatePreviewRequest(validPayload(), configuration, fixedNow)
  const second = await evaluatePreviewRequest(validPayload(), configuration, fixedNow)

  assert.equal(first.execution, 'dry_run')
  assert.equal(first.runId, second.runId)
  assert.equal(first.correlationId, correlationId)
  assert.equal(first.counts.projectedMembers, 1)
  assert.equal(first.counts.marketingClassifications, 1)
  assert.equal(first.contactClassifications.current_member, 1)
  assert.equal(first.assetCandidateScopes.nested_objects, 1)
  assert.equal(first.safety.activeCampaignMutations, false)
  assert.equal(first.safety.modelExecution, false)

  const serialized = JSON.stringify(first)
  assert.equal(serialized.includes('member@example.invalid'), false)
  assert.equal(serialized.includes('synthetic-contact-1'), false)
  assert.equal(serialized.includes(memberId), false)
})

test('Phase C2 rejects every database persistence path', async () => {
  const configuration = loadPreviewRuntimeConfiguration(previewEnvironment())
  await assert.rejects(
    () => evaluatePreviewRequest(validPayload({ persist: true }), configuration, fixedNow),
    PreviewPersistenceDisabledError,
  )

  assert.throws(
    () => loadPreviewRuntimeConfiguration(previewEnvironment({
      AGENT_PREVIEW_PERSISTENCE_ENABLED: 'true',
    })),
    PreviewRuntimeConfigurationError,
  )
  assert.throws(
    () => loadPreviewRuntimeConfiguration(previewEnvironment({
      SUPABASE_URL: 'https://synthetic-staging.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_synthetic',
    })),
    PreviewRuntimeConfigurationError,
  )
  assert.throws(
    () => loadPreviewRuntimeConfiguration(previewEnvironment({
      AGENT_STAGING_PROJECT_REF: 'synthetic-staging',
    })),
    PreviewRuntimeConfigurationError,
  )
})

test('health snapshot exposes safe state and fails closed on malformed configuration', () => {
  const health = previewHealthSnapshot(previewEnvironment({ VERCEL_ENV: 'preview' }))
  assert.equal(health.ok, true)
  assert.equal(health.configurationValid, true)
  assert.equal(health.tokenConfigured, true)
  assert.equal(health.mutationsEnabled, false)
  assert.equal(health.persistenceEnabled, false)
  assert.equal(health.supabaseConfigured, false)
  assert.equal(JSON.stringify(health).includes(token), false)

  const production = previewHealthSnapshot(previewEnvironment({ VERCEL_ENV: 'production' }))
  assert.equal(production.ok, false)
  assert.equal(production.configurationValid, false)

  const malformed = previewHealthSnapshot(previewEnvironment({ AGENT_MUTATIONS_ENABLED: 'definitely-not-a-boolean' }))
  assert.equal(malformed.ok, false)
  assert.equal(malformed.configurationValid, false)

  const wrongMode = previewHealthSnapshot(previewEnvironment({ AGENT_RUNTIME_MODE: 'observe_only' }))
  assert.equal(wrongMode.ok, false)
  assert.equal(wrongMode.configurationValid, false)

  const databaseConfigured = previewHealthSnapshot(previewEnvironment({
    SUPABASE_URL: 'https://synthetic-staging.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_synthetic',
  }))
  assert.equal(databaseConfigured.ok, false)
  assert.equal(databaseConfigured.configurationValid, false)
  assert.equal(databaseConfigured.supabaseConfigured, true)
})
