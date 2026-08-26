import type { WorkflowInvocation, WorkflowStartResult } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import { InMemoryIdempotencyStore, runIdempotently } from '../idempotency.js'
import type {
  DurableWorkflowPort,
  WorkflowHandler,
  WorkflowRunSnapshot,
} from './port.js'

export class InMemoryDurableWorkflowPort implements DurableWorkflowPort {
  readonly provider = 'in_memory'

  private readonly handlers = new Map<string, WorkflowHandler>()
  private readonly runs = new Map<string, WorkflowRunSnapshot>()
  private readonly idempotency = new InMemoryIdempotencyStore()

  register<
    TPayload extends Record<string, unknown>,
    TResult extends Record<string, unknown>,
  >(workflowName: string, handler: WorkflowHandler<TPayload, TResult>): void {
    if (!workflowName.trim()) throw new ContractValidationError('workflowName is required')
    if (this.handlers.has(workflowName)) {
      throw new ContractValidationError(`Workflow ${workflowName} is already registered`)
    }
    this.handlers.set(workflowName, handler as WorkflowHandler)
  }

  async start<TPayload extends Record<string, unknown>>(
    invocation: WorkflowInvocation<TPayload>,
  ): Promise<WorkflowStartResult> {
    const handler = this.handlers.get(invocation.workflowName)
    if (!handler) throw new ContractValidationError(`Workflow ${invocation.workflowName} is not registered`)

    const idempotent = await runIdempotently(this.idempotency, invocation.idempotencyKey, async () => {
      const workflowRunId = crypto.randomUUID()
      const startedAt = new Date().toISOString()
      this.runs.set(workflowRunId, {
        workflowRunId,
        workflowName: invocation.workflowName,
        state: 'running',
        result: null,
        errorCode: null,
        startedAt,
        completedAt: null,
        correlation: structuredClone(invocation.correlation),
      })

      try {
        const result = await handler(invocation as WorkflowInvocation)
        this.runs.set(workflowRunId, {
          workflowRunId,
          workflowName: invocation.workflowName,
          state: 'succeeded',
          result: structuredClone(result),
          errorCode: null,
          startedAt,
          completedAt: new Date().toISOString(),
          correlation: structuredClone(invocation.correlation),
        })
      } catch (error) {
        const errorCode = error instanceof Error && 'code' in error ? String(error.code) : 'WORKFLOW_FAILED'
        this.runs.set(workflowRunId, {
          workflowRunId,
          workflowName: invocation.workflowName,
          state: 'failed',
          result: null,
          errorCode,
          startedAt,
          completedAt: new Date().toISOString(),
          correlation: structuredClone(invocation.correlation),
        })
      }

      return { workflowRunId }
    })

    const workflowRunId = idempotent.result?.workflowRunId
    if (typeof workflowRunId !== 'string') {
      throw new ContractValidationError('Duplicate workflow invocation is still processing or failed without a reusable run id', {
        idempotencyKey: invocation.idempotencyKey,
        state: idempotent.state,
      })
    }

    return {
      workflowRunId,
      status: 'running',
      acceptedAt: new Date().toISOString(),
      correlation: structuredClone(invocation.correlation),
    }
  }

  async get<TResult extends Record<string, unknown>>(
    workflowRunId: string,
  ): Promise<WorkflowRunSnapshot<TResult> | null> {
    const run = this.runs.get(workflowRunId) as WorkflowRunSnapshot<TResult> | undefined
    return run ? structuredClone(run) : null
  }
}
