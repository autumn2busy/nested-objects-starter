import { z } from 'zod'

const ref = z.string().regex(/^[A-Za-z0-9_-]{1,160}$/)
const timestamp = z.string().datetime({ offset: true })
const minor = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const seconds = z.number().int().nonnegative().max(8_640_000_000_000)
const currency = z.string().regex(/^[a-z]{3}$/).transform((value) => value.toUpperCase())
const resource = z.enum(['stripe_charge', 'stripe_refunds', 'stripe_balance', 'stripe_invoice_payments', 'outseta_account'])
export const BILLING_STRIPE_API_VERSION = '2025-06-30.basil' as const
const policySchema = z.object({
  reviewRef: ref, reviewedAt: timestamp, expiresAt: timestamp,
  stripeAccountRef: z.string().regex(/^acct_[A-Za-z0-9]+$/), livemode: z.boolean(),
  stripeApiVersion: z.literal(BILLING_STRIPE_API_VERSION),
  outsetaHostname: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.outseta\.com$/),
  scopes: z.array(z.object({ resource, id: ref }).strict()).min(1).max(50),
  maxRequests: z.number().int().min(1).max(100), maxPages: z.number().int().min(1).max(5),
  pageSize: z.number().int().min(1).max(100), timeoutMs: z.number().int().min(1).max(30_000),
}).strict()

export type BillingReadPolicy = z.infer<typeof policySchema>
export type BillingReadResource = z.infer<typeof resource>
export interface BillingReadRequest {
  method: 'GET'
  url: string
  headers: Readonly<Record<string, string>>
  signal: AbortSignal
  redirect: 'error'
  cache: 'no-store'
}
export type BillingReadTransport = (request: BillingReadRequest) => Promise<{ status: number; body: unknown }>
export interface BillingReadResult<Row> {
  state: 'complete' | 'partial' | 'unavailable'
  reason: string
  records: Row[]
  observedAt: string
  pagesRead: number
  evidence: {
    resource: BillingReadResource; id: string; reviewRef: string; mode: 'fixture' | 'approved_live'
    sourceAccount: string; stripeApiVersion: typeof BILLING_STRIPE_API_VERSION | null; expectedLivemode: boolean
  }
  // Complete means this exact ID or child collection, never a complete revenue day.
  scope: 'explicit_id_only'
  captureDateCoverage: 'unknown'
  mutationAllowed: false
}

const nullableRef = z.union([ref, z.object({ id: ref })]).nullable()
const chargeSchema = z.object({
  id: ref, object: z.literal('charge'), customer: nullableRef, payment_intent: nullableRef, livemode: z.boolean(),
  status: z.enum(['succeeded', 'pending', 'failed']), paid: z.boolean(), captured: z.boolean(),
  amount_captured: minor, amount_refunded: minor, currency, created: seconds,
  disputed: z.boolean(), balance_transaction: nullableRef,
})
const refundSchema = z.object({
  id: ref, object: z.literal('refund'), charge: nullableRef, amount: minor, currency, created: seconds,
  status: z.enum(['succeeded', 'pending', 'requires_action', 'failed', 'canceled']),
})
const balanceSchema = z.object({
  id: ref, object: z.literal('balance_transaction'), source: nullableRef, currency, created: seconds,
  available_on: seconds, status: z.enum(['pending', 'available']),
})
const invoicePaymentSchema = z.object({
  id: ref, object: z.literal('invoice_payment'), invoice: nullableRef, livemode: z.boolean(), currency,
  status: z.enum(['open', 'paid', 'canceled']), amount_paid: minor.nullable(),
  payment: z.object({
    type: z.enum(['charge', 'payment_intent', 'payment_record']),
    charge: nullableRef.optional(), payment_intent: nullableRef.optional(), payment_record: nullableRef.optional(),
  }),
})
const subscription = z.object({ Uid: ref, Plan: z.object({ Uid: ref }).nullable().optional() })
const accountSchema = z.object({
  Uid: ref, AccountStage: z.number().int().nonnegative().nullable().optional(),
  StripeId: z.string().regex(/^cus_[A-Za-z0-9]+$/).nullable().optional(),
  IsLivemode: z.boolean(), IsDemo: z.boolean().nullable().optional(),
  CurrentSubscription: subscription.nullable().optional(),
  LatestSubscription: subscription.nullable().optional(),
})

