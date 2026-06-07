import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { hasAdminClaims } from '@/lib/backgroundcheck-admin-auth'

const FALLBACK_REVIEWER_EMAILS = new Set([
    'autumn.williams@nestedobjects.com',
    'autumn.s.williams@gmail.com',
    'info@nestedobjects.com',
])

function getConfiguredReviewerEmails() {
    return new Set(
        (process.env.BLOG_REVIEWER_EMAILS || '')
            .split(',')
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean),
    )
}

function getConfiguredAdminIds() {
    return new Set(
        (process.env.ADMIN_OUTSETA_IDS || '')
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean),
    )
}

export async function getBlogReviewerSession() {
    const user = await getCurrentUser()
    const outsetaId = getOutsetaUserId(user)

    if (!user || !outsetaId) {
        return { user: null, outsetaId: null, isReviewer: false }
    }

    const email = typeof user.email === 'string' ? user.email.toLowerCase() : ''
    const reviewerEmails = getConfiguredReviewerEmails()
    const adminIds = getConfiguredAdminIds()

    const isReviewer =
        hasAdminClaims(user) ||
        adminIds.has(outsetaId) ||
        reviewerEmails.has(email) ||
        FALLBACK_REVIEWER_EMAILS.has(email)

    return { user, outsetaId, isReviewer }
}
