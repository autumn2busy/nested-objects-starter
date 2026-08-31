import type { RuntimeEnvironmentVariables } from '../env.js'
import { loadDurableRuntimeConfiguration } from '../runtime/durable-runtime.js'
import { previewHealthSnapshot, type PreviewHealthSnapshot } from './preview-runtime.js'

export interface DurableHealthSnapshot {
  ok: boolean
  configurationValid: boolean
  service: 'nested-objects-agent-runtime'
  phase: 'phase-c3-durable-staging'
  environment: string
  mode: string
  persistenceEnabled: boolean
  modelExecutionEnabled: boolean
  mutationsEnabled: boolean
  workflowProvider: string
  tokenConfigured: boolean
  supabaseConfigured: boolean
  destinationReviewed: boolean
  databaseSentinelVerified: false
  vercelEnvironment: string | null
}

export function runtimeHealthSnapshot(
  environment: RuntimeEnvironmentVariables = process.env,
): PreviewHealthSnapshot | DurableHealthSnapshot {
  if (optionalString(environment.AGENT_WORKFLOW_PROVIDER) !== 'vercel_workflow') {
    return previewHealthSnapshot(environment)
  }

  let configurationValid = true
  try {
    loadDurableRuntimeConfiguration(environment)
  } catch {
    configurationValid = false
  }

  return {
    ok: configurationValid,
    configurationValid,
    service: 'nested-objects-agent-runtime',
    phase: 'phase-c3-durable-staging',
    environment: optionalString(environment.AGENT_RUNTIME_ENV) ?? 'unset',
    mode: optionalString(environment.AGENT_RUNTIME_MODE) ?? 'unset',
    persistenceEnabled: readBoolean(environment.AGENT_DURABLE_PERSISTENCE_ENABLED),
    modelExecutionEnabled: readBoolean(environment.AGENT_MODEL_EXECUTION_ENABLED),
    mutationsEnabled: readBoolean(environment.AGENT_MUTATIONS_ENABLED),
    workflowProvider: 'vercel_workflow',
    tokenConfigured: Boolean(optionalString(environment.AGENT_STAGING_WORKFLOW_TOKEN)),
    supabaseConfigured: Boolean(
      optionalString(environment.SUPABASE_URL) && optionalString(environment.SUPABASE_SERVICE_ROLE_KEY),
    ),
    destinationReviewed: configurationValid,
    databaseSentinelVerified: false,
    vercelEnvironment: optionalString(environment.VERCEL_ENV),
  }
}

function optionalString(value: string | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function readBoolean(value: string | undefined): boolean {
  return ['true', '1', 'yes', 'on'].includes(value?.trim().toLowerCase() ?? '')
}
