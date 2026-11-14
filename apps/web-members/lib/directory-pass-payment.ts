/** Payment evidence is independent of membership/access. No provider writes live here. */
export interface PassPaymentEvidence {
  observedAt: string
  account: { uid: string; primaryPersonUid: string; stripeCustomerId: string; livemode: boolean; isDemo: boolean; isQa: boolean }
  member: { personUid: string; accountUid: string; acContactId: string; acCustomerId: string }
  invoice: {
    uid: string; accountUid: string; subscriptionUid: string; planUid: string; renewalTerm: number
    status: number; currency: string | null; outstandingMinor: number; paidMinor: number; refundedMinor: number; creditMinor: number
    isUserGenerated: boolean; stripeChargeIds: string[]
    lines: Array<{ kind: number; amountMinor: number; taxMinor: number }>
  }
  transactions: Array<{ uid: string; accountUid: string; invoiceUid: string; kind: number; amountMinor: number; captured: boolean; electronic: boolean; occurredAt: string }>
  transactionsComplete: boolean
  charge: {
    id: string; stripeAccountId: string; customerId: string; livemode: boolean; status: string
    paid: boolean; captured: boolean; capturedMinor: number; refundedMinor: number; disputed: boolean
    currency: string; createdAt: string; paymentIntentId: string
  }
  paymentIntent: { id: string; latestChargeId: string; customerId: string; livemode: boolean; status: string; captureMethod: string; receivedMinor: number; currency: string }
  refunds: Array<{ id: string; chargeId: string; status: string; amountMinor: number; currency: string; occurredAt: string }>
  refundsComplete: boolean
}

export interface PassOrderProjection {
  externalId: string; invoiceUid: string; accountUid: string; personUid: string; subscriptionUid: string
  planUid: string; stripeChargeId: string; stripeAccountId: string; acContactId: string; acCustomerId: string
  currency: 'USD'; capturedMinor: number; refundedMinor: number; netMinor: number
  paidAt: string; updatedAt: string; source: 0; recurring: false
}

export type PassPaymentDecision =
  | { state: 'ready'; order: PassOrderProjection; createAllowed: boolean }
  | { state: 'skipped' | 'blocked'; reason: string }

const id = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value)
const numericId = (value: unknown) => typeof value === 'string' && /^[1-9]\d*$/.test(value)
const money = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const time = (value: string) => /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN

