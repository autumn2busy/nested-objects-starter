import { MembersDirectoryView, type Member } from './MembersDirectoryView'
import { generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generatePageMetadata({
    title: 'Members Directory | Find Field Inspectors & Notaries',
    description: 'Search verified independent field inspectors and mobile notaries for your coverage needs.',
    path: '/members',
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getMembers(): Promise<Member[]> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []

    try {
        const url =
            `${SUPABASE_URL}/rest/v1/profiles` +
            '?select=' +
            [
                'id',
                'display_name',
                'avatar_url',
                'verified_at',
                'rating',
                'rating_count'
                // 'service_area', // Removed to be safe, will address filtering if column missing
                // 'bio'
            ].join(',') +
            '&order=created_at.desc'

        const res = await fetch(url, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            next: { revalidate: 300 },
        })

        if (!res.ok) throw new Error('Failed to fetch members')

        const members = await res.json()

        // Transform data if needed or mock service area if not in top level which is likely
        // If we need service_area from resume_workspace, we'd need a join or separate fetch.
        // For V1, we will return what we have.
        return members.map((m: any) => ({
            ...m,
            // Fallback for missing service area if not in DB yet
            service_area: m.service_area || null
        }))

    } catch (err) {
        console.error('Error fetching members', err)
        return []
    }
}

export default async function MembersDirectoryPage() {
    const members = await getMembers()

    return (
        <MembersDirectoryView initialMembers={members} />
    )
}