export interface BillingChargeObservation {
  chargeRef: string; customerRef: string | null; paymentIntentRef: string | null; livemode: boolean; currency: string
  status: 'succeeded' | 'pending' | 'failed'; paid: boolean; captured: boolean
  amountCapturedMinor: number; amountRefundedMinor: number; createdAt: string
  capturedAt: null; captureBasis: 'multiple_or_unknown'; disputed: boolean; balanceRef: string | null
}
export interface BillingRefundObservation {
  refundRef: string; chargeRef: string; amountMinor: number; currency: string; createdAt: string
  status: 'succeeded' | 'pending' | 'requires_action' | 'failed' | 'canceled'
}
export interface BillingBalanceObservation {
  balanceRef: string; sourceRef: string | null; currency: string; createdAt: string; availableOn: string; status: 'pending' | 'available'
}
export interface BillingInvoicePaymentObservation {
  allocationRef: string; invoiceRef: string; livemode: boolean; currency: string; amountPaidMinor: number | null
  status: 'open' | 'paid' | 'canceled'; paymentType: 'charge' | 'payment_intent' | 'payment_record'
  paymentRef: string | null
}
export interface BillingAccountObservation {
  accountRef: string; accountStage: number | null; currentSubscriptionRef: string | null
  currentPlanRef: string | null; latestSubscriptionRef: string | null
  stripeCustomerRef: string | null; livemode: boolean; isDemo: boolean | null; identityState: 'unknown'
}

/**
 * Unwired, GET-only readers. Fixture mode requires an injected transport and uses fake headers;
 * live mode additionally requires explicit enablement, scoped review and caller-held secrets.
 * No environment lookup, account discovery, broad exports, automatic retries or persistence.
 */
export class BillingReadOnlyClient {
  readonly #policy: BillingReadPolicy
  readonly #scopes: Set<string>
  readonly #transport: BillingReadTransport
  readonly #headers: { stripe: Record<string, string>; outseta: Record<string, string> }
  readonly #now: () => string
  readonly #mode: 'fixture' | 'approved_live'
  #remaining: number

