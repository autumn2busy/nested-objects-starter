import { z } from 'zod'

import type { ConversionEventSourceRow, ProfileSourceRow } from '../projections/member-projection.js'
import type {
  ActiveCampaignAssetSnapshot,
  ActiveCampaignContactSnapshot,
  MarketingClassificationConfig,
} from '../sensors/activecampaign-audit.js'
import type {
  ActiveCampaignMembershipMirror,
  ProductAccessSnapshot,
} from '../workflows/lifecycle-integrity.js'

export const PREVIEW_INPUT_LIMITS = {
  profiles: 100,
  conversionEvents: 1_000,
  activeCampaignContacts: 250,
  activeCampaignAssets: 500,
  requestBytes: 1_500_000,
} as const

const SYNTHETIC_FIXTURE_UUID_PATTERN = /^31800000-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const timestampSchema = z.string().trim().min(1).max(64).refine(
  (value) => Number.isFinite(Date.parse(value)),
  'Expected an ISO-compatible timestamp',
)
const nullableTimestampSchema = timestampSchema.nullable().optional()
const nullableTextSchema = (maximum = 500) => z.string().trim().max(maximum).nullable().optional()
const emptyOptionalTextSchema = z.union([z.literal(''), z.null()]).optional()
const limitedStringArraySchema = (maximumItems: number, maximumLength = 200) =>
  z.array(z.string().trim().min(1).max(maximumLength)).max(maximumItems)
const syntheticUuidSchema = z.string().trim().uuid().refine(
  isSyntheticFixtureUuid,
  'Phase C2 fixture UUIDs must use the reserved 31800000-xxxx-5xxx-8xxx/9xxx/axxx/bxxx namespace.',
)
const nullableSyntheticUuidSchema = syntheticUuidSchema.nullable().optional()
const syntheticIdentifierSchema = z.string().trim().min(1).max(255).refine(
  isSyntheticIdentifier,
  'Identifiers must begin with validation- or synthetic-.',
)
const nullableSyntheticIdentifierSchema = syntheticIdentifierSchema.nullable().optional()
const syntheticLabelSchema = (maximum = 500) => z.string().trim().min(1).max(maximum).refine(
  isSyntheticLabel,
  'Fixture labels must begin with Validation or Synthetic.',
)
const nullableSyntheticLabelSchema = (maximum = 500) => syntheticLabelSchema(maximum).nullable().optional()
const emptyObjectSchema = z.record(z.string().trim().min(1).max(255), z.unknown()).refine(
  (value) => Object.keys(value).length === 0,
  'Phase C2 preview accepts only an empty object for this field',
)
const syntheticEmailSchema = z.string().email().max(320).refine(
  (value) => value.trim().toLowerCase().endsWith('.invalid'),
  'Phase C2 preview accepts only synthetic email addresses ending in .invalid',
)
const nullableSyntheticEmailSchema = syntheticEmailSchema.nullable().optional()
const syntheticDomainSchema = z.string().trim().min(1).max(255).refine(
  (value) => value.toLowerCase().endsWith('.invalid'),
  'Preview domains must end in .invalid',
)
const syntheticIdempotencyKeySchema = z.string().trim().min(16).max(200).refine(
  (value) => value.startsWith('phase-c2:synthetic-') || value.startsWith('phase-c2:validation-'),
  'Phase C2 idempotency keys must begin with phase-c2:synthetic- or phase-c2:validation-.',
)

const profileSchema = z.object({
  id: syntheticUuidSchema,
  user_id: nullableSyntheticUuidSchema,
  outseta_person_uid: nullableSyntheticIdentifierSchema,
  outseta_account_id: nullableSyntheticIdentifierSchema,
  user_email: nullableSyntheticEmailSchema,
  email: nullableSyntheticEmailSchema,
  subscription_tier: nullableTextSchema(120),
  subscription_status: nullableTextSchema(120),
  subscription_start_date: nullableTimestampSchema,
  subscription_end_date: nullableTimestampSchema,
  plan_uid: nullableSyntheticIdentifierSchema,
  plan_name: nullableTextSchema(255),
  outseta_updated_at: nullableTimestampSchema,
  last_login_at: nullableTimestampSchema,
  last_active_at: nullableTimestampSchema,
  created_at: timestampSchema,
  updated_at: nullableTimestampSchema,
  state: z.enum(['ZZ']).nullable().optional(),
  service_areas: z.union([
    z.array(syntheticLabelSchema(160)).max(100),
    syntheticLabelSchema(2_000),
    z.null(),
  ]).optional(),
  primary_services: z.union([
    z.array(syntheticLabelSchema(160)).max(100),
    syntheticLabelSchema(2_000),
    z.null(),
  ]).optional(),
  experience_level: nullableSyntheticLabelSchema(160),
  max_travel_distance: z.number().finite().nonnegative().max(10_000).nullable().optional(),
  training_modules_completed: z.number().int().nonnegative().max(10_000).nullable().optional(),
  training_modules_total: z.number().int().nonnegative().max(10_000).nullable().optional(),
  is_published: z.boolean().nullable().optional(),
  headline: emptyOptionalTextSchema,
  bio: emptyOptionalTextSchema,
  phone: emptyOptionalTextSchema,
}).strict()

