import { ContractValidationError } from './contracts.js'

export type IdempotencyState = 'processing' | 'completed' | 'failed'

export interface IdempotencyRecord<TResult extends Record<string, unknown> = Record<string, unknown>> {
  key: string
  state: IdempotencyState
  acquiredAt: string
  completedAt: string | null
  result: TResult | null
  errorCode: string | null
}

export type IdempotencyBeginResult<TResult extends Record<string, unknown>> =
  | { acquired: true; record: IdempotencyRecord<TResult> }
  | { acquired: false; record: IdempotencyRecord<TResult> }

export interface IdempotencyStore {
  begin<TResult extends Record<string, unknown>>(key: string, now?: string): Promise<IdempotencyBeginResult<TResult>>
  complete<TResult extends Record<string, unknown>>(key: string, result: TResult, now?: string): Promise<void>
  fail(key: string, errorCode: string, now?: string): Promise<void>
  get<TResult extends Record<string, unknown>>(key: string): Promise<IdempotencyRecord<TResult> | null>
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>()

  async begin<TResult extends Record<string, unknown>>(
    key: string,
    now = new Date().toISOString(),
  ): Promise<IdempotencyBeginResult<TResult>> {
    assertKey(key)
    const existing = this.records.get(key) as IdempotencyRecord<TResult> | undefined
    if (existing) return { acquired: false, record: cloneRecord(existing) }

    const record: IdempotencyRecord<TResult> = {
      key,
      state: 'processing',
      acquiredAt: now,
      completedAt: null,
      result: null,
      errorCode: null,
    }
    this.records.set(key, record)
    return { acquired: true, record: cloneRecord(record) }
  }

  async complete<TResult extends Record<string, unknown>>(
    key: string,
    result: TResult,
    now = new Date().toISOString(),
  ): Promise<void> {
    const record = this.records.get(key)
    if (!record) throw new ContractValidationError('Cannot complete an idempotency key that was not acquired', { key })
    if (record.state === 'completed') return
    this.records.set(key, {
      ...record,
      state: 'completed',
      completedAt: now,
      result: structuredClone(result),
      errorCode: null,
    })
  }

  async fail(key: string, errorCode: string, now = new Date().toISOString()): Promise<void> {
    const record = this.records.get(key)
    if (!record) throw new ContractValidationError('Cannot fail an idempotency key that was not acquired', { key })
    if (!errorCode.trim()) throw new ContractValidationError('errorCode is required')
    this.records.set(key, {
      ...record,
      state: 'failed',
      completedAt: now,
      result: null,
      errorCode,
    })
  }

  async get<TResult extends Record<string, unknown>>(key: string): Promise<IdempotencyRecord<TResult> | null> {
    const record = this.records.get(key) as IdempotencyRecord<TResult> | undefined
    return record ? cloneRecord(record) : null
  }
}

export interface IdempotentRunResult<TResult extends Record<string, unknown>> {
  duplicate: boolean
  result: TResult | null
  state: IdempotencyState
}

export async function runIdempotently<TResult extends Record<string, unknown>>(
  store: IdempotencyStore,
  key: string,
  operation: () => Promise<TResult>,
): Promise<IdempotentRunResult<TResult>> {
  const begin = await store.begin<TResult>(key)
  if (!begin.acquired) {
    return {
      duplicate: true,
      result: begin.record.result,
      state: begin.record.state,
    }
  }

  try {
    const result = await operation()
    await store.complete(key, result)
    return { duplicate: false, result, state: 'completed' }
  } catch (error) {
    const errorCode = error instanceof Error && 'code' in error ? String(error.code) : 'UNHANDLED_ERROR'
    await store.fail(key, errorCode)
    throw error
  }
}

function assertKey(key: string): void {
  if (!key.trim()) throw new ContractValidationError('Idempotency key is required')
  if (key.length > 512) throw new ContractValidationError('Idempotency key exceeds 512 characters')
}

function cloneRecord<TResult extends Record<string, unknown>>(
  record: IdempotencyRecord<TResult>,
): IdempotencyRecord<TResult> {
  return structuredClone(record)
}
