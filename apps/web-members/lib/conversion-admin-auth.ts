import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { hasAdminClaims } from '@/lib/backgroundcheck-admin-auth'

const FALLBACK_ADMIN_EMAILS = new Set([
  'autumn.williams@nestedobjects.com',
  'autumn.s.williams@gmail.com',
])

function configuredValues(value: string | undefined) {
  return new Set(
    (value || '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  )
}

export async function getConversionAdminSession() {
  const user = await getCurrentUser()
  const outsetaId = getOutsetaUserId(user)

  if (!user || !outsetaId) {
    return { user: null, outsetaId: null, isAdmin: false }
  }

  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : ''
  const adminEmails = configuredValues(process.env.CONVERSION_ADMIN_EMAILS)
  const adminIds = configuredValues(process.env.ADMIN_OUTSETA_IDS)

  const isAdmin =
    hasAdminClaims(user) ||
    adminIds.has(outsetaId.toLowerCase()) ||
    adminEmails.has(email) ||
    FALLBACK_ADMIN_EMAILS.has(email)

  return { user, outsetaId, isAdmin }
}
