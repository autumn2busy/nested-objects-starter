import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import {
  PROFILE_CRITICAL_COLUMNS,
  PROFILE_GUARANTEED_COLUMNS,
  buildDegradedProfile,
  buildFallbackProfileSchemaInfo,
  buildProfileQueryColumns,
  type ProfileSchemaInfo,
} from './schema'

export const dynamic = 'force-dynamic'

const PROFILE_LOG_PREFIX = '[PROFILE_API_SUPABASE_ERROR]'
const PROFILE_SCHEMA_GUARD_PREFIX = '[PROFILE_API_SCHEMA_GUARD]'

let cachedProfileSchemaInfo: Promise<ProfileSchemaInfo> | null = null

// Helper to get user identifier
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

function resolveUserEmail(outsetaUser: any) {
  return outsetaUser?.email || outsetaUser?.Email || null
}

function resolveUserPhone(outsetaUser: any) {
  return outsetaUser?.Phone || outsetaUser?.MobilePhone || outsetaUser?.phone || null
}

function logSupabaseError(event: string, error: any, context: Record<string, unknown> = {}) {
  console.error(PROFILE_LOG_PREFIX, {
    event,
    code: error?.code ?? null,
    message: error?.message ?? null,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    ...context,
  })
}

function isSchemaError(error: any) {
  const text = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return (
    error?.code === '42703' ||
    error?.code === '42P01' ||
    error?.code === 'PGRST204' ||
    text.includes('column') ||
    text.includes('relation')
  )
}

async function getProfileSchemaInfo(supabase: ReturnType<typeof createServiceRoleClient>) {
  if (!cachedProfileSchemaInfo) {
    cachedProfileSchemaInfo = (async () => {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'profiles')

      if (error) {
        logSupabaseError('schema_probe_failed', error)
        return buildFallbackProfileSchemaInfo()
      }

      const availableColumns = new Set((data ?? []).map((row: any) => row.column_name))
      const missingCriticalColumns = PROFILE_CRITICAL_COLUMNS.filter((column) => !availableColumns.has(column))

      if (missingCriticalColumns.length > 0) {
        console.error(PROFILE_SCHEMA_GUARD_PREFIX, {
          message: 'Missing critical profile columns for /profile payload defaults',
          missingCriticalColumns,
        })
      }

      return { availableColumns, missingCriticalColumns }
    })()
  }

  return cachedProfileSchemaInfo
}

// GET - Fetch current user's profile
export async function GET() {
  try {
    const outsetaUser = await getCurrentUser()

    if (!outsetaUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = resolveUserId(outsetaUser)
    const userEmail = resolveUserEmail(outsetaUser)

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Could not identify user' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const schemaInfo = await getProfileSchemaInfo(supabase)
    const queryColumns = buildProfileQueryColumns(schemaInfo.availableColumns)

    // Try to find profile by user_id first, then by email
    let query = supabase.from('profiles').select(queryColumns.join(', '))

    // Query by outseta_person_uid, user_id, or email
    if (userId) {
      query = schemaInfo.availableColumns.has('user_id')
        ? query.or(`outseta_person_uid.eq.${userId},user_id.eq.${userId}`)
        : query.eq('outseta_person_uid', userId)
    } else if (userEmail) {
      query = query.eq('user_email', userEmail)
    } else {
      return NextResponse.json({ error: 'No user ID or email to query' }, { status: 400 })
    }

    const { data, error } = await query.limit(1).single()

    if (error && error.code !== 'PGRST116') {
      logSupabaseError('profile_fetch_failed', error, { userId, userEmail })

      if (isSchemaError(error)) {
        return NextResponse.json({ profile: buildDegradedProfile(outsetaUser, userEmail, resolveUserPhone(outsetaUser)) })
      }

      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ profile: buildDegradedProfile(outsetaUser, userEmail, resolveUserPhone(outsetaUser)) })
    }

    return NextResponse.json({ profile: buildDegradedProfile(outsetaUser, userEmail, resolveUserPhone(outsetaUser), data) })
  } catch (err) {
    console.error('[PROFILE_GET_ERROR]', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

// PATCH - Update current user's profile (vendor fields only)
export async function PATCH(req: NextRequest) {
  try {
    const outsetaUser = await getCurrentUser()

    if (!outsetaUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = resolveUserId(outsetaUser)
    const userEmail = resolveUserEmail(outsetaUser)

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Could not identify user' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const supabase = createServiceRoleClient()
    const schemaInfo = await getProfileSchemaInfo(supabase)

    // Only allow updating vendor-specific fields (not Outseta-managed fields)
    const allowedFields = [
      'headline',
      'bio',
      'city',
      'state',
      'service_areas',
      'primary_services',
      'experience_level',
      'tools_used',
      'preferred_job_types',
      'max_travel_distance',
      'avatar_url',
      'is_published',
    ]

    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) {
        if (field === 'is_published' && !schemaInfo.availableColumns.has('is_published')) {
          console.error(PROFILE_SCHEMA_GUARD_PREFIX, {
            message: 'Ignoring is_published update because column is unavailable',
          })
          continue
        }
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Add updated_at
    updates.updated_at = new Date().toISOString()

    // Find existing profile
    let existingQuery = supabase.from('profiles').select('id')
    if (userId) {
      existingQuery = schemaInfo.availableColumns.has('user_id')
        ? existingQuery.or(`outseta_person_uid.eq.${userId},user_id.eq.${userId}`)
        : existingQuery.eq('outseta_person_uid', userId)
    } else if (userEmail) {
      existingQuery = existingQuery.eq('user_email', userEmail)
    } else {
      return NextResponse.json({ error: 'No user ID or email to save against' }, { status: 400 })
    }

    const { data: existing } = await existingQuery.limit(1).maybeSingle()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        logSupabaseError('profile_update_failed', error, { userId, userEmail })
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
      result = data
    } else {
      const newProfile = {
        ...updates,
        user_email: userEmail,
        outseta_person_uid: userId,
        ...(schemaInfo.availableColumns.has('user_id') ? { user_id: userId } : {}),
        email: userEmail,
        full_name: outsetaUser?.name || outsetaUser?.FullName || null,
        first_name: outsetaUser?.first_name || outsetaUser?.FirstName || null,
        last_name: outsetaUser?.last_name || outsetaUser?.LastName || null,
        phone: resolveUserPhone(outsetaUser),
        email_verified: true,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single()

      if (error) {
        logSupabaseError('profile_insert_failed', error, { userId, userEmail })
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
      result = data
    }

    return NextResponse.json({ profile: result })
  } catch (err) {
    console.error('[PROFILE_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
