import { NextRequest, NextResponse } from 'next/server'
import { verifyOutsetaSignature } from '@/lib/security'
import { verifyStripeReadiness } from '@/lib/stripe-readiness'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Signed diagnostic only: no reconciliation, provider writes, or settings changes. */
export async function POST(request: NextRequest) {
  const respond = (data: unknown, status: number) => NextResponse.json(data, { status,
    headers: { 'Cache-Control': 'no-store' } })
  const raw = await request.text()
  if (Buffer.byteLength(raw) > 2048) return respond({ code: 'payload_too_large' }, 413)
  if (!verifyOutsetaSignature(request.headers.get('x-hub-signature-256'), raw, process.env.OUTSETA_WEBHOOK_SECRET)) {
    return respond({ code: 'unauthorized' }, 401)
  }
  let input
  try { input = JSON.parse(raw) } catch { return respond({ code: 'invalid_request' }, 400) }
  if (!input || Array.isArray(input) || input.operation !== 'stripe-readiness-v1' ||
    Object.keys(input).sort().join(',') !== 'expectedStripeAccountId,issuedAt,operation,outsetaAccountUid' ||
    typeof input.issuedAt !== 'number' || !Number.isSafeInteger(input.issuedAt) || Math.abs(Date.now() - input.issuedAt) > 120000 ||
    typeof input.expectedStripeAccountId !== 'string' || !/^acct_[A-Za-z0-9]{1,80}$/.test(input.expectedStripeAccountId) ||
    typeof input.outsetaAccountUid !== 'string' || !/^[A-Za-z0-9]{4,40}$/.test(input.outsetaAccountUid)) {
    return respond({ code: 'invalid_request' }, 400)
  }
  const result = await verifyStripeReadiness(input, process.env)
  return respond(result, result.code === 'stripe_readiness_verified' ? 200 : 409)
}
