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

const timestampSchema = z.string().trim().min(1).max(64).refine(
  (value) => Number.isFinite(Date.parse(value)),
  'Expected an ISO-compatible timestamp',
)
const nullableTimestampSchema = timestampSchema.nullable().optional()
const nullableTextSchema = (maximum = 500) => z.string().trim().max(maximum).nullable().optional()
const limitedStringArraySchema = (maximumItems: number, maximumLength = 200) =>
  z.array(z.string().trim().min(1).max(maximumLength)).max(maximumItems)
const flatJsonValueSchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
])
const eventDataSchema = z.record(z.string().trim().min(1).max(100), flatJsonValueSchema)
  .refine((value) => Object.keys(value).length <= 30, 'event_data may contain at most 30 keys')
const syntheticActiveCampaignIdSchema = z.string().trim().min(1).max(255).refine(
  isSyntheticIdentifier,
  'ActiveCampaign identifiers must begin with validation- or synthetic-.',
)

const profileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  outseta_person_uid: nullableTextSchema(255),
  outseta_account_id: nullableTextSchema(255),
  user_email: z.string().email().max(320).nullable().optional(),
  email: z.string().email().max(320).nullable().optional(),
  subscription_tier: nullableTextSchema(120),
  subscription_status: nullableTextSchema(120),
  subscription_start_date: nullableTimestampSchema,
  subscription_end_date: nullableTimestampSchema,
  plan_uid: nullableTextSchema(255),
  plan_name: nullableTextSchema(255),
  outseta_updated_at: nullableTimestampSchema,
  last_login_at: nullableTimestampSchema,
  last_active_at: nullableTimestampSchema,
  created_at: timestampSchema,
  updated_at: nullableTimestampSchema,
  state: nullableTextSchema(120),
  service_areas: z.union([
    limitedStringArraySchema(100, 160),
    z.string().max(2_000),
    z.null(),
  ]).optional(),
  primary_services: z.union([
    limitedStringArraySchema(100, 160),
    z.string().max(2_000),
    z.null(),
  ]).optional(),
  experience_level: nullableTextSchema(160),
  max_travel_distance: z.union([
    z.number().finite().nonnegative().max(10_000),
    z.string().trim().max(32),
    z.null(),
  ]).optional(),
  training_modules_completed: z.number().int().nonnegative().max(10_000).nullable().optional(),
  training_modules_total: z.number().int().nonnegative().max(10_000).nullable().optional(),
  is_published: z.boolean().nullable().optional(),
  headline: nullableTextSchema(500),
  bio: nullableTextSchema(5_000),
  phone: nullableTextSchema(100),
}).strict()

const conversionEventSchema = z.object({
  id: z.string().uuid(),
  client_event_id: nullableTextSchema(255),
  event_name: z.string().trim().min(1).max(160),
  anonymous_id: nullableTextSchema(255),
  session_id: nullableTextSchema(255),
  member_uid: nullableTextSchema(255),
  member_email: z.string().email().max(320).nullable().optional(),
  plan_uid: nullableTextSchema(255),
  plan_name: nullableTextSchema(255),
  source_page: nullableTextSchema(2_000),
  source: nullableTextSchema(255),
  reason: nullableTextSchema(1_000),
  utm_source: nullableTextSchema(255),
  utm_medium: nullableTextSchema(255),
  utm_campaign: nullableTextSchema(255),
  event_data: eventDataSchema.nullable().optional(),
  occurred_at: timestampSchema,
}).strict()

const activeCampaignContactSchema = z.object({
  contactId: syntheticActiveCampaignIdSchema,
  email: z.string().email().max(320).nullable(),
  tagNames: limitedStringArraySchema(250, 255),
  listNames: limitedStringArraySchema(100, 255),
  customFields: z.record(z.string().trim().min(1).max(255), z.string().max(2_000).nullable())
    .refine((value) => Object.keys(value).length <= 250, 'customFields may contain at most 250 keys'),
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
  externalId: syntheticActiveCampaignIdSchema,
  name: z.string().trim().min(1).max(500),
  description: z.string().trim().max(2_000).nullable().optional(),
  active: z.boolean().nullable().optional(),
}).strict()

const marketingConfigSchema = z.object({
  internalDomains: limitedStringArraySchema(20, 255),
  approvedInternalMemberEmails: z.array(z.string().email().max(320)).max(50).default([]),
  coldTagPatterns: limitedStringArraySchema(50, 160).default([]),
  wixTagPatterns: limitedStringArraySchema(50, 160).default([]),
  testPatterns: limitedStringArraySchema(50, 160).default([]),
  staleAfterDays: z.number().int().min(1).max(3_650).default(90),
  now: timestampSchema.optional(),
}).strict()

const productAccessSchema = z.object({
  memberId: z.string().uuid(),
  accessTier: z.string().trim().max(160).nullable(),
  accessStatus: z.string().trim().max(160).nullable(),
  directoryAccess: z.boolean().nullable(),
  observedAt: timestampSchema,
}).strict()

const activeCampaignMirrorSchema = z.object({
  contactId: syntheticActiveCampaignIdSchema,
  planName: z.string().trim().max(255).nullable(),
  lifecycleStatus: z.string().trim().max(255).nullable(),
  onboardingEnteredAt: timestampSchema.nullable(),
  observedAt: timestampSchema,
}).strict()

const previewEvaluationRequestSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(200),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().nullable().optional(),
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
  productAccessByMemberId: z.record(z.string().uuid(), productAccessSchema)
    .refine((value) => Object.keys(value).length <= PREVIEW_INPUT_LIMITS.profiles, 'Too many product access snapshots')
    .default({}),
  activeCampaignMirrorByMemberId: z.record(z.string().uuid(), activeCampaignMirrorSchema)
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
  assertUnique(request.profiles.map((profile) => profile.id), 'profiles.id')
  assertMapKeysMatchMemberIds(request.productAccessByMemberId, 'productAccessByMemberId')
  assertSyntheticPreviewInput(request)
  return request
}

export function assertSyntheticPreviewInput(input: PreviewEvaluationRequest): void {
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

  const activeCampaignIds = [
    ...input.activeCampaignContacts.map((contact) => contact.contactId),
    ...input.activeCampaignAssets.map((asset) => asset.externalId),
    ...Object.values(input.activeCampaignMirrorByMemberId).map((mirror) => mirror.contactId),
  ]
  if (activeCampaignIds.some((identifier) => !isSyntheticIdentifier(identifier))) {
    throw new PreviewRequestValidationError(
      'Phase C2 preview accepts only synthetic ActiveCampaign identifiers',
      [{
        path: 'activeCampaign',
        message: 'Contact, mirror, and asset IDs must begin with validation- or synthetic-.',
      }],
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

function assertUnique(values: string[], fieldName: string): void {
  if (new Set(values).size !== values.length) {
    throw new PreviewRequestValidationError(
      `${fieldName} values must be unique`,
      [{ path: fieldName, message: 'Duplicate values are not allowed.' }],
    )
  }
}

function isSyntheticIdentifier(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('validation-') || normalized.startsWith('synthetic-')
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
