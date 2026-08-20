import type { SupabaseClient } from '@supabase/supabase-js'

export const CONVERSION_EVENT_NAMES = [
  'signup_started',
  'signup_completed',
  'profile_completed',
  'directory_viewed',
  'firm_view',
  'paywall_hit',
  'pricing_view',
  'pricing_cta_click',
  'join_free_click',
  'upgrade_clicked',
  'upgrade_started',
  'start_trial',
  'outseta_modal_open',
  'purchase',
  'subscription_created',
  'subscription_upgraded',
  'tool_used',
  'ai_resume_generated',
  'ai_concierge_used',
  'training_started',
  'training_completed',
] as const

export type ConversionEventName = (typeof CONVERSION_EVENT_NAMES)[number]

const EVENT_NAMES = new Set<string>(CONVERSION_EVENT_NAMES)

export type ConversionEventInput = {
  eventName: ConversionEventName
  clientEventId?: string | null
  anonymousId?: string | null
  sessionId?: string | null
  memberUid?: string | null
  memberEmail?: string | null
  planUid?: string | null
  planName?: string | null
  eventData?: Record<string, unknown>
  occurredAt?: string | null
}

export function isConversionEventName(value: unknown): value is ConversionEventName {
  return typeof value === 'string' && EVENT_NAMES.has(value)
}

function textValue(value: unknown, maxLength = 255): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function safeOccurredAt(value: string | null | undefined) {
  if (!value) return new Date().toISOString()
  const timestamp = new Date(value)
  const now = Date.now()

  if (Number.isNaN(timestamp.getTime())) return new Date(now).toISOString()
  if (timestamp.getTime() > now + 5 * 60 * 1000) return new Date(now).toISOString()
  if (timestamp.getTime() < now - 180 * 24 * 60 * 60 * 1000) return new Date(now).toISOString()

  return timestamp.toISOString()
}

export async function recordConversionEvent(
  supabase: SupabaseClient,
  input: ConversionEventInput,
) {
  const eventData = input.eventData || {}
  const row = {
    client_event_id: textValue(input.clientEventId, 160),
    event_name: input.eventName,
    anonymous_id: textValue(input.anonymousId, 160),
    session_id: textValue(input.sessionId, 160),
    member_uid: textValue(input.memberUid, 160),
    member_email: textValue(input.memberEmail, 320)?.toLowerCase() || null,
    plan_uid: textValue(input.planUid, 160),
    plan_name: textValue(input.planName, 120),
    source_page: textValue(eventData.sourcePage, 255),
    source: textValue(eventData.source, 160),
    reason: textValue(eventData.reason, 160),
    utm_source: textValue(eventData.utm_source, 160),
    utm_medium: textValue(eventData.utm_medium, 160),
    utm_campaign: textValue(eventData.utm_campaign, 255),
    event_data: eventData,
    occurred_at: safeOccurredAt(input.occurredAt),
  }

  const { error } = await supabase
    .from('conversion_events')
    .upsert(row, {
      onConflict: 'client_event_id',
      ignoreDuplicates: true,
    })

  if (error) throw error
}
