import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import AdminView from './AdminView'

export const dynamic = 'force-dynamic'

export default async function AdminBackgroundChecksPage() {
    // 1. Authenticate exactly like the API route
    const user = await getCurrentUser()
    const outsetaId = getOutsetaUserId(user)

    if (!user || !outsetaId) {
        redirect('/')
    }

    const ADMIN_IDS = process.env.ADMIN_OUTSETA_IDS?.split(',') || []
    const isAdmin = ADMIN_IDS.includes(outsetaId) || user.email === 'autumn.williams@nestedobjects.com' || user.email === 'syre.gibson@nestedobjects.com' || user.email === 'autumn.s.williams@gmail.com'

    if (!isAdmin) {
        redirect('/profile') // Boot non-admins back to their own profile
    }

    // 2. Fetch all profiles awaiting background check verification
    const supabase = createServiceRoleClient()
    const { data: pendingProfiles, error } = await supabase
        .from('profiles')
        .select(`
            id,
            user_id,
            shield_id,
            shield_id_submitted_at,
            background_check_status,
            trust_score,
            user_email,
            first_name,
            last_name
        `)
        .eq('background_check_status', 'pending_verification')
        .order('shield_id_submitted_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch pending profiles:', error)
    }

    // Map the relational user data cleanly for the client component
    const formattedProfiles = (pendingProfiles || []).map(profile => {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown User'
        const email = profile.user_email || 'No email'

        return {
            id: profile.id,
            fullName,
            email,
            shieldId: profile.shield_id,
            submittedAt: profile.shield_id_submitted_at,
            trustScore: profile.trust_score || 0
        }
    })

    return (
        <main className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Background Verification</h1>
                    <p className="text-slate-500 mt-2">
                        Review and verify member ABC# records shielding applications.
                    </p>
                </div>
                <Link
                    href="/admin/conversion-funnel"
                    className="text-sm font-semibold text-brand-copper hover:text-brand-copperDark"
                >
                    Conversion funnel
                </Link>
            </div>

            <AdminView initialProfiles={formattedProfiles} />
        </main>
    )
}
