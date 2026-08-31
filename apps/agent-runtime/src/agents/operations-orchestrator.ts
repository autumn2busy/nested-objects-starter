import type {
  AgentTask,
  CorrelationContext,
  ExperimentReference,
  IntelligenceSignal,
  MetricSnapshot,
  ProposedAction,
  SourceReference,
} from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import { evaluateActionPolicy } from '../policy.js'
import { stableUuid } from '../stable-id.js'
import {
  runGrowthAgent,
  type GrowthAgentInput,
  type GrowthAgentOutput,
} from './growth-agent.js'
import {
  runIndustryIntelligenceAgent,
  type IndustryIntelligenceAgentInput,
  type IndustryIntelligenceAgentOutput,
} from './industry-intelligence-agent.js'
import {
  runMarketingAgent,
  type MarketingAgentInput,
  type MarketingAgentOutput,
  type MarketingExperimentProposal,
} from './marketing-agent.js'
import {
  runRevenueAgent,
  type RevenueAgentInput,
  type RevenueAgentOutput,
} from './revenue-agent.js'
import {
  CORE_AGENT_VERSION,
  deterministicResult,
  type AutumnDecision,
  type DeterministicAgentResult,
  uniqueSourceReferences,
} from './specialist-contracts.js'

export interface OperationsOrchestratorSpecialistInputs {
  revenue?: Omit<RevenueAgentInput, 'correlation'>
  growth?: Omit<GrowthAgentInput, 'revenue' | 'correlation'>
  industry?: Omit<IndustryIntelligenceAgentInput, 'correlation'>
  marketing?: Omit<MarketingAgentInput, 'revenue' | 'growth' | 'correlation'>
}

export interface OperationsOrchestratorInput {
  workflowName: string
  idempotencyKey: string
  specialists: OperationsOrchestratorSpecialistInputs
  persistedSignals: IntelligenceSignal[]
  persistedMetrics: MetricSnapshot[]
  experiments: ExperimentReference[]
  tasks: AgentTask[]
  priorActions: ProposedAction[]
  stateStore: OperationsOrchestratorStateStore
  correlation: CorrelationContext
  observedAt?: string
  maximumPriorities?: number
}

export interface OrchestratorPriority {
  rank: number
  signalId: string
  fingerprint: string
  title: string
  summary: string
  domain: string
  score: number
  priority: number
  confidence: number
  evidenceReferences: SourceReference[]
  recommendedFollowUp: string | null
  correlation: CorrelationContext
}

export interface OrchestratorTaskDraft {
  id: string
  taskType: 'investigate_signal'
  assignedAgent: string
  status: 'pending'
  priority: number
  signalId: string
  conciseRationale: string
  idempotencyKey: string
  correlation: CorrelationContext
}

export interface OrchestratorOperationalState {
  workflowName: string
  version: typeof CORE_AGENT_VERSION
  idempotencyKey: string
  status: 'completed' | 'quiet' | 'blocked'
  inputSummary: {
    persistedSignalCount: number
    persistedMetricCount: number
    experimentCount: number
    taskCount: number
    priorActionCount: number
  }
  specialistStatuses: Record<string, 'completed' | 'quiet' | 'blocked' | 'not_invoked'>
  priorities: OrchestratorPriority[]
  taskDrafts: OrchestratorTaskDraft[]
  experimentProposalIds: string[]
  proposedActionIds: string[]
  autumnDecisionIds: string[]
  persistedAt: string
  correlation: CorrelationContext
}

export interface OperationsOrchestratorStateStore {
  persist(state: OrchestratorOperationalState): Promise<'created' | 'reused'>
}

export class InMemoryOperationsOrchestratorStateStore implements OperationsOrchestratorStateStore {
  readonly states = new Map<string, OrchestratorOperationalState>()

  async persist(state: OrchestratorOperationalState): Promise<'created' | 'reused'> {
    const existing = this.states.get(state.idempotencyKey)
    if (existing) {
      if (JSON.stringify(withoutTimestamp(existing)) !== JSON.stringify(withoutTimestamp(state))) {
        throw new ContractValidationError('Orchestrator idempotency key was reused with different operational state')
      }
      return 'reused'
    }
    this.states.set(state.idempotencyKey, structuredClone(state))
    return 'created'
  }
}

export interface OperationsOrchestratorData extends Record<string, unknown> {
  priorities: OrchestratorPriority[]
  taskDrafts: OrchestratorTaskDraft[]
  experimentProposals: MarketingExperimentProposal[]
  specialistOutputs: {
    revenue: RevenueAgentOutput | null
    growth: GrowthAgentOutput | null
    industry: IndustryIntelligenceAgentOutput | null
    marketing: MarketingAgentOutput | null
  }
  operationalState: OrchestratorOperationalState
  persistenceDisposition: 'created' | 'reused'
  quiet: boolean
}

