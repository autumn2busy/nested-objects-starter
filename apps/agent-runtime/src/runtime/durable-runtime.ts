import { ContractValidationError, type RuntimeConfiguration } from '../contracts.js'
import { loadRuntimeConfiguration, type RuntimeEnvironmentVariables } from '../env.js'
import { assertServerOnlyControlPlaneAccess } from '../persistence/control-plane-store.js'
import {
  assertReviewedStagingDestination,
  STAGING_DESTINATION_POLICY,
  type StagingDestinationBinding,
  type StagingDestinationPolicy,
} from './staging-destination.js'

export interface DurableRuntimeConfiguration {
  runtime: RuntimeConfiguration
  apiToken: string
  binding: StagingDestinationBinding
  persistenceEnabled: true
  syntheticOnly: true
  vercelEnvironment: string | null
}

export function loadDurableRuntimeConfiguration(
  environment: RuntimeEnvironmentVariables = process.env,
  policy: StagingDestinationPolicy = STAGING_DESTINATION_POLICY,
): DurableRuntimeConfiguration {
  let runtime: RuntimeConfiguration
  try {
    runtime = loadRuntimeConfiguration(environment)
  } catch (error) {
    if (error instanceof ContractValidationError) {
      throw new DurableRuntimeConfigurationError('Base runtime configuration is invalid')
    }
    throw error
  }

  if (runtime.environment !== 'preview') {
    throw new DurableRuntimeConfigurationError('Durable staging execution requires AGENT_RUNTIME_ENV=preview')
  }
  const vercelEnvironment = optionalString(environment.VERCEL_ENV)
  if (vercelEnvironment === 'production') {
    throw new DurableRuntimeConfigurationError('Durable staging execution is blocked in Vercel Production')
  }
  if (runtime.workflowProvider !== 'vercel_workflow') {
    throw new DurableRuntimeConfigurationError('Durable staging execution requires AGENT_WORKFLOW_PROVIDER=vercel_workflow')
  }
  if (runtime.model) {
    throw new DurableRuntimeConfigurationError('Phase C3 durable staging execution does not permit model execution')
  }
  if (!runtime.supabaseUrl || !runtime.supabaseServiceRoleKey) {
    throw new DurableRuntimeConfigurationError('Durable staging execution requires server-only Supabase credentials')
  }
  try {
    assertServerOnlyControlPlaneAccess({
      url: runtime.supabaseUrl,
      serviceRoleKey: runtime.supabaseServiceRoleKey,
    })
  } catch {
    throw new DurableRuntimeConfigurationError('Durable staging Supabase credentials are not server-only credentials')
  }

  const persistenceEnabled = parseBoolean(environment.AGENT_DURABLE_PERSISTENCE_ENABLED, false)
  if (!persistenceEnabled) {
    throw new DurableRuntimeConfigurationError('Durable staging persistence is not explicitly enabled')
  }
  const syntheticOnly = parseBoolean(environment.AGENT_DURABLE_SYNTHETIC_ONLY, true)
  if (!syntheticOnly) {
    throw new DurableRuntimeConfigurationError('Phase C3 durable staging execution cannot disable synthetic-only mode')
  }

  const apiToken = requiredString(environment.AGENT_STAGING_WORKFLOW_TOKEN, 'AGENT_STAGING_WORKFLOW_TOKEN')
  if (apiToken.length < 32) {
    throw new DurableRuntimeConfigurationError('AGENT_STAGING_WORKFLOW_TOKEN must contain at least 32 characters')
  }

  const configuredProjectRef = requiredString(environment.AGENT_STAGING_PROJECT_REF, 'AGENT_STAGING_PROJECT_REF')
  const binding = assertReviewedStagingDestination({
    supabaseUrl: runtime.supabaseUrl,
    configuredProjectRef,
    runtimeEnvironment: runtime.environment,
    vercelEnvironment,
  }, policy)

  return {
    runtime,
    apiToken,
    binding,
    persistenceEnabled: true,
    syntheticOnly: true,
    vercelEnvironment,
  }
}

function optionalString(value: string | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function requiredString(value: string | undefined, name: string): string {
  const normalized = optionalString(value)
  if (!normalized) throw new DurableRuntimeConfigurationError(`${name} is required`)
  return normalized
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  throw new DurableRuntimeConfigurationError('Boolean environment variable has an invalid value')
}

export class DurableRuntimeConfigurationError extends Error {
  readonly code = 'DURABLE_RUNTIME_CONFIGURATION_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'DurableRuntimeConfigurationError'
  }
}
