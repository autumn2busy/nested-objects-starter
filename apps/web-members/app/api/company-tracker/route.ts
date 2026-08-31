import { NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import { memberToolsUnavailableResponse } from '@/lib/member-tools-availability'

export const dynamic = 'force-dynamic'

// GET — fetch all tracked firms for the current user
export async function GET() {
    const unavailable = memberToolsUnavailableResponse()
    if (unavailable) return unavailable

    try {
        const user = await getCurrentUser()
        const outsetaId = getOutsetaUserId(user)

        if (!user || !outsetaId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createServiceRoleClient()

        const { data, error } = await supabase
            .from('company_tracker')
            .select('*')
            .eq('user_id', outsetaId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[TRACKER] Fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch tracked companies' }, { status: 500 })
        }

        return NextResponse.json({ companies: data })

    } catch (error: any) {
        console.error('[TRACKER] Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST — add a firm to the company tracker
export async function POST(request: Request) {
    const unavailable = memberToolsUnavailableResponse()
    if (unavailable) return unavailable

    try {
        const user = await getCurrentUser()
        const outsetaId = getOutsetaUserId(user)

        if (!user || !outsetaId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { company_name, website, notes } = await request.json()

        if (!company_name) {
            return NextResponse.json({ error: 'company_name is required' }, { status: 400 })
        }

        const supabase = createServiceRoleClient()

        // Check if already tracked
        const { data: existing } = await supabase
            .from('company_tracker')
            .select('id')
            .eq('user_id', outsetaId)
            .ilike('company_name', company_name)
            .limit(1)

        if (existing && existing.length > 0) {
            return NextResponse.json({ success: true, alreadyTracked: true, id: existing[0].id })
        }

        const { data, error } = await supabase
            .from('company_tracker')
            .insert([{
                user_id: outsetaId,
                company_name,
                website: website || null,
                research_status: 'not_started',
                notes: notes || null,
            }])
            .select()
            .single()

        if (error) {
            console.error('[TRACKER] Insert error:', error)
            return NextResponse.json({ error: 'Failed to track company' }, { status: 500 })
        }

        return NextResponse.json({ success: true, company: data })

    } catch (error: any) {
        console.error('[TRACKER] Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE — remove a firm from the company tracker
export async function DELETE(request: Request) {
    const unavailable = memberToolsUnavailableResponse()
    if (unavailable) return unavailable

    try {
        const user = await getCurrentUser()
        const outsetaId = getOutsetaUserId(user)

        if (!user || !outsetaId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 })
        }

        const supabase = createServiceRoleClient()

        const { error } = await supabase
            .from('company_tracker')
            .delete()
            .eq('id', id)
            .eq('user_id', outsetaId)

        if (error) {
            console.error('[TRACKER] Delete error:', error)
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('[TRACKER] Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH — update a tracked firm (e.g. status change)
export async function PATCH(request: Request) {
    const unavailable = memberToolsUnavailableResponse()
    if (unavailable) return unavailable

    try {
        const user = await getCurrentUser()
        const outsetaId = getOutsetaUserId(user)

        if (!user || !outsetaId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id, ...updates } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 })
        }

        const supabase = createServiceRoleClient()

        const { error } = await supabase
            .from('company_tracker')
            .update(updates)
            .eq('id', id)
            .eq('user_id', outsetaId)

        if (error) {
            console.error('[TRACKER] Update error:', error)
            return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('[TRACKER] Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
