import { z } from 'zod'

import type { OperatingWorkflowName } from '../persistence/operating-workflow-store.js'

export const ADMIN_BODY_LIMIT_BYTES = 32 * 1024

export const EVENT_TRIGGER_TYPES = [
  'member_created',
  'trial_started',
  'upgrade',
  'downgrade',
  'cancellation',
  'payment_failure',
  'paywall_hit',
  'training_completion',
  'firm_inquiry',
  'opportunity_ingestion',
  'critical_integration_failure',
] as const

const stableKeySchema = z.string().trim().min(8).max(240).regex(/^(synthetic|validation)-[a-z0-9:._-]+$/)
const eventTypeSchema = z.enum(EVENT_TRIGGER_TYPES)
const workflowNameSchema = z.enum(['conversion_review', 'daily_business_health', 'weekly_operating_review'])

export const adminTriggerRequestSchema = z.discriminatedUnion('triggerCategory', [
  z.object({
    triggerCategory: z.literal('event'),
    eventType: eventTypeSchema,
    sourceEventId: stableKeySchema,
    businessKey: stableKeySchema,
    fixtureMode: z.literal('synthetic'),
  }).strict(),
  z.object({
    triggerCategory: z.literal('daily'),
    workflowName: z.literal('daily_business_health'),
    businessKey: stableKeySchema,
    fixtureMode: z.literal('synthetic'),
  }).strict(),
  z.object({
    triggerCategory: z.literal('weekly'),
    workflowName: z.literal('weekly_operating_review'),
    businessKey: stableKeySchema,
    fixtureMode: z.literal('synthetic'),
  }).strict(),
  z.object({
    triggerCategory: z.literal('manual'),
    workflowName: workflowNameSchema,
    businessKey: stableKeySchema,
    fixtureMode: z.literal('synthetic'),
  }).strict(),
])

export type AdminTriggerRequest = z.infer<typeof adminTriggerRequestSchema>

export const adminActionDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  expectedVersion: z.number().int().min(0).max(1_000_000),
  expectedPayloadDigest: z.string().regex(/^[a-f0-9]{64}$/),
  reason: z.string().trim().min(3).max(1_000),
}).strict()

export type AdminActionDecisionBody = z.infer<typeof adminActionDecisionSchema>

export function workflowForTrigger(trigger: AdminTriggerRequest): OperatingWorkflowName {
  if (trigger.triggerCategory === 'event') return 'conversion_review'
  return trigger.workflowName
}

export function syntheticRequestedAtForKey(businessKey: string): string {
  const match = businessKey.match(/(?:^|[:._-])(\d{4}-\d{2}-\d{2})(?:$|[:._-])/)
  if (!match?.[1]) return '2026-01-01T12:00:00.000Z'
  const timestamp = `${match[1]}T12:00:00.000Z`
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== timestamp) return '2026-01-01T12:00:00.000Z'
  return timestamp
}

export async function readAdminJson(request: Request): Promise<{ bodyText: string; value: unknown }> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('application/json')) {
    throw new AdminRequestValidationError('Admin mutations require application/json')
  }
  const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '', 10)
  if (Number.isFinite(declaredLength) && declaredLength > ADMIN_BODY_LIMIT_BYTES) {
    throw new AdminRequestPayloadTooLargeError()
  }
  const bodyText = await request.text()
  if (new TextEncoder().encode(bodyText).byteLength > ADMIN_BODY_LIMIT_BYTES) {
    throw new AdminRequestPayloadTooLargeError()
  }
  if (!bodyText.trim()) throw new AdminRequestValidationError('Admin mutation body is empty')
  try {
    return { bodyText, value: JSON.parse(bodyText) as unknown }
  } catch {
    throw new AdminRequestValidationError('Admin mutation body contains invalid JSON')
  }
}

export function parseAdminTriggerRequest(value: unknown): AdminTriggerRequest {
  const result = adminTriggerRequestSchema.safeParse(value)
  if (!result.success) throw new AdminRequestValidationError('Admin trigger contract is invalid')
  return result.data
}

export function parseAdminActionDecision(value: unknown): AdminActionDecisionBody {
  const result = adminActionDecisionSchema.safeParse(value)
  if (!result.success) throw new AdminRequestValidationError('Admin action decision contract is invalid')
  return result.data
}

export function assertActionId(value: string): string {
  return assertAdminUuid(value, 'Action')
}

export function assertAdminUuid(value: string, label: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new AdminRequestValidationError(`${label} ID must be a UUID`)
  }
  return value
}

export class AdminRequestValidationError extends Error {
  readonly code = 'ADMIN_REQUEST_VALIDATION_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'AdminRequestValidationError'
  }
}

export class AdminRequestPayloadTooLargeError extends Error {
  readonly code = 'ADMIN_REQUEST_PAYLOAD_TOO_LARGE'
  readonly maximumBytes = ADMIN_BODY_LIMIT_BYTES

  constructor() {
    super(`Admin request exceeds ${ADMIN_BODY_LIMIT_BYTES} bytes`)
    this.name = 'AdminRequestPayloadTooLargeError'
  }
}
