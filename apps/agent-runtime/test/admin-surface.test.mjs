import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AdminControlPlaneAuthorizationError,
  AdminControlPlaneConflictError,
  AdminControlPlaneReplayError,
  AdminRuntimeConfigurationError,
  AdminServiceAuthenticationError,
  AdminServiceAuthorizationError,
  EVENT_TRIGGER_TYPES,
  InMemoryAdminControlPlaneStore,
  createAdminServiceHeaders,
  loadAdminRuntimeConfiguration,
  parseAdminTriggerRequest,
  payloadDigest,
  stableJson,
  syntheticRequestedAtForKey,
  verifyAdminServiceRequest,
  workflowForTrigger,
} from '../dist/index.js'

const ownerSubject = 'outseta-subject-autumn-stable-001'
const sharedSecret = 'synthetic-admin-secret-32-characters-minimum'
const allowedOrigin = 'https://staging.example.test'
const fixedNow = new Date('2026-08-27T16:00:00.000Z')

function signedRequest(bodyText = '{"fixtureMode":"synthetic"}', overrides = {}) {
  const method = overrides.method ?? 'POST'
  const pathname = overrides.pathname ?? '/api/admin/triggers'
  const actorSubject = overrides.actorSubject ?? ownerSubject
  const origin = overrides.origin ?? allowedOrigin
  const timestamp = overrides.timestamp ?? fixedNow.toISOString()
  const nonce = overrides.nonce ?? '11111111-1111-4111-8111-111111111111'
  const headers = createAdminServiceHeaders({
    method,
    pathname,
    bodyText,
    actorSubject,
    origin,
    timestamp,
    nonce,
    sharedSecret,
  })
  return new Request(`${allowedOrigin}${pathname}`, { method, headers, body: method === 'GET' ? undefined : bodyText })
}

test('admin service signatures bind the stable subject, origin, body, timestamp, nonce, method, and path', () => {
  const bodyText = '{"fixtureMode":"synthetic"}'
  const request = signedRequest(bodyText)
  const verified = verifyAdminServiceRequest(request, bodyText, {
    sharedSecret,
    autumnSubjectId: ownerSubject,
    allowedOrigin,
  }, fixedNow)
  assert.equal(verified.actorSubject, ownerSubject)
  assert.match(verified.nonceDigest, /^[a-f0-9]{64}$/)

  assert.throws(
    () => verifyAdminServiceRequest(request, '{"fixtureMode":"tampered"}', {
      sharedSecret,
      autumnSubjectId: ownerSubject,
      allowedOrigin,
    }, fixedNow),
    AdminServiceAuthenticationError,
  )
  assert.throws(
    () => verifyAdminServiceRequest(signedRequest(bodyText, { actorSubject: 'email-only-owner@example.test' }), bodyText, {
      sharedSecret,
      autumnSubjectId: ownerSubject,
      allowedOrigin,
    }, fixedNow),
    AdminServiceAuthorizationError,
  )
  assert.throws(
    () => verifyAdminServiceRequest(signedRequest(bodyText, { origin: 'https://attacker.example.test' }), bodyText, {
      sharedSecret,
      autumnSubjectId: ownerSubject,
      allowedOrigin,
    }, fixedNow),
    AdminServiceAuthorizationError,
  )
  assert.throws(
    () => verifyAdminServiceRequest(signedRequest(bodyText, { timestamp: '2026-08-27T15:49:59.000Z' }), bodyText, {
      sharedSecret,
      autumnSubjectId: ownerSubject,
      allowedOrigin,
    }, fixedNow),
    AdminServiceAuthenticationError,
  )
})

test('protected trigger contracts cover every required event and only deterministic fixtures', () => {
  for (const eventType of EVENT_TRIGGER_TYPES) {
    const trigger = parseAdminTriggerRequest({
      triggerCategory: 'event',
      eventType,
      sourceEventId: `synthetic-event:${eventType}`,
      businessKey: `synthetic-business:${eventType}`,
      fixtureMode: 'synthetic',
    })
    assert.equal(workflowForTrigger(trigger), 'conversion_review')
  }
  assert.equal(workflowForTrigger(parseAdminTriggerRequest({
    triggerCategory: 'daily',
    workflowName: 'daily_business_health',
    businessKey: 'synthetic-daily:2026-08-27',
    fixtureMode: 'synthetic',
  })), 'daily_business_health')
  assert.equal(workflowForTrigger(parseAdminTriggerRequest({
    triggerCategory: 'weekly',
    workflowName: 'weekly_operating_review',
    businessKey: 'synthetic-weekly:2026-w35',
    fixtureMode: 'synthetic',
  })), 'weekly_operating_review')
  assert.equal(
    syntheticRequestedAtForKey('synthetic-weekly:2026-08-27'),
    '2026-08-27T12:00:00.000Z',
  )
  assert.equal(
    syntheticRequestedAtForKey('synthetic-weekly:2026-w35'),
    '2026-01-01T12:00:00.000Z',
  )
  assert.throws(() => parseAdminTriggerRequest({
    triggerCategory: 'event',
    eventType: 'payment_failure',
    sourceEventId: 'real-customer-123',
    businessKey: 'real-customer-123',
    fixtureMode: 'live',
  }))
})

