import { createHash } from 'node:crypto'
import { z } from 'zod'

export const FREE_JOURNEY_CONSENT_EVENT = 'lifecycle_email_consent_requested'
export const FREE_JOURNEY_CONSENT_PURPOSE = 'free_onboarding_and_conversion_email'
export const SIGNUP_CONSENT_PROPERTY = 'NoLifecycleEmailRequested'
export const SIGNUP_CONSENT_TEXT = 'Email me getting-started guidance and occasional membership offers from Nested Objects. I can unsubscribe anytime.'

const id = z.string().min(1).max(160).refine(value => value === value.trim() && !/[\s@\u0000-\u001f]/.test(value))
const timestamp = z.string().datetime({ offset: true })
export const freeJourneyConsentEventDataSchema = z.discriminatedUnion('consentContract', [
  z.object({
    sourcePage: z.literal('/welcome'), source: z.literal('member_consent'), consentContract: z.literal('v1'),
    purpose: z.literal(FREE_JOURNEY_CONSENT_PURPOSE), lifecycleCycleId: id,
  }).strict(),
  z.object({
    sourcePage: z.literal('/outseta/signup'), source: z.literal('outseta_signup_form'), consentContract: z.literal('signup-v1'),
    purpose: z.literal(FREE_JOURNEY_CONSENT_PURPOSE), lifecycleCycleId: id,
    consentText: z.literal(SIGNUP_CONSENT_TEXT), consentProperty: z.literal(SIGNUP_CONSENT_PROPERTY),
    evidenceKind: z.literal('signed_signup_callback'), outsetaAccountUid: id,
    registrationOccurredAt: timestamp, consentRequested: z.literal(true),
  }).strict(),
])

export const freeJourneyConsentSourceRowSchema = z.object({
  id: z.string().uuid(), client_event_id: z.string().max(255), event_name: z.literal(FREE_JOURNEY_CONSENT_EVENT),
  member_uid: id, source_page: z.string(), source: z.string(), occurred_at: timestamp,
  event_data: freeJourneyConsentEventDataSchema,
}).refine(row => row.source_page === row.event_data.sourcePage && row.source === row.event_data.source)

const receiptSchema = z.object({
  clientEventId: z.string().max(255), eventName: z.literal(FREE_JOURNEY_CONSENT_EVENT),
  memberUid: id, occurredAt: timestamp, eventData: freeJourneyConsentEventDataSchema,
})
export type FreeJourneyConsentReceipt = z.infer<typeof receiptSchema>
export type FreeJourneyConsentContract = FreeJourneyConsentReceipt['eventData']['consentContract']

export function freeJourneyConsentKey(personUid: string, subscriptionUid: string, contract: FreeJourneyConsentContract) {
  const hash = createHash('sha256').update(JSON.stringify([
    FREE_JOURNEY_CONSENT_EVENT, contract, personUid, subscriptionUid, FREE_JOURNEY_CONSENT_PURPOSE,
  ])).digest('hex')
  return `${FREE_JOURNEY_CONSENT_EVENT}:${contract}:${hash}`
}

/** A persisted request is not email confirmation or permission to invoke a provider writer. */
export function isCurrentCycleConsentReceipt(value: unknown, context: {
  outsetaPersonUid: string; outsetaAccountUid: string; subscriptionUid: string
  memberSince: string; cycleStartedAt: string; observedAt: string; now: string
}) {
  const parsed = receiptSchema.safeParse(value)
  if (!parsed.success) return false
  const receipt = parsed.data
  if (receipt.memberUid !== context.outsetaPersonUid || receipt.eventData.lifecycleCycleId !== context.subscriptionUid
    || receipt.clientEventId !== freeJourneyConsentKey(context.outsetaPersonUid, context.subscriptionUid, receipt.eventData.consentContract)) return false
  const occurredAt = Date.parse(receipt.occurredAt)
  if (receipt.eventData.consentContract === 'signup-v1'
    && (receipt.eventData.outsetaAccountUid !== context.outsetaAccountUid
      || Date.parse(receipt.eventData.registrationOccurredAt) !== occurredAt)) return false
  return occurredAt >= Date.parse(context.memberSince) && occurredAt >= Date.parse(context.cycleStartedAt)
    && occurredAt <= Date.parse(context.observedAt) && occurredAt <= Date.parse(context.now)
}
