import type { SupabaseClient } from '@supabase/supabase-js'
import type { ConversionEventRow } from './conversion-funnel'

const COLUMNS = 'id, event_name, anonymous_id, member_uid, member_email, plan_uid, plan_name, source_page, source, reason, utm_source, utm_medium, utm_campaign, occurred_at, event_data'
const EVENT_LIMIT = 20_000
const PAGE_SIZE = 500

export async function readConversionReportEvents(supabase: SupabaseClient, startDate: string, endDate: string) {
  const rows: ConversionEventRow[] = []
  let count: number | null = null
  for (let page = 0; page < EVENT_LIMIT / PAGE_SIZE; page++) {
    const { data, error, count: total } = await supabase.from('conversion_events')
      .select(COLUMNS, { count: 'exact' })
      .gte('occurred_at', startDate).lt('occurred_at', endDate)
      .order('occurred_at', { ascending: true }).order('id', { ascending: true })
      .range(rows.length, Math.min(rows.length + PAGE_SIZE - 1, EVENT_LIMIT - 1))
    if (error) return { rows, count, error: true, resultsLimited: true }
    if (total !== null) count = total
    const batch = (data || []) as ConversionEventRow[]
    rows.push(...batch)
    if (count !== null && rows.length >= count) return { rows, count, error: false, resultsLimited: false }
    if (!batch.length) return { rows, count, error: false, resultsLimited: count === null || rows.length < count }
    if (count === null && batch.length < PAGE_SIZE) return { rows, count, error: false, resultsLimited: true }
  }
  return { rows, count, error: false, resultsLimited: count === null || rows.length < count }
}
