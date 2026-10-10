import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Reuses SensorSourceHealth's sourceId/status/observedAt/staleAfterHours shape.
// This evaluates supplied evidence, not provider authenticity or live availability.
export const REQUIRED_SOURCES = Object.freeze([
  'contact-durability', 'contact-delivery', 'conversion-events-ledger',
  'distributed-rate-limit', 'payment-access-truth',
  'adzuna-opportunity-ingestion', 'seo-content-monitor', 'ai-aeo-monitor',
]);
const HOUR = 3_600_000;
const iso = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value));

export function evaluateHealthWindow(input) {
  const invalid = (reason) => ({ status: 'invalid', reason, qualifies: false, liveVerified: false });
  if (!input || !iso(input.evaluatedAt) || !Array.isArray(input.observations)) return invalid('invalid_envelope');
  if (input.environment !== 'production' || input.provenanceMode !== 'live') return invalid('live_production_evidence_required');
  // Thresholds must be explicitly reviewed; no inferred scheduler or freshness defaults.
  if (typeof input.policyReference !== 'string' || !/^[a-zA-Z0-9._:-]{1,120}$/.test(input.policyReference)) return invalid('reviewed_policy_reference_required');
  const now = Date.parse(input.evaluatedAt);
  const results = [];
  for (const sourceId of REQUIRED_SOURCES) {
    const threshold = input.thresholds?.[sourceId];
    if (!threshold || !Number.isFinite(threshold.maxGapHours) || threshold.maxGapHours <= 0 || threshold.maxGapHours > 48 || !Number.isFinite(threshold.staleAfterHours) || threshold.staleAfterHours <= 0 || threshold.staleAfterHours > 48) return invalid('invalid_source_threshold');
    const rows = input.observations.filter((row) => row?.sourceId === sourceId);
    if (rows.some((row) => !iso(row.observedAt) || Date.parse(row.observedAt) > now)) return invalid('invalid_observation_time');
    rows.sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
    if (rows.some((row, index) => index && row.observedAt === rows[index - 1].observedAt)) return invalid('duplicate_source_timestamp');
    let start = null;
    let previous = null;
    let reason = 'missing_source';
    for (const row of rows) {
      const at = Date.parse(row.observedAt);
      const healthy = row.status === 'healthy' && row.provenanceMode === 'live' && row.environment === 'production'
        && typeof row.evidenceReference === 'string' && /^[a-zA-Z0-9._:/-]{1,200}$/.test(row.evidenceReference)
        && row.errorCode === null && row.staleAfterHours === threshold.staleAfterHours;
      if (!healthy) { start = null; previous = null; reason = 'unhealthy_or_unverified'; continue; }
      if (previous === null || at - previous > threshold.maxGapHours * HOUR) start = at;
      previous = at;
      reason = 'insufficient_continuous_duration';
    }
    if (previous !== null && (now - previous > threshold.staleAfterHours * HOUR || now - previous > threshold.maxGapHours * HOUR)) { start = null; reason = 'stale_latest_observation'; }
    results.push({ sourceId, continuousSince: start === null ? null : new Date(start).toISOString(), observedThrough: start === null ? null : new Date(previous).toISOString(), reason });
  }
  const starts = results.map((row) => row.continuousSince === null ? null : Date.parse(row.continuousSince));
  const commonStart = starts.includes(null) ? null : Math.max(...starts);
  const observedThrough = commonStart === null ? null : Math.min(...results.map(row => Date.parse(row.observedThrough)));
  const elapsedHours = commonStart === null ? 0 : Math.max(0, (observedThrough - commonStart) / HOUR);
  const qualifies = elapsedHours >= 48;
  return { status: qualifies ? 'evidence_window_satisfied' : 'not_satisfied', qualifies,
    liveVerified: false, evaluatedAt: input.evaluatedAt, policyReference: input.policyReference,
    continuousSince: commonStart === null ? null : new Date(commonStart).toISOString(), observedThrough: observedThrough === null ? null : new Date(observedThrough).toISOString(), elapsedHours,
    sources: results, caveat: 'Supplied evidence only; provider authenticity and live acceptance require independent verification.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('usage');
    const result = evaluateHealthWindow(JSON.parse(await readFile(process.argv[2], 'utf8')));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.qualifies ? 0 : 1;
  } catch {
    // Never echo raw files, provider responses, paths or possibly private error details.
    console.error('Health evidence could not be evaluated. Supply one valid JSON evidence file.');
    process.exitCode = 2;
  }
}
