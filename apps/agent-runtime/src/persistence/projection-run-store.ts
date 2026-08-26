import type { CorrelationContext } from '../contracts.js'
import { stableUuid } from '../stable-id.js'
import {
  assertServerOnlyControlPlaneAccess,
  type SupabaseControlPlaneConfiguration,
} from './control-plane-store.js'

interface SupabaseErrorLike {
  message?: string
  code?: string
  details?: string
  hint?: string
}

interface SupabaseResponseLike {
  data: unknown
  error: SupabaseErrorLike | null
}

interface SupabaseQueryLike {
  eq(column: string, value: unknown): SupabaseQueryLike
  then?: Promise<SupabaseResponseLike>['then']
}

interface SupabaseClientLike {
  from(table: string): {
    upsert(values: unknown, options?: Record<string, unknown>): SupabaseQueryLike
    update(values: unknown): SupabaseQueryLike
  }
}

export interface ProjectionRunStartInput {
  idempotencyKey: string
  correlation: CorrelationContext
  sourceWindowStart: string | null
  sourceWindowEnd: string | null
  inputRecords: number
  metadata: Record<string, unknown>
  startedAt: string
}

export interface ProjectionRunCompletionInput {
  outputRecords: number
  conflictRecords: number
  unmatchedRecords: number
  completeness: number
  confidence: number
  completedAt: string
}

export interface ProjectionRunStore {
  begin(input: ProjectionRunStartInput): Promise<string>
  succeed(runId: string, input: ProjectionRunCompletionInput): Promise<void>
  fail(runId: string, errorCode: string, completedAt: string): Promise<void>
}

export async function createSupabaseProjectionRunStore(
  configuration: SupabaseControlPlaneConfiguration,
): Promise<ProjectionRunStore> {
  assertServerOnlyControlPlaneAccess(configuration)
  const packageName = '@supabase/supabase-js'
  const module = (await import(packageName)) as {
    createClient?: (url: string, key: string, options: Record<string, unknown>) => SupabaseClientLike
  }
  if (typeof module.createClient !== 'function') {
    throw new ProjectionRunPersistenceError('@supabase/supabase-js did not expose createClient')
  }

  return new SupabaseProjectionRunStore(module.createClient(
    configuration.url.trim(),
    configuration.serviceRoleKey.trim(),
    { auth: { autoRefreshToken: false, persistSession: false } },
  ))
}

export class SupabaseProjectionRunStore implements ProjectionRunStore {
  constructor(private readonly client: SupabaseClientLike) {}

  async begin(input: ProjectionRunStartInput): Promise<string> {
    const runId = stableUuid('nested-objects-phase-c2-preview-run', input.idempotencyKey)
    const staleAfter = new Date(Date.parse(input.startedAt) + 10 * 60 * 1_000).toISOString()

    await execute(this.client.from('projection_runs').upsert({
      id: runId,
      projection_name: 'phase-c2-preview-evaluation',
      projection_version: 'phase-c2-v1',
      status: 'running',
      source_window_start: input.sourceWindowStart,
      source_window_end: input.sourceWindowEnd,
      source_watermark: {},
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
      completed_at: null,
      stale_after: staleAfter,
      error: null,
      metadata: input.metadata,
    }, { onConflict: 'idempotency_key' }))

    return runId
  }

  async succeed(runId: string, input: ProjectionRunCompletionInput): Promise<void> {
    await execute(this.client.from('projection_runs').update({
      status: 'succeeded',
      output_records: input.outputRecords,
      conflict_records: input.conflictRecords,
      unmatched_records: input.unmatchedRecords,
      completeness: input.completeness,
      confidence: input.confidence,
      completed_at: input.completedAt,
      stale_after: null,
      error: null,
    }).eq('id', runId))
  }

  async fail(runId: string, errorCode: string, completedAt: string): Promise<void> {
    await execute(this.client.from('projection_runs').update({
      status: 'failed',
      completed_at: completedAt,
      stale_after: null,
      error: { code: errorCode },
    }).eq('id', runId))
  }
}

async function execute(query: SupabaseQueryLike): Promise<void> {
  const response = await (query as unknown as Promise<SupabaseResponseLike>)
  if (response.error) {
    throw new ProjectionRunPersistenceError(response.error.message ?? 'Projection run persistence failed', {
      code: response.error.code,
      details: response.error.details,
      hint: response.error.hint,
    })
  }
}

export class ProjectionRunPersistenceError extends Error {
  readonly code = 'PROJECTION_RUN_PERSISTENCE_FAILED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ProjectionRunPersistenceError'
    this.details = details
  }
}
