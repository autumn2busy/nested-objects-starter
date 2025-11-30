import { useCallback, useMemo, useState } from 'react'

import { useAuth } from '@/components/auth-provider'
import type { Profile, ProfileUpdatePayload, StructuredNotes } from '@/types/profile'

function toNullableString(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function parseStructuredNotes(rawNotes: string | null): StructuredNotes {
  if (!rawNotes) {
    return { bio: '', phone: '', linkedin: '', notes: '' }
  }

  try {
    const parsed = JSON.parse(rawNotes)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'bio' in parsed &&
      'phone' in parsed &&
      'linkedin' in parsed
    ) {
      return {
        bio: (parsed as any).bio ?? '',
        phone: (parsed as any).phone ?? '',
        linkedin: (parsed as any).linkedin ?? '',
        notes: (parsed as any).notes ?? '',
      }
    }
  } catch (error) {
    console.warn('Could not parse structured notes, falling back to plain text', error)
  }

  return { bio: rawNotes || '', phone: '', linkedin: '', notes: '' }
}

export function deriveFallbackName(
  displayName: string | null | undefined,
  outsetaFirstName: string | null,
  emailLabel: string,
) {
  return (
    displayName ||
    outsetaFirstName ||
    emailLabel.split('@')[0]?.replace(/[._]/g, ' ') ||
    'Member'
  )
}

export function useProfile() {
  const auth = useAuth() as any
  const { isAuthenticated } = auth
  const userEmail: string | null =
    (auth?.user?.email as string | undefined) ??
    (auth?.user?.Email as string | undefined) ??
    null

  const outsetaFirstName: string | null =
    (auth?.user?.FirstName as string | undefined) ??
    (auth?.user?.first_name as string | undefined) ??
    null

  const emailLabel = userEmail ?? 'Your profile'

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fallbackName = useMemo(
    () => deriveFallbackName(profile?.display_name, outsetaFirstName, emailLabel),
    [emailLabel, outsetaFirstName, profile?.display_name],
  )

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || !userEmail) {
      setProfile(null)
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/profile', { cache: 'no-store' })

      if (res.status === 404) {
        setProfile(null)
        auth.updateProfileDisplayName?.(fallbackName || null)
        return null
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Profile service is temporarily unavailable.')
      }

      const body = (await res.json()) as { profile: Profile | null }
      const nextProfile = body.profile || null
      setProfile(nextProfile)
      auth.updateProfileDisplayName?.(nextProfile?.display_name || fallbackName || null)
      return nextProfile
    } catch (err) {
      console.error('Error loading profile', err)
      setError(err instanceof Error ? err.message : 'Unknown error while loading profile')
      setProfile(null)
      auth.updateProfileDisplayName?.(fallbackName || null)
      return null
    } finally {
      setLoading(false)
    }
  }, [auth, fallbackName, isAuthenticated, userEmail])

  const saveProfile = useCallback(
    async (payload: ProfileUpdatePayload) => {
      if (!isAuthenticated || !userEmail) {
        throw new Error('Authentication required to update profile.')
      }

      const body: ProfileUpdatePayload = { ...payload }

      if (body.structured_notes && !body.notes) {
        body.notes = body.structured_notes
      }

      if (typeof body.notes === 'string') {
        body.notes = toNullableString(body.notes)
      }

      if (body.display_name !== undefined) {
        body.display_name = toNullableString(body.display_name)
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}))
        throw new Error(responseBody?.error || 'Unable to save profile right now.')
      }

      const data = (await res.json()) as { profile: Profile }
      setProfile(data.profile)
      auth.updateProfileDisplayName?.(data.profile?.display_name || fallbackName || null)
      return data.profile
    },
    [auth, fallbackName, isAuthenticated, userEmail],
  )

  return {
    profile,
    setProfile,
    loading,
    error,
    refreshProfile,
    saveProfile,
    fallbackName,
    userEmail,
    isAuthenticated,
  }
}
