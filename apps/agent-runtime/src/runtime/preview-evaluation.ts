import type { CorrelationContext } from '../contracts.js'
import { createCorrelationContext } from '../contracts.js'
import {
  createSupabaseProjectionRunStore,
  type ProjectionRunStore,
} from '../persistence/projection-run-store.js'
import {
  createSupabaseProjectionStore,
  type ProjectionPersistenceStore,
} from '../persistence/projection-store.js'
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
  execution: 'dry_run' | 'persisted_to_staging'
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
  if (input.persist && !configuration.persistenceEnabled) {
    throw new PreviewPersistenceDisabledError(
      'Request asked to persist, but AGENT_PREVIEW_PERSISTENCE_ENABLED is false',
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

  if (input.persist) {
    await persistPreviewEvaluation({
      input,
      correlation,
      runId,
      result,
      assetClassifications,
      configuration,
      now,
    })
  }

  return {
    ok: true,
    phase: 'phase-c2-preview',
    execution: input.persist ? 'persisted_to_staging' : 'dry_run',
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

async function persistPreviewEvaluation(input: {
  input: PreviewEvaluationRequest
  correlation: CorrelationContext
  runId: string
  result: ReturnType<typeof runPhaseCCore>
  assetClassifications: ReturnType<typeof classifyActiveCampaignAsset>[]
  configuration: PreviewRuntimeConfiguration
  now: string
}): Promise<void> {
  const { configuration } = input
  const url = configuration.runtime.supabaseUrl
  const serviceRoleKey = configuration.runtime.supabaseServiceRoleKey
  if (!url || !serviceRoleKey) {
    throw new PreviewPersistenceDisabledError('Staging Supabase credentials are unavailable')
  }

  const storeConfiguration = { url, serviceRoleKey }
  const [runStore, projectionStore] = await Promise.all([
    createSupabaseProjectionRunStore(storeConfiguration),
    createSupabaseProjectionStore(storeConfiguration),
  ])
  const sourceWindow = sourceWindowFor(input.input)
  let runStarted = false

  try {
    const persistedRunId = await runStore.begin({
      idempotencyKey: input.input.idempotencyKey,
      correlation: input.correlation,
      sourceWindowStart: sourceWindow.start,
      sourceWindowEnd: sourceWindow.end,
      inputRecords:
        input.input.profiles.length +
        input.input.conversionEvents.length +
        input.input.activeCampaignContacts.length +
        input.input.activeCampaignAssets.length,
      metadata: {
        syntheticOnly: true,
        runtimeVersion: configuration.runtime.runtimeVersion,
        environment: configuration.runtime.environment,
        inputCounts: {
          profiles: input.input.profiles.length,
          conversionEvents: input.input.conversionEvents.length,
          activeCampaignContacts: input.input.activeCampaignContacts.length,
          activeCampaignAssets: input.input.activeCampaignAssets.length,
        },
      },
      startedAt: input.now,
    })
    runStarted = true
    if (persistedRunId !== input.runId) {
      throw new PreviewPersistenceError('Projection run ID did not match the deterministic request ID')
    }

    await persistProjectionResult(
      projectionStore,
      input.result,
      input.assetClassifications,
      input.now,
    )

    const completedAt = new Date().toISOString()
    const identityConflictCount = input.result.projections.reduce(
      (sum, projection) => sum + projection.identityConflicts.length,
      0,
    )
    await runStore.succeed(input.runId, {
      outputRecords:
        input.result.projections.length +
        input.result.metrics.length +
        input.result.signals.length +
        input.result.marketingClassifications.length +
        input.assetClassifications.length,
      conflictRecords: identityConflictCount,
      unmatchedRecords: input.result.unmatchedConversionEventIds.length,
      completeness: input.input.profiles.length === 0
        ? 1
        : round4(input.result.projections.length / input.input.profiles.length),
      confidence: identityConflictCount > 0 ? 0.8 : 1,
      completedAt,
    })
  } catch (error) {
    if (runStarted) {
      try {
        await runStore.fail(input.runId, operationalErrorCode(error), new Date().toISOString())
      } catch {
        // The original failure remains authoritative. A later stale-run sweep can repair run status.
      }
    }
    throw error
  }
}

async function persistProjectionResult(
  store: ProjectionPersistenceStore,
  result: ReturnType<typeof runPhaseCCore>,
  assetClassifications: ReturnType<typeof classifyActiveCampaignAsset>[],
  observedAt: string,
): Promise<void> {
  for (const projection of result.projections) {
    await store.persistMemberProjection(projection)
  }
  await store.persistMetrics(result.metrics)
  await store.persistSignals(result.signals)
  await store.persistMarketingClassifications(result.marketingClassifications)
  await store.persistAssetClassifications(assetClassifications, observedAt)
}

function sourceWindowFor(input: PreviewEvaluationRequest): { start: string | null; end: string | null } {
  const timestamps = [
    ...input.profiles.map((profile) => profile.created_at),
    ...input.conversionEvents.map((event) => event.occurred_at),
  ]
    .map((value) => Date.parse(value))
    .filter(Number.isFinite)
    .sort((left, right) => left - right)

  if (timestamps.length === 0) return { start: null, end: null }
  return {
    start: new Date(timestamps[0] ?? 0).toISOString(),
    end: new Date(timestamps[timestamps.length - 1] ?? 0).toISOString(),
  }
}

function countBy(values: string[]): Record<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)))
}

function operationalErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) return String(error.code)
  return 'PREVIEW_EVALUATION_FAILED'
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

export class PreviewPersistenceDisabledError extends Error {
  readonly code = 'PREVIEW_PERSISTENCE_DISABLED'

  constructor(message: string) {
    super(message)
    this.name = 'PreviewPersistenceDisabledError'
  }
}

export class PreviewPersistenceError extends Error {
  readonly code = 'PREVIEW_PERSISTENCE_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'PreviewPersistenceError'
  }
}