test('admin runtime fails closed before durable configuration in Production', () => {
  assert.throws(
    () => loadAdminRuntimeConfiguration({ VERCEL_ENV: 'production', AGENT_ADMIN_ENABLED: 'true' }),
    AdminRuntimeConfigurationError,
  )
})

test('owner decisions are replay-safe, compare-and-swap guarded, payload-bound, audited, and non-executing', async () => {
  const actionId = '22222222-2222-4222-8222-222222222222'
  const correlationId = '33333333-3333-4333-8333-333333333333'
  const originalPayload = { contactId: 'synthetic-contact-c7', mutationAllowed: false }
  const action = {
    id: actionId,
    actionType: 'external.activecampaign_update',
    targetSystem: 'activecampaign',
    status: 'proposed',
    riskLevel: 'high',
    conciseRationale: 'Synthetic approval boundary validation.',
    payload: originalPayload,
    payloadDigest: payloadDigest(originalPayload),
    decisionVersion: 0,
    evidence: [],
    sourceRefs: [],
    signalIds: [],
    runId: null,
    approvalRequired: true,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    executorKey: null,
    executionStartedAt: null,
    executedAt: null,
    correlationId,
    causationId: null,
    createdAt: fixedNow.toISOString(),
  }
  const store = new InMemoryAdminControlPlaneStore(ownerSubject, {
    generatedAt: fixedNow.toISOString(),
    runs: [],
    unresolvedSignals: [],
    sourceWarnings: [],
    topPriorities: [],
    experiments: [],
    reviews: [],
    delegationEnabled: false,
    executionEnabled: false,
    awaitingActions: [action],
  })

  await assert.rejects(() => store.getSnapshot('autumn@example.test'), AdminControlPlaneAuthorizationError)
  const before = await store.getSnapshot(ownerSubject)
  assert.equal(before.awaitingActions.length, 1)
  assert.equal(before.executionEnabled, false)
  assert.equal(before.delegationEnabled, false)

  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()
  const approved = await store.decideAction({
    actionId,
    decision: 'approved',
    expectedVersion: 0,
    expectedPayloadDigest: payloadDigest(originalPayload),
    reason: 'Owner reviewed the exact synthetic payload.',
    actorSubject: ownerSubject,
    nonceDigest: 'a'.repeat(64),
    nonceExpiresAt: expiresAt,
    decidedAt: fixedNow.toISOString(),
    requestIdempotencyKey: 'synthetic-c7-approval',
  })
  originalPayload.contactId = 'caller-side-mutation'
  assert.equal(approved.executionStarted, false)
  assert.equal(approved.correlationId, correlationId)
  assert.equal(approved.approvedPayloadDigest, payloadDigest({
    contactId: 'synthetic-contact-c7',
    mutationAllowed: false,
  }))
  assert.equal(store.actions.get(actionId).payload.contactId, 'synthetic-contact-c7')
  assert.equal(store.actions.get(actionId).executorKey, null)
  assert.ok(store.events.some((event) => event.eventType === 'agent.action.approved'))

  await assert.rejects(() => store.decideAction({
    actionId,
    decision: 'approved',
    expectedVersion: 0,
    expectedPayloadDigest: payloadDigest(action.payload),
    reason: 'Duplicate approval must fail.',
    actorSubject: ownerSubject,
    nonceDigest: 'a'.repeat(64),
    nonceExpiresAt: expiresAt,
    decidedAt: fixedNow.toISOString(),
    requestIdempotencyKey: 'synthetic-c7-approval-replay',
  }), AdminControlPlaneReplayError)
  await assert.rejects(() => store.decideAction({
    actionId,
    decision: 'rejected',
    expectedVersion: 0,
    expectedPayloadDigest: payloadDigest(action.payload),
    reason: 'Stale version must fail.',
    actorSubject: ownerSubject,
    nonceDigest: 'b'.repeat(64),
    nonceExpiresAt: expiresAt,
    decidedAt: fixedNow.toISOString(),
    requestIdempotencyKey: 'synthetic-c7-stale-decision',
  }), AdminControlPlaneConflictError)
})

test('payload digests use stable recursive key ordering', () => {
  assert.equal(
    stableJson({ z: 1, a: { second: 2, first: 1 } }),
    '{"a":{"first":1,"second":2},"z":1}',
  )
  assert.equal(
    payloadDigest({ z: 1, a: { second: 2, first: 1 } }),
    payloadDigest({ a: { first: 1, second: 2 }, z: 1 }),
  )
})
