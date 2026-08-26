import type { CorrelationContext } from '../contracts.js'
import { createCorrelationContext } from '../contracts.js'
import { classifyActiveCampaignAsset } from '../sensors/activecampaign-audit.js'
import { stableUuid } from '../stable-id.js'
import {
  parsePreviewEvaluationRequest,
  type PreviewEvaluationRequest,
} from '../http/preview-contract.js'
import type { PreviewRuntimeConfiguration } from '../http/preview-runtime.js'
import { runPhaseCCore } from '../workflows/phase-c-core.js'

export interface PreviewEvaluationSummary {
  ok: true
  phase: 'phase-c2-preview'
  execution: 'dry_run'
  runId: string
  correlationId: string
  counts: {
    profiles: number
    conversionEvents: number
    activeCampaignContacts: number
    activeCampaignAssets: number
    projectedMembers: number
    metrics: number
    signals: number
    marketingClassifications: number
    assetClassifications: number
    identityConflicts: number
    unmatchedConversionEvents: number
    duplicateConversionEvents: number
  }
  signalTypes: Record<string, number>
  metricValueStates: Record<string, number>
  contactClassifications: Record<string, number>
  assetCandidateScopes: Record<string, number>
  safety: {
    syntheticInputOnly: true
    activeCampaignMutations: false
    modelExecution: false
    productionWrites: false
    consequentialExecutors: false
  }
}

export async function evaluatePreviewRequest(
  rawInput: unknown,
  configuration: PreviewRuntimeConfiguration,
  now = new Date().toISOString(),
): Promise<PreviewEvaluationSummary> {
  const input = parsePreviewEvaluationRequest(rawInput)
  if (input.persist) {
    throw new PreviewPersistenceDisabledError(
      'Phase C2 preview is dry-run-only. Staging persistence requires the later durable workflow increment.',
    )
  }
  if (configuration.persistenceEnabled) {
    throw new PreviewPersistenceDisabledError(
      'Phase C2 runtime configuration unexpectedly enabled persistence.',
    )
  }

  const correlationInput: Partial<CorrelationContext> = {
    causationId: input.causationId ?? null,
    traceId: null,
  }
  if (input.correlationId) correlationInput.correlationId = input.correlationId
  const correlation = createCorrelationContext(correlationInput)
  const runId = stableUuid('nested-objects-phase-c2-preview-run', input.idempotencyKey)
  const result = runPhaseCCore({
    profiles: input.profiles,
    conversionEvents: input.conversionEvents,
    activeCampaignContacts: input.activeCampaignContacts,
    marketingConfig: {
      ...input.marketingConfig,
      now: input.marketingConfig.now ?? now,
    },
    productAccessByMemberId: input.productAccessByMemberId,
    activeCampaignMirrorByMemberId: input.activeCampaignMirrorByMemberId,
    metricDate: input.metricDate,
    correlation,
    sourceRunId: runId,
    observedAt: now,
  })
  const assetClassifications = input.activeCampaignAssets.map(classifyActiveCampaignAsset)

  return {
    ok: true,
    phase: 'phase-c2-preview',
    execution: 'dry_run',
    runId,
    correlationId: correlation.correlationId,
    counts: {
      profiles: input.profiles.length,
      conversionEvents: input.conversionEvents.length,
      activeCampaignContacts: input.activeCampaignContacts.length,
      activeCampaignAssets: input.activeCampaignAssets.length,
      projectedMembers: result.projections.length,
      metrics: result.metrics.length,
      signals: result.signals.length,
      marketingClassifications: result.marketingClassifications.length,
      assetClassifications: assetClassifications.length,
      identityConflicts: result.projections.reduce(
        (sum, projection) => sum + projection.identityConflicts.length,
        0,
      ),
      unmatchedConversionEvents: result.unmatchedConversionEventIds.length,
      duplicateConversionEvents: result.duplicateConversionEventIds.length,
    },
    signalTypes: countBy(result.signals.map((signal) => signal.signalType)),
    metricValueStates: countBy(result.metrics.map((metric) => metric.valueState)),
    contactClassifications: countBy(
      result.marketingClassifications.map((classification) => classification.classification),
    ),
    assetCandidateScopes: countBy(
      assetClassifications.map((classification) => classification.candidateScope),
    ),
    safety: {
      syntheticInputOnly: true,
      activeCampaignMutations: false,
      modelExecution: false,
      productionWrites: false,
      consequentialExecutors: false,
    },
  }
}

function countBy(values: string[]): Record<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)))
}

export class PreviewPersistenceDisabledError extends Error {
  readonly code = 'PREVIEW_PERSISTENCE_DISABLED'

  constructor(message: string) {
    super(message)
    this.name = 'PreviewPersistenceDisabledError'
  }
}
