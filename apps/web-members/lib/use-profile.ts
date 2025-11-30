import { useCallback, useEffect, useState } from 'react'

export type ProfileRecord = {
  id?: string
  user_email: string
  display_name: string | null
  headline: string | null
  city: string | null
  state: string | null
  primary_interest: string | null
  tools: string | null
  notes: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type StructuredNotes = {
  bio: string
  phone: string
  linkedin: string
  notes: string
  availability: string
  service_area: string
  website: string
}

export type ProfileUpdateInput = {
  displayName: string
  headline: string
  city: string
  state: string
  primaryInterest: string
  tools: string
  structuredNotes: StructuredNotes
}

type UseProfileState = {
  profile: ProfileRecord | null
  structuredNotes: StructuredNotes
  isLoading: boolean
  isSaving: boolean
  error: string | null
  success: string | null
  refresh: () => Promise<void>
  saveProfile: (input: ProfileUpdateInput) => Promise<boolean>
  setError: (message: string | null) => void
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const DEFAULT_STRUCTURED_NOTES: StructuredNotes = {
  bio: '',
  phone: '',
  linkedin: '',
  notes: '',
  availability: '',
  service_area: '',
  website: '',
}

function parseStructuredNotes(raw: string | null): StructuredNotes {
  if (!raw) return { ...DEFAULT_STRUCTURED_NOTES }

  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return {
        ...DEFAULT_STRUCTURED_NOTES,
        bio: (parsed as any).bio ?? '',
        phone: (parsed as any).phone ?? '',
        linkedin: (parsed as any).linkedin ?? '',
        notes: (parsed as any).notes ?? '',
        availability: (parsed as any).availability ?? '',
        service_area: (parsed as any).service_area ?? '',
        website: (parsed as any).website ?? '',
      }
    }
  } catch (error) {
    console.warn('Could not parse structured notes, falling back to plain text', error)
  }

  return { ...DEFAULT_STRUCTURED_NOTES, bio: raw || '' }
}

function serializeStructuredNotes(notes: StructuredNotes) {
  return JSON.stringify({
    ...DEFAULT_STRUCTURED_NOTES,
    ...notes,
  })
}

export function useProfile(userEmail: string | null): UseProfileState {
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [structuredNotes, setStructuredNotes] = useState<StructuredNotes>(DEFAULT_STRUCTURED_NOTES)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setError('Profile service is temporarily unavailable.')
      setIsLoading(false)
      return
    }

    if (!userEmail) {
      setError('No user email found for this session.')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const encodedEmail = encodeURIComponent(userEmail)
      const url = `${SUPABASE_URL}/rest/v1/profiles?user_email=eq.${encodedEmail}&select=*`
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Supabase returned ${res.status} ${res.statusText}`)
      }

      const rows = (await res.json()) as ProfileRecord[]
      const row = rows[0] ?? null

      if (row) {
        setProfile(row)
        setStructuredNotes(parseStructuredNotes(row.notes))
      } else {
        setProfile(null)
        setStructuredNotes({ ...DEFAULT_STRUCTURED_NOTES })
      }
    } catch (err) {
      console.error('Error loading profile', err)
      setError(err instanceof Error ? err.message : 'Unknown error while loading profile')
    } finally {
      setIsLoading(false)
    }
  }, [userEmail])

  useEffect(() => {
    if (userEmail) {
      void refresh()
    } else {
      setProfile(null)
      setStructuredNotes({ ...DEFAULT_STRUCTURED_NOTES })
      setIsLoading(false)
    }
  }, [refresh, userEmail])

  const saveProfile = useCallback(
    async ({ displayName, headline, city, state, primaryInterest, tools, structuredNotes: notes }: ProfileUpdateInput) => {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setError('Profile service is temporarily unavailable.')
        return false
      }

      if (!userEmail) {
        setError('No user email found for this session.')
        return false
      }

      try {
        setIsSaving(true)
        setError(null)
        setSuccess(null)

        const payload = {
          user_email: userEmail,
          display_name: displayName.trim() || null,
          headline: headline.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          primary_interest: primaryInterest.trim() || null,
          tools: tools.trim() || null,
          notes: serializeStructuredNotes(notes),
        }

        const encodedEmail = encodeURIComponent(userEmail)
        const hasExisting = !!profile
        const url = hasExisting
          ? `${SUPABASE_URL}/rest/v1/profiles?user_email=eq.${encodedEmail}`
          : `${SUPABASE_URL}/rest/v1/profiles`

        const method = hasExisting ? 'PATCH' : 'POST'

        const res = await fetch(url, {
          method,
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          throw new Error(`Supabase returned ${res.status} ${res.statusText}`)
        }

        const rows = (await res.json()) as ProfileRecord[]
        const row = rows[0] ?? null
        setProfile(row)
        if (row) {
          setStructuredNotes(parseStructuredNotes(row.notes))
        }

        setSuccess('Profile updated. Your dashboard greeting will reflect this change.')
        return true
      } catch (err) {
        console.error('Error saving profile', err)
        setError(err instanceof Error ? err.message : 'Unknown error while saving profile')
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [profile, userEmail],
  )

  return {
    profile,
    structuredNotes,
    isLoading,
    isSaving,
    error,
    success,
    refresh,
    saveProfile,
    setError,
  }
}
