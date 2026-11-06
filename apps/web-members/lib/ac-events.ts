import { isVerificationTraffic } from './verification-traffic'
/**
 * ActiveCampaign and GA4 client-side event tracking.
 *
 * GA4/GTM events fire for anonymous and authenticated visitors.
 * Events are persisted through /api/conversion-events. Authenticated member
 * events are also forwarded to ActiveCampaign from that server route.
 */

import { acquisitionGa4Data, journeyAttribution } from '../../../packages/acquisition-attribution'

declare global {
    interface Window {
        vgo?: (...args: any[]) => void
        gtag?: (...args: any[]) => void
        dataLayer?: Array<Record<string, unknown>>
    }
}

type EventData = Record<string, any>

const ANONYMOUS_ID_KEY = 'nested_objects_anonymous_id'
const SESSION_ID_KEY = 'nested_objects_conversion_session_id'

function createClientId(prefix: string): string {
    const randomPart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    return `${prefix}:${randomPart}`
}

function getStoredId(storageName: 'localStorage' | 'sessionStorage', key: string, prefix: string): string {
    try {
        const storage = window[storageName]
        const existing = storage.getItem(key)
        if (existing) return existing

        const created = createClientId(prefix)
        storage.setItem(key, created)
        return created
    } catch {
        return createClientId(prefix)
    }
}

function getAttributionContext(): EventData {
    if (typeof window === 'undefined') return {}
    const query = new URLSearchParams(window.location.search)
    const context: EventData = { ...journeyAttribution(), sourcePage: window.location.pathname }
    for (const key of ['source', 'reason']) {
        const value = query.get(key)
        if (value) context[key] = value
    }
    return context
}

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

    const payload = cleanEventData({
        ...getAttributionContext(),
        ...eventData,
    })
    const anonymousId = getStoredId('localStorage', ANONYMOUS_ID_KEY, 'anon')
    const sessionId = getStoredId('sessionStorage', SESSION_ID_KEY, 'session')
    const occurredAt = new Date().toISOString()
    const clientEventId = createClientId('event')

    // Correlated checkout diagnostics stay in the private first-party ledger.
    // Do not expand marketing-provider configuration or leak correlation IDs.
    if (eventName !== 'checkout_handoff') trackGa4Event(eventName, payload)

    fetch('/api/conversion-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: eventName,
            eventData: payload,
            anonymousId,
            sessionId,
            occurredAt,
            clientEventId,
        }),
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
    // Verification stays in the private ledger, including direct GA4 calls.
    if (isVerificationTraffic({ ...getAttributionContext(), ...eventData })) return

    const acquisitionEvent = ['pricing_view', 'pricing_cta_click', 'join_free_click', 'signup_started',
        'upgrade_clicked', 'upgrade_started', 'outseta_modal_open', 'paywall_hit'].includes(eventName)
    const payload = acquisitionEvent ? acquisitionGa4Data(eventData) : cleanEventData(eventData)

    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, acquisitionEvent ? { ...payload, send_to: 'G-NCQC8C8V6J' } : payload)
        return
    }

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
        ...payload,
        event: eventName,
        ...(acquisitionEvent ? { acquisition: payload } : {}),
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
