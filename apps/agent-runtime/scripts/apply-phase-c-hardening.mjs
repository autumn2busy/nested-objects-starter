import { readFile, writeFile } from 'node:fs/promises'

async function replaceOnce(path, oldValue, newValue) {
  const source = await readFile(path, 'utf8')
  const count = source.split(oldValue).length - 1
  if (count !== 1) {
    throw new Error(`Expected one match in ${path}, found ${count}: ${oldValue.slice(0, 80)}`)
  }
  await writeFile(path, source.replace(oldValue, newValue))
}

const memberPath = 'apps/agent-runtime/src/projections/member-projection.ts'
await replaceOnce(
  memberPath,
  [
    "    if (conflicted && identifierType === 'email') return",
    '',
    '    links.push({',
    '      sourceSystem,',
    '      identifierType,',
    '      externalId,',
    '      normalizedExternalId,',
    "      status: conflicted ? 'conflict' : 'active',",
    '      isPrimary,',
    '      confidence: conflicted ? 0 : 1,',
  ].join('\n'),
  [
    '    if (conflicted) return',
    '',
    '    links.push({',
    '      sourceSystem,',
    '      identifierType,',
    '      externalId,',
    '      normalizedExternalId,',
    "      status: 'active',",
    '      isPrimary,',
    '      confidence: 1,',
  ].join('\n'),
)

const metricsPath = 'apps/agent-runtime/src/projections/daily-metrics.ts'
await replaceOnce(
  metricsPath,
  "metrics.push(unknownMetric(input, observedAt, 'revenue.mrr', 'revenue', 'Authoritative billing-grade recurring revenue amounts are not available in profiles or conversion_events.'))",
  "metrics.push(unknownMetric(input, observedAt, 'revenue.mrr', 'revenue', 'USD', 'Authoritative billing-grade recurring revenue amounts are not available in profiles or conversion_events.'))",
)
await replaceOnce(
  metricsPath,
  "metrics.push(unknownMetric(input, observedAt, 'revenue.arr', 'revenue', 'Authoritative billing-grade recurring revenue amounts are not available in profiles or conversion_events.'))",
  "metrics.push(unknownMetric(input, observedAt, 'revenue.arr', 'revenue', 'USD', 'Authoritative billing-grade recurring revenue amounts are not available in profiles or conversion_events.'))",
)
await replaceOnce(
  metricsPath,
  "metrics.push(unknownMetric(input, observedAt, 'members.cancellations', 'revenue', 'No authoritative cancellation event is available in the Phase C input contract yet.'))",
  "metrics.push(unknownMetric(input, observedAt, 'members.cancellations', 'revenue', 'count', 'No authoritative cancellation event is available in the Phase C input contract yet.'))",
)
await replaceOnce(
  metricsPath,
  [
    '  metricName: string,',
    '  domain: MetricDomain,',
    '  reason: string,',
    '): MetricSnapshot {',
  ].join('\n'),
  [
    '  metricName: string,',
    '  domain: MetricDomain,',
    '  unit: string,',
    '  reason: string,',
    '): MetricSnapshot {',
  ].join('\n'),
)
await replaceOnce(metricsPath, "    unit: 'USD',\n", '    unit,\n')

const metricSource = await readFile(metricsPath, 'utf8')
const oldMetricKey = "idempotencyKey: `metric:${input.metricDate}:${metricName}:global:${input.sourceRunId ?? 'none'}`"
const metricKeyCount = metricSource.split(oldMetricKey).length - 1
if (metricKeyCount !== 2) {
  throw new Error(`Expected two metric idempotency key matches, found ${metricKeyCount}`)
}
await writeFile(
  metricsPath,
  metricSource.replaceAll(
    oldMetricKey,
    'idempotencyKey: `metric:${input.metricDate}:${metricName}:global:phase-c-v1`',
  ),
)

const integrityPath = 'apps/agent-runtime/src/workflows/lifecycle-integrity.ts'
await replaceOnce(
  integrityPath,
  'fingerprint: `identity:${input.projection.memberId}:${conflict.conflictType}:${conflict.identifier}`',
  "fingerprint: `identity:${input.projection.memberId}:${conflict.conflictType}:${stableUuid('identity-conflict-identifier', conflict.identifier)}`",
)

const testPath = 'apps/agent-runtime/test/phase-c.test.mjs'
const tests = await readFile(testPath, 'utf8')
const marker = 'conflicting Outseta identifiers are withheld from persistence-safe identity links'
if (tests.includes(marker)) throw new Error('Phase C hardening tests already exist')

const additions = `

test('conflicting Outseta identifiers are withheld from persistence-safe identity links', () => {
  const secondId = '22222222-2222-4222-8222-222222222222'
  const batch = buildMemberProjectionBatch({
    profiles: [
      profile(),
      profile({
        id: secondId,
        user_email: 'second@example.com',
        outseta_account_id: 'account-2',
      }),
    ],
    conversionEvents: [],
    correlation,
  })

  assert.ok(batch.identityConflicts.some((conflict) => conflict.conflictType === 'outseta_person_collision'))
  assert.ok(batch.projections.every((projection) =>
    projection.identityLinks.every((link) => link.identifierType !== 'person_uid'),
  ))
})

test('daily metric units and idempotency remain stable across projection reruns', () => {
  const first = buildDailyBusinessMetrics({
    metricDate: '2026-08-25',
    profiles: [profile()],
    conversionEvents: [],
    correlation,
    sourceRunId: 'run-1',
    observedAt: fixedNow,
  })
  const second = buildDailyBusinessMetrics({
    metricDate: '2026-08-25',
    profiles: [profile()],
    conversionEvents: [],
    correlation,
    sourceRunId: 'run-2',
    observedAt: fixedNow,
  })

  const firstMrr = first.find((metric) => metric.metricName === 'revenue.mrr')
  const secondMrr = second.find((metric) => metric.metricName === 'revenue.mrr')
  const cancellations = first.find((metric) => metric.metricName === 'members.cancellations')

  assert.equal(firstMrr.idempotencyKey, secondMrr.idempotencyKey)
  assert.equal(cancellations.unit, 'count')
  assert.equal(cancellations.valueState, 'unknown')
  assert.equal(cancellations.value, null)
})
`

await writeFile(testPath, `${tests.trimEnd()}${additions}\n`)
console.log('Applied Phase C hardening patch.')
