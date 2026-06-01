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

interface ApplyTagParams {
    email: string
    tag: string
}

type ActiveCampaignContact = {
    id?: string | number
}

type ActiveCampaignTag = {
    id?: string | number
    tag?: string
}

const tagIdCache = new Map<string, string>()

function getActiveCampaignConfig() {
    const acApiUrl = env.acApiUrl?.replace(/\/$/, '')
    const acApiKey = env.acApiKey

    if (!acApiUrl || !acApiKey) {
        console.warn('[AC Contact Tag] Missing AC_API_URL or AC_API_KEY env vars')
        return null
    }

    return { acApiUrl, acApiKey }
}

async function syncActiveCampaignContact(email: string): Promise<string | null> {
    const config = getActiveCampaignConfig()
    if (!config) return null

    const response = await fetch(`${config.acApiUrl}/api/3/contact/sync`, {
        method: 'POST',
        headers: {
            'Api-Token': config.acApiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact: { email } }),
    })

    const data = await response.json().catch(() => ({}))
    const contact = data.contact as ActiveCampaignContact | undefined

    if (!response.ok || !contact?.id) {
        console.error(`[AC Contact Tag] Failed to sync contact ${email}: ${response.status}`, data)
        return null
    }

    return String(contact.id)
}

async function getOrCreateActiveCampaignTagId(tagName: string): Promise<string | null> {
    const config = getActiveCampaignConfig()
    if (!config) return null

    const cachedTagId = tagIdCache.get(tagName)
    if (cachedTagId) return cachedTagId

    const searchResponse = await fetch(
        `${config.acApiUrl}/api/3/tags?search=${encodeURIComponent(tagName)}`,
        { headers: { 'Api-Token': config.acApiKey } }
    )
    const searchData = await searchResponse.json().catch(() => ({}))
    const existingTag = (searchData.tags as ActiveCampaignTag[] | undefined)?.find(
        (tag) => tag.tag?.toLowerCase() === tagName.toLowerCase()
    )

    if (existingTag?.id) {
        const tagId = String(existingTag.id)
        tagIdCache.set(tagName, tagId)
        return tagId
    }

    const createResponse = await fetch(`${config.acApiUrl}/api/3/tags`, {
        method: 'POST',
        headers: {
            'Api-Token': config.acApiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tag: {
                tag: tagName,
                tagType: 'contact',
                description: 'Auto-created by Nested Objects',
            },
        }),
    })
    const createData = await createResponse.json().catch(() => ({}))
    const createdTag = createData.tag as ActiveCampaignTag | undefined

    if (!createResponse.ok || !createdTag?.id) {
        console.error(`[AC Contact Tag] Failed to create tag "${tagName}": ${createResponse.status}`, createData)
        return null
    }

    const tagId = String(createdTag.id)
    tagIdCache.set(tagName, tagId)
    return tagId
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

/**
 * Apply a contact tag through ActiveCampaign's REST API.
 * This is intentionally non-throwing so activation and onboarding UX is never blocked by AC.
 */
export async function applyACContactTag({ email, tag }: ApplyTagParams): Promise<boolean> {
    try {
        const config = getActiveCampaignConfig()
        if (!config) return false

        const contactId = await syncActiveCampaignContact(email)
        if (!contactId) return false

        const tagId = await getOrCreateActiveCampaignTagId(tag)
        if (!tagId) return false

        const response = await fetch(`${config.acApiUrl}/api/3/contactTags`, {
            method: 'POST',
            headers: {
                'Api-Token': config.acApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } }),
        })

        if (response.ok || response.status === 201 || response.status === 422) {
            return true
        }

        const data = await response.json().catch(() => ({}))
        console.error(`[AC Contact Tag] Failed to apply "${tag}" to ${email}: ${response.status}`, data)
        return false
    } catch (error) {
        console.error(`[AC Contact Tag] Error applying "${tag}" to ${email}:`, error)
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
