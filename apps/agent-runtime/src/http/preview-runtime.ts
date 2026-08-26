import { createHash, timingSafeEqual } from 'node:crypto'

import type { RuntimeConfiguration } from '../contracts.js'
import { loadRuntimeConfiguration, type RuntimeEnvironmentVariables } from '../env.js'

export interface PreviewRuntimeConfiguration {
  runtime: RuntimeConfiguration
  apiToken: string
  persistenceEnabled: boolean
  syntheticOnly: true
  stagingProjectRef: string | null
  vercelEnvironment: string | null
}

export interface PreviewHealthSnapshot {
  ok: boolean
  service: 'nested-objects-agent-runtime'
  phase: 'phase-c2-preview'
  environment: string
  mode: string
  persistenceEnabled: boolean
  modelExecutionEnabled: boolean
  mutationsEnabled: boolean
  workflowProvider: string
  tokenConfigured: boolean
  supabaseConfigured: boolean
  stagingProjectRefConfigured: boolean
  vercelEnvironment: string | null
}

export function loadPreviewRuntimeConfiguration(
  environment: RuntimeEnvironmentVariables = process.env,
): PreviewRuntimeConfiguration {
  const runtime = loadRuntimeConfiguration(environment)
  const vercelEnvironment = optionalString(environment.VERCEL_ENV)

  if (runtime.environment !== 'preview') {
    throw new PreviewRuntimeConfigurationError('Phase C2 HTTP execution requires AGENT_RUNTIME_ENV=preview')
  }
  if (vercelEnvironment === 'production') {
    throw new PreviewRuntimeConfigurationError('Phase C2 preview execution is blocked in a Vercel production environment')
  }
  if (runtime.workflowProvider !== 'in_memory') {
    throw new PreviewRuntimeConfigurationError('Phase C2 preview requires AGENT_WORKFLOW_PROVIDER=in_memory')
  }
  if (runtime.model) {
    throw new PreviewRuntimeConfigurationError('Phase C2 preview does not permit model execution')
  }

  const apiToken = requiredString(environment.AGENT_PREVIEW_API_TOKEN, 'AGENT_PREVIEW_API_TOKEN')
  if (apiToken.length < 32) {
    throw new PreviewRuntimeConfigurationError('AGENT_PREVIEW_API_TOKEN must contain at least 32 characters')
  }

  const syntheticOnly = parseBoolean(environment.AGENT_PREVIEW_SYNTHETIC_ONLY, true)
  if (!syntheticOnly) {
    throw new PreviewRuntimeConfigurationError('Phase C2 preview cannot disable its synthetic-only boundary')
  }

  const persistenceEnabled = parseBoolean(environment.AGENT_PREVIEW_PERSISTENCE_ENABLED, false)
  const stagingProjectRef = optionalString(environment.AGENT_STAGING_PROJECT_REF)
  if (persistenceEnabled) {
    if (!runtime.supabaseUrl || !runtime.supabaseServiceRoleKey) {
      throw new PreviewRuntimeConfigurationError('Preview persistence requires staging Supabase credentials')
    }
    if (!stagingProjectRef) {
      throw new PreviewRuntimeConfigurationError('Preview persistence requires AGENT_STAGING_PROJECT_REF')
    }
    assertStagingSupabaseUrl(runtime.supabaseUrl, stagingProjectRef)
  }

  return {
    runtime,
    apiToken,
    persistenceEnabled,
    syntheticOnly: true,
    stagingProjectRef,
    vercelEnvironment,
  }
}

