import { NextResponse } from 'next/server'
import { verifyOutsetaSignature } from '@/lib/security'
import { PLAN_UIDS } from '@/lib/plan-config'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { evaluateSignupConsent, persistSignupConsent } from '@/lib/signup-email-consent'
import { emitFreeJourneySourceEvent } from '@/lib/free-journey-operation-producer'

export const dynamic = 'force-dynamic'
const MAX_BODY_BYTES = 64 * 1024

// Configure only the native Sign Up Callback here after signing and payload
// acceptance. General Outseta notifications keep their existing endpoint.
export async function POST(request: Request) {
  const secret = process.env.OUTSETA_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ recorded: false, reason: 'signature_configuration_unavailable' }, { status: 503 })
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ recorded: false, reason: 'payload_too_large' }, { status: 413 })
  }
  const body = await request.text()
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ recorded: false, reason: 'payload_too_large' }, { status: 413 })
  }
  if (!verifyOutsetaSignature(request.headers.get('x-hub-signature-256'), body, secret)) {
    return NextResponse.json({ recorded: false, reason: 'invalid_signature' }, { status: 401 })
  }
  let payload: unknown
  try { payload = JSON.parse(body) } catch {
    return NextResponse.json({ recorded: false, reason: 'invalid_json' }, { status: 400 })
  }
  const decision = evaluateSignupConsent(payload, PLAN_UIDS.FREE)
  if (decision.status !== 'accepted') {
    return NextResponse.json({ recorded: false, reason: decision.reason }, { status: decision.status === 'ignored' ? 200 : 422 })
  }
  if (process.env.VERCEL_ENV === 'preview' && process.env.INTELLIGENCE_OS_ADMIN_ENABLED === 'true') {
    return new Response(null, { status: 204 })
  }
  try {
    await persistSignupConsent(createServiceRoleClient(), decision.receipt)
  } catch {
    // Never log the raw callback or member details. Require exact ledger readback.
    return NextResponse.json({ recorded: false, reason: 'persistence_unverified' }, { status: 503 })
  }
  try {
    const routing = await emitFreeJourneySourceEvent({
      kind: 'consent_recorded', occurredAt: decision.receipt.occurredAt,
      outsetaPersonUid: decision.receipt.memberUid,
      subscriptionUid: decision.receipt.eventData.lifecycleCycleId,
    })
    return NextResponse.json({ recorded: true, activeCampaignTracked: false, routing: {
      status: routing.status, code: routing.code, recoveryRequired: routing.recoveryRequired, automaticRetry: false,
    } })
  } catch {
    // Routing uncertainty never erases a successfully verified request receipt.
    return NextResponse.json({ recorded: true, activeCampaignTracked: false, routing: {
      status: 'failed', code: 'routing_unverified', recoveryRequired: true, automaticRetry: false,
    } })
  }
}
