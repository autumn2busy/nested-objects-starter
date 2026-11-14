import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { verifyOutsetaSignature } from '@/lib/security'
import { reconcileNonrecurringAccount } from '@/lib/nonrecurring-ac-sync'

export const runtime = 'nodejs'
export const maxDuration = 300

/** A dedicated callback keeps payment/customer repair away from lifecycle sends.
 * Outseta account callbacks use the existing signed webhook secret. An operator
 * may reconcile one exact account/invoice using a separate server-only secret.
 * No GET execution, cron, scheduler, contact enrollment, or manual send endpoint.
 */
export async function POST(request: NextRequest) {
  if (!['verify', 'apply'].includes(process.env.AC_NONRECURRING_SYNC_MODE || '')) {
    return NextResponse.json({ state: 'blocked', code: 'nonrecurring_sync_disabled' }, { status: 503 })
  }
  const raw = await request.text()
  if (Buffer.byteLength(raw) > 65536) return NextResponse.json({ code: 'payload_too_large' }, { status: 413 })
  const expected = process.env.AC_NONRECURRING_RECONCILE_SECRET
  const bearer = request.headers.get('authorization')?.replace(/^Bearer /, '') || ''
  const operator = !!expected && Buffer.byteLength(expected) === Buffer.byteLength(bearer) &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(bearer))
  const signature = request.headers.get('x-hub-signature-256')
  const signed = verifyOutsetaSignature(signature, raw, process.env.OUTSETA_WEBHOOK_SECRET)
  if (!operator && !signed) return NextResponse.json({ code: 'unauthorized' }, { status: 401 })
  let data: Record<string, unknown>
  try { data = JSON.parse(raw) } catch { return NextResponse.json({ code: 'invalid_json' }, { status: 400 }) }
  if (!data || Array.isArray(data) || typeof data !== 'object') return NextResponse.json({ code: 'invalid_scope' }, { status: 400 })
  // Signed account callbacks only. Invoice/person payloads cannot be mistaken for accounts.
  const accountUid = operator ? data.accountUid : Array.isArray(data.PersonAccount) && !data.Email ? data.Uid : null
  const invoiceUid = operator ? data.invoiceUid : undefined
  if (typeof accountUid !== 'string' || !/^[A-Za-z0-9]{4,40}$/.test(accountUid) ||
      (invoiceUid !== undefined && (typeof invoiceUid !== 'string' || !/^[A-Za-z0-9]{4,40}$/.test(invoiceUid)))) {
    return NextResponse.json({ code: 'invalid_scope' }, { status: 400 })
  }
  const result = await reconcileNonrecurringAccount(accountUid, invoiceUid as string | undefined)
  if (result.code === 'exact_existing_member_required') {
    // Callback ordering can precede the membership webhook. Do not acknowledge
    // missing authority as success; the existing membership hook also retries
    // Free reconciliation immediately after it saves the exact profile.
    return NextResponse.json(result, { status: 503, headers: { 'Retry-After': '60' } })
  }
  // A provider retry may reconcile uncertain writes by GET; durable intent prevents reposting.
  return NextResponse.json(result, { status: result.state === 'blocked' || result.state === 'uncertain' ? 409 : 200 })
}
