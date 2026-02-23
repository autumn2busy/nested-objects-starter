import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

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
  return (
    outsetaUser?.email ||
    outsetaUser?.Email ||
    null
  )
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

    // Try to find profile by user_id first, then by email
    let query = supabase
      .from('profiles')
      .select(`
        id,
        user_email,
        full_name,
        display_name,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        headline,
        bio,
        city,
        state,
        service_areas,
        primary_services,
        experience_level,
        tools_used,
        preferred_job_types,
        max_travel_distance,
        trust_score,
        trust_tier,
        trust_score_breakdown,
        background_check_status,
        background_check_verified_at,
        shield_id,
        shield_ic_rating,
        training_modules_completed,
        training_modules_total,
        inspections_completed,
        certifications,
        identity_verified,
        phone_verified,
        email_verified,
        verified_at,
        created_at,
        subscription_tier,
        subscription_status,
        rating,
        rating_count
      `)

    // Query by outseta_person_uid or user_id
    if (userId) {
      query = query.or(`outseta_person_uid.eq.${userId},user_id.eq.${userId}`)
    }

    const { data, error } = await query.limit(1).single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[PROFILE_FETCH_ERROR]', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // If no profile found, return basic info from Outseta
    if (!data) {
      return NextResponse.json({
        profile: {
          id: null,
          user_email: userEmail,
          full_name: outsetaUser?.name || outsetaUser?.FullName || null,
          display_name: outsetaUser?.first_name || outsetaUser?.FirstName || null,
          first_name: outsetaUser?.first_name || outsetaUser?.FirstName || null,
          last_name: outsetaUser?.last_name || outsetaUser?.LastName || null,
          email: userEmail,
          phone: null,
          avatar_url: null,
          trust_score: 0,
          trust_tier: 'bronze',
          trust_score_breakdown: null,
          background_check_status: 'not_started',
          training_modules_completed: 0,
          training_modules_total: 5,
          inspections_completed: 0,
          email_verified: true,
          phone_verified: false,
          identity_verified: false,
          created_at: new Date().toISOString(),
        }
      })
    }

    return NextResponse.json({ profile: data })
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
    ]

    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Add updated_at
    updates.updated_at = new Date().toISOString()

    const supabase = createServiceRoleClient()

    // Find existing profile
    let existingQuery = supabase.from('profiles').select('id')
    if (userId) {
      existingQuery = existingQuery.or(`outseta_person_uid.eq.${userId},user_id.eq.${userId}`)
    }
    const { data: existing } = await existingQuery.limit(1).single()

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('[PROFILE_UPDATE_ERROR]', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
      result = data
    } else {
      // Create new profile
      const newProfile = {
        ...updates,
        user_email: userEmail,
        outseta_person_uid: userId,
        user_id: userId,
        email: userEmail,
        full_name: outsetaUser?.name || outsetaUser?.FullName || null,
        first_name: outsetaUser?.first_name || outsetaUser?.FirstName || null,
        last_name: outsetaUser?.last_name || outsetaUser?.LastName || null,
        email_verified: true,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single()

      if (error) {
        console.error('[PROFILE_INSERT_ERROR]', error)
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