const conversionEventSchema = z.object({
  id: syntheticUuidSchema,
  client_event_id: nullableSyntheticIdentifierSchema,
  event_name: z.string().trim().min(1).max(160),
  anonymous_id: nullableSyntheticIdentifierSchema,
  session_id: nullableSyntheticIdentifierSchema,
  member_uid: nullableSyntheticIdentifierSchema,
  member_email: nullableSyntheticEmailSchema,
  plan_uid: nullableSyntheticIdentifierSchema,
  plan_name: nullableTextSchema(255),
  source_page: emptyOptionalTextSchema,
  source: nullableSyntheticIdentifierSchema,
  reason: emptyOptionalTextSchema,
  utm_source: nullableSyntheticIdentifierSchema,
  utm_medium: nullableSyntheticIdentifierSchema,
  utm_campaign: nullableSyntheticIdentifierSchema,
  event_data: emptyObjectSchema.nullable().optional(),
  occurred_at: timestampSchema,
}).strict()

const activeCampaignContactSchema = z.object({
  contactId: syntheticIdentifierSchema,
  email: syntheticEmailSchema.nullable(),
  tagNames: z.array(syntheticLabelSchema(255)).max(250),
  listNames: z.array(syntheticLabelSchema(255)).max(100),
  customFields: emptyObjectSchema,
  createdAt: timestampSchema.nullable(),
  updatedAt: timestampSchema.nullable(),
  lastOpenAt: timestampSchema.nullable(),
  lastClickAt: timestampSchema.nullable(),
  lastSiteVisitAt: timestampSchema.nullable(),
  bounced: z.boolean(),
  unsubscribed: z.boolean(),
}).strict()

const activeCampaignAssetSchema = z.object({
  assetType: z.enum(['list', 'tag', 'field', 'automation', 'campaign', 'segment', 'custom_object', 'pipeline']),
  externalId: syntheticIdentifierSchema,
  name: syntheticLabelSchema(500),
  description: nullableSyntheticLabelSchema(2_000),
  active: z.boolean().nullable().optional(),
}).strict()

const marketingConfigSchema = z.object({
  internalDomains: z.array(syntheticDomainSchema).max(20),
  approvedInternalMemberEmails: z.array(syntheticEmailSchema).max(50).default([]),
  coldTagPatterns: limitedStringArraySchema(50, 160).default([]),
  wixTagPatterns: limitedStringArraySchema(50, 160).default([]),
  testPatterns: limitedStringArraySchema(50, 160).default([]),
  staleAfterDays: z.number().int().min(1).max(3_650).default(90),
  now: timestampSchema.optional(),
}).strict()

const productAccessSchema = z.object({
  memberId: syntheticUuidSchema,
  accessTier: z.string().trim().max(160).nullable(),
  accessStatus: z.string().trim().max(160).nullable(),
  directoryAccess: z.boolean().nullable(),
  observedAt: timestampSchema,
}).strict()

const activeCampaignMirrorSchema = z.object({
  contactId: syntheticIdentifierSchema,
  planName: z.string().trim().max(255).nullable(),
  lifecycleStatus: z.string().trim().max(255).nullable(),
  onboardingEnteredAt: timestampSchema.nullable(),
  observedAt: timestampSchema,
}).strict()