/** No inference from price, email, account stage, access expiry or plan alone. */
export function assessDirectoryPassPayment(e: PassPaymentEvidence, policy: { planUid: string; stripeAccountId: string }, now: string): PassPaymentDecision {
  const block = (reason: string): PassPaymentDecision => ({ state: 'blocked', reason })
  const skip = (reason: string): PassPaymentDecision => ({ state: 'skipped', reason })
  if (!id(policy.planUid) || !/^acct_[A-Za-z0-9]+$/.test(policy.stripeAccountId) || !Number.isFinite(time(now)) || !Number.isFinite(time(e.observedAt)) ||
      time(e.observedAt) > time(now) || time(now) - time(e.observedAt) > 300_000) return block('stale_or_invalid_evidence')
  const { account:a, member:m, invoice:i, charge:c, paymentIntent:p } = e
  if (a.isQa || a.isDemo || !a.livemode) return skip('qa_demo_or_test_account')
  if (![a.uid,a.primaryPersonUid,m.personUid,m.accountUid,i.uid,i.accountUid,i.subscriptionUid,i.planUid].every(id) ||
      a.uid !== m.accountUid || a.primaryPersonUid !== m.personUid || i.accountUid !== a.uid ||
      !numericId(m.acContactId) || !numericId(m.acCustomerId)) return block('member_invoice_identity_mismatch')
  if (i.planUid !== policy.planUid || i.renewalTerm !== 4 || i.isUserGenerated) return block('invoice_not_exact_pass_subscription')
  if (![i.outstandingMinor,i.paidMinor,i.refundedMinor,i.creditMinor].every(money)) return block('invalid_invoice_amount')
  if (i.paidMinor === 0) return skip('zero_charge_invoice')
  if (i.creditMinor !== 0) return block('credit_allocation_unsupported')
  if (i.outstandingMinor !== 0 || ![2,5].includes(i.status)) return skip('invoice_unsettled')
  if (i.refundedMinor > i.paidMinor) return block('invoice_refund_conflict')
  // One plan and discounts only: no allocation by account/email across products.
  if (!Array.isArray(i.lines) || i.lines.filter(x=>x.kind===1).length!==1 ||
      i.lines.some(x=>![1,5].includes(x.kind) || !Number.isSafeInteger(x.amountMinor) || !money(x.taxMinor) ||
        (x.kind===1 && x.amountMinor<=0) || (x.kind===5 && (x.amountMinor>0 || x.taxMinor!==0))) ||
      i.lines.reduce((sum,x)=>sum+x.amountMinor+x.taxMinor,0)!==i.paidMinor) return block('invoice_product_allocation_unverified')
  if (!e.transactionsComplete || !e.refundsComplete) return block('incomplete_payment_collection')
  if (i.stripeChargeIds.length!==1 || i.stripeChargeIds[0]!==c.id || !/^ch_[A-Za-z0-9]+$/.test(c.id) ||
      c.stripeAccountId!==policy.stripeAccountId || !/^cus_[A-Za-z0-9]+$/.test(a.stripeCustomerId) ||
      c.customerId!==a.stripeCustomerId || p.customerId!==a.stripeCustomerId || c.paymentIntentId!==p.id ||
      !/^pi_[A-Za-z0-9]+$/.test(p.id) || p.latestChargeId!==c.id) return block('stripe_payment_identity_mismatch')
  if (!c.livemode || !p.livemode) return skip('test_payment')
  if (c.disputed) return block('payment_disputed')
  if (c.status!=='succeeded' || !c.paid || !c.captured || p.status!=='succeeded') return skip('payment_unsettled')
  if (p.captureMethod!=='automatic') return block('capture_timestamp_unverified')
  if (i.currency!=='USD' || c.currency.toUpperCase()!=='USD' || p.currency.toUpperCase()!=='USD') return block('currency_not_verified_usd')
  if (![c.capturedMinor,c.refundedMinor,p.receivedMinor].every(money) || c.capturedMinor!==i.paidMinor ||
      p.receivedMinor!==c.capturedMinor || c.refundedMinor!==i.refundedMinor) return block('payment_amount_conflict')
  const tx=e.transactions.filter(t=>t.invoiceUid===i.uid)
  if (tx.some(t=>t.accountUid!==a.uid || !id(t.uid) || !Number.isSafeInteger(t.amountMinor) || !Number.isFinite(time(t.occurredAt)))) return block('transaction_identity_or_date_invalid')
  if (new Set(tx.map(t=>t.uid)).size!==tx.length || tx.some(t=>![1,2,4].includes(t.kind))) return block('transaction_allocation_unsupported')
  const payments=tx.filter(t=>t.kind===2)
  if (payments.length!==1 || !payments[0].captured || !payments[0].electronic ||
      payments[0].amountMinor!==-c.capturedMinor) return block('captured_invoice_payment_unverified')
  const paidAt=payments[0].occurredAt
  if (!Number.isFinite(time(c.createdAt)) || time(paidAt)<time(c.createdAt)-300_000 ||
      Math.abs(time(paidAt)-time(c.createdAt))>3_600_000 || time(paidAt)>time(now)) return block('payment_timestamp_conflict')
  if (e.refunds.some(r=>r.chargeId!==c.id || !/^re_[A-Za-z0-9]+$/.test(r.id) || r.currency.toUpperCase()!=='USD' ||
      !money(r.amountMinor) || !Number.isFinite(time(r.occurredAt)) || time(r.occurredAt)>time(now)) ||
      new Set(e.refunds.map(r=>r.id)).size!==e.refunds.length) return block('refund_identity_or_date_invalid')
  if (e.refunds.some(r=>!['succeeded','failed','canceled'].includes(r.status))) return block('refund_pending')
  const refunds=e.refunds.filter(r=>r.status==='succeeded')
  if (refunds.reduce((sum,r)=>sum+r.amountMinor,0)!==c.refundedMinor ||
      tx.filter(t=>t.kind===4).reduce((sum,t)=>sum+t.amountMinor,0)!==c.refundedMinor) return block('refund_amount_conflict')
  const updatedAt=[paidAt,...refunds.map(r=>r.occurredAt)].sort((a,b)=>time(b)-time(a))[0]
  return {state:'ready',createAllowed:c.refundedMinor===0,order:{
    externalId:`outseta-pass-invoice-${i.uid}`,invoiceUid:i.uid,accountUid:a.uid,personUid:m.personUid,
    subscriptionUid:i.subscriptionUid,planUid:i.planUid,stripeChargeId:c.id,stripeAccountId:c.stripeAccountId,
    acContactId:m.acContactId,acCustomerId:m.acCustomerId,currency:'USD',capturedMinor:c.capturedMinor,
    refundedMinor:c.refundedMinor,netMinor:c.capturedMinor-c.refundedMinor,paidAt,updatedAt,source:0,recurring:false,
  }}
}

/** Decimal Outseta amounts become integer cents without silently rounding bad evidence. */
export function outsetaAmountMinor(value: unknown): number {
  if (typeof value!=='number' || !Number.isFinite(value) || Math.abs(value)>Number.MAX_SAFE_INTEGER/100) throw Error('invalid_money')
  const minor=Math.round(value*100)
  if (Math.abs(value*100-minor)>1e-7) throw Error('fractional_minor_unit')
  return minor
}

/** Outseta documents unzoned API timestamps as UTC, never workstation local time. */
export function outsetaUtc(value: unknown): string {
  if (typeof value!=='string') throw Error('invalid_timestamp')
  const parts=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(?:Z|[+-](\d{2}):(\d{2}))?$/.exec(value)
  if (!parts) throw Error('invalid_timestamp')
  const [,year,month,day,hour,minute,second,offsetHour,offsetMinute]=parts.map(Number)
  if (year<2000 || month<1 || month>12 || day<1 || day>new Date(Date.UTC(year,month,0)).getUTCDate() ||
      hour>23 || minute>59 || second>59 || (offsetHour!==undefined && offsetHour>23) ||
      (offsetMinute!==undefined && offsetMinute>59)) throw Error('invalid_timestamp')
  const zoned=/(?:Z|[+-]\d{2}:\d{2})$/.test(value)?value:value+'Z'
  const date=new Date(zoned)
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear()<2000) throw Error('invalid_timestamp')
  return date.toISOString()
}
