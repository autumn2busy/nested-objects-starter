import { readFile } from 'node:fs/promises'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { start } from 'workflow/api'

import { parsePreviewEvaluationRequest } from '../src/http/preview-contract.js'
import {
  DurableWorkflowPersistenceError,
  InMemoryDurableWorkflowStore,
} from '../src/persistence/durable-workflow-store.js'
import { installDurableWorkflowTestContext } from '../src/runtime/durable-step-context.js'
import { createStagingDestinationFingerprint } from '../src/runtime/staging-destination.js'
import {
  lifecycleIntegrityStagingWorkflow,
  type LifecycleIntegrityStagingWorkflowInput,
} from './lifecycle-integrity.js'

const projectRef = 'syntheticstaging318'
const hostname = `${projectRef}.supabase.co`
const binding = {
  bindingKey: 'phase-c3-workflow-test',
  policyVersion: 'phase-c3-test',
  projectRef,
  hostname,
  destinationFingerprint: createStagingDestinationFingerprint({
    policyVersion: 'phase-c3-test',
    projectRef,
    hostname,
  }),
}

describe('lifecycleIntegrityStagingWorkflow', () => {
  let cleanup: (() => void) | null = null

  beforeEach(() => {
    process.env.VITEST = 'true'
  })

  afterEach(() => {
    cleanup?.()
    cleanup = null
  })

  it('executes real workflow directives and deduplicates a second delivery', async () => {
    const store = new InMemoryDurableWorkflowStore(binding)
    cleanup = installDurableWorkflowTestContext({ store, binding, runtimeVersion: 'phase-c3-test' })
    const input = await workflowInput('phase-c3:workflow-test:duplicate')

    const firstRun = await start(lifecycleIntegrityStagingWorkflow, [input])
    const first = await firstRun.returnValue
    expect(firstRun.runId).toMatch(/^wrun_/)
    expect(first.state).toBe('succeeded')
    expect(first.signalCount).toBe(first.persistedSignalCount)
    expect(first.verificationStatus).toBe('verified')

    const duplicateRun = await start(lifecycleIntegrityStagingWorkflow, [input])
    const duplicate = await duplicateRun.returnValue
    expect(duplicate.state).toBe('reused')
    expect(duplicate.agentRunId).toBe(first.agentRunId)
    expect(store.runsById.size).toBe(1)
    expect(store.persistedSignals.size).toBe(first.persistedSignalCount)
  })

  it('retries a transient bounded persistence step and resumes from completed evaluation output', async () => {
    const store = new FailOnceSignalStore(binding)
    cleanup = installDurableWorkflowTestContext({ store, binding, runtimeVersion: 'phase-c3-test' })
    const input = await workflowInput('phase-c3:workflow-test:resume')

    const run = await start(lifecycleIntegrityStagingWorkflow, [input])
    const result = await run.returnValue
    expect(result.state).toBe('succeeded')
    expect(store.persistAttempts).toBe(2)

    const runId = result.agentRunId
    const evaluation = store.steps.get(`${runId}:evaluate-lifecycle-integrity`)
    const persistence = store.steps.get(`${runId}:persist-lifecycle-signals`)
    expect(evaluation?.status).toBe('succeeded')
    expect(evaluation?.attempt).toBe(1)
    expect(persistence?.status).toBe('succeeded')
    expect(persistence?.attempt).toBe(2)
  })
})

class FailOnceSignalStore extends InMemoryDurableWorkflowStore {
  persistAttempts = 0

  override async persistSignals(
    runId: string,
    signals: Parameters<InMemoryDurableWorkflowStore['persistSignals']>[1],
  ): Promise<number> {
    this.persistAttempts += 1
    if (this.persistAttempts === 1) {
      throw new DurableWorkflowPersistenceError('Synthetic transient persistence failure')
    }
    return super.persistSignals(runId, signals)
  }
}

async function workflowInput(idempotencyKey: string): Promise<LifecycleIntegrityStagingWorkflowInput> {
  const source = await readFile(new URL('../fixtures/preview-evaluation.synthetic.json', import.meta.url), 'utf8')
  const fixture = parsePreviewEvaluationRequest(JSON.parse(source) as unknown)
  return {
    fixture,
    binding,
    idempotencyKey,
    requestedAt: '2026-08-27T12:00:00.000Z',
    correlation: {
      correlationId: '31800000-0000-5000-8000-000000000318',
      causationId: null,
      traceId: 'trace-phase-c3-workflow-test',
    },
  }
}
