import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

import { getCurrentUser, getOutsetaUserId, getPlanName } from '@/lib/auth-server'
import { trackACServerEvent } from '@/lib/ac-event-tracking'
import { isBrowserConversionEventName, recordConversionEvent } from '@/lib/conversion-events'
import { isRateLimitExceededError, isRateLimitUnavailableError, rateLimit } from '@/lib/rate-limit'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const limiter = rateLimit({ limit: 120, intervalMs: 60 * 1000 })
const MAX_BODY_BYTES = 16_384
const MAX_EVENT_DATA_BYTES = 8_192
const INCOME_SCENARIO_COMPLETION_EVENT = 'income_scenario_completed'
const INCOME_SCENARIO_COMPLETION_VERSION = 'v1'

function sessionClaim(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= 160 ? normalized : null
}

function incomeScenarioCompletionId(memberUid: string, lifecycleCycleId: string) {
  const digest = createHash('sha256')
    .update(JSON.stringify([
      INCOME_SCENARIO_COMPLETION_EVENT,
      INCOME_SCENARIO_COMPLETION_VERSION,
      memberUid,
      lifecycleCycleId,
    ]))
    .digest('hex')

  return `${INCOME_SCENARIO_COMPLETION_EVENT}:${INCOME_SCENARIO_COMPLETION_VERSION}:${digest}`
}

function rateLimitKey(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const address = forwardedFor || request.headers.get('x-real-ip') || 'unknown'
  return `conversion:${createHash('sha256').update(address).digest('hex').slice(0, 24)}`
}

function validIdentifier(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (!normalized || normalized.length > 160 || !/^[a-zA-Z0-9:_-]+$/.test(normalized)) return null
  return normalized
}

function safeEventData(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const json = JSON.stringify(value)
  if (json.length > MAX_EVENT_DATA_BYTES) return null
  return JSON.parse(json) as Record<string, unknown>
}

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === 'preview' && process.env.INTELLIGENCE_OS_ADMIN_ENABLED === 'true') {
    return new Response(null, { status: 204 })
  }
  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    await limiter.check(rateLimitKey(request))

    const body = await request.json().catch(() => null)
    if (!body || !isBrowserConversionEventName(body.event)) {
      return NextResponse.json({ error: 'Unsupported event name' }, { status: 400 })
    }

    if (body.event === INCOME_SCENARIO_COMPLETION_EVENT) {
      const user = await getCurrentUser()
      const memberUid = sessionClaim(user?.sub)
      if (!memberUid) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      const lifecycleCycleId = sessionClaim(user?.['outseta:subscriptionUid'])
      if (!lifecycleCycleId) {
        return NextResponse.json({ error: 'Membership cycle unavailable' }, { status: 409 })
      }

      const supabase = createServiceRoleClient()
      let recorded = false
      try {
        await recordConversionEvent(supabase, {
          eventName: INCOME_SCENARIO_COMPLETION_EVENT,
          clientEventId: incomeScenarioCompletionId(memberUid, lifecycleCycleId),
          memberUid,
          eventData: {
            sourcePage: '/tools/income-calculator',
            source: 'income_scenarios',
            completionContract: INCOME_SCENARIO_COMPLETION_VERSION,
            lifecycleCycleId,
          },
        })
        recorded = true
      } catch (storageError) {
        console.error('[Conversion Events] First-party storage failed:', storageError)
      }

      return NextResponse.json(
        { recorded, activeCampaignTracked: false },
        { status: recorded ? 200 : 202 },
      )
    }

    const eventData = safeEventData(body.eventData)
    if (!eventData) {
      return NextResponse.json({ error: 'Event data is too large' }, { status: 413 })
    }

    const user = await getCurrentUser()
    const memberUid = getOutsetaUserId(user)
    const memberEmail = typeof user?.email === 'string' ? user.email : null
    const planUid = typeof user?.['outseta:planUid'] === 'string' ? user['outseta:planUid'] : null
    const planName = planUid ? getPlanName(planUid) : null

    const supabase = createServiceRoleClient()
    let recorded = false
    try {
      await recordConversionEvent(supabase, {
        eventName: body.event,
        clientEventId: validIdentifier(body.clientEventId),
        anonymousId: validIdentifier(body.anonymousId),
        sessionId: validIdentifier(body.sessionId),
        memberUid,
        memberEmail,
        planUid,
        planName,
        eventData,
        occurredAt: typeof body.occurredAt === 'string' ? body.occurredAt : null,
      })
      recorded = true
    } catch (storageError) {
      // ActiveCampaign continuity is more important than making a member-facing
      // request fail while a database migration is still rolling out.
      console.error('[Conversion Events] First-party storage failed:', storageError)
    }

    let activeCampaignTracked = false
    if (memberEmail) {
      activeCampaignTracked = await trackACServerEvent({
        email: memberEmail,
        event: body.event,
        eventData: JSON.stringify(eventData),
      })
    }

    return NextResponse.json(
      { recorded, activeCampaignTracked },
      { status: recorded ? 200 : 202 },
    )
  } catch (error) {
    if (isRateLimitExceededError(error)) {
      return NextResponse.json({ error: 'Too many events' }, { status: 429 })
    }
    if (isRateLimitUnavailableError(error)) {
      return NextResponse.json(
        { error: 'Request protection is temporarily unavailable' },
        { status: 503, headers: { 'Retry-After': '30' } },
      )
    }

    console.error('[Conversion Events] Failed to record event:', error)
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
  }
}
