import { z } from 'zod'

import type { FreeJourneyOperationInput } from '../operations/free-journey-operation.js'
import { classifyMarketingContact } from './activecampaign-audit.js'
import type { OnboardingStoredSources } from './onboarding-receipt-reader.js'

const FREE_PLAN_UID = 'L9nbKV9Z'
const CONSENT_LIST_ID = '34'
const CONSENT_FORM_ID = '90'
const PURPOSE = 'free_onboarding_and_conversion_email' as const
const ref = z.string().regex(/^[A-Za-z0-9_-]{1,160}$/)
const numericId = z.string().regex(/^\d+$/)
const timestamp = z.string().datetime({ offset: true })
const email = z.string().email().max(320)
const policySchema = z.object({
  reviewRef: ref,
  reviewedAt: timestamp,
  expiresAt: timestamp,
  outsetaHostname: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.outseta\.com$/),
  activeCampaignHostname: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.api-us1\.com$/),
  pageSize: z.number().int().min(1).max(100),
  maxPages: z.number().int().min(1).max(5),
  maxRequests: z.number().int().min(4).max(100),
  timeoutMs: z.number().int().min(1).max(30_000),
  consentAsset: z.object({
    purpose: z.literal(PURPOSE),
    listId: z.literal(CONSENT_LIST_ID),
    formId: z.literal(CONSENT_FORM_ID),
    doubleOptInVerified: z.literal(true),
  }).strict(),
  exclusionPolicy: z.object({
    internalDomains: z.array(z.string().regex(/^[a-z0-9.-]+$/)).max(50),
    approvedInternalMemberEmails: z.array(email).max(50),
    coldTagPatterns: z.array(z.string().trim().min(1).max(100)).max(50),
    wixTagPatterns: z.array(z.string().trim().min(1).max(100)).max(50),
    testPatterns: z.array(z.string().trim().min(1).max(100)).min(1).max(50),
    coworkerContactIds: z.array(numericId).max(100),
    demoContactIds: z.array(numericId).max(100),
    hiringFirmContactIds: z.array(numericId).max(100),
  }).strict(),
}).strict()

const profileSchema = z.object({
  id: z.string().uuid(),
  outseta_person_uid: ref,
  outseta_account_id: ref,
  ac_contact_id: numericId,
  user_email: email.nullable(),
  email: email.nullable(),
})
const personAccountSchema = z.object({
  IsPrimary: z.boolean(),
  Person: z.object({ Uid: ref, Email: email }).nullable(),
})
const subscriptionSchema = z.object({
  Uid: ref,
  StartDate: timestamp,
  Plan: z.object({ Uid: ref, Name: z.string().max(200).nullable().optional() }),
})
const accountSchema = z.object({
  Uid: ref,
  IsDemo: z.boolean().nullable(),
  AccountStage: z.number().int().nonnegative().nullable(),
  AccountStageLabel: z.string().max(100).nullable(),
  Created: timestamp,
  CurrentSubscription: subscriptionSchema.nullable(),
  PersonAccount: z.array(personAccountSchema).max(100),
})
const contactSchema = z.object({
  id: numericId,
  email,
  bounced_hard: z.enum(['0', '1']),
  bounced_soft: z.enum(['0', '1']),
  deleted: z.enum(['0', '1']),
  cdate: timestamp.nullable().optional(),
  udate: timestamp.nullable().optional(),
})
const listRelationSchema = z.object({
  id: numericId,
  contact: numericId,
  list: numericId,
  form: numericId.nullable(),
  status: z.string().regex(/^-?\d+$/),
})
const tagRelationSchema = z.object({ id: numericId, contact: numericId, tag: numericId })
const tagSchema = z.object({ id: numericId, tag: z.string().trim().min(1).max(500) })

const OUTSETA_FIELDS = [
  'Uid', 'IsDemo', 'AccountStage', 'AccountStageLabel', 'Created',
  'CurrentSubscription.Uid', 'CurrentSubscription.StartDate',
  'CurrentSubscription.Plan.Uid', 'CurrentSubscription.Plan.Name',
  'PersonAccount.IsPrimary', 'PersonAccount.Person.Uid', 'PersonAccount.Person.Email',
].join(',')

