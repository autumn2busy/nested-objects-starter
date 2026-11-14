// This hostname comes from VERCEL_URL on the server, never a request header.
const MEMBERS_PREVIEW_HOST = /^nested-objects-starter-[a-z0-9]+-autumns-projects-246e052c\.vercel\.app$/
const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

/** Keep Preview pricing login on its exact deployment without changing Production. */
export function pricingPreviewLoginCallback(previewHost: string | undefined, currentHref: string): string | undefined {
  if (!previewHost || !MEMBERS_PREVIEW_HOST.test(previewHost)) return undefined
  try {
    const current = new URL(currentHref)
    const origin = `https://${previewHost}`
    if (current.origin !== origin || current.username || current.password
      || current.pathname !== '/membership-pricing') return undefined

    const destination = new URL('/membership-pricing', origin)
    for (const key of CAMPAIGN_KEYS) {
      const values = current.searchParams.getAll(key)
      // Preserve campaign labels, never arbitrary callbacks, identities or tokens.
      if (values.length === 1 && /^[a-zA-Z0-9._~-]{1,128}$/.test(values[0])) {
        destination.searchParams.set(key, values[0])
      }
    }
    const callback = new URL('/auth/callback', origin)
    callback.searchParams.set('redirect', destination.pathname + destination.search)
    return callback.href
  } catch {
    return undefined
  }
}
