import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getCurrentUser } from '@/lib/auth-server'
import { PLAN_UIDS } from '@/lib/plan-config'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { readConsentRequestStatus } from '@/lib/signup-email-consent'
import { emitFreeJourneySourceEvent } from '@/lib/free-journey-operation-producer'
import { rateLimit, isRateLimitExceededError } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' }
const limiter = rateLimit({ limit: 10, intervalMs: 60_000 })

// Saved-request status only. Email confirmation/delivery remain separate.
export async function GET() {
  const user = await getCurrentUser()
  if (!user?.sub) return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers })
  if (user['outseta:planUid'] !== PLAN_UIDS.FREE) {
    return NextResponse.json({ error: 'Free membership required' }, { status: 403, headers })
  }
  const cycle = user['outseta:subscriptionUid']
  if (!cycle) return NextResponse.json({ error: 'Membership cycle unavailable' }, { status: 409, headers })
  try {
    const status = await readConsentRequestStatus(createServiceRoleClient(), user.sub, cycle)
    return NextResponse.json(status, { status: status.status === 'unavailable' ? 503 : 200, headers })
  } catch {
    return NextResponse.json({ status: 'unavailable', recorded: false, source: null, confirmationRequired: true }, { status: 503, headers })
  }
}

// Deliberate recheck only: no GET side effects, new consent receipt or claimed
// email confirmation. Runtime independently rereads confirmation/suppression.
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Same-origin request required' }, { status: 403, headers })
  }
  const user = await getCurrentUser()
  if (!user?.sub) return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers })
  if (user['outseta:planUid'] !== PLAN_UIDS.FREE) {
    return NextResponse.json({ error: 'Free membership required' }, { status: 403, headers })
  }
  const cycle = user['outseta:subscriptionUid']
  if (!cycle) return NextResponse.json({ error: 'Membership cycle unavailable' }, { status: 409, headers })
  try {
    await limiter.check('consent-check:' + createHash('sha256').update(JSON.stringify([user.sub, cycle])).digest('hex'))
    const status = await readConsentRequestStatus(createServiceRoleClient(), user.sub, cycle)
    if (status.status === 'unavailable') {
      return NextResponse.json({ error: 'Consent request unavailable' }, { status: 503, headers })
    }
    if (!status.recorded) return NextResponse.json({ error: 'Consent request not recorded' }, { status: 409, headers })
    const routing = await emitFreeJourneySourceEvent({
      kind: 'consent_check_requested', occurredAt: new Date().toISOString(),
      outsetaPersonUid: user.sub, subscriptionUid: cycle,
    })
    return NextResponse.json({ recorded: true, routing: {
      status: routing.status, code: routing.code, recoveryRequired: routing.recoveryRequired, automaticRetry: false,
    } }, { status: routing.status === 'failed' ? 503 : 200, headers })
  } catch (error) {
    return NextResponse.json({ error: isRateLimitExceededError(error) ? 'Too many checks' : 'Check unavailable; do not retry automatically' },
      { status: isRateLimitExceededError(error) ? 429 : 503, headers })
  }
}
