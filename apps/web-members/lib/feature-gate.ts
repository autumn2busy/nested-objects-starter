import { hasFeatureAccess } from './auth-helpers'

export { hasFeatureAccess }

// Server-side feature gate that verifies JWT and checks entitlements
export async function requireFeature(featureKey: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    console.warn('requireFeature is intended for server-side usage only')
    return false
  }

  const { requireFeature: serverRequireFeature } = await import('./auth-server')

  try {
    await serverRequireFeature(featureKey)
    return true
  } catch (error) {
    console.error(`Feature gate failed for ${featureKey}:`, error)
    return false
  }
}
