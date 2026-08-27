import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InMemoryLearningTraceStore,
  assertLearningTraceBatch,
  learningTraceLinks,
} from '../dist/index.js'

const actionId = '31800000-0000-5000-8000-000000000801'
const runId = '31800000-0000-5000-8000-000000000802'
const experimentId = '31800000-0000-5000-8000-000000000803'
const signalId = '31800000-0000-5000-8000-000000000804'
const planId = '31800000-0000-5000-8000-000000000805'
const outcomeId = '31800000-0000-5000-8000-000000000806'
const measurementId = '31800000-0000-5000-8000-000000000807'
const learningId = '31800000-0000-5000-8000-000000000808'
const fixedNow = '2026-08-27T16:00:00.000Z'
const sourceRefs = [{
  sourceSystem: 'synthetic-fixture',
  sourceType: 'experiment-observation',
  sourceId: 'synthetic-c8-observation',
  observedAt: fixedNow,
}]
const evidence = [{
  evidenceType: 'observation',
  summary: 'Synthetic bounded learning-loop observation.',
  sourceRef: sourceRefs[0],
  value: 0.12,
  confidence: 1,
}]

test('planned measurement can link later to a verified outcome and candidate learning', async () => {
  const store = new InMemoryLearningTraceStore()
  const planned = measurement({
    id: planId,
    outcomeId: null,
    planMeasurementId: null,
    status: 'planned',
    value: null,
    valueState: 'unknown',
    observedSampleSize: 0,
    observedDurationDays: 0,
    measuredAt: null,
    idempotencyKey: 'measurement-plan:c8',
    correlation: correlation(actionId),
  })

  assert.deepEqual(await store.persistBatch({ outcomes: [], measurements: [planned], learnings: [] }), {
    outcomeCount: 0,
    measurementCount: 1,
    learningCount: 0,
    linkCount: 0,
  })

  const outcome = {
    id: outcomeId,
    outcomeType: 'experiment_conversion_lift',
    actionId,
    runId,
    experimentId,
    signalIds: [signalId],
    state: 'verified',
    summary: 'Synthetic experiment met its committed observation threshold.',
    evidence,
    sourceRefs,
    observedAt: fixedNow,
    verificationStatus: 'verified',
    idempotencyKey: 'outcome:c8',
    correlation: correlation(actionId),
  }
  const completed = measurement({
    id: measurementId,
    outcomeId,
    planMeasurementId: planId,
    status: 'complete',
    value: 0.12,
    valueState: 'known',
    observedSampleSize: 120,
    observedDurationDays: 14,
    measuredAt: fixedNow,
    idempotencyKey: 'measurement-complete:c8',
    correlation: correlation(outcomeId),
  })
  const learning = {
    id: learningId,
    learningType: 'experiment_result',
    actionId,
    experimentId,
    outcomeId,
    measurementIds: [measurementId],
    summary: 'The synthetic intervention cleared sample and duration guardrails.',
    decision: 'Keep as a reviewed candidate; do not auto-execute.',
    confidence: 0.9,
    reviewStatus: 'candidate',
    evidence,
    sourceRefs,
    learnedAt: fixedNow,
    idempotencyKey: 'learning:c8',
    correlation: correlation(outcomeId),
  }
  const batch = { outcomes: [outcome], measurements: [completed], learnings: [learning] }
  const links = learningTraceLinks(batch)
  assert.deepEqual(links.map((link) => link.relationship).sort(), [
    'action_produced_outcome',
    'measurement_produced_learning',
    'outcome_measured_by',
  ])
  assert.ok(links.every((link) => link.correlation.correlationId === actionId))

  const first = await store.persistBatch(batch)
  assert.equal(first.linkCount, 3)
  assert.deepEqual(await store.persistBatch(batch), first)
  assert.equal(store.outcomes.size, 1)
  assert.equal(store.measurements.size, 2)
  assert.equal(store.learnings.size, 1)
  assert.equal(store.traceLinks.size, 3)

  const changed = structuredClone(batch)
  changed.outcomes[0].summary = 'Changed content under the same idempotency key.'
  await assert.rejects(store.persistBatch(changed), /idempotency key was reused with different content/)
})

test('learning contracts reject insufficient completion and private reasoning fields', () => {
  const insufficient = measurement({
    id: measurementId,
    outcomeId,
    planMeasurementId: null,
    status: 'complete',
    value: 0.12,
    valueState: 'known',
    observedSampleSize: 5,
    observedDurationDays: 2,
    measuredAt: fixedNow,
    idempotencyKey: 'measurement:insufficient',
    correlation: correlation(outcomeId),
  })
  assert.throws(
    () => assertLearningTraceBatch({ outcomes: [outcomeFixture()], measurements: [insufficient], learnings: [] }),
    /sufficient sample and duration/,
  )

  const privateBatch = { outcomes: [outcomeFixture()], measurements: [], learnings: [] }
  privateBatch.outcomes[0].privateReasoning = 'must never be stored'
  assert.throws(() => assertLearningTraceBatch(privateBatch), /Private reasoning fields are forbidden/)
})

function measurement(overrides) {
  return {
    id: measurementId,
    metricName: 'conversion.rate',
    actionId,
    runId,
    experimentId,
    outcomeId,
    planMeasurementId: null,
    status: 'complete',
    value: 0.12,
    valueState: 'known',
    unit: 'ratio',
    minimumSampleSize: 100,
    minimumDurationDays: 7,
    observedSampleSize: 120,
    observedDurationDays: 14,
    evidence,
    sourceRefs,
    measuredAt: fixedNow,
    idempotencyKey: 'measurement:c8',
    correlation: correlation(outcomeId),
    ...overrides,
  }
}

function outcomeFixture() {
  return {
    id: outcomeId,
    outcomeType: 'experiment_conversion_lift',
    actionId,
    runId,
    experimentId,
    signalIds: [signalId],
    state: 'verified',
    summary: 'Synthetic verified outcome.',
    evidence,
    sourceRefs,
    observedAt: fixedNow,
    verificationStatus: 'verified',
    idempotencyKey: 'outcome:c8',
    correlation: correlation(actionId),
  }
}

function correlation(causationId) {
  return { correlationId: actionId, causationId, traceId: 'trace-phase-c8-learning' }
}
