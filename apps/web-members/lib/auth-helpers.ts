// This file is safe for 'use client' components because it has no server imports
// We moved the logic here to avoid the "next/headers" error

export const PLANS = {
  STARTER: 'L9nbKV9Z',
  PRO: 'rQVqlLm6',
  ELITE: 'NmdnNO90',
  AGENCY: 'rmk5Xk9g',
}

export const PLAN_FEATURES: Record<string, string[]> = {
  [PLANS.STARTER]: ['basic-search', 'firm-directory'],
  [PLANS.PRO]: ['basic-search', 'firm-directory', 'ai-chatbot', 'job-intel', 'advanced-search'],
  [PLANS.ELITE]: ['basic-search', 'firm-directory', 'ai-chatbot', 'job-intel', 'advanced-search', 'priority-support'],
  [PLANS.AGENCY]: ['basic-search', 'firm-directory', 'ai-chatbot', 'job-intel', 'advanced-search', 'priority-support', 'white-label'],
}

export function hasFeatureAccess(user: any, feature: string): boolean {
  if (!user) return false
  
  // If user has a planUid, check if the feature is included in that plan
  const userPlan = user.planUid || user.plan_uid
  
  if (!userPlan) return false
  
  // Direct plan check (if the feature string matches the plan name/feature list)
  const features = PLAN_FEATURES[userPlan] || []
  return features.includes(feature) || features.some(f => feature.includes(f))
}
