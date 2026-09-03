import { ContractValidationError } from '../contracts.js'
import type { SensorIngestionBatch, SensorObservation } from '../sensors/contracts.js'
import { assertServerOnlyControlPlaneAccess } from './control-plane-store.js'

export interface PersistedSensorBatchCounts {
  disposition: 'created' | 'reused'
  runCount: 1
  observationCount: number
}

export interface SensorObservationStore {
  persistBatch(batch: SensorIngestionBatch): Promise<PersistedSensorBatchCounts>
}

interface SupabaseErrorLike {
  message?: string
  code?: string
  details?: string
  hint?: string
}

interface SupabaseResponseLike<T> {
  data: T | null
  error: SupabaseErrorLike | null
}

interface SupabaseRpcClientLike {
  rpc(name: string, parameters: Record<string, unknown>): PromiseLike<SupabaseResponseLike<unknown>>
}

export async function createSupabaseSensorObservationStore(configuration: {
  url: string
  serviceRoleKey: string
}): Promise<SensorObservationStore> {
  assertServerOnlyControlPlaneAccess(configuration)
  const supabaseModule = (await import('@supabase/supabase-js')) as {
    createClient?: (url: string, key: string, options: Record<string, unknown>) => SupabaseRpcClientLike
  }
  if (typeof supabaseModule.createClient !== 'function') {
    throw new ContractValidationError('@supabase/supabase-js did not expose createClient')
  }
  const client = supabaseModule.createClient(configuration.url.trim(), configuration.serviceRoleKey.trim(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return new SupabaseSensorObservationStore(client)
}

export class SupabaseSensorObservationStore implements SensorObservationStore {
  constructor(private readonly client: SupabaseRpcClientLike) {}

  async persistBatch(batch: SensorIngestionBatch): Promise<PersistedSensorBatchCounts> {
    assertBatch(batch)
    const response = await this.client.rpc('persist_agent_sensor_batch', {
      p_batch: mapBatch(batch),
      p_observations: batch.observations.map(mapObservation),
    })
    if (response.error) {
      throw new SensorObservationPersistenceError(response.error.message ?? 'Sensor observation persistence failed', {
        code: response.error.code,
        details: response.error.details,
        hint: response.error.hint,
      })
    }
    if (!response.data || typeof response.data !== 'object') {
      throw new SensorObservationPersistenceError('Sensor persistence RPC returned no verification result')
    }
    return response.data as PersistedSensorBatchCounts
  }
}

export class InMemorySensorObservationStore implements SensorObservationStore {
  readonly runs = new Map<string, SensorIngestionBatch>()
  readonly observations = new Map<string, SensorObservation>()

  async persistBatch(batch: SensorIngestionBatch): Promise<PersistedSensorBatchCounts> {
    assertBatch(batch)
    const existing = this.runs.get(batch.idempotencyKey)
    if (existing && !sameSensorContent(existing, batch)) {
      throw new SensorObservationPersistenceError('Sensor run idempotency key was reused with different content')
    }
    for (const observation of batch.observations) {
      const prior = this.observations.get(observation.idempotencyKey)
      if (prior && !sameObservationContent(prior, observation)) {
        throw new SensorObservationPersistenceError('Sensor observation idempotency key was reused with different content')
      }
    }
    if (!existing) this.runs.set(batch.idempotencyKey, structuredClone(batch))
    for (const observation of batch.observations) {
      if (!this.observations.has(observation.idempotencyKey)) {
        this.observations.set(observation.idempotencyKey, structuredClone(observation))
      }
    }
    return {
      disposition: existing ? 'reused' : 'created',
      runCount: 1,
      observationCount: batch.observations.length,
    }
  }
}

function assertBatch(batch: SensorIngestionBatch): void {
  if (!batch.idempotencyKey.trim() || !batch.sensorRunId.trim() || batch.observations.length > 100) {
    throw new ContractValidationError('Sensor persistence batch requires stable IDs and at most 100 observations')
  }
  if (!/^[a-f0-9]{64}$/.test(batch.checksum)) {
    throw new ContractValidationError('Sensor persistence batch requires a SHA-256 checksum')
  }
  for (const observation of batch.observations) {
    if (
      observation.sensorName !== batch.sensorName
      || observation.sensorRunId !== batch.sensorRunId
      || observation.provenanceMode !== batch.provenanceMode
    ) {
      throw new ContractValidationError('Sensor observation does not match its ingestion batch')
    }
  }
}

function mapBatch(batch: SensorIngestionBatch): Record<string, unknown> {
  return {
    id: batch.sensorRunId,
    sensor_name: batch.sensorName,
    provenance_mode: batch.provenanceMode,
    observed_at: batch.observedAt,
    source_generated_at: batch.sourceGeneratedAt,
    checksum: batch.checksum,
    health_status: batch.healthStatus,
    source_health: batch.sourceHealth,
    observation_count: batch.observations.length,
    idempotency_key: batch.idempotencyKey,
    correlation_id: batch.correlation.correlationId,
    causation_id: batch.correlation.causationId,
  }
}

function mapObservation(observation: SensorObservation): Record<string, unknown> {
  return {
    id: observation.id,
    sensor_run_id: observation.sensorRunId,
    sensor_name: observation.sensorName,
    observation_type: observation.observationType,
    source_record_id: observation.sourceRecordId,
    provenance_mode: observation.provenanceMode,
    observed_at: observation.observedAt,
    source_generated_at: observation.sourceGeneratedAt,
    checksum: observation.checksum,
    payload: observation.payload,
    source_refs: observation.sourceRefs,
    source_health: observation.sourceHealth,
    idempotency_key: observation.idempotencyKey,
    correlation_id: observation.correlation.correlationId,
    causation_id: observation.correlation.causationId,
  }
}

function sameSensorContent(left: SensorIngestionBatch, right: SensorIngestionBatch): boolean {
  return JSON.stringify({
    sensorName: left.sensorName,
    sensorRunId: left.sensorRunId,
    provenanceMode: left.provenanceMode,
    sourceGeneratedAt: left.sourceGeneratedAt,
    checksum: left.checksum,
    observationKeys: left.observations.map((item) => item.idempotencyKey),
  }) === JSON.stringify({
    sensorName: right.sensorName,
    sensorRunId: right.sensorRunId,
    provenanceMode: right.provenanceMode,
    sourceGeneratedAt: right.sourceGeneratedAt,
    checksum: right.checksum,
    observationKeys: right.observations.map((item) => item.idempotencyKey),
  })
}

function sameObservationContent(left: SensorObservation, right: SensorObservation): boolean {
  return JSON.stringify({
    sensorName: left.sensorName,
    sensorRunId: left.sensorRunId,
    observationType: left.observationType,
    sourceRecordId: left.sourceRecordId,
    provenanceMode: left.provenanceMode,
    sourceGeneratedAt: left.sourceGeneratedAt,
    checksum: left.checksum,
    payload: left.payload,
    sourceRefs: left.sourceRefs,
  }) === JSON.stringify({
    sensorName: right.sensorName,
    sensorRunId: right.sensorRunId,
    observationType: right.observationType,
    sourceRecordId: right.sourceRecordId,
    provenanceMode: right.provenanceMode,
    sourceGeneratedAt: right.sourceGeneratedAt,
    checksum: right.checksum,
    payload: right.payload,
    sourceRefs: right.sourceRefs,
  })
}

export class SensorObservationPersistenceError extends Error {
  readonly code = 'SENSOR_OBSERVATION_PERSISTENCE_FAILED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'SensorObservationPersistenceError'
    this.details = details
  }
}
