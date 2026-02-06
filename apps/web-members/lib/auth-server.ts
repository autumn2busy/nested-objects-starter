import { jwtVerify, createRemoteJWKSet } from 'jose'
import { cookies } from 'next/headers'

interface OutsetaJWTPayload {
  email: string
  name: string
  sub: string
  'outseta:accountUid': string
  'outseta:subscriptionUid': string
  'outseta:planUid': string
  'outseta:addOnUids'?: string[]
  exp: number
  iss: string
  aud: string
  [key: string]: any
}

// Plan UID mapping (same as client-side)
import { PLAN_UIDS } from './plan-config'

export { PLAN_UIDS }

// Feature access rules (same as client-side)
export const FEATURE_ACCESS: Record<string, string[]> = {
  directory_access: [
    PLAN_UIDS.FREE,
    PLAN_UIDS.STARTER,
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
    PLAN_UIDS.FOUNDERS,
  ],
  ai_chatbot: [
    PLAN_UIDS.STARTER,
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
    PLAN_UIDS.FOUNDERS
  ],
  ai_resume: [
    PLAN_UIDS.STARTER,
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
    PLAN_UIDS.FOUNDERS
  ],
  job_intel: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  job_tracker: [PLAN_UIDS.STARTER, PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY, PLAN_UIDS.FOUNDERS],
  priority_support: [PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  white_label: [PLAN_UIDS.AGENCY]
}

// Outseta JWKS URL
const JWKS_URL = 'https://nested-objects.outseta.com/.well-known/jwks'
const JWKS = createRemoteJWKSet(new URL(JWKS_URL))

/**
 * Verify an Outseta JWT token using JWKS
 */
export async function verifyOutsetaToken(token: string): Promise<OutsetaJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'https://nested-objects.outseta.com'
    })

    return payload as unknown as OutsetaJWTPayload
  } catch (error) {
    console.error('Error verifying Outseta token:', error)
    return null
  }
}

export function getOutsetaUserId(user: OutsetaJWTPayload | null) {
  if (!user) return null

  return user.sub || user['outseta:accountUid'] || user['outseta:subscriptionUid'] || null
}

/**
 * Get the current user from the request cookies
 */
export async function getCurrentUser(): Promise<OutsetaJWTPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('outseta_access_token')?.value

  if (!token) {
    return null
  }

  return verifyOutsetaToken(token)
}

/**
 * Check if a user has access to a feature based on their plan
 */
export function hasAccess(planUid: string, feature: string): boolean {
  const allowedPlans = FEATURE_ACCESS[feature]
  if (!allowedPlans) return false
  return allowedPlans.includes(planUid)
}

/**
 * Server-side feature gate - throws error if user lacks access
 */
export async function requireFeature(feature: string): Promise<OutsetaJWTPayload> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  if (!hasAccess(user['outseta:planUid'], feature)) {
    throw new Error(`Access denied: ${feature} not available on your plan`)
  }

  return user
}

/**
 * Get plan name from UID (for display purposes)
 */
export function getPlanName(planUid: string): string {
  switch (planUid) {
    case PLAN_UIDS.FREE:
      return 'Free'
    case PLAN_UIDS.STARTER:
      return 'Starter'
    case PLAN_UIDS.PRO:
      return 'Pro'
    case PLAN_UIDS.ELITE:
      return 'Elite'
    case PLAN_UIDS.AGENCY:
      return 'Agency'
    case PLAN_UIDS.FOUNDERS:
      return 'Founders'
    default:
      return 'Unknown'
  }
}