const previewEvaluationRequestSchema = z.object({
  idempotencyKey: syntheticIdempotencyKeySchema,
  correlationId: syntheticUuidSchema.optional(),
  causationId: syntheticUuidSchema.nullable().optional(),
  metricDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'metricDate must use YYYY-MM-DD'),
  persist: z.boolean().default(false),
  profiles: z.array(profileSchema).max(PREVIEW_INPUT_LIMITS.profiles),
  conversionEvents: z.array(conversionEventSchema).max(PREVIEW_INPUT_LIMITS.conversionEvents),
  activeCampaignContacts: z.array(activeCampaignContactSchema)
    .max(PREVIEW_INPUT_LIMITS.activeCampaignContacts)
    .default([]),
  activeCampaignAssets: z.array(activeCampaignAssetSchema)
    .max(PREVIEW_INPUT_LIMITS.activeCampaignAssets)
    .default([]),
  marketingConfig: marketingConfigSchema,
  productAccessByMemberId: z.record(syntheticUuidSchema, productAccessSchema)
    .refine((value) => Object.keys(value).length <= PREVIEW_INPUT_LIMITS.profiles, 'Too many product access snapshots')
    .default({}),
  activeCampaignMirrorByMemberId: z.record(syntheticUuidSchema, activeCampaignMirrorSchema)
    .refine((value) => Object.keys(value).length <= PREVIEW_INPUT_LIMITS.profiles, 'Too many lifecycle mirror snapshots')
    .default({}),
}).strict()

export interface PreviewEvaluationRequest {
  idempotencyKey: string
  correlationId?: string
  causationId?: string | null
  metricDate: string
  persist: boolean
  profiles: ProfileSourceRow[]
  conversionEvents: ConversionEventSourceRow[]
  activeCampaignContacts: ActiveCampaignContactSnapshot[]
  activeCampaignAssets: ActiveCampaignAssetSnapshot[]
  marketingConfig: MarketingClassificationConfig
  productAccessByMemberId: Record<string, ProductAccessSnapshot>
  activeCampaignMirrorByMemberId: Record<string, ActiveCampaignMembershipMirror>
}

export function parsePreviewEvaluationRequest(value: unknown): PreviewEvaluationRequest {
  const parsed = previewEvaluationRequestSchema.safeParse(value)
  if (!parsed.success) {
    throw new PreviewRequestValidationError(
      'Preview evaluation request failed validation',
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    )
  }

  const request = parsed.data as PreviewEvaluationRequest
  const profileIds = new Set(request.profiles.map((profile) => profile.id))
  assertUnique([...profileIds], 'profiles.id')
  assertMapKeysMatchMemberIds(request.productAccessByMemberId, 'productAccessByMemberId')
  assertMapKeysBelongToProfiles(request.productAccessByMemberId, profileIds, 'productAccessByMemberId')
  assertMapKeysBelongToProfiles(request.activeCampaignMirrorByMemberId, profileIds, 'activeCampaignMirrorByMemberId')
  assertSyntheticPreviewInput(request)
  return request
}

