import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, getOutsetaUserId, hasAccess } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import type { MemberJobStatus } from '@/types/member-jobs'

type MemberJobUpdatePayload = {
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

function normalizeUpdatePayload(body: any): MemberJobUpdatePayload {
  const toNullableString = (value: any) => {
    if (value === null || value === undefined) return null
    const trimmed = String(value).trim()
    return trimmed.length ? trimmed : null
  }

  const status = body?.status as MemberJobStatus | undefined

  return {
    job_id: body?.job_id === undefined ? undefined : toNullableString(body.job_id),
    source_url: body?.source_url === undefined ? undefined : toNullableString(body.source_url),
    title: body?.title === undefined ? undefined : toNullableString(body.title),
    company: body?.company === undefined ? undefined : toNullableString(body.company),
    location: body?.location === undefined ? undefined : toNullableString(body.location),
    pay: body?.pay === undefined ? undefined : toNullableString(body.pay),
    status,
    notes: body?.notes === undefined ? undefined : toNullableString(body.notes),
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    const updates = normalizeUpdatePayload(body)

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('member_job_tracker')
      .update({ ...updates, user_id: userId })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[MEMBER_JOBS_UPDATE_ERROR]', error)
      return NextResponse.json({ error: 'Could not update job entry.' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[MEMBER_JOBS_PATCH_ERROR]', error)
    return NextResponse.json({ error: 'Unexpected error while updating job entry.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
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

    const supabase = createServiceRoleClient()
    const { error } = await supabase
      .from('member_job_tracker')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) {
      console.error('[MEMBER_JOBS_DELETE_ERROR]', error)
      return NextResponse.json({ error: 'Could not delete job entry.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MEMBER_JOBS_DELETE_HANDLER_ERROR]', error)
    return NextResponse.json({ error: 'Unexpected error while deleting job entry.' }, { status: 500 })
  }
}
