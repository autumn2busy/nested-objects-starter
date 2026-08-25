import type {
  ModelRuntimeConfiguration,
  RuntimeConfiguration,
  RuntimeEnvironment,
  RuntimeMode,
  WorkflowProvider,
} from './contracts.js'
import { ContractValidationError } from './contracts.js'

export type RuntimeEnvironmentVariables = Record<string, string | undefined>

const ENVIRONMENTS = new Set<RuntimeEnvironment>(['test', 'development', 'preview', 'production'])
const MODES = new Set<RuntimeMode>(['dry_run', 'observe_only'])
const WORKFLOW_PROVIDERS = new Set<WorkflowProvider>(['in_memory', 'vercel_workflow'])

function optionalString(value: string | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function requiredString(value: string | undefined, name: string): string {
  const normalized = optionalString(value)
  if (!normalized) throw new ContractValidationError(`${name} is required`, { name })
  return normalized
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  throw new ContractValidationError('Boolean environment variable has an invalid value', { value })
}

function parseInteger(value: string | undefined, defaultValue: number, name: string): number {
  if (value === undefined || value.trim() === '') return defaultValue
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ContractValidationError(`${name} must be a positive integer`, { name, value })
  }
  return parsed
}

export function getProcessEnvironment(): RuntimeEnvironmentVariables {
  const processLike = (globalThis as { process?: { env?: RuntimeEnvironmentVariables } }).process
  return processLike?.env ?? {}
}

export function loadRuntimeConfiguration(
  environment: RuntimeEnvironmentVariables = getProcessEnvironment(),
): RuntimeConfiguration {
  const runtimeEnvironment = (optionalString(environment.AGENT_RUNTIME_ENV) ?? 'development') as RuntimeEnvironment
  if (!ENVIRONMENTS.has(runtimeEnvironment)) {
    throw new ContractValidationError('AGENT_RUNTIME_ENV is invalid', { runtimeEnvironment })
  }

  const mode = (optionalString(environment.AGENT_RUNTIME_MODE) ?? 'dry_run') as RuntimeMode
  if (!MODES.has(mode)) throw new ContractValidationError('AGENT_RUNTIME_MODE is invalid', { mode })

  const workflowProvider = (optionalString(environment.AGENT_WORKFLOW_PROVIDER) ?? 'in_memory') as WorkflowProvider
  if (!WORKFLOW_PROVIDERS.has(workflowProvider)) {
    throw new ContractValidationError('AGENT_WORKFLOW_PROVIDER is invalid', { workflowProvider })
  }

  const mutationsEnabled = parseBoolean(environment.AGENT_MUTATIONS_ENABLED, false)
  if (mutationsEnabled) {
    throw new ContractValidationError(
      'Phase B forbids AGENT_MUTATIONS_ENABLED=true. Consequential actions must stop at a reviewable proposal.',
    )
  }

  const supabaseUrl = optionalString(environment.SUPABASE_URL)
  const supabaseServiceRoleKey = optionalString(environment.SUPABASE_SERVICE_ROLE_KEY)
  if (Boolean(supabaseUrl) !== Boolean(supabaseServiceRoleKey)) {
    throw new ContractValidationError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured together')
  }
  if (runtimeEnvironment === 'production' && (!supabaseUrl || !supabaseServiceRoleKey)) {
    throw new ContractValidationError('Production runtime requires server-only Supabase credentials')
  }

  const modelExecutionEnabled = parseBoolean(environment.AGENT_MODEL_EXECUTION_ENABLED, false)
  const openAiApiKey = optionalString(environment.OPENAI_API_KEY)
  let model: ModelRuntimeConfiguration | null = null
  if (modelExecutionEnabled) {
    if (!openAiApiKey) throw new ContractValidationError('OPENAI_API_KEY is required when model execution is enabled')
    model = {
      provider: 'openai',
      model: requiredString(environment.OPENAI_AGENT_MODEL, 'OPENAI_AGENT_MODEL'),
      maxTurns: parseInteger(environment.OPENAI_AGENT_MAX_TURNS, 4, 'OPENAI_AGENT_MAX_TURNS'),
      modelExecutionEnabled: true,
      persistPrivateReasoning: false,
    }
  }

  return {
    environment: runtimeEnvironment,
    mode,
    mutationsEnabled: false,
    workflowProvider,
    runtimeVersion: optionalString(environment.AGENT_RUNTIME_VERSION) ?? 'phase-b-v1',
    traceNamespace: optionalString(environment.AGENT_TRACE_NAMESPACE) ?? 'nested-objects-intelligence-os',
    supabaseUrl,
    supabaseServiceRoleKey,
    openAiApiKey,
    model,
  }
}