export function assertSyntheticPreviewInput(input: PreviewEvaluationRequest): void {
  const uuidCandidates = [
    input.correlationId,
    input.causationId,
    ...input.profiles.flatMap((profile) => [profile.id, profile.user_id]),
    ...input.conversionEvents.map((event) => event.id),
    ...Object.keys(input.productAccessByMemberId),
    ...Object.values(input.productAccessByMemberId).map((snapshot) => snapshot.memberId),
    ...Object.keys(input.activeCampaignMirrorByMemberId),
  ].filter((value): value is string => Boolean(value))
  if (uuidCandidates.some((value) => !isSyntheticFixtureUuid(value))) {
    throw new PreviewRequestValidationError(
      'Phase C2 preview accepts only reserved synthetic fixture UUIDs',
      [{ path: 'uuid', message: 'Use the reserved 31800000-xxxx-5xxx-8xxx/9xxx/axxx/bxxx UUID namespace.' }],
    )
  }

  const externalIdentifierCandidates = [
    ...input.profiles.flatMap((profile) => [
      profile.outseta_person_uid,
      profile.outseta_account_id,
      profile.plan_uid,
    ]),
    ...input.conversionEvents.flatMap((event) => [
      event.client_event_id,
      event.anonymous_id,
      event.session_id,
      event.member_uid,
      event.plan_uid,
      event.source,
      event.utm_source,
      event.utm_medium,
      event.utm_campaign,
    ]),
    ...input.activeCampaignContacts.map((contact) => contact.contactId),
    ...input.activeCampaignAssets.map((asset) => asset.externalId),
    ...Object.values(input.activeCampaignMirrorByMemberId).map((mirror) => mirror.contactId),
  ].filter((value): value is string => Boolean(value))
  if (externalIdentifierCandidates.some((value) => !isSyntheticIdentifier(value))) {
    throw new PreviewRequestValidationError(
      'Phase C2 preview accepts only synthetic external identifiers',
      [{ path: 'identifier', message: 'External identifiers must begin with validation- or synthetic-.' }],
    )
  }

  const emailCandidates = [
    ...input.profiles.flatMap((profile) => [profile.user_email, profile.email]),
    ...input.conversionEvents.map((event) => event.member_email),
    ...input.activeCampaignContacts.map((contact) => contact.email),
    ...(input.marketingConfig.approvedInternalMemberEmails ?? []),
  ].filter((value): value is string => Boolean(value))
  if (emailCandidates.some((email) => !email.trim().toLowerCase().endsWith('.invalid'))) {
    throw new PreviewRequestValidationError(
      'Phase C2 preview accepts only synthetic email addresses ending in .invalid',
      [{ path: 'email', message: 'Replace real addresses with synthetic .invalid addresses.' }],
    )
  }

  if (input.profiles.some((profile) => Boolean(profile.phone?.trim()))) {
    throw new PreviewRequestValidationError(
      'Phase C2 preview does not accept phone numbers',
      [{ path: 'profiles.phone', message: 'Remove phone values from synthetic preview fixtures.' }],
    )
  }

  if (input.profiles.some((profile) => Boolean(profile.headline?.trim()) || Boolean(profile.bio?.trim()))) {
    throw new PreviewRequestValidationError(
      'Phase C2 preview does not accept profile headline or biography text',
      [{ path: 'profiles', message: 'Remove headline and bio values from synthetic preview fixtures.' }],
    )
  }

  if (input.conversionEvents.some((event) => event.event_data && Object.keys(event.event_data).length > 0)) {
    throw new PreviewRequestValidationError(
      'Phase C2 preview does not accept conversion event payload values',
      [{ path: 'conversionEvents.event_data', message: 'Use an empty object or omit event_data.' }],
    )
  }

  if (input.activeCampaignContacts.some((contact) => Object.keys(contact.customFields).length > 0)) {
    throw new PreviewRequestValidationError(
      'Phase C2 preview does not accept ActiveCampaign custom field values',
      [{ path: 'activeCampaignContacts.customFields', message: 'Use an empty object for synthetic preview fixtures.' }],
    )
  }
}

function assertMapKeysMatchMemberIds(
  snapshots: Record<string, ProductAccessSnapshot>,
  fieldName: string,
): void {
  for (const [memberId, snapshot] of Object.entries(snapshots)) {
    if (memberId !== snapshot.memberId) {
      throw new PreviewRequestValidationError(
        `${fieldName} keys must match snapshot memberId values`,
        [{ path: `${fieldName}.${memberId}`, message: 'Map key and memberId differ.' }],
      )
    }
  }
}

function assertMapKeysBelongToProfiles(
  snapshots: Record<string, unknown>,
  profileIds: Set<string>,
  fieldName: string,
): void {
  for (const memberId of Object.keys(snapshots)) {
    if (!profileIds.has(memberId)) {
      throw new PreviewRequestValidationError(
        `${fieldName} keys must reference a profile in the same fixture`,
        [{ path: `${fieldName}.${memberId}`, message: 'No matching profile exists.' }],
      )
    }
  }
}

function assertUnique(values: string[], fieldName: string): void {
  if (new Set(values).size !== values.length) {
    throw new PreviewRequestValidationError(
      `${fieldName} values must be unique`,
      [{ path: fieldName, message: 'Duplicate values are not allowed.' }],
    )
  }
}

function isSyntheticFixtureUuid(value: string): boolean {
  return SYNTHETIC_FIXTURE_UUID_PATTERN.test(value.trim())
}

function isSyntheticIdentifier(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('validation-') || normalized.startsWith('synthetic-')
}

function isSyntheticLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('validation ') || normalized.startsWith('synthetic ')
}

export class PreviewRequestValidationError extends Error {
  readonly code = 'PREVIEW_REQUEST_VALIDATION_FAILED'
  readonly details: Record<string, unknown>

  constructor(message: string, issues: Array<Record<string, unknown>>) {
    super(message)
    this.name = 'PreviewRequestValidationError'
    this.details = { issues }
  }
}
