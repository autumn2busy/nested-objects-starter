export type FeatureFlag = 'enableFirms' | 'enableAIResume' | 'enableOnboarding'

export const features: Record<FeatureFlag, boolean> = {
    // Directory is live but "Claim Firm" or deep firm integration might be gated
    enableFirms: true,

    // Member tool execution remains disabled while the preview boundary is active.
    enableAIResume: false,

    // New Onboarding flow (PR 3.1)
    enableOnboarding: true,
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
    return features[flag]
}
