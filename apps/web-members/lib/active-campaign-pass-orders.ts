import type { PassOrderProjection, PassPaymentDecision } from '@/lib/directory-pass-payment'

export interface StoredPassOrder {
  id: string; externalId: string; connectionId: string; customerId: string; source: number
  totalMinor: number; currency: string; paidAt: string
  products: Array<{ externalId: string; priceMinor: number; quantity: number }>
}
export interface PassOrderLease {
  token: string; writeStarted: boolean; orderId: string | null; capturedMinor: number; refundedMinor: number
}
export interface PassOrderPorts {
  claim(order: PassOrderProjection): Promise<PassOrderLease | null>
  markWriteStarted(token: string): Promise<void>
  finish(token: string, result: { state: 'verified' | 'blocked' | 'uncertain'; code: string; orderId?: string; refundedMinor?: number }): Promise<void>
  noEmailPreflight(contactId: string): Promise<void>
  findOrder(externalId: string): Promise<StoredPassOrder | null>
  createOrder(order: PassOrderProjection): Promise<void>
  updateOrder(id: string, order: PassOrderProjection): Promise<void>
}
export interface PassOrderSyncResult {
  state: 'verified' | 'skipped' | 'blocked' | 'uncertain' | 'busy'
  code: string
  providerWrite: boolean
  automaticWriteRetry: false
}

/**
 * Source 0 is mandatory. Source 1 is REALTIME and triggers purchases/conversions.
 * https://developers.activecampaign.com/reference/orders
 * Historical imports still update customer aggregates; native attribution is intentionally absent.
 * A timeout or crash after write intent may only reconcile by GET, never replay POST blindly.
 */
export async function syncPassOrder(decision: PassPaymentDecision, connectionId: string, ports: PassOrderPorts): Promise<PassOrderSyncResult> {
  const result=(state:PassOrderSyncResult['state'],code:string,providerWrite=false):PassOrderSyncResult=>({state,code,providerWrite,automaticWriteRetry:false})
  if (decision.state!=='ready') return result(decision.state,decision.reason)
  const o=decision.order
  if (o.source!==0 || o.recurring!==false || !/^[1-9]\d*$/.test(connectionId)) return result('blocked','unsafe_order_configuration')
  let lease: PassOrderLease | null
  try { lease=await ports.claim(o) } catch { return result('blocked','receipt_claim_unavailable') }
  if (!lease) return result('busy','receipt_claimed_elsewhere')
  let attempted=false
  const finish=async (state:'verified'|'blocked'|'uncertain',code:string,orderId?:string)=>{
    try { await ports.finish(lease!.token,{state,code,...(orderId?{orderId}:{}),...(state==='verified'?{refundedMinor:o.refundedMinor}:{})}) }
    catch { return result('uncertain','receipt_finish_unavailable',attempted) }
    return result(state,code,attempted)
  }
  const identity=(found:StoredPassOrder)=>found.externalId===o.externalId && found.connectionId===connectionId &&
    found.customerId===o.acCustomerId && found.source===0 && found.currency===o.currency &&
    Date.parse(found.paidAt)===Date.parse(o.paidAt) && found.products.length===1 &&
    found.products[0].externalId===o.planUid && found.products[0].quantity===1
  const exact=(found:StoredPassOrder)=>identity(found) && found.totalMinor===o.netMinor && found.products[0].priceMinor===o.netMinor
  try {
    if (lease.capturedMinor!==o.capturedMinor || lease.refundedMinor>o.refundedMinor) return finish('blocked','stale_or_changed_payment')
    const found=await ports.findOrder(o.externalId)
    if (found) {
      if (!identity(found) || (lease.orderId && lease.orderId!==found.id)) return finish('blocked','existing_order_identity_conflict')
      // A found record is ours only if a durable intent predates the provider write.
      if (!lease.writeStarted) return finish('blocked','unowned_existing_order')
      if (exact(found)) return finish('verified','provider_readback_matches',found.id)
      if (!lease.orderId || found.totalMinor<o.netMinor || found.totalMinor>o.capturedMinor ||
          found.products[0].priceMinor!==found.totalMinor) return finish('blocked','existing_order_amount_conflict')
      await ports.noEmailPreflight(o.acContactId)
      await ports.markWriteStarted(lease.token)
      attempted=true
      await ports.updateOrder(found.id,o)
    } else {
      if (lease.writeStarted || lease.orderId) return finish('uncertain','prior_write_not_found_no_replay')
      if (!decision.createAllowed || o.netMinor<=0) return finish('blocked','refunded_payment_not_imported')
      await ports.noEmailPreflight(o.acContactId)
      await ports.markWriteStarted(lease.token)
      attempted=true
      await ports.createOrder(o)
    }
    const readback=await ports.findOrder(o.externalId)
    if (!readback || !exact(readback)) return finish('uncertain','provider_readback_unconfirmed')
    return finish('verified','provider_readback_matches',readback.id)
  } catch {
    // The provider may have committed even when transport/JSON handling failed.
    if (attempted) {
      try {
        const reconciled=await ports.findOrder(o.externalId)
        if (reconciled && exact(reconciled)) return finish('verified','uncertain_write_reconciled',reconciled.id)
      } catch { /* Unavailable reads remain unknown. */ }
      return finish('uncertain','write_outcome_unknown_no_replay')
    }
    return finish('blocked','prewrite_verification_failed')
  }
}

export function historicalPassOrderPayload(order: PassOrderProjection, connectionId: string, email: string) {
  if (order.source!==0 || order.recurring!==false || !Number.isSafeInteger(order.netMinor) || order.netMinor<0) throw Error('unsafe_order_payload')
  return {ecomOrder:{
    externalid:order.externalId,orderNumber:order.externalId,source:0,
    connectionid:connectionId,customerid:order.acCustomerId,email,currency:order.currency,totalPrice:order.netMinor,
    externalCreatedDate:order.paidAt,externalUpdatedDate:order.updatedAt,
    orderProducts:[{externalid:order.planUid,name:'Directory Pass — settled one-time payment',price:order.netMinor,quantity:1}],
  }}
}
