export const SIGNAL_DOMAINS = [
  'growth',
  'revenue',
  'marketing',
  'seo',
  'aeo',
  'industry',
  'opportunity',
  'member_feedback',
  'product',
  'technical',
  'operations',
  'other',
] as const

export const METRIC_DOMAINS = [
  'growth',
  'revenue',
  'marketing',
  'product',
  'seo',
  'aeo',
  'industry',
  'opportunity',
  'operations',
  'technical',
  'other',
] as const

export const SIGNAL_SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const
export const SIGNAL_STATUSES = ['new', 'investigating', 'actioned', 'dismissed', 'resolved'] as const
export const TASK_STATUSES = ['pending', 'queued', 'running', 'succeeded', 'failed', 'cancelled', 'blocked', 'stale'] as const
export const RUN_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'cancelled', 'stale'] as const
export const ACTION_STATUSES = [
  'proposed',
  'awaiting_approval',
  'approved',
  'executing',
  'executed',
  'verified',
  'rejected',
  'failed',
  'cancelled',
] as const
export const METRIC_VALUE_STATES = ['known', 'partial', 'unknown', 'not_applicable'] as const
export const EXPERIMENT_ANALYSIS_STATES = ['insufficient_data', 'ready', 'conclusive', 'inconclusive'] as const

export type SignalDomain = (typeof SIGNAL_DOMAINS)[number]
export type MetricDomain = (typeof METRIC_DOMAINS)[number]
export type SignalSeverity = (typeof SIGNAL_SEVERITIES)[number]
export type SignalStatus = (typeof SIGNAL_STATUSES)[number]
export type TaskStatus = (typeof TASK_STATUSES)[number]
export type RunStatus = (typeof RUN_STATUSES)[number]
export type ActionStatus = (typeof ACTION_STATUSES)[number]
export type MetricValueState = (typeof METRIC_VALUE_STATES)[number]
export type ExperimentAnalysisState = (typeof EXPERIMENT_ANALYSIS_STATES)[number]
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type RuntimeEnvironment = 'test' | 'development' | 'preview' | 'production'
export type RuntimeMode = 'dry_run' | 'observe_only'
export type WorkflowProvider = 'in_memory' | 'vercel_workflow'

export interface CorrelationContext {
  correlationId: string
  causationId: string | null
  traceId: string | null
}

export interface SourceReference {
  sourceSystem: string
  sourceType: string
  sourceId?: string
  uri?: string
  observedAt?: string
  checksum?: string
  metadata?: Record<string, unknown>
}

export interface EvidenceReference {
  evidenceType: 'metric' | 'event' | 'document' | 'query' | 'observation' | 'test' | 'other'
  summary: string
  sourceRef: SourceReference
  value?: unknown
  confidence?: number
}

export interface IntelligenceSignal {
  id: string
  signalType: string
  domain: SignalDomain
  producer: string
  title: string
  summary: string
  evidence: EvidenceReference[]
  sourceRefs: SourceReference[]
  confidence: number
  severity: SignalSeverity
  priority: number
  businessImpact: string | null
  affectedEntities: Array<Record<string, unknown>>
  recommendedFollowUp: string | null
  fingerprint: string
  idempotencyKey: string | null
  status: SignalStatus
  firstDetectedAt: string
  lastDetectedAt: string
  correlation: CorrelationContext
}

export interface RetryPolicy {
  maxAttempts: number
  retryableCodes: string[]
  initialDelayMs: number
  maximumDelayMs: number
  backoffMultiplier: number
}

export interface OperationalError {
  code: string
  message: string
  retryable: boolean
  details: Record<string, unknown>
  occurredAt: string
}

export interface AgentEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  eventType: string
  producer: string
  subjectType: string
  subjectId: string | null
  payload: TPayload
  evidence: EvidenceReference[]
  sourceRefs: SourceReference[]
  confidence: number
  priority: number
  idempotencyKey: string | null
  createdAt: string
  updatedAt: string
  correlation: CorrelationContext
}

