import type { CorrelationContext, WorkflowInvocation, WorkflowStartResult } from '../contracts.js'

export type WorkflowRunState = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'

export interface WorkflowRunSnapshot<TResult extends Record<string, unknown> = Record<string, unknown>> {
  workflowRunId: string
  workflowName: string
  state: WorkflowRunState
  result: TResult | null
  errorCode: string | null
  startedAt: string
  completedAt: string | null
  correlation: CorrelationContext
}

export type WorkflowHandler<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TResult extends Record<string, unknown> = Record<string, unknown>,
> = (invocation: WorkflowInvocation<TPayload>) => Promise<TResult>

export interface DurableWorkflowPort {
  readonly provider: string
  register<
    TPayload extends Record<string, unknown>,
    TResult extends Record<string, unknown>,
  >(workflowName: string, handler: WorkflowHandler<TPayload, TResult>): void
  start<TPayload extends Record<string, unknown>>(
    invocation: WorkflowInvocation<TPayload>,
  ): Promise<WorkflowStartResult>
  get<TResult extends Record<string, unknown>>(
    workflowRunId: string,
  ): Promise<WorkflowRunSnapshot<TResult> | null>
}

export interface VercelWorkflowExtensionBoundary {
  provider: 'vercel_workflow'
  packageName: 'workflow'
  integrationRule: 'orchestrate_in_workflow_execute_node_code_in_steps'
  queueRule: 'add_vercel_queues_only_for_true_fan_out'
}

export const VERCEL_WORKFLOW_EXTENSION_BOUNDARY: VercelWorkflowExtensionBoundary = {
  provider: 'vercel_workflow',
  packageName: 'workflow',
  integrationRule: 'orchestrate_in_workflow_execute_node_code_in_steps',
  queueRule: 'add_vercel_queues_only_for_true_fan_out',
}
