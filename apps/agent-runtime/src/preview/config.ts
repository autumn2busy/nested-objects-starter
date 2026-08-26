import { timingSafeEqual } from 'node:crypto'

import { ContractValidationError } from '../contracts.js'
import type { RuntimeConfiguration, RuntimeEnvironmentVariables } from '../env.js'
import { getProcessEnvironment, loadRuntimeConfiguration } from '../env.js'
import { PreviewHttpError } from './http.js'

export interface PreviewDeploymentConfiguration {
  runtime: RuntimeConfiguration
  apiSecret: string
  stagingProjectRef: string
  supabaseUrl: string
  supabaseServiceRoleKey: string
  vercelEnvironment: string | null
}

const PROJECT_REF_PATTERN = /^[a-z0-9]{8,40}$/

export function loadPreviewDeploymentConfiguration(
  environment: RuntimeEnvironmentVariables = getProcessEnvironment(),
): PreviewDeploymentConfiguration {
  const runtime = loadRuntimeConfiguration(environment)
  if (!['preview', 'test'].includes(runtime.environment)) {
    throw new ContractValidationError('The Phase C2 runtime may execute only in preview or test environments.', {
      environment: runtime.environment,
    })
  }
  if (runtime.mode !== 'dry_run') {
    throw new ContractValidationError('The Phase C2 runtime must remain in dry_run mode.', { mode: runtime.mode })
  }
  if (runtime.mutationsEnabled) {
    throw new ContractValidationError('The Phase C2 runtime cannot enable mutations.')
  }
  if (runtime.model?.modelExecutionEnabled) {
    throw new ContractValidationError('The Phase C2 runtime cannot enable model execution.')
  }
  if (runtime.workflowProvider !== 'in_memory') {
    throw new ContractValidationError('Phase C2 preview execution requires the in_memory workflow provider.', {
      provider: runtime.workflowProvider,
    })
  }

  const vercelEnvironment = normalized(environment.VERCEL_ENV)
  if (runtime.environment !== 'test' && vercelEnvironment !== 'preview') {
    throw new ContractValidationError('VERCEL_ENV must be preview for the Phase C2 deployment.', {
      vercelEnvironment,
    })
  }

  const apiSecret = requireValue(environment.AGENT_RUNTIME_API_SECRET, 'AGENT_RUNTIME_API_SECRET')
  if (apiSecret.length < 32) {
    throw new ContractValidationError('AGENT_RUNTIME_API_SECRET must contain at least 32 characters.')
  }

  const stagingProjectRef = requireValue(
    environment.AGENT_STAGING_SUPABASE_PROJECT_REF,
    'AGENT_STAGING_SUPABASE_PROJECT_REF',
  ).toLowerCase()
  if (!PROJECT_REF_PATTERN.test(stagingProjectRef)) {
    throw new ContractValidationError('AGENT_STAGING_SUPABASE_PROJECT_REF has an invalid format.')
  }

  const supabaseUrl = runtime.supabaseUrl
  const supabaseServiceRoleKey = runtime.supabaseServiceRoleKey
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new ContractValidationError('Preview execution requires staging Supabase server credentials.')
  }

  const parsedUrl = parseUrl(supabaseUrl)
  const expectedHostname = `${stagingProjectRef}.supabase.co`
  if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname.toLowerCase() !== expectedHostname) {
    throw new ContractValidationError(
      'SUPABASE_URL does not match the explicitly approved staging project reference.',
      {
        expectedHostname,
        actualHostname: parsedUrl.hostname.toLowerCase(),
      },
    )
  }

  return {
    runtime,
    apiSecret,
    stagingProjectRef,
    supabaseUrl,
    supabaseServiceRoleKey,
    vercelEnvironment,
  }
}

export function authorizePreviewRequest(request: Request, expectedSecret: string): void {
  const authorization = request.headers.get('authorization') ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  if (!match?.[1] || !constantTimeEqual(match[1], expectedSecret)) {
    throw new PreviewHttpError(401, 'UNAUTHORIZED', 'A valid bearer credential is required.')
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left)
  const rightBytes = new TextEncoder().encode(right)
  if (leftBytes.byteLength !== rightBytes.byteLength) return false
  return timingSafeEqual(leftBytes, rightBytes)
}

function normalized(value: string | undefined): string | null {
  const result = value?.trim()
  return result ? result : null
}

function requireValue(value: string | undefined, name: string): string {
  const result = normalized(value)
  if (!result) throw new ContractValidationError(`${name} is required for Phase C2 preview execution.`)
  return result
}

function parseUrl(value: string): URL {
  try {
    return new URL(value)
  } catch {
    throw new ContractValidationError('SUPABASE_URL must be a valid URL.')
  }
}