export type OperationsOrchestratorOutput = DeterministicAgentResult<OperationsOrchestratorData>

export async function runOperationsOrchestrator(
  input: OperationsOrchestratorInput,
): Promise<OperationsOrchestratorOutput> {
  assertOrchestratorInput(input)
  const observedAt = input.observedAt ?? new Date().toISOString()
  const revenue = input.specialists.revenue
    ? runRevenueAgent({ ...input.specialists.revenue, correlation: input.correlation, observedAt })
    : null
  const growth = input.specialists.growth && revenue
    ? runGrowthAgent({
      ...input.specialists.growth,
      metrics: mergeMetrics(input.specialists.growth.metrics, input.persistedMetrics),
      revenue,
      correlation: input.correlation,
      observedAt,
    })
    : null
  const industry = input.specialists.industry
    ? runIndustryIntelligenceAgent({ ...input.specialists.industry, correlation: input.correlation, observedAt })
    : null
  const marketing = input.specialists.marketing && revenue && growth
    ? runMarketingAgent({ ...input.specialists.marketing, revenue, growth, correlation: input.correlation, observedAt })
    : null
  const missingDependencies = dependencyFailures(input.specialists, { revenue, growth, marketing })
  const allSignals = deduplicateSignals([
    ...input.persistedSignals,
    ...(revenue?.signals ?? []),
    ...(growth?.signals ?? []),
    ...(industry?.signals ?? []),
    ...(marketing?.signals ?? []),
  ])
  const maximumPriorities = Math.min(3, input.maximumPriorities ?? 3)
  const priorities = allSignals
    .filter(isMeaningfulSignal)
    .sort(compareSignalPriority)
    .slice(0, maximumPriorities)
    .map((signal, index) => priorityFromSignal(signal, index + 1))
  const taskDrafts = priorities
    .filter((priority) => !hasOpenTask(priority.signalId, input.tasks))
    .map(taskFromPriority)
  const proposedActions = enforceActionPolicy(marketing?.proposedActions ?? [])
    .filter((action) => !hasCurrentAction(action.idempotencyKey, input.priorActions))
  const experimentProposals = (marketing?.data.experiments ?? [])
    .filter((proposal) => !hasCurrentExperiment(proposal, input.experiments))
  const autumnDecisions = meaningfulDecisions(priorities, proposedActions, marketing?.autumnDecisions ?? [])
  const status = missingDependencies.length > 0
    ? 'blocked' as const
    : priorities.length === 0 && proposedActions.length === 0
      ? 'quiet' as const
      : 'completed' as const
  const operationalState: OrchestratorOperationalState = {
    workflowName: input.workflowName,
    version: CORE_AGENT_VERSION,
    idempotencyKey: input.idempotencyKey,
    status,
    inputSummary: {
      persistedSignalCount: input.persistedSignals.length,
      persistedMetricCount: input.persistedMetrics.length,
      experimentCount: input.experiments.length,
      taskCount: input.tasks.length,
      priorActionCount: input.priorActions.length,
    },
    specialistStatuses: {
      revenue: revenue?.status ?? 'not_invoked',
      growth: growth?.status ?? 'not_invoked',
      industry: industry?.status ?? 'not_invoked',
      marketing: marketing?.status ?? 'not_invoked',
    },
    priorities,
    taskDrafts,
    experimentProposalIds: experimentProposals.map((experiment) => experiment.id),
    proposedActionIds: proposedActions.map((action) => action.id),
    autumnDecisionIds: autumnDecisions.map((decision) => decision.id),
    persistedAt: observedAt,
    correlation: input.correlation,
  }
  const persistenceDisposition = await input.stateStore.persist(operationalState)
  const sourceRefs = uniqueSourceReferences(priorities.flatMap((priority) => priority.evidenceReferences))

  return deterministicResult({
    agentName: 'operations-orchestrator',
    status,
    summary: status === 'blocked'
      ? `Specialist dependency requirements were not met: ${missingDependencies.join(', ')}.`
      : status === 'quiet'
        ? 'No meaningful priority or owner decision met the operating threshold.'
        : `Ranked ${priorities.length} operating priorities and surfaced ${autumnDecisions.length} decisions for Autumn.`,
    data: {
      priorities,
      taskDrafts,
      experimentProposals,
      specialistOutputs: { revenue, growth, industry, marketing },
      operationalState,
      persistenceDisposition,
      quiet: status === 'quiet',
    },
    signals: allSignals,
    recommendations: priorities.map((priority) => ({
      id: stableUuid('operations-orchestrator-recommendation', priority.fingerprint),
      domain: priority.domain,
      title: priority.title,
      summary: priority.summary,
      priority: priority.priority,
      evidenceReferences: priority.evidenceReferences,
      recommendedFollowUp: priority.recommendedFollowUp,
    })),
    proposedActions,
    autumnDecisions,
    evidence: priorities.flatMap((priority) => {
      const signal = allSignals.find((candidate) => candidate.id === priority.signalId)
      return signal?.evidence ?? []
    }),
    sourceRefs,
    conciseRationale: 'The orchestrator invokes typed deterministic specialists, ranks only evidence-backed unresolved signals, enforces action policy, persists bounded operational state, and stays quiet when nothing material changed.',
    correlation: input.correlation,
  })
}

