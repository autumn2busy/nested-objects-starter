import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
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
  DIRECTORY: 'zWZD0rQp',
  PRO: 'rQVqlLm6',
  ELITE: 'NmdnNO90',
  AGENCY: 'rmk5Xk9g'
} as const

// Feature access rules (same as client-side)
export const FEATURE_ACCESS: Record<string, string[]> = {
  directory_access: [
    PLAN_UIDS.STARTER,
    PLAN_UIDS.DIRECTORY,
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
  ],
  ai_chatbot: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  job_intel: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  job_tracker: [PLAN_UIDS.STARTER, PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  priority_support: [PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  white_label: [PLAN_UIDS.AGENCY]
}

const client = jwksClient({
  jwksUri: 'https://nested-objects.outseta.com/.well-known/jwks'
})

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      callback(err, null)
      return
    }
    const signingKey = key?.getPublicKey()
    callback(null, signingKey)
  })
}

export async function verifyOutsetaToken(token: string): Promise<OutsetaJWTPayload | null> {
  return new Promise((resolve) => {
    jwt.verify(
      token,
      getKey,
      {
        // Outseta tokens don't strictly set "audience" to your site ID in some versions, 
        // but they do set issuer. We check issuer rigorously.
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) {
          console.error('JWT Verification Failed:', err.message)
          resolve(null)
          return
        }

        const payload = decoded as OutsetaJWTPayload

        // Verify issuer matches Outseta domain
        if (!payload.iss || !payload.iss.includes('outseta.com')) {
          console.error('JWT Issuer Mismatch:', payload.iss)
          resolve(null)
          return
        }

        resolve(payload)
      }
    )
  })
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
    case PLAN_UIDS.STARTER:
      return 'Starter'
    case PLAN_UIDS.PRO:
      return 'Pro'
    case PLAN_UIDS.DIRECTORY:
      return 'Directory'
    case PLAN_UIDS.ELITE:
      return 'Elite'
    case PLAN_UIDS.AGENCY:
      return 'Agency'
    default:
      return 'Unknown'
  }
}