import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateHealthWindow, REQUIRED_SOURCES } from './production-health-window.mjs';

function evidence() {
  const input = { evaluatedAt: '2026-10-10T12:00:00.000Z', environment: 'production', provenanceMode: 'live', policyReference: 'reviewed-policy-test', thresholds: {}, observations: [] };
  for (const sourceId of REQUIRED_SOURCES) {
    input.thresholds[sourceId] = { maxGapHours: 6, staleAfterHours: 6 };
    for (let hours = 0; hours <= 48; hours += 6) input.observations.push({ sourceId, status: 'healthy', observedAt: new Date(Date.parse(input.evaluatedAt) - hours * 3600000).toISOString(), staleAfterHours: 6, errorCode: null, evidenceReference: 'synthetic-reference', environment: 'production', provenanceMode: 'live' });
  }
  return input;
}
test('48 hours supplied evidence qualifies but never certifies live verification', () => {
  const result = evaluateHealthWindow(evidence());
  assert.equal(result.qualifies, true);
  assert.equal(result.elapsedHours, 48);
  assert.equal(result.liveVerified, false);
});
test('every named source is mandatory', () => {
  for (const sourceId of REQUIRED_SOURCES) {
    const input = evidence(); input.observations = input.observations.filter(row => row.sourceId !== sourceId);
    assert.equal(evaluateHealthWindow(input).qualifies, false);
  }
});
test('failed, unknown, stale and missing provenance cannot be healthy', () => {
  for (const status of ['failed', 'unknown', 'stale', 'degraded', 'not_configured']) {
    const input = evidence(); input.observations[0].status = status;
    assert.equal(evaluateHealthWindow(input).qualifies, false);
  }
  const input = evidence(); delete input.observations[0].provenanceMode;
  assert.equal(evaluateHealthWindow(input).qualifies, false);
});
test('interior source gap restarts rather than extrapolates the window', () => {
  const input = evidence(); input.observations.splice(4, 1);
  assert.equal(evaluateHealthWindow(input).elapsedHours, 18);
});
test('a failed observation resets the common window', () => {
  const input = evidence(); input.observations[4].status = 'failed';
  assert.equal(evaluateHealthWindow(input).elapsedHours, 18);
});
test('stale latest observation invalidates the window', () => {
  const input = evidence(); input.evaluatedAt = '2026-10-10T19:00:00.000Z';
  assert.equal(evaluateHealthWindow(input).elapsedHours, 0);
});
test('freshness allowance does not extend actual observed duration', () => {
  const input = evidence(); input.observations = input.observations.filter(row => row.observedAt !== input.evaluatedAt);
  assert.equal(evaluateHealthWindow(input).elapsedHours, 42);
  assert.equal(evaluateHealthWindow(input).qualifies, false);
});
test('fixture/baseline or nonproduction envelopes are rejected', () => {
  for (const provenanceMode of ['fixture', 'baseline']) {
    const input = evidence(); input.provenanceMode = provenanceMode;
    assert.equal(evaluateHealthWindow(input).status, 'invalid');
  }
  const input = evidence(); input.environment = 'preview';
  assert.equal(evaluateHealthWindow(input).status, 'invalid');
});
test('duplicates, future dates, unreviewed thresholds and errors fail closed', () => {
  for (const mutate of [input => input.observations.push(input.observations[0]), input => input.observations[0].observedAt = '2027-01-01T00:00:00Z', input => delete input.thresholds, input => delete input.policyReference]) {
    const input = evidence(); mutate(input); assert.equal(evaluateHealthWindow(input).status, 'invalid');
  }
  const input = evidence(); input.observations[0].errorCode = 'READ_FAILED';
  assert.equal(evaluateHealthWindow(input).qualifies, false);
});