export interface AgentTask<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TOutput extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string
  taskType: string
  assignedAgent: string
  status: TaskStatus
  priority: number
  input: TInput
  output: TOutput | null
  conciseRationale: string | null
  parentTaskId: string | null
  signalId: string | null
  experimentId: string | null
  idempotencyKey: string
  attempts: number
  maxAttempts: number
  retryAfter: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  error: OperationalError | null
  correlation: CorrelationContext
}

export interface ApprovalRecord {
  approvedBy: string
  approvedAt: string
  approvalContext: Record<string, unknown>
}

export interface RejectionRecord {
  rejectedBy: string
  rejectedAt: string
  reason: string
}

export interface ProposedAction<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  actionType: string
  targetSystem: string
  requestedByAgent: string
  taskId: string | null
  runId: string | null
  experimentId: string | null
  signalIds: string[]
  payload: TPayload
  evidence: EvidenceReference[]
  sourceRefs: SourceReference[]
  conciseRationale: string
  riskLevel: RiskLevel
  approvalRequired: boolean
  status: ActionStatus
  approval: ApprovalRecord | null
  rejection: RejectionRecord | null
  executorKey: string | null
  executionGuardVersion: string
  executionStartedAt: string | null
  executedAt: string | null
  executionResult: Record<string, unknown> | null
  verificationStatus: 'not_started' | 'pending' | 'verified' | 'failed' | 'not_applicable'
  verifiedAt: string | null
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  correlation: CorrelationContext
}

export interface ToolCallSummary {
  toolName: string
  callId: string | null
  startedAt: string
  completedAt: string | null
  status: 'started' | 'succeeded' | 'failed'
  inputSummary: Record<string, unknown>
  outputSummary: Record<string, unknown> | null
  errorCode: string | null
}

export interface AgentRun<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TOutput extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string
  agentName: string
  workflowName: string
  workflowRunId: string | null
  durableWorkflowId: string | null
  taskId: string | null
  provider: string | null
  model: string | null
  runtimeVersion: string
  status: RunStatus
  input: TInput
  output: TOutput | null
  conciseRationale: string | null
  toolCalls: ToolCallSummary[]
  inputTokens: number | null
  outputTokens: number | null
  estimatedCost: number | null
  attempt: number
  maxAttempts: number
  retryAfter: string | null
  startedAt: string | null
  completedAt: string | null
  lastHeartbeatAt: string | null
  staleAfter: string | null
  durationMs: number | null
  error: OperationalError | null
  idempotencyKey: string
  correlation: CorrelationContext
}

export interface MetricSnapshot {
  metricDate: string
  metricName: string
  domain: MetricDomain
  scopeKey: string
  dimensions: Record<string, unknown>
  value: number | null
  valueState: MetricValueState
  unit: string
  numerator: number | null
  denominator: number | null
  observedRecords: number | null
  expectedRecords: number | null
  completeness: number
  confidence: number
  sourceSystem: string
  sourceRunId: string | null
  sourceRefs: SourceReference[]
  provenance: Record<string, unknown>
  idempotencyKey: string
  observedAt: string | null
  correlation: CorrelationContext
}

export interface ExperimentReference {
  id: string
  name: string
  status: 'draft' | 'planned' | 'running' | 'paused' | 'completed' | 'cancelled'
  primaryMetric: string
  minimumSampleSize: number
  minimumDurationDays: number
  observedSampleSize: number
  observedDurationDays: number
  analysisState: ExperimentAnalysisState
  correlationId: string
}

export interface SpecialistInput<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  taskId: string
  objective: string
  payload: TPayload
  evidence: EvidenceReference[]
  sourceRefs: SourceReference[]
  experiment: ExperimentReference | null
  correlation: CorrelationContext
}

export interface SpecialistFinding {
  findingType: string
  summary: string
  confidence: number
  severity: SignalSeverity
  evidenceIndexes: number[]
  recommendedFollowUp: string | null
}

export interface SpecialistOutput<TData extends Record<string, unknown> = Record<string, unknown>> {
  summary: string
  findings: SpecialistFinding[]
  data: TData
  proposedActions: Array<{
    actionType: string
    targetSystem: string
    conciseRationale: string
    payload: Record<string, unknown>
  }>
  evidence: EvidenceReference[]
  conciseRationale: string
  correlation: CorrelationContext
}

