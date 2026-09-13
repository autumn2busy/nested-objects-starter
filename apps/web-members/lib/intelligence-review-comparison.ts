import type { IntelligenceReviewSummary } from './intelligence-os-admin'

type ReviewItem = Record<string, unknown>
export type ReviewChange = {
  key: string
  label: 'Added' | 'Changed' | 'Unchanged' | 'Only in reference'
  reference: ReviewItem | null
  selected: ReviewItem | null
}
export type ReviewItemComparison = {
  changes: ReviewChange[]
  unavailable: string | null
}

// This module compares stored review artifacts only. It performs no reads or writes.
export function selectOperatingReviews(
  input: unknown,
  selectedId?: string,
  referenceId?: string,
) {
  const records = Array.isArray(input) ? input.slice(0, 100).filter(isReview) : []
  const ids = new Map<string, number>()
  for (const review of records) ids.set(review.id, (ids.get(review.id) ?? 0) + 1)
  const reviews = records.filter(review => ids.get(review.id) === 1)
    .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate) || a.id.localeCompare(b.id))
  const selected = selectedId
    ? reviews.find(review => review.id === selectedId) ?? null
    : reviews.find(review => review.workflowName === 'weekly_operating_review') ?? reviews[0] ?? null
  const reference = referenceId
    ? reviews.find(review => review.id === referenceId) ?? null
    : reviews.find(review => review.id !== selected?.id && review.workflowName === selected?.workflowName
      && review.reviewDate <= selected.reviewDate) ?? null

  let unavailable: string | null = null
  if (selectedId && !selected) unavailable = 'The selected review is no longer in this snapshot. Choose an available review.'
  else if (referenceId && !reference) unavailable = 'The reference review is no longer in this snapshot. Choose an available review.'
  else if (!selected || !reference) unavailable = 'Two saved reviews of the same workflow are needed for a comparison.'
  else if (selected.id === reference.id) unavailable = 'Choose two different reviews.'
  else if (selected.workflowName !== reference.workflowName) unavailable = 'Choose two reviews of the same workflow.'
  else if (reference.reviewDate > selected.reviewDate) unavailable = 'Choose a reference dated on or before the selected review.'
  else if (![selected, reference].every(review => ['completed', 'quiet'].includes(review.status))) {
    unavailable = 'Comparison is available for completed or quiet reviews only.'
  }
  return { reviews, selected, reference, unavailable }
}

export function compareReviewItems(
  reference: ReviewItem[],
  selected: ReviewItem[],
  identity: 'fingerprint' | 'id',
): ReviewItemComparison {
  const before = keyedItems(reference, identity)
  const after = keyedItems(selected, identity)
  if (!before || !after) return {
    changes: [],
    unavailable: 'Some items have missing or repeated identifiers. Read both reviews below; their changes cannot be matched reliably.',
  }
  const changes: ReviewChange[] = []
  for (const [key, item] of after) {
    const prior = before.get(key) ?? null
    changes.push({
      key, reference: prior, selected: item,
      label: !prior ? 'Added' : comparableJson(prior) === comparableJson(item) ? 'Unchanged' : 'Changed',
    })
  }
  for (const [key, item] of before) {
    if (!after.has(key)) changes.push({ key, reference: item, selected: null, label: 'Only in reference' })
  }
  return { changes, unavailable: null }
}

export function reviewText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function keyedItems(items: ReviewItem[], identity: string): Map<string, ReviewItem> | null {
  const result = new Map<string, ReviewItem>()
  for (const item of items) {
    const key = item[identity]
    if (typeof key !== 'string' || !key.trim() || result.has(key)) return null
    result.set(key, item)
  }
  return result
}

function comparableJson(item: ReviewItem): string {
  // Run-specific tracing may change even when the recorded recommendation does not.
  const { correlation: _correlation, signalId: _signalId, ...content } = item
  return JSON.stringify(sorted(content))
}

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted)
  if (!record(value)) return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])]))
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isReview(value: unknown): value is IntelligenceReviewSummary {
  if (!record(value)) return false
  if (!['id', 'workflowName', 'reviewDate', 'status', 'executiveSummary', 'correlationId']
    .every(key => typeof value[key] === 'string')) return false
  if (!value.id || !value.workflowName || !value.correlationId) return false
  const date = value.reviewDate as string
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const time = Date.parse(date)
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) return false
  return ['priorities', 'autumnDecisions'].every(key =>
    Array.isArray(value[key]) && value[key].length <= 50 && value[key].every(record))
}