  constructor(configuration: {
    policy: BillingReadPolicy; mode: 'fixture' | 'approved_live'; liveReadsEnabled?: boolean
    credentials?: { stripeSecret: string; outsetaApiKey: string; outsetaApiSecret: string }
    transport?: BillingReadTransport; now?: () => string
  }) {
    this.#policy = policySchema.parse(configuration.policy)
    this.#now = configuration.now ?? (() => new Date().toISOString())
    this.#mode = configuration.mode
    if (!['fixture', 'approved_live'].includes(this.#mode)) throw new Error('Invalid billing reader mode')
    this.#assertReview()
    if (this.#mode === 'fixture' && (!configuration.transport || configuration.credentials)) {
      throw new Error('Fixture billing reads require an injected transport and no credentials')
    }
    if (this.#mode === 'approved_live' && configuration.liveReadsEnabled !== true) {
      throw new Error('Live billing reads are disabled')
    }
    const credentials = this.#mode === 'fixture'
      ? { stripeSecret: 'fixture-stripe-not-a-secret', outsetaApiKey: 'fixture-key', outsetaApiSecret: 'fixture-secret' }
      : z.object({ stripeSecret: secret(), outsetaApiKey: secret(), outsetaApiSecret: secret() }).strict().parse(configuration.credentials)
    this.#headers = {
      stripe: { Authorization: `Bearer ${credentials.stripeSecret}`, 'Stripe-Account': this.#policy.stripeAccountRef,
        'Stripe-Version': this.#policy.stripeApiVersion, Accept: 'application/json' },
      outseta: { Authorization: `Outseta ${credentials.outsetaApiKey}:${credentials.outsetaApiSecret}`, Accept: 'application/json' },
    }
    this.#scopes = new Set(this.#policy.scopes.map((scope) => `${scope.resource}:${scope.id}`))
    this.#remaining = this.#policy.maxRequests
    this.#transport = configuration.transport ?? boundedFetch
  }

  readCharge(id: string): Promise<BillingReadResult<BillingChargeObservation>> {
    return this.#read('stripe_charge', id, false, (raw) => {
      const row = chargeSchema.parse(raw)
      if (row.id !== id || row.livemode !== this.#policy.livemode) throw new Error('scope_mismatch')
      return { chargeRef: row.id, customerRef: externalRef(row.customer), paymentIntentRef: externalRef(row.payment_intent), livemode: row.livemode,
        currency: row.currency, status: row.status, paid: row.paid, captured: row.captured,
        amountCapturedMinor: row.amount_captured, amountRefundedMinor: row.amount_refunded,
        createdAt: iso(row.created), capturedAt: null, captureBasis: 'multiple_or_unknown',
        disputed: row.disputed, balanceRef: externalRef(row.balance_transaction) }
    })
  }

  readRefunds(chargeId: string): Promise<BillingReadResult<BillingRefundObservation>> {
    return this.#read('stripe_refunds', chargeId, true, (raw) => {
      const row = refundSchema.parse(raw)
      if (externalRef(row.charge) !== chargeId) throw new Error('scope_mismatch')
      return { refundRef: row.id, chargeRef: chargeId, amountMinor: row.amount, currency: row.currency,
        createdAt: iso(row.created), status: row.status }
    })
  }

  readBalance(id: string): Promise<BillingReadResult<BillingBalanceObservation>> {
    return this.#read('stripe_balance', id, false, (raw) => {
      const row = balanceSchema.parse(raw)
      if (row.id !== id) throw new Error('scope_mismatch')
      return { balanceRef: row.id, sourceRef: externalRef(row.source), currency: row.currency, createdAt: iso(row.created),
        availableOn: iso(row.available_on), status: row.status }
    })
  }

  readInvoicePayments(invoiceId: string): Promise<BillingReadResult<BillingInvoicePaymentObservation>> {
    return this.#read('stripe_invoice_payments', invoiceId, true, (raw) => {
      const row = invoicePaymentSchema.parse(raw)
      if (externalRef(row.invoice) !== invoiceId || row.livemode !== this.#policy.livemode) throw new Error('scope_mismatch')
      return { allocationRef: row.id, invoiceRef: invoiceId, livemode: row.livemode, currency: row.currency,
        amountPaidMinor: row.amount_paid, status: row.status, paymentType: row.payment.type,
        paymentRef: externalRef(row.payment[row.payment.type] ?? null) }
    })
  }

  readOutsetaAccount(id: string): Promise<BillingReadResult<BillingAccountObservation>> {
    return this.#read('outseta_account', id, false, (raw) => {
      const row = accountSchema.parse(raw)
      if (row.Uid !== id || row.IsLivemode !== this.#policy.livemode) throw new Error('scope_mismatch')
      return { accountRef: row.Uid, accountStage: row.AccountStage ?? null,
        currentSubscriptionRef: row.CurrentSubscription?.Uid ?? null,
        currentPlanRef: row.CurrentSubscription?.Plan?.Uid ?? null,
        latestSubscriptionRef: row.LatestSubscription?.Uid ?? null,
        // StripeId is a documented candidate link, not proof of the connected Stripe account
        // or membership payment allocation. Neither email nor a person projection is used.
        stripeCustomerRef: row.StripeId ?? null, livemode: row.IsLivemode,
        isDemo: row.IsDemo ?? null, identityState: 'unknown' }
    })
  }

  async #read<Row extends object>(kind: BillingReadResource, id: string, collection: boolean,
    normalize: (raw: unknown) => Row): Promise<BillingReadResult<Row>> {
    const records: Row[] = []
    let pagesRead = 0
    const finish = (reason: string): BillingReadResult<Row> => ({
      state: reason === 'scope_read' ? 'complete' : records.length || pagesRead ? 'partial' : 'unavailable',
      reason, records, pagesRead, observedAt: this.#now(),
      evidence: { resource: kind, id: ref.safeParse(id).success ? id : 'invalid', reviewRef: this.#policy.reviewRef, mode: this.#mode,
        sourceAccount: kind === 'outseta_account' ? this.#policy.outsetaHostname : this.#policy.stripeAccountRef,
        stripeApiVersion: kind === 'outseta_account' ? null : this.#policy.stripeApiVersion,
        expectedLivemode: this.#policy.livemode },
      scope: 'explicit_id_only', captureDateCoverage: 'unknown', mutationAllowed: false,
    })
    if (!ref.safeParse(id).success || !this.#scopes.has(`${kind}:${id}`)) return finish('scope_not_approved')
    let cursor: string | null = null
    const seen = new Set<string>()
    for (let page = 0; page < (collection ? this.#policy.maxPages : 1); page++) {
      try {
        this.#assertReview()
        if (this.#remaining <= 0) return finish('request_budget')
        this.#remaining--
        const url = endpoint(kind, id, this.#policy.outsetaHostname)
        if (collection) {
          url.searchParams.set('limit', String(this.#policy.pageSize))
          if (cursor) url.searchParams.set('starting_after', cursor)
        }
        const body = await this.#request(url, kind === 'outseta_account' ? 'outseta' : 'stripe')
        this.#assertReview()
        if (!collection) { records.push(normalize(body)); pagesRead++; return finish('scope_read') }
        const list = z.object({ object: z.literal('list'), data: z.array(z.unknown()).max(this.#policy.pageSize), has_more: z.boolean() }).parse(body)
        const rows: Row[] = []
        const ids: string[] = []
        for (const raw of list.data) {
          const rowId = z.object({ id: ref }).parse(raw).id
          if (seen.has(rowId) || ids.includes(rowId)) return finish('duplicate_or_changing_page')
          ids.push(rowId)
          rows.push(normalize(raw))
        }
        if (list.has_more && rows.length === 0) return finish('invalid_page')
        ids.forEach((rowId) => seen.add(rowId))
        records.push(...rows)
        pagesRead++
        if (!list.has_more) return finish('scope_read')
        cursor = ids.at(-1)!
      } catch {
        // Never return provider response bodies, tokens, URLs or raw error messages.
        return finish('read_failed_or_invalid_evidence')
      }
    }
    return finish('page_budget')
  }

  #assertReview(): void {
    const now = timestamp.parse(this.#now())
    if (Date.parse(this.#policy.reviewedAt) > Date.parse(now) || Date.parse(this.#policy.expiresAt) <= Date.parse(now)) {
      throw new Error('Billing read review is not currently valid')
    }
  }

  async #request(url: URL, provider: 'stripe' | 'outseta'): Promise<unknown> {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('bounded_request_timeout')) }, this.#policy.timeoutMs)
    })
    try {
      const response = await Promise.race([this.#transport({ method: 'GET', url: url.toString(),
        headers: { ...this.#headers[provider] }, signal: controller.signal, redirect: 'error', cache: 'no-store' }), timeout])
      if (response.status !== 200) throw new Error('provider_read_failed')
      return response.body
    } finally { if (timer) clearTimeout(timer) }
  }
}

function endpoint(kind: BillingReadResource, id: string, outsetaHostname: string): URL {
  const paths = {
    stripe_charge: `/v1/charges/${id}`, stripe_refunds: `/v1/refunds?charge=${id}`,
    stripe_balance: `/v1/balance_transactions/${id}`, stripe_invoice_payments: `/v1/invoice_payments?invoice=${id}`,
    outseta_account: `/api/v1/crm/accounts/${id}?fields=Uid,StripeId,IsLivemode,IsDemo,AccountStage,CurrentSubscription.Uid,CurrentSubscription.Plan.Uid,LatestSubscription.Uid`,
  }
  return new URL(paths[kind], kind === 'outseta_account' ? `https://${outsetaHostname}` : 'https://api.stripe.com')
}
function externalRef(value: string | { id: string } | null): string | null { return typeof value === 'string' ? value : value?.id ?? null }
function iso(value: number): string { return new Date(value * 1000).toISOString() }
function secret() { return z.string().regex(/^[A-Za-z0-9_-]{10,500}$/) }

async function boundedFetch(request: BillingReadRequest): ReturnType<BillingReadTransport> {
  const response = await fetch(request.url, request)
  if (response.status !== 200 || !response.body) { await response.body?.cancel(); return { status: response.status, body: null } }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > 1_000_000) throw new Error('response_bound')
      chunks.push(chunk.value)
    }
    const data = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength }
    return { status: response.status, body: JSON.parse(new TextDecoder().decode(data)) }
  } finally { await reader.cancel(); reader.releaseLock() }
}
