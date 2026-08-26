import { z } from 'zod'

import type { PhaseCWorkflowInput } from '../workflows/phase-c-core.js'
import { PreviewHttpError } from './http.js'

const timestampSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)), {
  message: 'Expected an ISO-compatible timestamp.',
})
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const nullableText = z.string().trim().min(1).max(1000).nullable().optional()
const recordSchema = z.record(z.string(), z.unknown())

const correlationSchema = z.object({
  correlationId: z.string().uuid(),
  causationId: z.string().uuid().nullable(),
  traceId: z.string().trim().min(1).max(255).nullable(),
}).strict()

const profileSchema = z.object({
  id: z.string().uuid(),
  created_at: timestampSchema,
  user_email: nullableText,
  email: nullableText,
}).catchall(z.unknown())

const conversionEventSchema = z.object({
  id: z.string().uuid(),
  event_name: z.string().trim().min(1).max(160),
  occurred_at: timestampSchema,
  client_event_id: nullableText,
  member_email: nullableText,
}).catchall(z.unknown())

const activeCampaignContactSchema = z.object({
  id: z.union([z.string().trim().min(1).max(255), z.number().int().nonnegative()]).optional(),
  sourceContactId: z.string().trim().min(1).max(255).optional(),
  email: nullableText,
}).catchall(z.unknown())

const workflowInputSchema = z.object({
  metricDate: dateSchema,
  profiles: z.array(profileSchema).max(100),
  conversionEvents: z.array(conversionEventSchema).max(1000),
  activeCampaignContacts: z.array(activeCampaignContactSchema).max(250),
  marketingConfig: recordSchema,
  productAccessByMemberId: z.record(z.string().uuid(), recordSchema).optional(),
  activeCampaignMirrorByMemberId: z.record(z.string().uuid(), recordSchema).optional(),
  sourceRunId: z.string().trim().min(1).max(255).nullable().optional(),
  observedAt: timestampSchema.optional(),
  correlation: correlationSchema,
}).strict()

export const previewLifecycleInvocationSchema = z.object({
  invocationId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(8).max(512),
  synthetic: z.literal(true),
  persist: z.boolean().default(false),
  purpose: z.string().trim().min(8).max(500),
  input: workflowInputSchema,
}).strict()

export type PreviewLifecycleInvocation = z.infer<typeof previewLifecycleInvocationSchema>

export function parsePreviewLifecycleInvocation(source: unknown): PreviewLifecycleInvocation {
  const parsed = previewLifecycleInvocationSchema.safeParse(source)
  if (!parsed.success) {
    throw new PreviewHttpError(422, 'INVALID_WORKFLOW_INPUT', 'Workflow input failed validation.', {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        code: issue.code,
        message: issue.message,
      })),
    })
  }
  assertSyntheticOnly(parsed.data)
  return parsed.data
}

export function toPhaseCWorkflowInput(
  invocation: PreviewLifecycleInvocation,
  sourceRunId: string,
): PhaseCWorkflowInput {
  return {
    ...invocation.input,
    sourceRunId,
  } as PhaseCWorkflowInput
}

function assertSyntheticOnly(invocation: PreviewLifecycleInvocation): void {
  const violations: string[] = []
  invocation.input.profiles.forEach((profile, index) => {
    assertSyntheticEmail(profile.user_email, `input.profiles.${index}.user_email`, violations)
    assertSyntheticEmail(profile.email, `input.profiles.${index}.email`, violations)
  })
  invocation.input.conversionEvents.forEach((event, index) => {
    assertSyntheticEmail(event.member_email, `input.conversionEvents.${index}.member_email`, violations)
  })
  invocation.input.activeCampaignContacts.forEach((contact, index) => {
    assertSyntheticEmail(contact.email, `input.activeCampaignContacts.${index}.email`, violations)
    const sourceContactId = typeof contact.sourceContactId === 'string'
      ? contact.sourceContactId
      : typeof contact.id === 'string'
        ? contact.id
        : contact.id === undefined
          ? null
          : String(contact.id)
    if (sourceContactId && !sourceContactId.toLowerCase().startsWith('synthetic-')) {
      violations.push(`input.activeCampaignContacts.${index} must use a synthetic- contact identifier.`)
    }
  })

  if (violations.length > 0) {
    throw new PreviewHttpError(
      422,
      'NON_SYNTHETIC_DATA_BLOCKED',
      'Phase C2 accepts synthetic preview records only.',
      { violations },
    )
  }
}

function assertSyntheticEmail(
  value: string | null | undefined,
  path: string,
  violations: string[],
): void {
  if (!value) return
  const normalized = value.trim().toLowerCase()
  if (!normalized.endsWith('.invalid')) {
    violations.push(`${path} must use the reserved .invalid domain.`)
  }
}
