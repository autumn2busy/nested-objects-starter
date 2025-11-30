import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import type { Profile, ProfileUpdatePayload, StructuredNotes } from '@/types/profile'

function toNullableString(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  return trimmed.length ? trimmed : null
}

function resolveUserEmail(user: any) {
  return (
    (user?.email as string | undefined) ??
    (user?.Email as string | undefined) ??
    null
  )
}

function normalizeStructuredNotes(input: unknown): string | null | undefined {
  if (input === undefined) return undefined
  if (input === null) return null

  if (typeof input === 'object') {
    const value = input as StructuredNotes
    return JSON.stringify({
      bio: value.bio ?? '',
      phone: value.phone ?? '',
      linkedin: value.linkedin ?? '',
      notes: value.notes ?? '',
    })
  }

  const trimmed = String(input).trim()
  return trimmed.length ? trimmed : null
}

function normalizeProfilePayload(body: any, userEmail: string) {
  const payload: Partial<Profile> & { user_email: string } = { user_email: userEmail }

  const assignField = (
    key: keyof ProfileUpdatePayload,
    transform: (value: any) => string | null | undefined,
  ) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      const value = transform(body[key])
      if (value !== undefined) {
        payload[key as keyof Profile] = value as any
      }
    }
  }

  assignField('display_name', toNullableString)
  assignField('headline', toNullableString)
  assignField('city', toNullableString)
  assignField('state', toNullableString)
  assignField('primary_interest', toNullableString)
  assignField('tools', toNullableString)
  assignField('avatar_url', toNullableString)

  if (
    Object.prototype.hasOwnProperty.call(body, 'structured_notes') ||
    Object.prototype.hasOwnProperty.call(body, 'notes')
  ) {
    const notesValue =
      Object.prototype.hasOwnProperty.call(body, 'structured_notes') && body.structured_notes
        ? body.structured_notes
        : body.notes

    const normalizedNotes = normalizeStructuredNotes(notesValue)
    if (normalizedNotes !== undefined) {
      payload.notes = normalizedNotes
    }
  }

  return payload
}

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const userEmail = resolveUserEmail(user)

    if (!userEmail) {
      return NextResponse.json({ error: 'No user email found for this session.' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_email', userEmail)
      .maybeSingle()

    if (error) {
      console.error('[PROFILE_GET_ERROR]', error)
      return NextResponse.json({ error: 'Profile service is temporarily unavailable.' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ profile: null }, { status: 404 })
    }

    return NextResponse.json({ profile: data as Profile })
  } catch (error) {
    console.error('[PROFILE_GET_UNEXPECTED]', error)
    return NextResponse.json({ error: 'Unexpected error while loading profile.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const userEmail = resolveUserEmail(user)

    if (!userEmail) {
      return NextResponse.json({ error: 'No user email found for this session.' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const normalized = normalizeProfilePayload(body, userEmail)

    if (Object.keys(normalized).length <= 1) {
      return NextResponse.json({ error: 'No profile fields provided.' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('profiles')
      .upsert(normalized, { onConflict: 'user_email' })
      .select()
      .single()

    if (error) {
      console.error('[PROFILE_SAVE_ERROR]', error)
      return NextResponse.json({ error: 'Unable to save profile right now.' }, { status: 500 })
    }

    return NextResponse.json({ profile: data as Profile })
  } catch (error) {
    console.error('[PROFILE_PATCH_UNEXPECTED]', error)
    return NextResponse.json({ error: 'Unexpected error while saving profile.' }, { status: 500 })
  }
}
