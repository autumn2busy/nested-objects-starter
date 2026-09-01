import type { RuntimeEnvironmentVariables } from '../env.js'
import { createSupabaseAdminControlPlaneStore, type AdminControlPlaneStore } from '../persistence/admin-control-plane-store.js'
import { createSupabaseDurableWorkflowStore } from '../persistence/durable-workflow-store.js'
import { loadDurableRuntimeConfiguration } from './durable-runtime.js'

export interface AdminRuntimeConfiguration {
  sharedSecret: string
  autumnSubjectId: string
  allowedOrigin: string
  enabled: true
  durable: ReturnType<typeof loadDurableRuntimeConfiguration>
}

export interface AdminRuntimeContext {
  configuration: AdminRuntimeConfiguration
  store: AdminControlPlaneStore
}

export function loadAdminRuntimeConfiguration(
  environment: RuntimeEnvironmentVariables = process.env,
): AdminRuntimeConfiguration {
  if (environment.VERCEL_ENV?.trim().toLowerCase() === 'production') {
    throw new AdminRuntimeConfigurationError('The C7 admin surface is disabled in Vercel Production')
  }
  if (!parseBoolean(environment.AGENT_ADMIN_ENABLED, false)) {
    throw new AdminRuntimeConfigurationError('AGENT_ADMIN_ENABLED must be explicitly enabled for reviewed staging')
  }
  const sharedSecret = requiredString(environment.AGENT_ADMIN_SHARED_SECRET, 'AGENT_ADMIN_SHARED_SECRET')
  if (sharedSecret.length < 32) {
    throw new AdminRuntimeConfigurationError('AGENT_ADMIN_SHARED_SECRET must contain at least 32 characters')
  }
  const autumnSubjectId = requiredString(environment.AGENT_ADMIN_AUTUMN_SUBJECT_ID, 'AGENT_ADMIN_AUTUMN_SUBJECT_ID')
  if (autumnSubjectId.length > 255) throw new AdminRuntimeConfigurationError('Autumn subject ID exceeds 255 characters')
  const allowedOrigin = originOnly(requiredString(environment.AGENT_ADMIN_ALLOWED_ORIGIN, 'AGENT_ADMIN_ALLOWED_ORIGIN'))
  const durable = loadDurableRuntimeConfiguration(environment)
  return { sharedSecret, autumnSubjectId, allowedOrigin, enabled: true, durable }
}

export async function resolveAdminRuntimeContext(
  environment: RuntimeEnvironmentVariables = process.env,
  configuration = loadAdminRuntimeConfiguration(environment),
): Promise<AdminRuntimeContext> {
  const credentials = {
    url: requiredValue(configuration.durable.runtime.supabaseUrl),
    serviceRoleKey: requiredValue(configuration.durable.runtime.supabaseServiceRoleKey),
  }
  const [durableStore, store] = await Promise.all([
    createSupabaseDurableWorkflowStore(credentials),
    createSupabaseAdminControlPlaneStore(credentials),
  ])
  await durableStore.verifyDestination(configuration.durable.binding)
  return { configuration, store }
}

function originOnly(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new AdminRuntimeConfigurationError('AGENT_ADMIN_ALLOWED_ORIGIN must be a valid URL origin')
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new AdminRuntimeConfigurationError('AGENT_ADMIN_ALLOWED_ORIGIN must contain only scheme and host')
  }
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new AdminRuntimeConfigurationError('AGENT_ADMIN_ALLOWED_ORIGIN requires HTTPS outside local development')
  }
  return url.origin.toLowerCase()
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  throw new AdminRuntimeConfigurationError('Admin boolean environment variable is invalid')
}

function requiredString(value: string | undefined, name: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new AdminRuntimeConfigurationError(`${name} is required`)
  return normalized
}

function requiredValue<T>(value: T | null): T {
  if (value === null) throw new AdminRuntimeConfigurationError('Durable admin configuration is incomplete')
  return value
}

export class AdminRuntimeConfigurationError extends Error {
  readonly code = 'ADMIN_RUNTIME_CONFIGURATION_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'AdminRuntimeConfigurationError'
  }
}