function assertOrchestratorInput(input: OperationsOrchestratorInput): void {
  if (!input.workflowName.trim() || !input.idempotencyKey.trim()) {
    throw new ContractValidationError('Orchestrator workflowName and idempotencyKey are required')
  }
  if (
    input.maximumPriorities !== undefined
    && (!Number.isInteger(input.maximumPriorities) || input.maximumPriorities < 1)
  ) {
    throw new ContractValidationError('maximumPriorities must be a positive integer')
  }
  if (input.persistedSignals.length > 5_000 || input.persistedMetrics.length > 25_000) {
    throw new ContractValidationError('Orchestrator persisted input bounds were exceeded')
  }
}

function dependencyFailures(
  inputs: OperationsOrchestratorSpecialistInputs,
  outputs: { revenue: RevenueAgentOutput | null; growth: GrowthAgentOutput | null; marketing: MarketingAgentOutput | null },
): string[] {
  const failures: string[] = []
  if (inputs.growth && !outputs.revenue) failures.push('growth requires Revenue Agent financial truth')
  if (inputs.marketing && (!outputs.revenue || !outputs.growth)) {
    failures.push('marketing requires Revenue and Growth outputs')
  }
  return failures
}

function deduplicateSignals(signals: IntelligenceSignal[]): IntelligenceSignal[] {
  const byFingerprint = new Map<string, IntelligenceSignal>()
  for (const signal of signals) {
    if (!['new', 'investigating'].includes(signal.status)) continue
    const existing = byFingerprint.get(signal.fingerprint)
    if (!existing || compareSignalPriority(signal, existing) < 0) byFingerprint.set(signal.fingerprint, signal)
  }
  const byMetricSubject = new Map<string, IntelligenceSignal>()
  const withoutMetricSubject: IntelligenceSignal[] = []
  for (const signal of byFingerprint.values()) {
    const metricSubject = signal.affectedEntities.find((entity) => (
      entity.entityType === 'metric' && typeof entity.metricName === 'string'
    ))
    if (!metricSubject) {
      withoutMetricSubject.push(signal)
      continue
    }
    const key = `metric:${String(metricSubject.metricName)}:${String(metricSubject.scopeKey ?? 'global')}`
    const existing = byMetricSubject.get(key)
    if (!existing || compareSignalPriority(signal, existing) < 0) byMetricSubject.set(key, signal)
  }
  return [...withoutMetricSubject, ...byMetricSubject.values()]
}

function isMeaningfulSignal(signal: IntelligenceSignal): boolean {
  return signal.priority >= 60 && signal.confidence >= 0.6
}

function compareSignalPriority(left: IntelligenceSignal, right: IntelligenceSignal): number {
  const scoreDifference = signalScore(right) - signalScore(left)
  return scoreDifference !== 0 ? scoreDifference : left.fingerprint.localeCompare(right.fingerprint)
}

function signalScore(signal: IntelligenceSignal): number {
  const severityWeight: Record<IntelligenceSignal['severity'], number> = {
    info: 0,
    low: 3,
    medium: 7,
    high: 12,
    critical: 18,
  }
  return signal.priority * signal.confidence + severityWeight[signal.severity]
}

function priorityFromSignal(signal: IntelligenceSignal, rank: number): OrchestratorPriority {
  return {
    rank,
    signalId: signal.id,
    fingerprint: signal.fingerprint,
    title: signal.title,
    summary: signal.summary,
    domain: signal.domain,
    score: signalScore(signal),
    priority: signal.priority,
    confidence: signal.confidence,
    evidenceReferences: signal.sourceRefs,
    recommendedFollowUp: signal.recommendedFollowUp,
    correlation: signal.correlation,
  }
}

