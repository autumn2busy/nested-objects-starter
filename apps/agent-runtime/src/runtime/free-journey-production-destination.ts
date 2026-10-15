import {
  createStagingDestinationFingerprint,
  projectRefFromSupabaseUrl,
  type DurableDestinationBinding,
} from './staging-destination.js'
import type { RuntimeEnvironmentVariables } from '../env.js'

const PRODUCTION_PROJECT_REF = 'lzzghrjjsyzlvofpidis'
const PRODUCTION_HOSTNAME = `${PRODUCTION_PROJECT_REF}.supabase.co`
const POLICY_VERSION = 'free-journey-production-v1'
const BINDING_KEY = 'nested-objects-free-journey-production'
const DESTINATION_FINGERPRINT = '1a1e94c0f81a4880dd2aeb34150bd0c84b8e1cfd4bef375ad2a0e71180a4a2a9'

export const FREE_JOURNEY_PRODUCTION_DESTINATION = Object.freeze({
  bindingKey: BINDING_KEY,
  policyVersion: POLICY_VERSION,
  projectRef: PRODUCTION_PROJECT_REF,
  hostname: PRODUCTION_HOSTNAME,
  destinationFingerprint: DESTINATION_FINGERPRINT,
}) satisfies DurableDestinationBinding

export function loadFreeJourneyProductionDestination(
  environment: RuntimeEnvironmentVariables = process.env,
): DurableDestinationBinding {
  if (environment.FREE_JOURNEY_OPERATIONAL_MODE !== 'write'
    || environment.FREE_JOURNEY_WRITE_ENABLED !== 'true'
    || environment.FREE_JOURNEY_ACTIVE_527_ENABLED !== 'true'
    || environment.FREE_JOURNEY_DURABLE_EXECUTOR_ENABLED !== 'true') {
    throw new FreeJourneyProductionDestinationError('Free journey Production write gates are disabled')
  }
  return assertFreeJourneyProductionDestination({
    supabaseUrl: environment.SUPABASE_URL ?? '',
    configuredProjectRef: environment.FREE_JOURNEY_PRODUCTION_PROJECT_REF ?? '',
    runtimeEnvironment: environment.AGENT_RUNTIME_ENV ?? '',
    vercelEnvironment: environment.VERCEL_ENV ?? null,
    durableExecutorEnabled: environment.FREE_JOURNEY_DURABLE_EXECUTOR_ENABLED,
  })
}

export function assertFreeJourneyProductionDestination(input: {
  supabaseUrl: string
  configuredProjectRef: string
  runtimeEnvironment: string
  vercelEnvironment: string | null
  durableExecutorEnabled: string | undefined
}): DurableDestinationBinding {
  if (input.runtimeEnvironment !== 'production' || input.vercelEnvironment !== 'production') {
    throw new FreeJourneyProductionDestinationError('Free journey writes require the Production runtime')
  }
  if (input.durableExecutorEnabled !== 'true') {
    throw new FreeJourneyProductionDestinationError('Free journey durable execution is disabled')
  }
  const configuredProjectRef = input.configuredProjectRef.trim().toLowerCase()
  const urlProjectRef = projectRefFromSupabaseUrl(input.supabaseUrl)
  if (configuredProjectRef !== PRODUCTION_PROJECT_REF || urlProjectRef !== PRODUCTION_PROJECT_REF) {
    throw new FreeJourneyProductionDestinationError('Free journey destination is not the reviewed member project')
  }
  const fingerprint = createStagingDestinationFingerprint({
    policyVersion: POLICY_VERSION,
    projectRef: PRODUCTION_PROJECT_REF,
    hostname: PRODUCTION_HOSTNAME,
  })
  if (fingerprint !== DESTINATION_FINGERPRINT) {
    throw new FreeJourneyProductionDestinationError('Free journey destination fingerprint is invalid')
  }
  return { ...FREE_JOURNEY_PRODUCTION_DESTINATION }
}

export class FreeJourneyProductionDestinationError extends Error {
  readonly code = 'FREE_JOURNEY_PRODUCTION_DESTINATION_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'FreeJourneyProductionDestinationError'
  }
}
