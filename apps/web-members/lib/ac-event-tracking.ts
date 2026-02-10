/**
 * ActiveCampaign Server-Side Event Tracking
 *
 * Fires events to AC's Event Tracking API (trackcmp.net).
 * Used for backend events like subscription changes, payments, quota limits.
 *
 * AC Event Tracking docs:
 * https://help.activecampaign.com/hc/en-us/articles/221870128
 */

import { env } from '@/lib/env'

const EVENT_TRACKING_URL = 'https://trackcmp.net/event'

interface TrackEventParams {
    email: string
    event: string
    eventData?: string
}

/**
 * Fire a server-side event to ActiveCampaign Event Tracking API.
 *
 * Events created here appear in the contact's activity timeline
 * and can be used as automation triggers in AC.
 *
 * @param email - Contact email (must exist in AC)
 * @param event - Event name (e.g. 'subscription_created')
 * @param eventData - Optional JSON string of additional data
 */
export async function trackACServerEvent({ email, event, eventData }: TrackEventParams): Promise<boolean> {
    const actId = env.acEventActId
    const eventKey = env.acEventKey

    if (!actId || !eventKey) {
        console.warn('[AC Event Tracking] Missing AC_EVENT_ACTID or AC_EVENT_KEY env vars')
        return false
    }

    try {
        const body = new URLSearchParams({
            actid: actId,
            key: eventKey,
            event,
            eventdata: eventData || '',
            visit: JSON.stringify({ email }),
        })

        const response = await fetch(EVENT_TRACKING_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        })

        if (!response.ok) {
            console.error(`[AC Event Tracking] Failed to track "${event}" for ${email}: ${response.status}`)
            return false
        }

        return true
    } catch (error) {
        console.error(`[AC Event Tracking] Error tracking "${event}":`, error)
        return false
    }
}

// ============================================================================
// PRE-DEFINED SERVER EVENTS
// ============================================================================

export async function trackSubscriptionCreated(email: string, plan: string, amount: number): Promise<boolean> {
    return trackACServerEvent({
        email,
        event: 'subscription_created',
        eventData: JSON.stringify({ plan, amount }),
    })
}

export async function trackSubscriptionUpgraded(email: string, oldPlan: string, newPlan: string): Promise<boolean> {
    return trackACServerEvent({
        email,
        event: 'subscription_upgraded',
        eventData: JSON.stringify({ oldPlan, newPlan }),
    })
}

export async function trackSubscriptionCancelled(email: string, plan: string): Promise<boolean> {
    return trackACServerEvent({
        email,
        event: 'subscription_cancelled',
        eventData: JSON.stringify({ plan }),
    })
}

export async function trackPaymentReceived(email: string, amount: number): Promise<boolean> {
    return trackACServerEvent({
        email,
        event: 'payment_received',
        eventData: JSON.stringify({ amount }),
    })
}

export async function trackAiQuotaExceeded(email: string, feature: string): Promise<boolean> {
    return trackACServerEvent({
        email,
        event: 'ai_quota_exceeded',
        eventData: JSON.stringify({ feature }),
    })
}