function taskFromPriority(priority: OrchestratorPriority): OrchestratorTaskDraft {
  return {
    id: stableUuid('operations-orchestrator-task', priority.fingerprint),
    taskType: 'investigate_signal',
    assignedAgent: agentForDomain(priority.domain),
    status: 'pending',
    priority: priority.priority,
    signalId: priority.signalId,
    conciseRationale: priority.recommendedFollowUp ?? priority.summary,
    idempotencyKey: `orchestrator-task:${priority.fingerprint}`,
    correlation: priorityCorrelation(priority),
  }
}

function mergeMetrics(primary: MetricSnapshot[], persisted: MetricSnapshot[]): MetricSnapshot[] {
  const byIdempotencyKey = new Map<string, MetricSnapshot>()
  for (const metric of [...persisted, ...primary]) byIdempotencyKey.set(metric.idempotencyKey, metric)
  return [...byIdempotencyKey.values()]
}

function hasOpenTask(signalId: string, tasks: AgentTask[]): boolean {
  return tasks.some((task) => (
    task.signalId === signalId
    && ['pending', 'queued', 'running', 'blocked'].includes(task.status)
  ))
}

function hasCurrentExperiment(
  proposal: MarketingExperimentProposal,
  experiments: ExperimentReference[],
): boolean {
  return experiments.some((experiment) => (
    experiment.name.trim().toLowerCase() === proposal.name.trim().toLowerCase()
    && ['draft', 'planned', 'running', 'paused'].includes(experiment.status)
  ))
}

function hasCurrentAction(idempotencyKey: string, actions: ProposedAction[]): boolean {
  return actions.some((action) => (
    action.idempotencyKey === idempotencyKey
    && !['rejected', 'failed', 'cancelled', 'verified'].includes(action.status)
  ))
}

function agentForDomain(domain: string): string {
  if (domain === 'revenue') return 'revenue-agent'
  if (domain === 'growth') return 'growth-agent'
  if (domain === 'industry') return 'industry-intelligence-agent'
  if (domain === 'marketing') return 'marketing-agent'
  return 'operations-orchestrator'
}

function priorityCorrelation(priority: OrchestratorPriority): CorrelationContext {
  return {
    correlationId: priority.correlation.correlationId,
    causationId: priority.signalId,
    traceId: priority.correlation.traceId,
  }
}

function enforceActionPolicy(actions: ProposedAction[]): ProposedAction[] {
  return actions.map((action) => {
    const policy = evaluateActionPolicy(action.actionType)
    if (action.executorKey !== null || action.executionStartedAt !== null || action.executedAt !== null) {
      throw new ContractValidationError('Core agents may propose but never execute an action')
    }
    if (action.approvalRequired !== policy.approvalRequired || action.riskLevel !== policy.riskLevel) {
      throw new ContractValidationError('Proposed action does not match the fail-closed action policy')
    }
    if (policy.approvalRequired && !['proposed', 'awaiting_approval'].includes(action.status)) {
      throw new ContractValidationError('Consequential core-agent action must remain proposed or awaiting approval')
    }
    return action
  })
}

function meaningfulDecisions(
  priorities: OrchestratorPriority[],
  actions: ProposedAction[],
  specialistDecisions: AutumnDecision[],
): AutumnDecision[] {
  const actionIds = new Set(actions.filter((action) => action.approvalRequired).map((action) => action.id))
  const decisions = specialistDecisions.filter((decision) => decision.actionId && actionIds.has(decision.actionId))
  const existingSignals = new Set(decisions.flatMap((decision) => decision.evidenceReferences.map(sourceKey)))
  for (const priority of priorities.filter((candidate) => candidate.priority >= 90)) {
    if (priority.evidenceReferences.some((sourceRef) => existingSignals.has(sourceKey(sourceRef)))) continue
    decisions.push({
      id: stableUuid('operations-orchestrator-decision', priority.fingerprint),
      decisionType: 'review_evidence',
      title: priority.title,
      summary: priority.recommendedFollowUp ?? priority.summary,
      priority: priority.priority,
      actionId: null,
      evidenceReferences: priority.evidenceReferences,
    })
  }
  return decisions.sort((left, right) => right.priority - left.priority).slice(0, 3)
}

function sourceKey(sourceRef: SourceReference): string {
  return `${sourceRef.sourceSystem}:${sourceRef.sourceType}:${sourceRef.sourceId ?? ''}`
}

function withoutTimestamp(state: OrchestratorOperationalState): Omit<OrchestratorOperationalState, 'persistedAt'> {
  const { persistedAt: _persistedAt, ...comparable } = state
  return comparable
}
