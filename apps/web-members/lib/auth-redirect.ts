const DEFAULT_DESTINATION = '/inspector-dashboard'
const VALIDATION_ORIGIN = 'https://auth-redirect.invalid'

/** Allow only local application destinations, never another auth/API handoff. */
export function safeAuthRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return DEFAULT_DESTINATION
  try {
    const decoded = decodeURIComponent(value)
    if (/[\u0000-\u0020\\]/.test(decoded) || decoded.startsWith('//')) return DEFAULT_DESTINATION
    const target = new URL(value, VALIDATION_ORIGIN)
    if (target.origin !== VALIDATION_ORIGIN || /^\/(auth|api)(\/|$)/i.test(decodeURIComponent(target.pathname))) {
      return DEFAULT_DESTINATION
    }
    target.searchParams.delete('access_token')
    return target.pathname + target.search
  } catch {
    return DEFAULT_DESTINATION
  }
}
