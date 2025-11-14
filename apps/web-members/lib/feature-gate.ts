import { requireFeature as serverRequireFeature } from './auth-server'

// Server-side feature gate that verifies JWT and checks entitlements
export async function requireFeature(featureKey: string): Promise<boolean> {
  try {
    await serverRequireFeature(featureKey)
    return true
  } catch (error) {
    console.error(`Feature gate failed for ${featureKey}:`, error)
    return false
  }
}