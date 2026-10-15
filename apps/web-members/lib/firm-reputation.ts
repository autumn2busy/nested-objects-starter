export type FirmRecommendationStatus = 'recommended' | 'under_review' | 'suppressed'

export type FirmReputationSource = {
  publisher: string
  title: string
  url: string
  published_at: string | null
  summary: string | null
  verification_status: 'verified' | 'unverified_third_party_report'
}

export type FirmReputationFields = {
  recommendation_status?: FirmRecommendationStatus | null
  reputation_notice?: string | null
  reputation_sources?: unknown
  reputation_reviewed_at?: string | null
}

export function isFirmSuppressed(firm: FirmReputationFields) {
  return firm.recommendation_status === 'suppressed'
}

export function formatFirmReputationReviewDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date)
}

export function normalizeFirmReputationSources(value: unknown): FirmReputationSource[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((source) => {
    if (!source || typeof source !== 'object') return []

    const candidate = source as Record<string, unknown>
    const publisher = typeof candidate.publisher === 'string' ? candidate.publisher.trim() : ''
    const title = typeof candidate.title === 'string' ? candidate.title.trim() : ''
    const url = typeof candidate.url === 'string' ? candidate.url.trim() : ''

    if (!publisher || !title || !/^https:\/\//i.test(url)) return []

    return [{
      publisher,
      title,
      url,
      published_at: typeof candidate.published_at === 'string' ? candidate.published_at : null,
      summary: typeof candidate.summary === 'string' ? candidate.summary : null,
      verification_status: candidate.verification_status === 'verified'
        ? 'verified'
        : 'unverified_third_party_report',
    } satisfies FirmReputationSource]
  })
}
