/** Website/application fields accept public web URLs, never email addresses or prose. */
export function normalizeFirmWebLink(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text || /\s/.test(text)) return null
  if (!/^https?:\/\//i.test(text) && !/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/:?#]|$)/i.test(text)) return null
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : 'https://' + text)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
    const host = url.hostname.toLowerCase()
    if (!host.includes('.') || /(?:^|\.)(?:localhost|local|internal)$/.test(host) || /^127\.|^10\.|^192\.168\.|^169\.254\.|^0\.|^172\.(?:1[6-9]|2\d|3[01])\./.test(host)) return null
    return url.href
  } catch { return null }
}
