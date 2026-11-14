import { historicalPassOrderPayload, type StoredPassOrder } from '@/lib/active-campaign-pass-orders'
import type { PassOrderProjection } from '@/lib/directory-pass-payment'
import { requireNumericId, type NonrecurringMember } from '@/lib/nonrecurring-provider-reads'

type Row = Record<string, any>
export type AcRequest = (path: string, method?: 'GET' | 'POST' | 'PUT', body?: unknown) => Promise<Row>
export function completeAcRows(data: Row, key: string): Row[] {
  const rows = data[key], total = String(data.meta?.total ?? '')
  if (!Array.isArray(rows) || !/^\d+$/.test(total) || Number(total) !== rows.length || rows.length > 100) throw Error('incomplete_ac_collection')
  if (new Set(rows.map(x => requireNumericId(x.id))).size !== rows.length) throw Error('duplicate_ac_rows')
  return rows
}

/** Only the inspected field-193 trigger and triggerless handoff are allowed.
 * Customer/order/email-only contact writes never touch that field. A new trigger
 * or an active contact journey blocks the write, including historical imports.
 */
export async function verifyNonrecurringNoEmail(ac: AcRequest, contactId: string | null): Promise<void> {
  const data = await ac('automations?filters[status]=1&limit=100&offset=0')
  const active = completeAcRows(data, 'automations')
  if (active.some(a => String(a.status) !== '1' || !['527', '528'].includes(String(a.id)))) throw Error('unreviewed_active_automation')
  for (const a of active) {
    const d = await ac(`automations/${requireNumericId(a.id)}/triggers?limit=100&offset=0`)
    const triggers = d.automationTriggers
    // This endpoint has no total; verify the exact complete saved singleton.
    if (!Array.isArray(triggers) || triggers.length !== 1) throw Error('unreviewed_trigger_set')
    const t = triggers[0], params = typeof t.params === 'string' ? JSON.parse(t.params) : t.params
    if (String(t.seriesid) !== String(a.id) || String(t.multientry) !== '0') throw Error('trigger_identity_conflict')
    if (String(a.id) === '527') {
      if (t.type !== 'field' || String(params?.field) !== '193' || params?.accountfield !== false ||
          params?.dealfield !== false || params?.action !== 'addupdate' || params?.changes !== 'ever') throw Error('unreviewed_field_trigger')
    } else if (t.type !== 'none' || !Array.isArray(params) || params.length !== 0) throw Error('unexpected_conversion_trigger')
  }
  if (contactId) {
    // The contact relationship contract returns EVERY run when limit is omitted;
    // its response has no pagination total. Do not invent a meta.total requirement.
    const d = await ac(`contacts/${requireNumericId(contactId)}/contactAutomations`)
    const runs = d.contactAutomations
    if (!Array.isArray(runs) || runs.length > 100 || new Set(runs.map(r => requireNumericId(r.id))).size !== runs.length ||
        (d.meta?.total != null && Number(d.meta.total) !== runs.length)) throw Error('incomplete_contact_history')
    if (runs.some(r => String(r.contact) !== contactId || String(r.status) !== '2')) throw Error('active_or_unknown_contact_journey')
  }
}

export function createNonrecurringAcClient(ac: AcRequest, connectionId: string) {
  requireNumericId(connectionId)
  const matchesEmail = (a: unknown, b: string) => typeof a === 'string' && a.trim().toLowerCase() === b.trim().toLowerCase()
  return {
    noEmailPreflight: (contactId: string | null) => verifyNonrecurringNoEmail(ac, contactId),
    async findContact(member: NonrecurringMember): Promise<string | null> {
      const d = await ac(`contacts?email=${encodeURIComponent(member.email)}&limit=100&offset=0`)
      const rows = completeAcRows(d, 'contacts')
      if (rows.length > 1 || rows.some(c => !matchesEmail(c.email, member.email))) throw Error('contact_identity_conflict')
      const found = rows[0] ? requireNumericId(rows[0].id) : null
      if (member.acContactId && found !== member.acContactId) throw Error('stored_contact_conflict')
      return found
    },
    async createContact(member: NonrecurringMember): Promise<void> {
      // No custom fields, tags, list subscription, event, enrollment, or names.
      await ac('contact/sync', 'POST', { contact: { email: member.email } })
    },
    async findCustomer(member: NonrecurringMember): Promise<string | null> {
      const d = await ac(`ecomCustomers?filters[email]=${encodeURIComponent(member.email)}&limit=100&offset=0`)
      const all = completeAcRows(d, 'ecomCustomers')
      if (all.some(c => !matchesEmail(c.email, member.email) ||
          (String(c.connectionid) === '0' && String(c.externalid) !== '0'))) throw Error('customer_identity_conflict')
      // AC's documented connection=0/externalid=0 row is a cross-store aggregate,
      // not a second owned customer. Other real connections remain a conflict.
      const rows = all.filter(c => String(c.connectionid) !== '0')
      if (rows.length > 1 || rows.some(c =>
          String(c.externalid) !== member.personUid || String(c.connectionid) !== connectionId)) throw Error('customer_identity_or_legacy_connection_conflict')
      const found = rows[0] ? requireNumericId(rows[0].id) : null
      if (member.acCustomerId && found !== member.acCustomerId) throw Error('stored_customer_conflict')
      return found
    },
    async createCustomer(member: NonrecurringMember): Promise<void> {
      await ac('ecomCustomers', 'POST', { ecomCustomer: { connectionid: connectionId, externalid: member.personUid, email: member.email, acceptsMarketing: 0 } })
    },
    async findOrder(externalId: string): Promise<StoredPassOrder | null> {
      const d = await ac(`ecomOrders?filters[connectionid]=${connectionId}&filters[externalid]=${encodeURIComponent(externalId)}&limit=100&offset=0`)
      const rows = completeAcRows(d, 'ecomOrders')
      if (rows.length > 1 || rows.some(o => o.externalid !== externalId || String(o.connectionid) !== connectionId)) throw Error('order_lookup_conflict')
      if (!rows.length) return null
      const o = rows[0], id = requireNumericId(o.id)
      // Collection returns product IDs. Read the same order's product relation.
      const pd = await ac(`ecomOrders/${id}/orderProducts?limit=100&offset=0`)
      const products = pd.ecomOrderProducts
      if (!Array.isArray(o.orderProducts) || !Array.isArray(products) || products.length !== o.orderProducts.length ||
          new Set(products.map(p => String(p.id))).size !== products.length ||
          products.some(p => !o.orderProducts.map(String).includes(String(p.id)) || String(p.orderid ?? p.order) !== id)) throw Error('order_product_readback_incomplete')
      const minor = (n: unknown) => { const value = Number(n); if (n == null || !Number.isSafeInteger(value) || value < 0) throw Error('invalid_ac_money'); return value }
      return { id, externalId: o.externalid, connectionId: String(o.connectionid), customerId: String(o.customerid),
        source: Number(o.source), totalMinor: minor(o.totalPrice), currency: o.currency, paidAt: o.externalCreatedDate,
        products: products.map(p => ({ externalId: p.externalid, priceMinor: minor(p.price), quantity: Number(p.quantity) })) }
    },
    async createOrder(order: PassOrderProjection, email: string) { await ac('ecomOrders', 'POST', historicalPassOrderPayload(order, connectionId, email)) },
    async updateOrder(id: string, order: PassOrderProjection, email: string) { await ac(`ecomOrders/${requireNumericId(id)}`, 'PUT', historicalPassOrderPayload(order, connectionId, email)) },
  }
}
