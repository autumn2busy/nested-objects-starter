import { NextResponse } from 'next/server'

import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { canAccessMemberTool, MEMBER_TOOL_IDS } from '@/lib/member-tool-access'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const RESEARCH_STATUSES = new Set(['not_started', 'contacted', 'registered', 'active', 'archived'])

function text(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null
  const clean = String(value).trim().slice(0, maxLength)
  return clean || null
}

async function authorize() {
  const user = await getCurrentUser()
  if (!user) return { response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) }
  if (!canAccessMemberTool(user['outseta:planUid'], MEMBER_TOOL_IDS.COMPANY_TRACKER)) {
    return { response: NextResponse.json({ error: 'A paid member plan is required.' }, { status: 403 }) }
  }
  const userId = getOutsetaUserId(user)
  if (!userId) return { response: NextResponse.json({ error: 'Could not resolve member identity.' }, { status: 400 }) }
  return { userId }
}

export async function GET() {
  const access = await authorize()
  if ('response' in access) return access.response

  const { data, error } = await createServiceRoleClient()
    .from('company_tracker')
    .select('id,user_id,company_name,website,research_status,notes,created_at')
    .eq('user_id', access.userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[COMPANY_TRACKER_FETCH_ERROR]', error.code)
    return NextResponse.json({ error: 'Could not load tracked companies.' }, { status: 500 })
  }
  return NextResponse.json({ companies: data ?? [] })
}

export async function POST(request: Request) {
  const access = await authorize()
  if ('response' in access) return access.response

  const body = await request.json().catch(() => ({}))
  const companyName = text(body.company_name, 160)
  if (!companyName) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { data: existing, error: existingError } = await supabase
    .from('company_tracker')
    .select('id')
    .eq('user_id', access.userId)
    .ilike('company_name', companyName)
    .limit(1)

  if (existingError) {
    console.error('[COMPANY_TRACKER_DUPLICATE_CHECK_ERROR]', existingError.code)
    return NextResponse.json({ error: 'Could not check the company record.' }, { status: 500 })
  }
  if (existing?.length) return NextResponse.json({ success: true, alreadyTracked: true, id: existing[0].id })

  const { data, error } = await supabase
    .from('company_tracker')
    .insert({
      user_id: access.userId,
      company_name: companyName,
      website: text(body.website, 500),
      research_status: 'not_started',
      notes: text(body.notes, 2000),
    })
    .select('id,user_id,company_name,website,research_status,notes,created_at')
    .single()

  if (error) {
    console.error('[COMPANY_TRACKER_INSERT_ERROR]', error.code)
    return NextResponse.json({ error: 'Could not save the company.' }, { status: 500 })
  }
  return NextResponse.json({ success: true, company: data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const access = await authorize()
  if ('response' in access) return access.response

  const body = await request.json().catch(() => ({}))
  const id = text(body.id, 100)
  if (!id) return NextResponse.json({ error: 'Record ID is required.' }, { status: 400 })

  const updates: Record<string, string | null> = {}
  if (body.research_status !== undefined) {
    if (!RESEARCH_STATUSES.has(body.research_status)) {
      return NextResponse.json({ error: 'Invalid research status.' }, { status: 400 })
    }
    updates.research_status = body.research_status
  }
  if (body.website !== undefined) updates.website = text(body.website, 500)
  if (body.notes !== undefined) updates.notes = text(body.notes, 2000)
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No supported changes supplied.' }, { status: 400 })

  const { data, error } = await createServiceRoleClient()
    .from('company_tracker')
    .update(updates)
    .eq('id', id)
    .eq('user_id', access.userId)
    .select('id,user_id,company_name,website,research_status,notes,created_at')
    .single()

  if (error) {
    console.error('[COMPANY_TRACKER_UPDATE_ERROR]', error.code)
    return NextResponse.json({ error: 'Could not update the company.' }, { status: 500 })
  }
  return NextResponse.json({ success: true, company: data })
}

export async function DELETE(request: Request) {
  const access = await authorize()
  if ('response' in access) return access.response

  const body = await request.json().catch(() => ({}))
  const id = text(body.id, 100)
  if (!id) return NextResponse.json({ error: 'Record ID is required.' }, { status: 400 })

  const { error } = await createServiceRoleClient()
    .from('company_tracker')
    .delete()
    .eq('id', id)
    .eq('user_id', access.userId)

  if (error) {
    console.error('[COMPANY_TRACKER_DELETE_ERROR]', error.code)
    return NextResponse.json({ error: 'Could not remove the company.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
