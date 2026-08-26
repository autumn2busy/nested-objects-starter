import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { CorrelationContext } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import {
  assertServerOnlyControlPlaneAccess,
  type SupabaseControlPlaneConfiguration,
} from '../persistence/control-plane-store.js'
import {
  createSupabaseProjectionStore,
  type ProjectionPersistenceStore,
} from '../persistence/projection-store.js'
import type { PhaseCWorkflowResult } from '../workflows/phase-c-core.js'
import type { PreviewDeploymentConfiguration } from './config.js'

export const PREVIEW_REQUIRED_TABLES = [
  'canonical_members',
  'member_identity_links',
  'member_memberships',
  'member_operational_profiles',
  'business_metrics_daily',
  'intelligence_signals',
  'projection_runs',
  'activecampaign_asset_registry',
  'marketing_contact_classifications',
] as const

export interface BeginPreviewRunInput {
  projectionName: 'phase-c2-preview-lifecycle-integrity'
  projectionVersion: 'phase-c2-preview-v1'
  idempotencyKey: string
  correlation: CorrelationContext
  inputRecords: number
  persistRequested: boolean
  requestDigest: string
  startedAt: string
}

export type BeginPreviewRunResult =
  | { duplicate: false; runId: string; status: 'running' }
  | { duplicate: true; runId: string; status: string; completedAt: string | null }

export interface CompletePreviewRunInput {
  runId: string
  outputRecords: number
  conflictRecords: number
  unmatchedRecords: number
  completeness: number
  confidence: number
  completedAt: string
  metadata: Record<string, unknown>
}

export interface PreviewRuntimeDependencies {
  checkReadiness(): Promise<void>
  beginRun(input: BeginPreviewRunInput): Promise<BeginPreviewRunResult>
  persistResult(result: PhaseCWorkflowResult): Promise<void>
  completeRun(input: CompletePreviewRunInput): Promise<void>
  failRun(runId: string, error: { code: string; message: string }, completedAt: string): Promise<void>
}

export async function createSupabasePreviewRuntimeDependencies(
  configuration: PreviewDeploymentConfiguration,
): Promise<PreviewRuntimeDependencies> {
  const controlPlaneConfiguration: SupabaseControlPlaneConfiguration = {
    url: configuration.supabaseUrl,
    serviceRoleKey: configuration.supabaseServiceRoleKey,
    runtime: 'server',
  }
  assertServerOnlyControlPlaneAccess(controlPlaneConfiguration)

  const client = createClient(configuration.supabaseUrl, configuration.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const projectionStore = await createSupabaseProjectionStore(controlPlaneConfiguration)
  return new SupabasePreviewRuntimeDependencies(client, projectionStore)
}

class SupabasePreviewRuntimeDependencies implements PreviewRuntimeDependencies {
  constructor(
    private readonly client: SupabaseClient,
    private readonly projectionStore: ProjectionPersistenceStore,
  ) {}

  async checkReadiness(): Promise<void> {
    for (const table of PREVIEW_REQUIRED_TABLES) {
      const { error } = await this.client.from(table).select('id', { count: 'exact', head: true })
      if (error) {
        throw new PreviewDependencyError('A required staging table is unavailable.', {
          table,
          code: error.code,
        })
      }
    }
  }

  async beginRun(input: BeginPreviewRunInput): Promise<BeginPreviewRunResult> {
    const { data, error } = await this.client
      .from('projection_runs')
      .insert({
        projection_name: input.projectionName,
        projection_version: input.projectionVersion,
        status: 'running',
        input_records: input.inputRecords,
        output_records: 0,
        conflict_records: 0,
        unmatched_records: 0,
        completeness: 0,
        confidence: 0,
        correlation_id: input.correlation.correlationId,
        causation_id: input.correlation.causationId,
        trace_id: input.correlation.traceId,
        idempotency_key: input.idempotencyKey,
        started_at: input.startedAt,
        stale_after: new Date(Date.parse(input.startedAt) + 5 * 60 * 1000).toISOString(),
        metadata: {
          synthetic: true,
          persistRequested: input.persistRequested,
          requestDigest: input.requestDigest,
        },
      })
      .select('id,status')
      .single()

    if (!error && data) {
      return { duplicate: false, runId: String(data.id), status: 'running' }
    }

    if (error?.code !== '23505') {
      throw new PreviewDependencyError('Unable to create the preview projection run.', {
        code: error?.code,
      })
    }

    const { data: existing, error: existingError } = await this.client
      .from('projection_runs')
      .select('id,status,completed_at')
      .eq('idempotency_key', input.idempotencyKey)
      .maybeSingle()

    if (existingError || !existing) {
      throw new PreviewDependencyError('The idempotent preview run exists but could not be read.', {
        code: existingError?.code,
      })
    }

    return {
      duplicate: true,
      runId: String(existing.id),
      status: String(existing.status),
      completedAt: existing.completed_at ? String(existing.completed_at) : null,
    }
  }

  async persistResult(result: PhaseCWorkflowResult): Promise<void> {
    for (const projection of result.projections) {
      await this.projectionStore.persistMemberProjection(projection)
    }
    await this.projectionStore.persistMetrics(result.metrics)
    await this.projectionStore.persistSignals(result.signals)
    await this.projectionStore.persistMarketingClassifications(result.marketingClassifications)
  }

  async completeRun(input: CompletePreviewRunInput): Promise<void> {
    const { error } = await this.client
      .from('projection_runs')
      .update({
        status: 'succeeded',
        output_records: input.outputRecords,
        conflict_records: input.conflictRecords,
        unmatched_records: input.unmatchedRecords,
        completeness: input.completeness,
        confidence: input.confidence,
        completed_at: input.completedAt,
        stale_after: null,
        metadata: input.metadata,
      })
      .eq('id', input.runId)

    if (error) {
      throw new PreviewDependencyError('Unable to complete the preview projection run.', {
        code: error.code,
      })
    }
  }

  async failRun(runId: string, errorValue: { code: string; message: string }, completedAt: string): Promise<void> {
    const { error } = await this.client
      .from('projection_runs')
      .update({
        status: 'failed',
        completed_at: completedAt,
        stale_after: null,
        error: errorValue,
      })
      .eq('id', runId)

    if (error) {
      throw new PreviewDependencyError('Unable to record the failed preview projection run.', {
        code: error.code,
      })
    }
  }
}

export class PreviewDependencyError extends Error {
  readonly code = 'PREVIEW_DEPENDENCY_FAILED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'PreviewDependencyError'
    this.details = details
  }
}

export function assertPreviewDependencies(value: PreviewRuntimeDependencies): void {
  for (const method of ['checkReadiness', 'beginRun', 'persistResult', 'completeRun', 'failRun'] as const) {
    if (typeof value[method] !== 'function') {
      throw new ContractValidationError(`Preview dependency ${method} is required.`)
    }
  }
}
