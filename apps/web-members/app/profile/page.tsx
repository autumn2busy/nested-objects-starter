'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

type Profile = {
  id?: string
  user_email: string
  full_name: string
  headline: string
  city: string
  state: string
  primary_services: string
  experience_level: string
  bio: string
  avatar_url: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getInitials(source?: string | null) {
  if (!source) return 'N'
  const fromEmail = source.includes('@')
    ? source.split('@')[0]?.replace(/[._]/g, ' ')
    : source

  const parts = fromEmail
    .split(' ')
    .filter((p) => p.trim().length > 0)

  if (parts.length === 0) return 'N'
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()

  return (
    parts[0]!.charAt(0).toUpperCase() +
    parts[parts.length - 1]!.charAt(0).toUpperCase()
  )
}

export default function ProfilePage() {
  const auth = useAuth() as any
  const { isAuthenticated, isLoading } = auth
  const user = auth.user ?? null

  const userEmail: string | null =
    user?.email ??
    user?.Email ??
    user?.primaryEmail ??
    user?.PrimaryEmail ??
    null

  const fallbackName: string =
    user?.fullName ??
    user?.FullName ??
    user?.name ??
    user?.Name ??
    (userEmail ?? '')

  const [profile, setProfile] = useState<Profile>({
    user_email: userEmail ?? '',
    full_name: fallbackName || '',
    headline: '',
    city: '',
    state: '',
    primary_services: '',
    experience_level: '',
    bio: '',
    avatar_url: '',
  })

  const [loadingProfile, setLoadingProfile] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const initials = useMemo(
    () => getInitials(profile.full_name || userEmail || 'Nested Objects'),
    [profile.full_name, userEmail],
  )

  useEffect(() => {
    if (!userEmail || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setLoadingProfile(false)
      return
    }

    let cancelled = false

    async function loadProfile() {
      try {
        const url =
          `${SUPABASE_URL}/rest/v1/profiles` +
          `?user_email=eq.${encodeURIComponent(userEmail)}` +
          `&select=*`

        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        })

        if (!res.ok) {
          console.error('Failed to load profile', await res.text())
          return
        }

        const rows = (await res.json()) as Profile[]

        if (cancelled) return

        if (rows.length > 0) {
          setProfile(rows[0])
        } else {
          // seed with auth data if no profile row yet
          setProfile((prev) => ({
            ...prev,
            user_email: userEmail,
            full_name: fallbackName || prev.full_name,
          }))
        }
      } catch (err) {
        console.error('Error loading profile', err)
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [userEmail, fallbackName])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setSaveMessage('Supabase is not configured on this project.')
      return
    }
    if (!userEmail) {
      setSaveMessage('You need to be logged in to save your profile.')
      return
    }

    setSaving(true)
    setSaveMessage(null)

    try {
      const url = `${SUPABASE_URL}/rest/v1/profiles`
      const payload: Profile = {
        ...profile,
        user_email: userEmail,
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify([payload]),
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('Save error', text)
        setSaveMessage('Something went wrong saving your profile. Try again.')
        return
      }

      setSaveMessage('Profile saved.')
    } catch (err) {
      console.error(err)
      setSaveMessage('Something went wrong saving your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <main
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Your profile
        </h1>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
          Log in to set up your inspector profile so firms know who they are assigning work to.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <a
            href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              border: '1px solid #3b82f6',
              color: '#3b82f6',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            Login
          </a>
          <a
            href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            Get free access
          </a>
        </div>
      </main>
    )
  }

  return (
    <main
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '2rem 1.5rem 3rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: '0.25rem',
            }}
          >
            Account
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
            Your inspector profile
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.3rem' }}>
            This is what firms see when they click into your profile from the directory tools.
          </p>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>
          <Link
            href="/dashboard"
            style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 2fr)',
          gap: '1.75rem',
          alignItems: 'flex-start',
        }}
      >
        {/* Left. avatar and snapshot */}
        <aside
          style={{
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '999px',
                background:
                  profile.avatar_url
                    ? 'transparent'
                    : 'radial-gradient(circle at 0 0, #4f46e5, #111827)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.5rem',
                overflow: 'hidden',
              }}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Avatar'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                initials
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.1rem',
                }}
              >
                {profile.full_name || 'Your name'}
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#6b7280',
                  marginBottom: '0.2rem',
                }}
              >
                {profile.headline || 'Independent field services pro'}
              </div>
              {userEmail && (
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  {userEmail}
                </div>
              )}
            </div>
          </div>

          <hr
            style={{
              margin: '1.25rem 0',
              border: 'none',
              borderTop: '1px solid #e5e7eb',
            }}
          />

          <dl
            style={{
              fontSize: '0.85rem',
              color: '#4b5563',
              display: 'grid',
              rowGap: '0.4rem',
            }}
          >
            <div>
              <dt style={{ color: '#9ca3af' }}>Location</dt>
              <dd>
                {profile.city || profile.state
                  ? [profile.city, profile.state].filter(Boolean).join(', ')
                  : 'Add your city and state'}
              </dd>
            </div>
            <div>
              <dt style={{ color: '#9ca3af' }}>Primary services</dt>
              <dd>
                {profile.primary_services || 'Ex. mortgage occupancy, insurance, REO'}
              </dd>
            </div>
            <div>
              <dt style={{ color: '#9ca3af' }}>Experience level</dt>
              <dd>{profile.experience_level || 'Tell firms how seasoned you are.'}</dd>
            </div>
          </dl>
        </aside>

        {/* Right. editable form */}
        <section
          style={{
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '1.5rem 1.75rem',
            backgroundColor: 'white',
          }}
        >
          <form onSubmit={handleSave}>
            <fieldset disabled={loadingProfile || saving} style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                Edit your profile
              </legend>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label
                    htmlFor="full_name"
                    style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}
                  >
                    Full name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, full_name: e.target.value }))
                    }
                    style={{
                      marginTop: '0.25rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="headline"
                    style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}
                  >
                    Headline
                  </label>
                  <input
                    id="headline"
                    type="text"
                    placeholder="Ex. Mortgage occupancy inspector, ATL region"
                    value={profile.headline}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, headline: e.target.value }))
                    }
                    style={{
                      marginTop: '0.25rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label
                    htmlFor="primary_services"
                    style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}
                  >
                    Primary services
                  </label>
                  <input
                    id="primary_services"
                    type="text"
                    placeholder="Ex. Property inspection, insurance loss, mystery shop"
                    value={profile.primary_services}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        primary_services: e.target.value,
                      }))
                    }
                    style={{
                      marginTop: '0.25rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="experience_level"
                    style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}
                  >
                    Experience level
                  </label>
                  <select
                    id="experience_level"
                    value={profile.experience_level}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        experience_level: e.target.value,
                      }))
                    }
                    style={{
                      marginTop: '0.25rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      backgroundColor: 'white',
                    }}
                  >
                    <option value="">Select one</option>
                    <option value="New to field services">New to field services</option>
                    <option value="1-2 years active">1–2 years active</option>
                    <option value="3-5 years active">3–5 years active</option>
                    <option value="5+ years, high volume">5+ years, high volume</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label
                    htmlFor="bio"
                    style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}
                  >
                    Short bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    placeholder="Share how you work, what regions you know best, and what types of assignments you are built for."
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, bio: e.target.value }))
                    }
                    style={{
                      marginTop: '0.25rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}
                  >
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, city: e.target.value }))
                    }
                    style={{
                      marginTop: '0.25rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      marginBottom: '0.75rem',
                    }}
                  />

                  <label
                    htmlFor="state"
                    style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}
                  >
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={profile.state}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, state: e.target.value }))
                    }
                    style={{
                      marginTop: '0.25rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      marginBottom: '0.75rem',
                    }}
                  />

                  <label
                    htmlFor="avatar_url"
                    style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}
                  >
                    Avatar image URL
                  </label>
                  <input
                    id="avatar_url"
                    type="url"
                    placeholder="Paste a square image link here"
                    value={profile.avatar_url}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, avatar_url: e.target.value }))
                    }
                    style={{
                      marginTop: '0.25rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                    }}
                  />
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      marginTop: '0.25rem',
                    }}
                  >
                    Later we can swap this for a true upload flow. For now you can use an
                    image from Google Drive, Notion, or another host.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1rem',
                  gap: '1rem',
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.65rem 1.4rem',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: saving ? 0.8 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </button>

                {saveMessage && (
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: saveMessage.includes('saved') ? '#166534' : '#b91c1c',
                    }}
                  >
                    {saveMessage}
                  </p>
                )}
              </div>
            </fieldset>
          </form>
        </section>
      </section>
    </main>
  )
}
