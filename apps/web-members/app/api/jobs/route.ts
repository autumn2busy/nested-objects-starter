import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, getOutsetaUserId, hasAccess, PLAN_UIDS } from '@/lib/auth-server'
import { createClient } from '@/lib/supabase-server'
import type { JobStatus, PayoutStatus } from '@/types/jobs'

type JobPayload = {
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

function normalizeJobPayload(body: any): JobPayload {
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
    firm_id: toNullableString(body?.firm_id),
    title: toNullableString(body?.title),
    firm_name: toNullableString(body?.firm_name),
    region: toNullableString(body?.region),
    address: toNullableString(body?.address),
    appointment_date: toNullableString(body?.appointment_date),
    appointment_time: toNullableString(body?.appointment_time),
    status: status ?? 'scheduled',
    payout: toNullableNumber(body?.payout),
    payout_status: payoutStatus ?? 'unpaid',
    mileage: toNullableNumber(body?.mileage),
    sla_target_hours: body?.sla_target_hours === 0 ? 0 : toNullableNumber(body?.sla_target_hours),
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

    let query = supabase.from('jobs').select('*').eq('user_id', userId)

    const status = searchParams.get('status')
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    if (dateFrom) {
      query = query.gte('appointment_date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('appointment_date', dateTo)
    }

    const { data, error } = await query
      .order('appointment_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[JOBS_FETCH_ERROR]', error)
      return NextResponse.json({ error: 'Could not load jobs.' }, { status: 500 })
    }

    return NextResponse.json({ jobs: data ?? [] })
  } catch (error) {
    console.error('[JOBS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Unexpected error while loading jobs.' }, { status: 500 })
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

    const supabase = createClient()

    if (outsetaUser['outseta:planUid'] === PLAN_UIDS.STARTER) {
      const { count, error: countError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('status', 'in', '(paid,cancelled)')

      if (countError) {
        console.error('[JOBS_COUNT_ERROR]', countError)
        return NextResponse.json({ error: 'Could not verify job limits.' }, { status: 500 })
      }

      if ((count ?? 0) >= 20) {
        return NextResponse.json(
          {
            error:
              'Starter includes tracking for up to 20 active jobs. Upgrade to Pro to unlock unlimited job tracking.',
          },
          { status: 403 }
        )
      }
    }

    const body = await req.json().catch(() => ({}))
    const payload = normalizeJobPayload(body)

    const { data, error } = await supabase
      .from('jobs')
      .insert({ user_id: userId, ...payload })
      .select()
      .single()

    if (error) {
      console.error('[JOBS_INSERT_ERROR]', error)
      return NextResponse.json({ error: 'Could not save job.' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[JOBS_POST_ERROR]', error)
    return NextResponse.json({ error: 'Unexpected error while creating job.' }, { status: 500 })
  }
}
