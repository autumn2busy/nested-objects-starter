/**
 * ActiveCampaign Client-Side Event Tracking
 *
 * Uses the AC site tracking `vgo()` global function to fire custom events.
 * Also provides a server-side event tracking helper via the Event Tracking API.
 *
 * Usage:
 *   import { trackEvent, identifyVisitor } from '@/lib/ac-events'
 *   trackEvent('ai_resume_generated')
 *   identifyVisitor('user@example.com')
 */

declare global {
    interface Window {
        vgo?: (...args: any[]) => void
    }
}

// ============================================================================
// CLIENT-SIDE TRACKING (vgo)
// ============================================================================

/**
 * Identify the current visitor by email.
 * Once called, all subsequent page views are attributed to this contact in AC.
 */
export function identifyVisitor(email: string): void {
    if (typeof window === 'undefined' || !window.vgo) return
    window.vgo('setEmail', email)
}

/**
 * Fire a custom event via AC site tracking.
 * Events appear in the contact's activity log in AC and can trigger automations.
 */
export function trackEvent(eventName: string, eventData?: Record<string, any>): void {
    if (typeof window === 'undefined') return

    // Use AC's vgo if available
    if (window.vgo) {
        window.vgo('setEmail', undefined) // ensure tracking is active
        // AC site tracking doesn't have a native custom event API via vgo,
        // so we fire to our server-side endpoint for reliable tracking
    }

    // Fire to server-side endpoint for AC Event Tracking API
    fetch('/api/ac/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, eventData }),
        // Don't block on this — fire and forget
        keepalive: true,
    }).catch(() => {
        // Silently fail — tracking should never break the UX
    })
}

// ============================================================================
// PRE-DEFINED EVENT HELPERS
// ============================================================================

export function trackToolUsed(toolName: string): void {
    trackEvent('tool_used', { tool: toolName })
}

export function trackAiResumeGenerated(): void {
    trackEvent('ai_resume_generated')
}

export function trackAiConciergeUsed(): void {
    trackEvent('ai_concierge_used')
}

export function trackTrainingStarted(moduleId: string): void {
    trackEvent('training_started', { moduleId })
}

export function trackTrainingCompleted(moduleId: string, score?: number): void {
    trackEvent('training_completed', { moduleId, score })
}

export function trackProfileCompleted(completeness: number): void {
    trackEvent('profile_completed', { completeness })
}

export function trackDirectoryViewed(): void {
    trackEvent('directory_viewed')
}

export function trackUpgradeClicked(sourcePage: string, targetPlan?: string): void {
    trackEvent('upgrade_clicked', { sourcePage, targetPlan })
}

export function trackSignupStarted(plan?: string): void {
    trackEvent('signup_started', { plan })
}

export function trackSignupCompleted(plan?: string): void {
    trackEvent('signup_completed', { plan })
}