export function previewHealthSnapshot(
  environment: RuntimeEnvironmentVariables = process.env,
): PreviewHealthSnapshot {
  const runtimeEnvironment = optionalString(environment.AGENT_RUNTIME_ENV) ?? 'unset'
  const mode = optionalString(environment.AGENT_RUNTIME_MODE) ?? 'unset'
  const workflowProvider = optionalString(environment.AGENT_WORKFLOW_PROVIDER) ?? 'unset'
  const vercelEnvironment = optionalString(environment.VERCEL_ENV)
  const tokenConfigured = Boolean(optionalString(environment.AGENT_PREVIEW_API_TOKEN))
  const supabaseConfigured = Boolean(
    optionalString(environment.SUPABASE_URL) && optionalString(environment.SUPABASE_SERVICE_ROLE_KEY),
  )
  const stagingProjectRefConfigured = Boolean(optionalString(environment.AGENT_STAGING_PROJECT_REF))
  const persistenceEnabled = safeBoolean(environment.AGENT_PREVIEW_PERSISTENCE_ENABLED, false)
  const modelExecutionEnabled = safeBoolean(environment.AGENT_MODEL_EXECUTION_ENABLED, false)
  const mutationsEnabled = safeBoolean(environment.AGENT_MUTATIONS_ENABLED, false)
  const syntheticOnly = safeBoolean(environment.AGENT_PREVIEW_SYNTHETIC_ONLY, true)
  const ok =
    runtimeEnvironment === 'preview' &&
    vercelEnvironment !== 'production' &&
    mode === 'dry_run' &&
    workflowProvider === 'in_memory' &&
    !modelExecutionEnabled &&
    !mutationsEnabled &&
    syntheticOnly &&
    tokenConfigured &&
    (!persistenceEnabled || (supabaseConfigured && stagingProjectRefConfigured))

  return {
    ok,
    service: 'nested-objects-agent-runtime',
    phase: 'phase-c2-preview',
    environment: runtimeEnvironment,
    mode,
    persistenceEnabled,
    modelExecutionEnabled,
    mutationsEnabled,
    workflowProvider,
    tokenConfigured,
    supabaseConfigured,
    stagingProjectRefConfigured,
    vercelEnvironment,
  }
}

export function authenticatePreviewRequest(request: Request, expectedToken: string): void {
  const authorization = request.headers.get('authorization') ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  const providedToken = match?.[1]?.trim() ?? ''
  if (!providedToken || !secureTokenEqual(providedToken, expectedToken)) {
    throw new PreviewAuthenticationError('Preview API authentication failed')
  }
}

export function assertStagingSupabaseUrl(url: string, projectRef: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new PreviewRuntimeConfigurationError('SUPABASE_URL is not a valid URL')
  }

  const normalizedRef = projectRef.trim().toLowerCase()
  if (!/^[a-z0-9-]{6,80}$/.test(normalizedRef)) {
    throw new PreviewRuntimeConfigurationError('AGENT_STAGING_PROJECT_REF has an invalid format')
  }
  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== `${normalizedRef}.supabase.co`) {
    throw new PreviewRuntimeConfigurationError(
      'SUPABASE_URL does not match the explicitly configured staging project reference',
    )
  }
}

function secureTokenEqual(left: string, right: string): boolean {
  const leftDigest = createHash('sha256').update(left).digest()
  const rightDigest = createHash('sha256').update(right).digest()
  return timingSafeEqual(leftDigest, rightDigest)
}

function optionalString(value: string | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function requiredString(value: string | undefined, name: string): string {
  const normalized = optionalString(value)
  if (!normalized) throw new PreviewRuntimeConfigurationError(`${name} is required`)
  return normalized
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  throw new PreviewRuntimeConfigurationError('Boolean environment variable has an invalid value')
}

function safeBoolean(value: string | undefined, defaultValue: boolean): boolean {
  try {
    return parseBoolean(value, defaultValue)
  } catch {
    return defaultValue
  }
}

export class PreviewAuthenticationError extends Error {
  readonly code = 'PREVIEW_AUTHENTICATION_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'PreviewAuthenticationError'
  }
}

export class PreviewRuntimeConfigurationError extends Error {
  readonly code = 'PREVIEW_RUNTIME_CONFIGURATION_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'PreviewRuntimeConfigurationError'
  }
}
