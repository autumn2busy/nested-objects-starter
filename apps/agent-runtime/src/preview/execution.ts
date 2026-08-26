import { createHash } from 'node:crypto'

import type { PhaseCWorkflowResult } from '../workflows/phase-c-core.js'
import { runPhaseCCore } from '../workflows/phase-c-core.js'
import type { PreviewLifecycleInvocation } from './contracts.js'
import { toPhaseCWorkflowInput } from './contracts.js'
import type { PreviewRuntimeDependencies } from './dependencies.js'

export interface PreviewExecutionSummary {
  duplicate: boolean
  runId: string
  status: string
  persisted: boolean
  completedAt: string | null
  counts: {
    profiles: number
    conversionEvents: number
    activeCampaignContacts: number
    projections: number
    metrics: number
    signals: number
    marketingClassifications: number
    identityConflicts: number
    unmatchedConversionEvents: number
    duplicateConversionEvents: number
  } | null
  correlationId: string
}

export async function executePreviewLifecycleIntegrity(
  invocation: PreviewLifecycleInvocation,
  dependencies: PreviewRuntimeDependencies,
  now = new Date().toISOString(),
): Promise<PreviewExecutionSummary> {
  const begin = await dependencies.beginRun({
    projectionName: 'phase-c2-preview-lifecycle-integrity',
    projectionVersion: 'phase-c2-preview-v1',
    idempotencyKey: invocation.idempotencyKey,
    correlation: invocation.input.correlation,
    inputRecords:
      invocation.input.profiles.length
      + invocation.input.conversionEvents.length
      + invocation.input.activeCampaignContacts.length,
    persistRequested: invocation.persist,
    requestDigest: digestInvocation(invocation),
    startedAt: now,
  })

  if (begin.duplicate) {
    return {
      duplicate: true,
      runId: begin.runId,
      status: begin.status,
      persisted: false,
      completedAt: begin.completedAt,
      counts: null,
      correlationId: invocation.input.correlation.correlationId,
    }
  }

  try {
    const result = runPhaseCCore(toPhaseCWorkflowInput(invocation, begin.runId))
    if (invocation.persist) await dependencies.persistResult(result)

    const completedAt = new Date().toISOString()
    const counts = summarizeResult(invocation, result)
    await dependencies.completeRun({
      runId: begin.runId,
      outputRecords:
        counts.projections
        + counts.metrics
        + counts.signals
        + counts.marketingClassifications,
      conflictRecords: counts.identityConflicts,
      unmatchedRecords: counts.unmatchedConversionEvents,
      completeness: averageCompleteness(result),
      confidence: averageConfidence(result),
      completedAt,
      metadata: {
        synthetic: true,
        persisted: invocation.persist,
        invocationId: invocation.invocationId,
        counts,
      },
    })

    return {
      duplicate: false,
      runId: begin.runId,
      status: 'succeeded',
      persisted: invocation.persist,
      completedAt,
      counts,
      correlationId: invocation.input.correlation.correlationId,
    }
  } catch (error) {
    const operationalError = sanitizeError(error)
    try {
      await dependencies.failRun(begin.runId, operationalError, new Date().toISOString())
    } catch {
      // Preserve the original failure. The API response never exposes database details.
    }
    throw error
  }
}

function summarizeResult(
  invocation: PreviewLifecycleInvocation,
  result: PhaseCWorkflowResult,
): NonNullable<PreviewExecutionSummary['counts']> {
  return {
    profiles: invocation.input.profiles.length,
    conversionEvents: invocation.input.conversionEvents.length,
    activeCampaignContacts: invocation.input.activeCampaignContacts.length,
    projections: result.projections.length,
    metrics: result.metrics.length,
    signals: result.signals.length,
    marketingClassifications: result.marketingClassifications.length,
    identityConflicts: result.projections.reduce(
      (total, projection) => total + projection.identityConflicts.length,
      0,
    ),
    unmatchedConversionEvents: result.unmatchedConversionEventIds.length,
    duplicateConversionEvents: result.duplicateConversionEventIds.length,
  }
}

function averageCompleteness(result: PhaseCWorkflowResult): number {
  if (result.projections.length === 0) return 1
  const total = result.projections.reduce(
    (sum, projection) => sum + projection.canonicalMember.dataQualityScore,
    0,
  )
  return round4(total / result.projections.length)
}

function averageConfidence(result: PhaseCWorkflowResult): number {
  const values = [
    ...result.metrics.map((metric) => metric.confidence),
    ...result.signals.map((signal) => signal.confidence),
    ...result.marketingClassifications.map((classification) => classification.confidence),
  ]
  if (values.length === 0) return 1
  return round4(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function digestInvocation(invocation: PreviewLifecycleInvocation): string {
  return createHash('sha256').update(JSON.stringify(invocation)).digest('hex')
}

function sanitizeError(error: unknown): { code: string; message: string } {
  if (error instanceof Error && 'code' in error) {
    return {
      code: String(error.code).slice(0, 100),
      message: error.message.slice(0, 500),
    }
  }
  if (error instanceof Error) {
    return { code: 'PREVIEW_WORKFLOW_FAILED', message: error.message.slice(0, 500) }
  }
  return { code: 'PREVIEW_WORKFLOW_FAILED', message: 'Preview workflow failed.' }
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000
}