export interface AgentRegistration {
  name: string
  displayName: string
  description: string
  implementationStatus: 'foundation' | 'placeholder'
  riskBoundary: 'read_only' | 'analytical' | 'proposal_only'
  capabilities: string[]
  inputContract: string
  outputContract: string
  enabledByDefault: boolean
}

export interface WorkflowInvocation<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  workflowName: string
  workflowVersion: string
  invocationId: string
  idempotencyKey: string
  payload: TPayload
  requestedBy: string
  requestedAt: string
  retryPolicy: RetryPolicy
  correlation: CorrelationContext
}

export interface WorkflowStartResult {
  workflowRunId: string
  status: 'queued' | 'running'
  acceptedAt: string
  correlation: CorrelationContext
}

export interface ModelRuntimeConfiguration {
  provider: 'openai'
  model: string
  maxTurns: number
  modelExecutionEnabled: boolean
  persistPrivateReasoning: false
}

export interface RuntimeConfiguration {
  environment: RuntimeEnvironment
  mode: RuntimeMode
  mutationsEnabled: false
  workflowProvider: WorkflowProvider
  runtimeVersion: string
  traceNamespace: string
  supabaseUrl: string | null
  supabaseServiceRoleKey: string | null
  openAiApiKey: string | null
  model: ModelRuntimeConfiguration | null
}

export function createCorrelationContext(input: Partial<CorrelationContext> = {}): CorrelationContext {
  return {
    correlationId: input.correlationId ?? crypto.randomUUID(),
    causationId: input.causationId ?? null,
    traceId: input.traceId ?? null,
  }
}

export function childCorrelation(parent: CorrelationContext, causationId: string): CorrelationContext {
  assertUuid(causationId, 'causationId')
  return {
    correlationId: parent.correlationId,
    causationId,
    traceId: parent.traceId,
  }
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function assertUuid(value: string, fieldName: string): void {
  if (!isUuid(value)) throw new ContractValidationError(`${fieldName} must be a UUID`, { fieldName, value })
}

export function assertConfidence(value: number, fieldName = 'confidence'): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ContractValidationError(`${fieldName} must be between 0 and 1`, { fieldName, value })
  }
}

export function assertPriority(value: number, fieldName = 'priority'): void {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new ContractValidationError(`${fieldName} must be an integer between 0 and 100`, { fieldName, value })
  }
}

export function assertIntelligenceSignal(signal: IntelligenceSignal): void {
  assertUuid(signal.id, 'signal.id')
  assertUuid(signal.correlation.correlationId, 'signal.correlation.correlationId')
  if (signal.correlation.causationId) assertUuid(signal.correlation.causationId, 'signal.correlation.causationId')
  assertConfidence(signal.confidence)
  assertPriority(signal.priority)
  if (!SIGNAL_DOMAINS.includes(signal.domain)) {
    throw new ContractValidationError('Unsupported signal domain', { domain: signal.domain })
  }
  if (!SIGNAL_SEVERITIES.includes(signal.severity)) {
    throw new ContractValidationError('Unsupported signal severity', { severity: signal.severity })
  }
  if (!SIGNAL_STATUSES.includes(signal.status)) {
    throw new ContractValidationError('Unsupported signal status', { status: signal.status })
  }
  if (!signal.signalType.trim() || !signal.title.trim() || !signal.summary.trim()) {
    throw new ContractValidationError('Signal type, title, and summary are required')
  }
  if (!signal.fingerprint.trim()) throw new ContractValidationError('Signal fingerprint is required')
  if (Date.parse(signal.lastDetectedAt) < Date.parse(signal.firstDetectedAt)) {
    throw new ContractValidationError('Signal lastDetectedAt cannot precede firstDetectedAt')
  }
  signal.evidence.forEach((item, index) => {
    if (!item.summary.trim()) throw new ContractValidationError('Evidence summary is required', { index })
    if (item.confidence !== undefined) assertConfidence(item.confidence, `evidence[${index}].confidence`)
  })
}

export class ContractValidationError extends Error {
  readonly code = 'CONTRACT_VALIDATION_FAILED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ContractValidationError'
    this.details = details
  }
}
