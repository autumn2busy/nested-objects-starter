import { z } from 'zod'
import { stableUuid } from '../stable-id.js'
import { BILLING_STRIPE_API_VERSION } from './billing-readonly.js'
import type { BillingAccountObservation, BillingChargeObservation, BillingReadResult } from './billing-readonly.js'
import { adaptRevenueEvidence } from './revenue-evidence.js'
import type { RevenueEvidenceInput } from './revenue-evidence.js'

const VERSION = 'billing-read-evidence-v1'
const id = z.string().regex(/^[A-Za-z0-9_-]{1,160}$/)
const time = z.string().datetime({ offset: true })
const amount = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const envelope = z.object({
  state: z.literal('complete'), reason: z.literal('scope_read'), observedAt: time,
  pagesRead: z.literal(1), scope: z.literal('explicit_id_only'), captureDateCoverage: z.literal('unknown'),
  mutationAllowed: z.literal(false),
  evidence: z.object({
    resource: z.enum(['stripe_charge', 'outseta_account']), id, reviewRef: id,
    mode: z.enum(['fixture', 'approved_live']), sourceAccount: id.or(z.string().regex(/^[a-z0-9-]+\.outseta\.com$/)),
    stripeApiVersion: z.literal(BILLING_STRIPE_API_VERSION).nullable(), expectedLivemode: z.boolean(),
  }),
})
const chargeRead = envelope.extend({ records: z.array(z.object({
  chargeRef: id, customerRef: id.nullable(), livemode: z.boolean(), currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.enum(['succeeded', 'pending', 'failed']), paid: z.boolean(), captured: z.boolean(),
  amountCapturedMinor: amount, amountRefundedMinor: amount, createdAt: time,
  capturedAt: z.null(), captureBasis: z.literal('multiple_or_unknown'), disputed: z.boolean(),
})).length(1) })
const accountRead = envelope.extend({ records: z.array(z.object({
  accountRef: id, currentSubscriptionRef: id.nullable(), stripeCustomerRef: id.nullable(),
  livemode: z.boolean(), identityState: z.literal('unknown'),
})).length(1) })

export interface BillingRevenueEvidenceInput {
  context: RevenueEvidenceInput['context']
  outsetaHostname: string
  account: BillingReadResult<BillingAccountObservation> | null
  charges: BillingReadResult<BillingChargeObservation>[]
}

export interface BillingRevenueEvidenceResult {
  evidence: RevenueEvidenceInput
  issues: string[]
  mutationAllowed: false
}

/**
 * Pure bridge for one account and at most five explicit charge observations. No fetch or
 * credential lookup. Reader success is not population coverage, capture timing, subscription
 * authority or commercial allocation. All snapshots stay unknown until separate evidence
 * can establish those facts; this function has no option to promote a sample to complete.
 */
