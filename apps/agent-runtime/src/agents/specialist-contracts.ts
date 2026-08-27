import type {
  CorrelationContext,
  EvidenceReference,
  IntelligenceSignal,
  ProposedAction,
  SourceReference,
  ToolCallSummary,
} from '../contracts.js'

export const CORE_AGENT_VERSION = 'phase-c4-v1' as const

export interface AgentRecommendation {
  id: string
  domain: string
  title: string
  summary: string
  priority: number
  evidenceReferences: SourceReference[]
  recommendedFollowUp: string | null
}

export interface AutumnDecision {
  id: string
  decisionType: 'approve_action' | 'choose_direction' | 'review_evidence'
  title: string
  summary: string
  priority: number
  actionId: string | null
  evidenceReferences: SourceReference[]
}

export interface DeterministicAgentResult<TData extends Record<string, unknown>> {
  agentName: string
  version: typeof CORE_AGENT_VERSION
  status: 'completed' | 'quiet' | 'blocked'
  summary: string
  data: TData
  signals: IntelligenceSignal[]
  recommendations: AgentRecommendation[]
  proposedActions: ProposedAction[]
  autumnDecisions: AutumnDecision[]
  evidence: EvidenceReference[]
  sourceRefs: SourceReference[]
  conciseRationale: string
  toolCalls: ToolCallSummary[]
  inputTokens: null
  outputTokens: null
  estimatedCost: null
  modelUsed: false
  mutationsPerformed: false
  correlation: CorrelationContext
}

export function deterministicResult<TData extends Record<string, unknown>>(
  input: Omit<
    DeterministicAgentResult<TData>,
    | 'version'
    | 'toolCalls'
    | 'inputTokens'
    | 'outputTokens'
    | 'estimatedCost'
    | 'modelUsed'
    | 'mutationsPerformed'
  > & { toolCalls?: ToolCallSummary[] },
): DeterministicAgentResult<TData> {
  return {
    ...input,
    version: CORE_AGENT_VERSION,
    toolCalls: input.toolCalls ?? [],
    inputTokens: null,
    outputTokens: null,
    estimatedCost: null,
    modelUsed: false,
    mutationsPerformed: false,
  }
}

export function uniqueSourceReferences(sourceRefs: SourceReference[]): SourceReference[] {
  const seen = new Set<string>()
  return sourceRefs.filter((sourceRef) => {
    const key = [
      sourceRef.sourceSystem,
      sourceRef.sourceType,
      sourceRef.sourceId ?? '',
      sourceRef.uri ?? '',
      sourceRef.checksum ?? '',
    ].join(':')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