export type FreeJourneyOperationalSourcePolicy = z.infer<typeof policySchema>
export interface FreeJourneyOperationalSourceRequest {
  provider: 'outseta' | 'activecampaign'
  method: 'GET'
  url: string
  headers: Readonly<Record<string, string>>
  signal: AbortSignal
  redirect: 'error'
  cache: 'no-store'
}
export type FreeJourneyOperationalSourceTransport = (
  request: FreeJourneyOperationalSourceRequest,
) => Promise<{ status: number; body: unknown }>

type ExternalSourceContext = FreeJourneyOperationInput['external']

export type FreeJourneyOperationalSourceResult =
  | {
    status: 'ready'
    reason: null
    external: ExternalSourceContext
    coverage: { outsetaAccounts: 1; activeCampaignContacts: 1; contactLists: number; contactTags: number }
    reviewRef: string
    mutationAllowed: false
    attemptedWrites: 0
  }
  | {
    status: 'withheld'
    reason: string
    coverage: null
    reviewRef: string
    mutationAllowed: false
    attemptedWrites: 0
  }

/**
 * Rebuilds one journey subject from stable server-side links. It never accepts caller-supplied
 * membership, consent, tag, list or audience snapshots and never performs a provider mutation.
 */
export class FreeJourneyOperationalSourceCollector {
  readonly #policy: FreeJourneyOperationalSourcePolicy
  readonly #transport: FreeJourneyOperationalSourceTransport
  readonly #headers: { outseta: Record<string, string>; activecampaign: Record<string, string> }
  readonly #now: () => string
  #remaining: number
  #used = false

