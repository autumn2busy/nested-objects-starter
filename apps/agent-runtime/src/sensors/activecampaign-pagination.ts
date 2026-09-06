import { ActiveCampaignReadBoundaryError, type ActiveCampaignReadOnlyClient, type ActiveCampaignReadResource } from './activecampaign-readonly.js'

export interface ActiveCampaignCollectionRead {
  state: 'complete' | 'partial' | 'unavailable'
  reason: 'total_reached' | 'page_budget' | 'request_failed' | 'invalid_page' | 'unknown_total' | 'changed_total' | 'duplicate_id' | 'early_end'
  expectedRecords: number | null
  records: Array<Record<string, unknown>>
  pages: Array<{ offset: number; received: number }>
}

// Completeness applies only to the explicitly approved collection and observation.
// No endpoint discovery, contact hydration, persistence, or retrying writes.
export async function readActiveCampaignCollection(client: ActiveCampaignReadOnlyClient, input: {
  resourceType: ActiveCampaignReadResource
  observedAt: string
  pageSize?: number
  maxPages?: number
}): Promise<ActiveCampaignCollectionRead> {
  const pageSize = input.pageSize ?? 100
  const maxPages = input.maxPages ?? 5
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100
    || !Number.isInteger(maxPages) || maxPages < 1 || maxPages > 5) {
    throw new ActiveCampaignReadBoundaryError('Collection reads require pageSize 1..100 and maxPages 1..5')
  }
  const key = { contact_inventory: 'contacts', automation: 'automations', campaign: 'campaigns', list: 'lists', tag: 'tags', field: 'fields' }[input.resourceType]
  const records: Array<Record<string, unknown>> = []
  const pages: ActiveCampaignCollectionRead['pages'] = []
  const seen = new Set<string>()
  let expectedRecords: number | null = null
  const finish = (reason: ActiveCampaignCollectionRead['reason']): ActiveCampaignCollectionRead => ({
    state: reason === 'total_reached' ? 'complete' : pages.length ? 'partial' : 'unavailable',
    reason, expectedRecords, records, pages,
  })
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    let raw: unknown
    try {
      raw = (await client.readPage({ resourceType: input.resourceType, externalId: 'collection',
        offset: pageIndex * pageSize, limit: pageSize, observedAt: input.observedAt })).body
    } catch { return finish('request_failed') }
    if (!raw || typeof raw !== 'object') return finish('invalid_page')
    const body = raw as Record<string, unknown>
    const rows = body[key]
    if (!Array.isArray(rows) || rows.length > pageSize
      || rows.some((row) => !row || typeof row !== 'object' || !/^[a-zA-Z0-9_-]+$/.test(String(row.id ?? '')))) return finish('invalid_page')
    const meta = body.meta as { total?: unknown } | undefined
    const totalValue = meta?.total
    const total = typeof totalValue === 'number' ? totalValue
      : typeof totalValue === 'string' && /^\d+$/.test(totalValue) ? Number(totalValue) : null
    pages.push({ offset: pageIndex * pageSize, received: rows.length })
    for (const row of rows as Array<Record<string, unknown>>) {
      const id = String(row.id)
      if (seen.has(id)) return finish('duplicate_id')
      seen.add(id)
      records.push(row)
    }
    if (total === null || !Number.isSafeInteger(total) || total < 0) return finish('unknown_total')
    if (expectedRecords !== null && expectedRecords !== total) return finish('changed_total')
    expectedRecords = total
    if (records.length > total) return finish('changed_total')
    if (records.length === total) return finish('total_reached')
    if (rows.length < pageSize) return finish('early_end')
  }
  return finish('page_budget')
}
