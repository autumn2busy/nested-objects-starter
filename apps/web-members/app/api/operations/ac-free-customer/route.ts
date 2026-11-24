import { NextRequest, NextResponse } from 'next/server'
import { verifyOutsetaSignature } from '@/lib/security'
import { readFreeCustomerScope, validateFreeCustomerRequest } from '@/lib/free-customer-scope'
import { reconcileOneFreeCustomer } from '@/lib/free-customer-ac-sync'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Operator only. Never registered as a membership/payment callback or cron. */
export async function POST(request: NextRequest) {
  const respond = (data: unknown, status: number) => NextResponse.json(data, { status,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
  if (!process.env.AC_FREE_CUSTOMER_SYNC_SCOPE) return respond({ code: 'free_customer_sync_disabled' }, 503)
  const raw = await request.text()
  if (Buffer.byteLength(raw) > 2048) return respond({ code: 'payload_too_large' }, 413)
  if (!verifyOutsetaSignature(request.headers.get('x-hub-signature-256'), raw, process.env.OUTSETA_WEBHOOK_SECRET)) {
    return respond({ code: 'unauthorized' }, 401)
  }
  let input
  try {
    const now = Date.now(), scope = readFreeCustomerScope(process.env, now)
    input = validateFreeCustomerRequest(JSON.parse(raw), scope, now)
  } catch { return respond({ code: 'invalid_or_disabled_free_customer_scope' }, 400) }
  const result = await reconcileOneFreeCustomer(input)
  return respond(result, result.state === 'verified' ? 200 : 409)
}
