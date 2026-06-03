/**
 * ActiveCampaign and GA4 client-side event tracking.
 *
 * GA4/GTM events fire for anonymous and authenticated visitors.
 * ActiveCampaign events are forwarded through /api/ac/track-event and are
 * attributed when the visitor has an authenticated member session.
 */

declare global {
    interface Window {
        vgo?: (...args: any[]) => void
        gtag?: (...args: any[]) => void
        dataLayer?: Array<Record<string, unknown>>
    }
}

type EventData = Record<string, any>

/**
 * Identify the current visitor by email.
 * Once called, subsequent AC site tracking is attributed to this contact.
 */
export function identifyVisitor(email: string): void {
    if (typeof window === 'undefined' || !window.vgo) return
    window.vgo('setEmail', email)
}

/**
 * Fire a canonical product event to GA4/GTM and best-effort ActiveCampaign.
 */
export function trackEvent(eventName: string, eventData?: EventData): void {
    if (typeof window === 'undefined') return

    const payload = cleanEventData(eventData)

    trackGa4Event(eventName, payload)

    if (window.vgo) {
        window.vgo('setEmail', undefined)
    }

    fetch('/api/ac/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, eventData: payload }),
        credentials: 'same-origin',
        keepalive: true,
    }).catch(() => {
        // Tracking should never interrupt the member experience.
    })
}

/**
 * Fire directly to GA4/GTM. Useful when AC attribution is not available yet.
 */
export function trackGa4Event(eventName: string, eventData?: EventData): void {
    if (typeof window === 'undefined') return

    const payload = cleanEventData(eventData)

    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, payload)
        return
    }

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
        event: eventName,
        ...payload,
    })
}

function cleanEventData(eventData?: EventData): EventData {
    if (!eventData) return {}

    return Object.fromEntries(
        Object.entries(eventData).filter(([, value]) => value !== undefined)
    )
}

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

export function trackDirectoryViewed(eventData?: EventData): void {
    trackEvent('directory_viewed', eventData)
}

export function trackUpgradeClicked(sourcePage: string, targetPlan?: string, eventData?: EventData): void {
    trackEvent('upgrade_clicked', { sourcePage, targetPlan, ...eventData })
}

export function trackSignupStarted(plan?: string): void {
    trackEvent('signup_started', { plan })
}

export function trackSignupCompleted(plan?: string): void {
    trackEvent('signup_completed', { plan })
}

export function trackPricingView(eventData?: EventData): void {
    trackEvent('pricing_view', eventData)
}

export function trackPricingCtaClick(eventData?: EventData): void {
    trackEvent('pricing_cta_click', eventData)
}

export function trackJoinFreeClick(eventData?: EventData): void {
    trackEvent('join_free_click', eventData)
}

export function trackOutsetaModalOpen(eventData?: EventData): void {
    trackEvent('outseta_modal_open', eventData)
}

export function trackUpgradeStarted(eventData?: EventData): void {
    trackEvent('upgrade_started', eventData)
}

export function trackStartTrial(eventData?: EventData): void {
    trackEvent('start_trial', eventData)
}

export function trackFirmView(eventData?: EventData): void {
    trackEvent('firm_view', eventData)
}

export function trackPaywallHit(eventData?: EventData): void {
    trackEvent('paywall_hit', eventData)
}
