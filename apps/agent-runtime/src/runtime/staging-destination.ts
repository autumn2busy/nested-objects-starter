import { createHash } from 'node:crypto'

export interface StagingDestinationPolicy {
  version: string
  bindingKey: string
  reviewedProjectRefs: readonly string[]
  deniedProjectRefs: readonly string[]
}

export interface StagingDestinationBinding {
  bindingKey: string
  policyVersion: string
  projectRef: string
  hostname: string
  destinationFingerprint: string
}

const MEMBER_SITE_PRODUCTION_PROJECT_REF = 'lzzghrjjsyzlvofpidis'

// Staging destinations become executable only through a reviewed code change.
// Runtime environment variables cannot add to this allowlist.
export const STAGING_DESTINATION_POLICY: StagingDestinationPolicy = Object.freeze({
  version: 'phase-c3-v1',
  bindingKey: 'nested-objects-agent-runtime-staging',
  // Verified in Supabase as nested-objects-staging on 2026-09-02 (Issue #318).
  // Credentials and the database sentinel remain separate activation gates.
  reviewedProjectRefs: Object.freeze(['wqstirwszdbsygstnvbn']),
  deniedProjectRefs: Object.freeze([MEMBER_SITE_PRODUCTION_PROJECT_REF]),
})

export function assertReviewedStagingDestination(
  input: {
    supabaseUrl: string
    configuredProjectRef: string
    runtimeEnvironment: string
    vercelEnvironment: string | null
  },
  policy: StagingDestinationPolicy = STAGING_DESTINATION_POLICY,
): StagingDestinationBinding {
  if (input.runtimeEnvironment !== 'preview') {
    throw new StagingDestinationBindingError('Durable staging workflows require the preview runtime environment')
  }
  if (input.vercelEnvironment === 'production') {
    throw new StagingDestinationBindingError('Durable staging workflows are blocked in Vercel Production')
  }

  const configuredProjectRef = normalizeProjectRef(input.configuredProjectRef)
  const urlProjectRef = projectRefFromSupabaseUrl(input.supabaseUrl)
  if (configuredProjectRef !== urlProjectRef) {
    throw new StagingDestinationBindingError('The configured project reference does not match the Supabase URL')
  }
  if (policy.deniedProjectRefs.includes(configuredProjectRef)) {
    throw new StagingDestinationBindingError('The configured destination is explicitly denied')
  }
  if (!policy.reviewedProjectRefs.includes(configuredProjectRef)) {
    throw new StagingDestinationBindingError('The configured destination has not been approved in the committed staging policy')
  }

  const hostname = new URL(input.supabaseUrl).hostname.toLowerCase()
  return {
    bindingKey: policy.bindingKey,
    policyVersion: policy.version,
    projectRef: configuredProjectRef,
    hostname,
    destinationFingerprint: createStagingDestinationFingerprint({
      policyVersion: policy.version,
      projectRef: configuredProjectRef,
      hostname,
    }),
  }
}

export function createStagingDestinationFingerprint(input: {
  policyVersion: string
  projectRef: string
  hostname: string
}): string {
  const normalized = [
    input.policyVersion.trim().toLowerCase(),
    normalizeProjectRef(input.projectRef),
    input.hostname.trim().toLowerCase(),
  ].join('\n')
  return createHash('sha256').update(normalized).digest('hex')
}

export function projectRefFromSupabaseUrl(value: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new StagingDestinationBindingError('Supabase URL is invalid')
  }
  if (parsed.protocol !== 'https:') {
    throw new StagingDestinationBindingError('Durable staging workflows require an HTTPS Supabase URL')
  }

  const match = /^([a-z0-9]{15,30})\.supabase\.co$/i.exec(parsed.hostname)
  if (!match?.[1]) {
    throw new StagingDestinationBindingError('Supabase URL must use the reviewed hosted-project hostname shape')
  }
  return normalizeProjectRef(match[1])
}

function normalizeProjectRef(value: string): string {
  const normalized = value.trim().toLowerCase()
  if (!/^[a-z0-9]{15,30}$/.test(normalized)) {
    throw new StagingDestinationBindingError('Supabase project reference has an invalid shape')
  }
  return normalized
}

export class StagingDestinationBindingError extends Error {
  readonly code = 'STAGING_DESTINATION_BINDING_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'StagingDestinationBindingError'
  }
}