export function buildRevenueEvidenceFromBillingReads(input: BillingRevenueEvidenceInput): BillingRevenueEvidenceResult {
  const c = structuredClone(input.context)
  z.array(z.unknown()).max(5).parse(input.charges)
  z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.outseta\.com$/).parse(input.outsetaHostname)
  const issues = new Set<string>(['sample_population_unknown', 'capture_timing_unverified', 'payment_allocation_unverified'])
  const mode = c.sourceKind === 'fixture' ? 'fixture' : 'approved_live'
  const fresh = (observedAt: string): boolean => {
    const age = Date.parse(c.now) - Date.parse(observedAt)
    return age >= 0 && age <= c.maxSnapshotAgeMs
  }
  const matches = (read: z.infer<typeof envelope>, resource: 'stripe_charge' | 'outseta_account'): boolean => (
    read.evidence.resource === resource && read.evidence.mode === mode
    && read.evidence.expectedLivemode === c.livemode && fresh(read.observedAt)
    && read.evidence.sourceAccount === (resource === 'stripe_charge' ? c.stripeAccountRef : input.outsetaHostname)
    && read.evidence.stripeApiVersion === (resource === 'stripe_charge' ? c.stripeApiVersion : null)
  )
  const account = accountRead.safeParse(input.account)
  const accountValid = account.success && matches(account.data, 'outseta_account')
    && account.data.records[0]!.accountRef === account.data.evidence.id
    && account.data.records[0]!.livemode === c.livemode
  const accountRow = accountValid && account.success ? account.data.records[0]! : null
  if (!accountRow) issues.add('account_read_missing_invalid_or_out_of_scope')
  const accounts: RevenueEvidenceInput['outseta']['rows'] = []
  if (accountRow?.stripeCustomerRef && accountRow.currentSubscriptionRef) {
    accounts.push({
      accountRef: accountRow.accountRef, stripeCustomerRef: accountRow.stripeCustomerRef,
      stripeAccountRef: c.stripeAccountRef, livemode: accountRow.livemode,
      subscriptionRef: accountRow.currentSubscriptionRef, identityState: 'unknown',
      plan: 'unknown', subscriptionStatus: 'unknown',
    })
  } else issues.add('current_subscription_or_customer_missing')

  const charges = new Map<string, { row: RevenueEvidenceInput['stripe']['rows'][number]; observedAt: string }>()
  const signatures = new Map<string, string>()
  const observations = new Set<string>()
  const conflicted = new Set<string>()
  for (const value of input.charges) {
    const parsed = chargeRead.safeParse(value)
    if (!parsed.success || !matches(parsed.data, 'stripe_charge')) {
      issues.add('charge_read_missing_invalid_or_out_of_scope')
      continue
    }
    const read = parsed.data
    const row = read.records[0]!
    if (row.chargeRef !== read.evidence.id || row.livemode !== c.livemode || row.currency !== c.currency
      || !row.customerRef || row.customerRef !== accountRow?.stripeCustomerRef) {
      issues.add('charge_customer_currency_or_mode_mismatch')
      continue
    }
    const normalized: RevenueEvidenceInput['stripe']['rows'][number] = {
      chargeRef: row.chargeRef, customerRef: row.customerRef, stripeAccountRef: c.stripeAccountRef,
      livemode: row.livemode, currency: row.currency, status: row.status, paid: row.paid, captured: row.captured,
      amountCapturedMinor: row.amountCapturedMinor, capturedAt: null, captureBasis: 'multiple_or_unknown',
      refundsCoverage: 'unknown', refunds: [], disputed: row.disputed, balance: null,
    }
    const previous = charges.get(row.chargeRef)
    // Compare stripped reader observations too: refund changes must not disappear merely
    // because this sample bridge cannot yet consume a refund reconciliation.
    const signature = JSON.stringify(row)
    observations.add(JSON.stringify({ row, observedAt: read.observedAt, review: read.evidence }))
    if (signatures.has(row.chargeRef) && signatures.get(row.chargeRef) !== signature) conflicted.add(row.chargeRef)
    signatures.set(row.chargeRef, signature)
    if (!previous || Date.parse(read.observedAt) > Date.parse(previous.observedAt)) {
      charges.set(row.chargeRef, { row: normalized, observedAt: read.observedAt })
    }
  }
  for (const ref of conflicted) { charges.delete(ref); issues.add('conflicting_charge_observations') }
  if (input.charges.length === 0) issues.add('charge_reads_absent')
  const rows = [...charges.values()].sort((a, b) => a.row.chargeRef.localeCompare(b.row.chargeRef))
  const observedAt = rows.map((item) => item.observedAt).sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? c.now
  const sourceRecordRef = stableUuid(VERSION, JSON.stringify({
    rows, accounts, observations: [...observations].sort(), issues: [...issues].sort(),
    accountObservation: accountValid && account.success ? account.data : null,
    source: [c.stripeAccountRef, c.livemode, c.sourceKind, input.outsetaHostname],
  }))
  const evidence: RevenueEvidenceInput = {
    context: c,
    stripe: { coverage: 'unknown', captureDate: c.metricDate, observedAt, sourceRecordRef, rows: rows.map((item) => item.row) },
    outseta: { coverage: 'unknown', observedAt: accountValid && account.success ? account.data.observedAt : c.now,
      sourceRecordRef, rows: accounts },
    allocations: { coverage: 'unknown', observedAt: c.now, sourceRecordRef, rows: [] },
  }
  // Validate the context with the existing adapter. Unknown snapshots do not publish these
  // fallback evaluation timestamps as observed source timestamps or known zeroes.
  adaptRevenueEvidence(evidence)
  return { evidence, issues: [...issues].sort(), mutationAllowed: false }
}
