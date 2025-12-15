import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, getOutsetaUserId, hasAccess } from '@/lib/auth-server'
import { createClient } from '@/lib/supabase-server'
import type { MemberJobStatus } from '@/types/member-jobs'

type MemberJobPayload = {
  job_id?: string | null
  source_url?: string | null
  title?: string | null
  company?: string | null
  location?: string | null
  pay?: string | null
  status?: MemberJobStatus
  notes?: string | null
}

function resolveUserId(outsetaUser: any) {
  return (
    getOutsetaUserId(outsetaUser) ||
    outsetaUser?.Uid ||
    outsetaUser?.uid ||
    outsetaUser?.Id ||
    outsetaUser?.id ||
    outsetaUser?.UserAccountUid ||
    null
  )
}

function normalizePayload(body: any): MemberJobPayload {
  const toNullableString = (value: any) => {
    if (value === null || value === undefined) return null
    const trimmed = String(value).trim()
    return trimmed.length ? trimmed : null
  }

  const status = body?.status as MemberJobStatus | undefined

  return {
    job_id: toNullableString(body?.job_id),
    source_url: toNullableString(body?.source_url),
    title: toNullableString(body?.title),
    company: toNullableString(body?.company),
    location: toNullableString(body?.location),
    pay: toNullableString(body?.pay),
    status: status ?? 'interested',
    notes: toNullableString(body?.notes),
  }
}

export async function GET(req: NextRequest) {
  try {
    const outsetaUser = await getCurrentUser()

    if (!outsetaUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    if (!hasAccess(outsetaUser['outseta:planUid'], 'job_tracker')) {
      return NextResponse.json({ error: 'Upgrade required for job tracker.' }, { status: 403 })
    }

    const userId = resolveUserId(outsetaUser)

    if (!userId) {
      return NextResponse.json({ error: 'Could not resolve user identity.' }, { status: 400 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')

    let query = supabase.from('member_job_tracker').select('*').eq('user_id', userId)

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query.order('updated_at', { ascending: false }).order('created_at', { ascending: false })

    if (error) {
      console.error('[MEMBER_JOBS_FETCH_ERROR]', error)
      return NextResponse.json({ error: 'Could not load job tracker entries.' }, { status: 500 })
    }

    return NextResponse.json({ jobs: data ?? [] })
  } catch (error) {
    console.error('[MEMBER_JOBS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Unexpected error while loading job tracker entries.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const outsetaUser = await getCurrentUser()

    if (!outsetaUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    if (!hasAccess(outsetaUser['outseta:planUid'], 'job_tracker')) {
      return NextResponse.json({ error: 'Upgrade required for job tracker.' }, { status: 403 })
    }

    const userId = resolveUserId(outsetaUser)

    if (!userId) {
      return NextResponse.json({ error: 'Could not resolve user identity.' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const payload = normalizePayload(body)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('member_job_tracker')
      .insert({ user_id: userId, ...payload })
      .select()
      .single()

    if (error) {
      console.error('[MEMBER_JOBS_INSERT_ERROR]', error)
      return NextResponse.json({ error: `Could not save job entry. DB Error: ${error.message || JSON.stringify(error)}` }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[MEMBER_JOBS_POST_ERROR]', error)
    return NextResponse.json({ error: `Unexpected error: ${error?.message || error}` }, { status: 500 })
  }
}
