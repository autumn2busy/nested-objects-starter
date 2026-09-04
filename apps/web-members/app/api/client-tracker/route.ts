import { NextResponse } from 'next/server'

import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { canAccessMemberTool, MEMBER_TOOL_IDS } from '@/lib/member-tool-access'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const RELATIONSHIP_STATUSES = new Set(['active', 'inactive', 'pending'])
const ENTITY_TYPES = new Set(['firm', 'vendor', 'client'])

function text(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null
  const clean = String(value).trim().slice(0, maxLength)
  return clean || null
}

async function authorize() {
  const user = await getCurrentUser()
  if (!user) return { response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) }
  if (!canAccessMemberTool(user['outseta:planUid'], MEMBER_TOOL_IDS.CLIENT_WORKSPACE)) {
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
    .from('client_vendor_tracker')
    .select('id,user_id,name,primary_contact,email,phone,payment_terms,website,relationship_status,entity_type,notes,created_at')
    .eq('user_id', access.userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[CLIENT_TRACKER_FETCH_ERROR]', error.code)
    return NextResponse.json({ error: 'Could not load client records.' }, { status: 500 })
  }
  return NextResponse.json({ clients: data ?? [] })
}

export async function POST(request: Request) {
  const access = await authorize()
  if ('response' in access) return access.response

  const body = await request.json().catch(() => ({}))
  const name = text(body.name, 160)
  if (!name) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 })

  const relationshipStatus = RELATIONSHIP_STATUSES.has(body.relationship_status) ? body.relationship_status : 'active'
  const entityType = ENTITY_TYPES.has(body.entity_type) ? body.entity_type : 'firm'
  const payload = {
    user_id: access.userId,
    name,
    primary_contact: text(body.primary_contact, 160),
    email: text(body.email, 254),
    phone: text(body.phone, 60),
    payment_terms: text(body.payment_terms, 120),
    website: text(body.website, 500),
    relationship_status: relationshipStatus,
    entity_type: entityType,
    notes: text(body.notes, 2000),
  }

  const { data, error } = await createServiceRoleClient()
    .from('client_vendor_tracker')
    .insert(payload)
    .select('id,user_id,name,primary_contact,email,phone,payment_terms,website,relationship_status,entity_type,notes,created_at')
    .single()

  if (error) {
    console.error('[CLIENT_TRACKER_INSERT_ERROR]', error.code)
    return NextResponse.json({ error: 'Could not save the client record.' }, { status: 500 })
  }
  return NextResponse.json({ client: data }, { status: 201 })
}

export async function DELETE(request: Request) {
  const access = await authorize()
  if ('response' in access) return access.response

  const body = await request.json().catch(() => ({}))
  const id = text(body.id, 100)
  if (!id) return NextResponse.json({ error: 'Record ID is required.' }, { status: 400 })

  const { error } = await createServiceRoleClient()
    .from('client_vendor_tracker')
    .delete()
    .eq('id', id)
    .eq('user_id', access.userId)

  if (error) {
    console.error('[CLIENT_TRACKER_DELETE_ERROR]', error.code)
    return NextResponse.json({ error: 'Could not remove the client record.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
