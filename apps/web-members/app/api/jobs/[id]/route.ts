import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, getOutsetaUserId, hasAccess } from '@/lib/auth-server'
import { createClient } from '@/lib/supabase-server'
import type { JobStatus, PayoutStatus } from '@/types/jobs'

type JobUpdatePayload = {
  firm_id?: string | null
  title?: string | null
  firm_name?: string | null
  region?: string | null
  address?: string | null
  appointment_date?: string | null
  appointment_time?: string | null
  status?: JobStatus
  payout?: number | null
  payout_status?: PayoutStatus
  mileage?: number | null
  sla_target_hours?: number | null
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

function normalizeUpdatePayload(body: any): JobUpdatePayload {
  const toNullableString = (value: any) => {
    if (value === null || value === undefined) return null
    const trimmed = String(value).trim()
    return trimmed.length ? trimmed : null
  }

  const toNullableNumber = (value: any) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  const status = body?.status as JobStatus | undefined
  const payoutStatus = body?.payout_status as PayoutStatus | undefined

  return {
    firm_id: body?.firm_id === undefined ? undefined : toNullableString(body.firm_id),
    title: body?.title === undefined ? undefined : toNullableString(body.title),
    firm_name: body?.firm_name === undefined ? undefined : toNullableString(body.firm_name),
    region: body?.region === undefined ? undefined : toNullableString(body.region),
    address: body?.address === undefined ? undefined : toNullableString(body.address),
    appointment_date:
      body?.appointment_date === undefined ? undefined : toNullableString(body.appointment_date),
    appointment_time:
      body?.appointment_time === undefined ? undefined : toNullableString(body.appointment_time),
    status,
    payout: body?.payout === undefined ? undefined : toNullableNumber(body.payout),
    payout_status: payoutStatus,
    mileage: body?.mileage === undefined ? undefined : toNullableNumber(body.mileage),
    sla_target_hours:
      body?.sla_target_hours === undefined
        ? undefined
        : body.sla_target_hours === 0
          ? 0
          : toNullableNumber(body.sla_target_hours),
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

    const supabase = createClient()
    const { data, error } = await supabase
      .from('jobs')
      .update({ ...updates, user_id: userId })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[JOBS_UPDATE_ERROR]', error)
      return NextResponse.json({ error: 'Could not update job.' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[JOBS_PATCH_ERROR]', error)
    return NextResponse.json({ error: 'Unexpected error while updating job.' }, { status: 500 })
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

    const supabase = createClient()
    const { error } = await supabase.from('jobs').delete().eq('id', params.id).eq('user_id', userId)

    if (error) {
      console.error('[JOBS_DELETE_ERROR]', error)
      return NextResponse.json({ error: 'Could not delete job.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[JOBS_DELETE_HANDLER_ERROR]', error)
    return NextResponse.json({ error: 'Unexpected error while deleting job.' }, { status: 500 })
  }
}
