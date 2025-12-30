
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export async function GET() {
    try {
        const supabase = createServiceRoleClient()

        // 1. Fetch profiles where user_id is NULL
        // We select id, and outseta_data
        const { data: profiles, error: fetchError } = await supabase
            .from('profiles')
            .select('id, outseta_data')
            .is('user_id', null)

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 })
        }

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ message: 'No profiles to migrate.' })
        }

        const stats = {
            total: profiles.length,
            updated: 0,
            failed: 0,
            errors: [] as any[]
        }

        // 2. Iterate and Update
        for (const profile of profiles) {
            const outsetaData = profile.outseta_data as any
            // Attempt to find the ID. 
            // The object might be the Account object itself { Uid: '...', Name: '...' }
            // or { account: { ... } }?
            // User said "The id is buried in the tables outseta_data column payload".
            // Common Outseta payload has `Uid`.

            const uid = outsetaData?.Uid || outsetaData?.uid || outsetaData?.AccountUid || outsetaData?.accountUid || outsetaData?.id

            if (uid) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ user_id: uid })
                    .eq('id', profile.id)

                if (updateError) {
                    stats.failed++
                    stats.errors.push({ id: profile.id, error: updateError.message })
                } else {
                    stats.updated++
                }
            } else {
                stats.failed++
                stats.errors.push({ id: profile.id, error: 'Could not extract UID from outseta_data' })
            }
        }

        return NextResponse.json({ stats })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
