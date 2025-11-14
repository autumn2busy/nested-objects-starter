import jwt from 'jsonwebtoken'
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
}

// Plan UID mapping (same as client-side)
export const PLAN_UIDS = {
  STARTER: 'L9nbKV9Z',
  PRO: 'rQVqlLm6',
  ELITE: 'NmdnNO90',
  AGENCY: 'rmk5Xk9g'
} as const

// Feature access rules (same as client-side)
export const FEATURE_ACCESS: Record<string, string[]> = {
  directory_access: [PLAN_UIDS.STARTER, PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  ai_chatbot: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  job_intel: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  priority_support: [PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  white_label: [PLAN_UIDS.AGENCY]
}

/**
 * Verify an Outseta JWT token
 * 
 * For production use, you should fetch and cache Outseta's public key from:
 * https://nested-objects.outseta.com/.well-known/jwks
 * 
 * For now, we'll decode without verification (for development only)
 * TODO: Add proper JWT verification with Outseta's public key
 */
export async function verifyOutsetaToken(token: string): Promise<OutsetaJWTPayload | null> {
  try {
    // Decode the JWT without verification (DEVELOPMENT ONLY)
    // In production, you should verify the signature using Outseta's public key
    const decoded = jwt.decode(token) as OutsetaJWTPayload | null
    
    if (!decoded) {
      return null
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp && decoded.exp < now) {
      return null
    }

    // Verify issuer matches Outseta domain
    if (!decoded.iss || !decoded.iss.includes('outseta.com')) {
      return null
    }

    return decoded
  } catch (error) {
    console.error('Error verifying Outseta token:', error)
    return null
  }
}

/**
 * Get the current user from the request cookies
 */
export async function getCurrentUser(): Promise<OutsetaJWTPayload | null> {
  const cookieStore = await cookies()
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
    case PLAN_UIDS.STARTER:
      return 'Starter'
    case PLAN_UIDS.PRO:
      return 'Pro'
    case PLAN_UIDS.ELITE:
      return 'Elite'
    case PLAN_UIDS.AGENCY:
      return 'Agency'
    default:
      return 'Unknown'
  }
}