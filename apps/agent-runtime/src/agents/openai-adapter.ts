import type {
  AgentRegistration,
  ModelRuntimeConfiguration,
  SpecialistInput,
  SpecialistOutput,
} from '../contracts.js'
import { assertConfidence, ContractValidationError } from '../contracts.js'

interface DynamicZod {
  string(): unknown
  number(): { min(value: number): { max(value: number): unknown } }
  unknown(): unknown
  array(value: unknown): unknown
  object(shape: Record<string, unknown>): unknown
  record(key: unknown, value: unknown): unknown
  nullable(value?: unknown): unknown
}

interface DynamicAgentsModule {
  Agent: new (configuration: Record<string, unknown>) => unknown
  run(
    agent: unknown,
    input: string,
    options?: Record<string, unknown>,
  ): Promise<{ finalOutput?: unknown }>
}

interface ModelFinding {
  findingType: string
  summary: string
  confidence: number
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  evidenceIndexes: number[]
  recommendedFollowUp: string | null
}

interface ModelOutput {
  summary: string
  findings: ModelFinding[]
  data: Record<string, unknown>
  proposedActions: Array<{
    actionType: string
    targetSystem: string
    conciseRationale: string
    payload: Record<string, unknown>
  }>
  conciseRationale: string
}

export interface OpenAiSpecialistAdapterConfiguration {
  registration: AgentRegistration
  model: ModelRuntimeConfiguration
}

export class OpenAiSpecialistAdapter {
  constructor(private readonly configuration: OpenAiSpecialistAdapterConfiguration) {}

  async run<TPayload extends Record<string, unknown>, TData extends Record<string, unknown>>(
    input: SpecialistInput<TPayload>,
  ): Promise<SpecialistOutput<TData>> {
    if (!this.configuration.model.modelExecutionEnabled) {
      throw new ModelExecutionDisabledError('OpenAI specialist execution is disabled by runtime configuration')
    }

    const agentsPackageName = '@openai/agents'
    const zodPackageName = 'zod'
    const [agentsModule, zodModule] = await Promise.all([
      import(agentsPackageName) as Promise<DynamicAgentsModule>,
      import(zodPackageName) as Promise<{ z?: DynamicZod } & DynamicZod>,
    ])
    const z = zodModule.z ?? zodModule
    const outputType = createOutputType(z)

    const agent = new agentsModule.Agent({
      name: this.configuration.registration.displayName,
      model: this.configuration.model.model,
      instructions: buildInstructions(this.configuration.registration),
      outputType,
      tools: [],
    })

    const result = await agentsModule.run(agent, JSON.stringify(toModelInput(input)), {
      maxTurns: this.configuration.model.maxTurns,
    })
    const parsed = assertModelOutput(result.finalOutput, input.evidence.length)

    return {
      summary: parsed.summary,
      findings: parsed.findings,
      data: parsed.data as TData,
      proposedActions: parsed.proposedActions,
      evidence: structuredClone(input.evidence),
      conciseRationale: parsed.conciseRationale,
      correlation: structuredClone(input.correlation),
    }
  }
}

function createOutputType(z: DynamicZod): unknown {
  const confidence = z.number().min(0).max(1)
  const nullableString = (z.string() as { nullable?: () => unknown }).nullable?.() ?? z.string()
  return z.object({
    summary: z.string(),
    findings: z.array(
      z.object({
        findingType: z.string(),
        summary: z.string(),
        confidence,
        severity: z.string(),
        evidenceIndexes: z.array(z.number()),
        recommendedFollowUp: nullableString,
      }),
    ),
    data: z.record(z.string(), z.unknown()),
    proposedActions: z.array(
      z.object({
        actionType: z.string(),
        targetSystem: z.string(),
        conciseRationale: z.string(),
        payload: z.record(z.string(), z.unknown()),
      }),
    ),
    conciseRationale: z.string(),
  })
}

function buildInstructions(registration: AgentRegistration): string {
  return [
    `You are the ${registration.displayName} within the Nested Objects Intelligence OS.`,
    registration.description,
    'Return only the requested structured output.',
    'Use only the supplied evidence and source references. Do not invent metrics, identifiers, revenue, membership state, or citations.',
    'Do not expose or store private chain-of-thought. Provide only concise operational rationale.',
    'Do not execute external mutations. Proposed actions are recommendations that must pass policy and approval gates.',
    'When evidence is incomplete, state the limitation and lower confidence instead of guessing.',
  ].join('\n')
}

function toModelInput<TPayload extends Record<string, unknown>>(
  input: SpecialistInput<TPayload>,
): Record<string, unknown> {
  return {
    taskId: input.taskId,
    objective: input.objective,
    payload: input.payload,
    evidence: input.evidence.map((evidence, index) => ({ index, ...evidence })),
    sourceRefs: input.sourceRefs,
    experiment: input.experiment,
    correlation: input.correlation,
  }
}

function assertModelOutput(value: unknown, evidenceCount: number): ModelOutput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ContractValidationError('OpenAI Agents SDK returned no structured specialist output')
  }
  const output = value as Partial<ModelOutput>
  if (typeof output.summary !== 'string' || typeof output.conciseRationale !== 'string') {
    throw new ContractValidationError('Specialist output is missing summary or conciseRationale')
  }
  if (!Array.isArray(output.findings) || !Array.isArray(output.proposedActions)) {
    throw new ContractValidationError('Specialist output is missing findings or proposedActions')
  }
  if (!output.data || typeof output.data !== 'object' || Array.isArray(output.data)) {
    throw new ContractValidationError('Specialist output data must be an object')
  }

  for (const finding of output.findings) {
    assertConfidence(finding.confidence, 'finding.confidence')
    if (!finding.evidenceIndexes.every((index) => Number.isInteger(index) && index >= 0 && index < evidenceCount)) {
      throw new ContractValidationError('Specialist finding references evidence outside the supplied evidence set')
    }
  }

  return output as ModelOutput
}

export class ModelExecutionDisabledError extends Error {
  readonly code = 'MODEL_EXECUTION_DISABLED'

  constructor(message: string) {
    super(message)
    this.name = 'ModelExecutionDisabledError'
  }
}
