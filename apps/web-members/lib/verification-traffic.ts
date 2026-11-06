/** Same explicit QA markers used by the conversion report; never infer human intent. */
export function isVerificationTraffic(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return false
  return /release_validation|attribution_20261011|pricing-route-check|route-repair|verification|synthetic|\bqa\b/i.test(
    ['source', 'utm_source', 'utm_medium', 'utm_campaign',
      'first_utm_source', 'last_utm_source', 'first_utm_medium', 'last_utm_medium',
      'first_utm_campaign', 'last_utm_campaign'].map(key => data[key]).join(' '),
  )
}
