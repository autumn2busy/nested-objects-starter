type PricingLoginSdk = {
  on: (event: string, listener: (url: string) => false | undefined) => void
  setAccessToken: (token: string | null) => void
}

type RedirectListener = (url: string) => false | undefined
const listeners = new WeakMap<PricingLoginSdk, { active: RedirectListener | null }>()

/** Keep the SDK's session in step with our verified cookie on the pricing login. */
export function retainPricingLoginSession(sdk: PricingLoginSdk, callback: string, options: {
  failed: () => void
  request?: typeof fetch
  navigate?: (url: string) => void
  schedule?: (callback: () => void, milliseconds: number) => () => void
}) {
  const expected = new URL(callback)
  if (typeof sdk.on !== 'function' || typeof sdk.setAccessToken !== 'function'
    || expected.protocol !== 'https:' || expected.pathname !== '/auth/callback'
    || expected.username || expected.password || expected.hash || expected.searchParams.has('access_token')) {
    throw new Error('Invalid pricing login callback')
  }
  const request = options.request || fetch
  const navigate = options.navigate || (url => window.location.assign(url))
  const schedule = options.schedule || ((callback, milliseconds) => {
    const timer = window.setTimeout(callback, milliseconds)
    return () => window.clearTimeout(timer)
  })
  let slot = listeners.get(sdk)
  if (!slot) {
    slot = { active: null }
    // Outseta has no public unsubscribe API. One inert dispatcher per instance
    // avoids retaining prior attempts when the header unmounts or login retries.
    sdk.on('redirect', url => slot!.active?.(url))
    listeners.set(sdk, slot)
  }
  const controller = new AbortController()
  let cancelled = false
  let pending = false
  let stopDeadline = () => {}
  const listener: RedirectListener = value => {
    let destination: URL
    try { destination = new URL(value) } catch { return }
    const tokens = destination.searchParams.getAll('access_token')
    destination.searchParams.delete('access_token')
    // Only the exact per-click return belongs to this attempt. All other
    // provider redirects retain their ordinary behavior.
    if (destination.href !== expected.href || cancelled) return
    if (pending) return false
    pending = true
    const token = tokens[0]
    if (tokens.length !== 1 || !token || token.length > 16_384
      || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      options.failed()
      return false
    }
    stopDeadline = schedule(() => controller.abort(), 8_000)
    void (async () => {
      try {
        // Use the existing JWT verifier before retaining the provider token.
        // Never read the HttpOnly cookie, mint a token or forward it to analytics.
        const response = await request('/api/auth/session', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin', cache: 'no-store',
          body: JSON.stringify({ accessToken: token }), signal: controller.signal,
        })
        const result = await response.json()
        if (!response.ok || result?.success !== true || typeof result.user?.sub !== 'string'
          || !result.user.sub || controller.signal.aborted || cancelled) throw new Error('Sign-in unavailable')
        // The SDK otherwise retains a different cached identity when token iat
        // values are equal. Replace it only after the server accepted this login.
        try {
          sdk.setAccessToken(null)
          sdk.setAccessToken(token)
        } catch {
          // Blocked browser storage must not break the verified site login.
          // The plan button independently checks the SDK session and recovers.
        }
        // Preserve the existing callback and its second server-side verification.
        navigate(value)
      } catch {
        if (!cancelled) options.failed()
      } finally { stopDeadline() }
    })()
    // Outseta's redirect callbacks are synchronous; defer navigation until the
    // existing session endpoint has accepted the login and the SDK is ready.
    return false
  }
  slot.active = listener
  return () => {
    cancelled = true
    controller.abort()
    stopDeadline()
    if (slot!.active === listener) slot!.active = null
  }
}