  constructor(configuration: {
    policy: FreeJourneyOperationalSourcePolicy
    mode: 'fixture' | 'approved_live'
    liveReadsEnabled?: boolean
    credentials?: { outsetaApiKey: string; outsetaApiSecret: string; activeCampaignApiKey: string }
    transport?: FreeJourneyOperationalSourceTransport
    now?: () => string
  }) {
    this.#policy = policySchema.parse(configuration.policy)
    this.#now = configuration.now ?? (() => new Date().toISOString())
    this.#assertReview()
    if (!['fixture', 'approved_live'].includes(configuration.mode)) {
      throw new FreeJourneyOperationalSourceError('source_mode_invalid')
    }
    if (configuration.mode === 'fixture' && (!configuration.transport || configuration.credentials)) {
      throw new FreeJourneyOperationalSourceError('fixture_configuration_invalid')
    }
    if (configuration.mode === 'approved_live' && configuration.liveReadsEnabled !== true) {
      throw new FreeJourneyOperationalSourceError('live_reads_disabled')
    }
    const credentials = configuration.mode === 'fixture'
      ? { outsetaApiKey: 'fixture-key', outsetaApiSecret: 'fixture-secret', activeCampaignApiKey: 'fixture-api-key' }
      : z.object({
        outsetaApiKey: z.string().trim().min(10).max(500),
        outsetaApiSecret: z.string().trim().min(10).max(500),
        activeCampaignApiKey: z.string().trim().min(20).max(500),
      }).strict().parse(configuration.credentials)
    this.#headers = {
      outseta: { Authorization: `Outseta ${credentials.outsetaApiKey}:${credentials.outsetaApiSecret}`, Accept: 'application/json' },
      activecampaign: { 'Api-Token': credentials.activeCampaignApiKey, Accept: 'application/json' },
    }
    this.#remaining = this.#policy.maxRequests
    this.#transport = configuration.transport ?? defaultTransport
  }

  async collect(input: {
    storedSources: OnboardingStoredSources
    outsetaPersonUid: string
    subscriptionUid: string
  }): Promise<FreeJourneyOperationalSourceResult> {
    const withheld = (reason: string): FreeJourneyOperationalSourceResult => ({
      status: 'withheld', reason, coverage: null, reviewRef: this.#policy.reviewRef,
      mutationAllowed: false, attemptedWrites: 0,
    })
    try {
      if (this.#used) return withheld('source_read_budget_exhausted')
      this.#used = true
      this.#assertReview()
      if (!ref.safeParse(input.outsetaPersonUid).success || !ref.safeParse(input.subscriptionUid).success
        || input.storedSources.profiles.coverage !== 'complete'
        || input.storedSources.profiles.rows.length !== 1) return withheld('profile_link_missing_or_ambiguous')
      const parsedProfile = profileSchema.safeParse(input.storedSources.profiles.rows[0])
      if (!parsedProfile.success || parsedProfile.data.outseta_person_uid !== input.outsetaPersonUid) {
        return withheld('profile_stable_link_invalid')
      }
      const profile = parsedProfile.data
      const profileEmail = exactProfileEmail(profile.user_email, profile.email)
      if (!profileEmail) return withheld('profile_email_missing_or_conflicting')

      const accountBody = await this.#request(
        'outseta',
        new URL(`/api/v1/crm/accounts/${encodeURIComponent(profile.outseta_account_id)}?fields=${encodeURIComponent(OUTSETA_FIELDS)}`,
          `https://${this.#policy.outsetaHostname}`),
      )
      const account = accountSchema.parse(accountBody)
      if (account.Uid !== profile.outseta_account_id) return withheld('outseta_account_link_conflict')
      if (account.IsDemo !== false) return withheld('outseta_demo_or_demo_state_unknown')
      const primary = account.PersonAccount.filter(link => link.IsPrimary === true && link.Person)
      if (primary.length !== 1 || primary[0]!.Person!.Uid !== input.outsetaPersonUid) {
        return withheld('outseta_primary_person_conflict')
      }
      const outsetaEmail = normalizeEmail(primary[0]!.Person!.Email)
      if (outsetaEmail !== profileEmail) return withheld('outseta_profile_email_conflict')
      const subscription = account.CurrentSubscription
      if (!subscription || subscription.Uid !== input.subscriptionUid) {
        return withheld('outseta_current_subscription_conflict')
      }
      const lifecycle = authoritativeLifecycle(account.AccountStage, account.AccountStageLabel)
      if (!lifecycle) return withheld('outseta_lifecycle_unknown_or_conflicting')
      const tier = authoritativeTier(subscription.Plan.Uid)

      const acBase = `https://${this.#policy.activeCampaignHostname}`
      const rawContact = await this.#request('activecampaign', new URL(`/api/3/contacts/${profile.ac_contact_id}`, acBase))
      const contact = contactSchema.parse(z.object({ contact: z.unknown() }).parse(rawContact).contact)
      if (contact.id !== profile.ac_contact_id || normalizeEmail(contact.email) !== profileEmail) {
        return withheld('activecampaign_contact_link_conflict')
      }
      const listRead = await this.#readCollection({
        baseUrl: acBase,
        path: `/api/3/contacts/${profile.ac_contact_id}/contactLists`,
        key: 'contactLists',
        schema: listRelationSchema,
        contactId: profile.ac_contact_id,
      })
      const tagRead = await this.#readTagCollection(acBase, profile.ac_contact_id)

      const doi = listRead.rows.some(row => row.list === CONSENT_LIST_ID
        && row.form === CONSENT_FORM_ID && row.status === '1')
      const classified = classifyMarketingContact({
        contact: {
          contactId: contact.id,
          email: contact.email,
          tagNames: tagRead.tagNames,
          listNames: [],
          customFields: {},
          createdAt: contact.cdate ?? null,
          updatedAt: contact.udate ?? null,
          lastOpenAt: null,
          lastClickAt: null,
          lastSiteVisitAt: null,
          bounced: contact.bounced_hard === '1' || contact.bounced_soft === '1',
          unsubscribed: listRead.rows.some(row => row.list === CONSENT_LIST_ID && row.status !== '1'),
          marketingConsent: doi ? 'granted' : 'unknown',
        },
        membership: {
          memberId: profile.id,
          email: outsetaEmail,
          membershipTier: tier,
          membershipStatus: lifecycle,
          authoritative: true,
          activeCampaignContactId: contact.id,
          sourceSystem: 'outseta',
          identityState: 'verified',
        },
        config: { ...this.#policy.exclusionPolicy, now: this.#now() },
        correlation: { correlationId: profile.id, causationId: null, traceId: 'free-journey-source-v1' },
      })
      const traits = new Set(classified.audienceTraits)
      const observedAt = this.#assertReview()
      const snapshot = <T>(rows: T[]) => ({ coverage: 'complete' as const, observedAt, rows })
      return {
        status: 'ready', reason: null,
        external: {
          identities: snapshot([{
            canonicalMemberId: profile.id,
            outsetaPersonUid: input.outsetaPersonUid,
            outsetaAccountUid: account.Uid,
            subscriptionUid: subscription.Uid,
            activeCampaignContactId: contact.id,
            identityState: 'verified' as const,
          }]),
          memberships: snapshot([{
            sourceSystem: 'outseta' as const,
            authoritative: true as const,
            isCurrent: true as const,
            identityState: 'verified' as const,
            sourceRecordId: subscription.Uid,
            outsetaPersonUid: input.outsetaPersonUid,
            outsetaAccountUid: account.Uid,
            subscriptionUid: subscription.Uid,
            tier,
            lifecycle,
            memberSince: account.Created,
            cycleStartedAt: subscription.StartDate,
          }]),
          audience: snapshot([{
            activeCampaignContactId: contact.id,
            internal: traits.has('internal'),
            coworker: traits.has('coworker'),
            test: traits.has('test'),
            demo: traits.has('demo'),
            hiringFirm: traits.has('hiring_firm'),
          }]),
          contacts: snapshot([{
            id: contact.id,
            email: contact.email,
            bounced_hard: contact.bounced_hard,
            bounced_soft: contact.bounced_soft,
            deleted: contact.deleted,
          }]),
          contactLists: snapshot(listRead.rows.map(row => ({
            contact: row.contact, list: row.list, form: row.form ?? '0', status: row.status,
          }))),
          consentAsset: { ...this.#policy.consentAsset, observedAt },
        },
        coverage: {
          outsetaAccounts: 1,
          activeCampaignContacts: 1,
          contactLists: listRead.rows.length,
          contactTags: tagRead.relationshipCount,
        },
        reviewRef: this.#policy.reviewRef,
        mutationAllowed: false,
        attemptedWrites: 0,
      }
    } catch (error) {
      return withheld(error instanceof FreeJourneyOperationalSourceError ? error.code : 'source_unavailable_or_invalid')
    }
  }

  async #readTagCollection(baseUrl: string, contactId: string) {
    const included = new Map<string, string>()
    const read = await this.#readCollection({
      baseUrl,
      path: `/api/3/contacts/${contactId}/contactTags`,
      key: 'contactTags',
      schema: tagRelationSchema,
      contactId,
      include: 'tag',
      onPage: (body) => {
        const tags = z.array(tagSchema).safeParse((body as Record<string, unknown>).tags ?? [])
        if (!tags.success) throw new FreeJourneyOperationalSourceError('activecampaign_tag_include_invalid')
        for (const tag of tags.data) {
          const prior = included.get(tag.id)
          if (prior && prior !== tag.tag) throw new FreeJourneyOperationalSourceError('activecampaign_tag_name_conflict')
          included.set(tag.id, tag.tag)
        }
      },
    })
    for (const relation of read.rows) {
      if (included.has(relation.tag)) continue
      const body = await this.#request('activecampaign', new URL(`/api/3/tags/${relation.tag}`, baseUrl))
      const tag = tagSchema.parse(z.object({ tag: z.unknown() }).parse(body).tag)
      if (tag.id !== relation.tag) throw new FreeJourneyOperationalSourceError('activecampaign_tag_identity_conflict')
      included.set(tag.id, tag.tag)
    }
    const tagNames = read.rows.map(relation => included.get(relation.tag))
    if (tagNames.some(value => !value)) throw new FreeJourneyOperationalSourceError('activecampaign_tag_name_missing')
    return { relationshipCount: read.rows.length, tagNames: tagNames as string[] }
  }

  async #readCollection<T extends { id: string; contact: string }>(input: {
    baseUrl: string
    path: string
    key: string
    schema: z.ZodType<T>
    contactId: string
    include?: string
    onPage?: (body: unknown) => void
  }): Promise<{ rows: T[] }> {
    const rows: T[] = []
    const seen = new Set<string>()
    let expectedTotal: number | null = null
    for (let page = 0; page < this.#policy.maxPages; page++) {
      const url = new URL(input.path, input.baseUrl)
      url.searchParams.set('limit', String(this.#policy.pageSize))
      url.searchParams.set('offset', String(page * this.#policy.pageSize))
      if (input.include) url.searchParams.set('include', input.include)
      const body = await this.#request('activecampaign', url)
      input.onPage?.(body)
      const record = z.record(z.string(), z.unknown()).parse(body)
      const pageRows = z.array(input.schema).max(this.#policy.pageSize).parse(record[input.key])
      const rawTotal = z.object({ total: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]) })
        .parse(record.meta).total
      const total = typeof rawTotal === 'number' ? rawTotal : Number(rawTotal)
      if (!Number.isSafeInteger(total) || (expectedTotal !== null && expectedTotal !== total)) {
        throw new FreeJourneyOperationalSourceError('activecampaign_relationship_total_changed')
      }
      expectedTotal = total
      for (const row of pageRows) {
        if (row.contact !== input.contactId || seen.has(row.id)) {
          throw new FreeJourneyOperationalSourceError('activecampaign_relationship_identity_conflict')
        }
        seen.add(row.id)
        rows.push(row)
      }
      if (rows.length > total) throw new FreeJourneyOperationalSourceError('activecampaign_relationship_total_changed')
      if (rows.length === total) return { rows }
      if (pageRows.length < this.#policy.pageSize) {
        throw new FreeJourneyOperationalSourceError('activecampaign_relationship_early_end')
      }
    }
    throw new FreeJourneyOperationalSourceError('activecampaign_relationship_page_budget')
  }

  async #request(provider: FreeJourneyOperationalSourceRequest['provider'], url: URL): Promise<unknown> {
    this.#assertReview()
    if (this.#remaining <= 0) throw new FreeJourneyOperationalSourceError('source_request_budget_exhausted')
    this.#remaining--
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new FreeJourneyOperationalSourceError('source_timeout'))
      }, this.#policy.timeoutMs)
    })
    try {
      const response = await Promise.race([this.#transport({
        provider,
        method: 'GET',
        url: url.toString(),
        headers: { ...this.#headers[provider] },
        signal: controller.signal,
        redirect: 'error',
        cache: 'no-store',
      }), timeout])
      this.#assertReview()
      if (response.status !== 200) throw new FreeJourneyOperationalSourceError('source_http_failure')
      return response.body
    } catch (error) {
      if (error instanceof FreeJourneyOperationalSourceError) throw error
      throw new FreeJourneyOperationalSourceError(controller.signal.aborted ? 'source_timeout' : 'source_transport_failure')
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  #assertReview(): string {
    const now = timestamp.safeParse(this.#now())
    if (!now.success || Date.parse(now.data) < Date.parse(this.#policy.reviewedAt)
      || Date.parse(now.data) >= Date.parse(this.#policy.expiresAt)) {
      throw new FreeJourneyOperationalSourceError('source_review_not_current')
    }
    return now.data
  }
}

const planTiers = {
  [FREE_PLAN_UID]: 'free', zWZD0rQp: 'starter', pWrBRnWn: 'founders',
  rQVqlLm6: 'pro', NmdnNO90: 'elite', rmk5Xk9g: 'agency',
} as const

function authoritativeTier(planUid: string): 'free' | 'starter' | 'founders' | 'pro' | 'elite' | 'agency' | 'unknown' {
  return planTiers[planUid as keyof typeof planTiers] ?? 'unknown'
}

function authoritativeLifecycle(stage: number | null, label: string | null) {
  const stages = { 2: 'trialing', 3: 'active', 4: 'canceled', 5: 'canceled', 6: 'canceled', 7: 'past_due', 8: 'trialing' } as const
  const labels: Record<string, 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'> = {
    trialing: 'trialing', subscribing: 'active', active: 'active', canceling: 'canceled', cancelling: 'canceled',
    canceled: 'canceled', cancelled: 'canceled', expired: 'canceled', 'trial expired': 'canceled',
    'past due': 'past_due', 'cancelling trial': 'trialing', 'canceling trial': 'trialing', paused: 'paused',
  }
  const fromStage = stage === null ? null : stages[stage as keyof typeof stages] ?? null
  const normalized = label?.trim().toLowerCase().replace(/_/g, ' ') ?? ''
  const fromLabel = normalized ? labels[normalized] ?? null : null
  if (stage !== null && !fromStage) return null
  if (normalized && !fromLabel) return null
  if (fromStage && fromLabel && fromStage !== fromLabel) return null
  return fromStage ?? fromLabel
}

function exactProfileEmail(left: string | null, right: string | null): string | null {
  const values = [left, right].filter((value): value is string => typeof value === 'string').map(normalizeEmail)
  return values.length > 0 && new Set(values).size === 1 ? values[0]! : null
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

async function defaultTransport(request: FreeJourneyOperationalSourceRequest) {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    signal: request.signal,
    redirect: request.redirect,
    cache: request.cache,
  })
  const bodyText = await response.text()
  if (new TextEncoder().encode(bodyText).byteLength > 256 * 1024) {
    throw new FreeJourneyOperationalSourceError('source_response_too_large')
  }
  let body: unknown
  try { body = JSON.parse(bodyText) } catch { throw new FreeJourneyOperationalSourceError('source_response_invalid') }
  return { status: response.status, body }
}

export class FreeJourneyOperationalSourceError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'FreeJourneyOperationalSourceError'
  }
}
