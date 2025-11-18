'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

type Profile = {
  id?: string
  user_email: string
  display_name: string | null
  headline: string | null
  city: string | null
  state: string | null
  primary_interest: string | null
  tools: string | null
  notes: string | null
  avatar_url: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function ProfilePage() {
  const auth = useAuth() as any
  const { isAuthenticated, isLoading, user } = auth
  const userEmail: string | null = (user?.email as string | undefined) ?? null

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [headline, setHeadline] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [primaryInterest, setPrimaryInterest] = useState('')
  const [tools, setTools] = useState('')
  const [notes, setNotes] = useState('')

  const firstNameFromAuth: string | undefined =
    user?.first_name ??
    user?.FirstName ??
    (user?.name ? (user.name as string).split(' ')[0] : undefined)

  const nameFallbackFromAuth: string =
    firstNameFromAuth ||
    (user?.name ? (user.name as string).split(' ')[0] : undefined) ||
    (userEmail ? userEmail.split('@')[0]?.replace(/[._]/g, ' ') : '') ||
    'Member'

  const emailLabel = userEmail ?? 'Your profile'
  const effectiveDisplayName = displayName || nameFallbackFromAuth
  const initials = effectiveDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  useEffect(() => {
    async function loadProfile() {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setError('Profile service is temporarily unavailable.')
        setLoadingProfile(false)
        return
      }

      if (!userEmail) {
        setError('No user email found for this session.')
        setLoadingProfile(false)
        return
      }

      try {
        setLoadingProfile(true)
        setError(null)
        setSuccess(null)

        const encodedEmail = encodeURIComponent(userEmail)
        const url =
          `${SUPABASE_URL}/rest/v1/profiles` +
          `?user_email=eq.${encodedEmail}` +
          `&select=*`

        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        })

        if (!res.ok) {
          throw new Error(`Supabase returned ${res.status} ${res.statusText}`)
        }

        const rows = (await res.json()) as Profile[]
        const row = rows[0] ?? null

        if (row) {
          setProfile(row)
          setDisplayName(row.display_name || nameFallbackFromAuth)
          setHeadline(row.headline || '')
          setCity(row.city || '')
          setState(row.state || '')
          setPrimaryInterest(row.primary_interest || '')
          setTools(row.tools || '')
          setNotes(row.notes || '')
        } else {
          setProfile(null)
          setDisplayName(nameFallbackFromAuth)
          setHeadline('')
          setCity('')
          setState('')
          setPrimaryInterest('')
          setTools('')
          setNotes('')
        }
      } catch (err) {
        console.error('Error loading profile', err)
        setError(
          err instanceof Error ? err.message : 'Unknown error while loading profile',
        )
      } finally {
        setLoadingProfile(false)
      }
    }

    if (!isLoading && isAuthenticated) {
      loadProfile()
    }
  }, [isLoading, isAuthenticated, userEmail, nameFallbackFromAuth])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setError('Profile service is temporarily unavailable.')
      return
    }
    if (!userEmail) {
      setError('No user email found for this session.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const payload = {
        user_email: userEmail,
        display_name: displayName || nameFallbackFromAuth,
        headline: headline || null,
        city: city || null,
        state: state || null,
        primary_interest: primaryInterest || null,
        tools: tools || null,
        notes: notes || null,
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

      const rows = (await res.json()) as Profile[]
      const row = rows[0] ?? null
      if (row) {
        setProfile(row)
        setDisplayName(row.display_name || nameFallbackFromAuth)
      }

      setSuccess('Profile updated.')
    } catch (err) {
      console.error('Error saving profile', err)
      setError(
        err instanceof Error ? err.message : 'Unknown error while saving profile',
      )
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
          Log in to view and personalize your Nested Objects profile.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
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
        maxWidth: '1100px',
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
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
            Your inspector profile
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.35rem' }}>
            This is what Nested Objects will use to match you to firms, gigs, and tools.
          </p>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>
          <Link
            href="/dashboard"
            style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}
          >
            ← Back to dashboard
          </Link>
          <div style={{ marginTop: '0.25rem' }}>{emailLabel}</div>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.8fr)',
          gap: '1.75rem',
          alignItems: 'flex-start',
        }}
      >
        <aside
          style={{
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '1.5rem 1.5rem 1.25rem',
            background:
              'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(16,185,129,0.04))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '999px',
                background:
                  'radial-gradient(circle at 30% 30%, #4f46e5, #0f766e)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.4rem',
                boxShadow: '0 10px 25px rgba(15,23,42,0.35)',
              }}
            >
              {initials || '?'}
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: '0.1rem',
                }}
              >
                {effectiveDisplayName}
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#4b5563',
                  marginBottom: '0.15rem',
                }}
              >
                {headline || 'Add a short headline so firms know your lane.'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {city && state ? `${city}, ${state}` : 'Add your city and state.'}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              fontSize: '0.85rem',
              color: '#4b5563',
              lineHeight: 1.5,
            }}
          >
            <p style={{ marginTop: 0, marginBottom: '0.4rem' }}>
              Treat this like your "inspector resume" inside Nested Objects.
            </p>
            <ul
              style={{
                paddingLeft: '1.1rem',
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <li>Highlight your main field services lanes and regions.</li>
              <li>List tools you already use so firms know you are plug and play.</li>
              <li>Use the notes area to track goals, certifications, or next steps.</li>
            </ul>
          </div>
        </aside>

        <section
          style={{
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '1.5rem 1.75rem 1.5rem',
            backgroundColor: 'white',
            boxShadow:
              '0 14px 28px rgba(15,23,42,0.05), 0 3px 6px rgba(15,23,42,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                margin: 0,
              }}
            >
              Profile details
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#6b7280',
              }}
            >
              Firms never see your email unless you share it directly.
            </span>
          </div>

          {loadingProfile && (
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Loading your profile…
            </p>
          )}

          {!loadingProfile && (
            <form
              onSubmit={handleSave}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {error && (
                <div
                  style={{
                    borderRadius: '8px',
                    padding: '0.75rem 0.9rem',
                    fontSize: '0.85rem',
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    borderRadius: '8px',
                    padding: '0.75rem 0.9rem',
                    fontSize: '0.85rem',
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  {success}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                  gap: '0.9rem 1rem',
                }}
              >
                <div>
                  <label
                    htmlFor="displayName"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      marginBottom: '0.15rem',
                    }}
                  >
                    Name or display name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Autumn Williams"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="headline"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      marginBottom: '0.15rem',
                    }}
                  >
                    Headline
                  </label>
                  <input
                    id="headline"
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Mortgage inspector · Atlanta metro · 5 years"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      marginBottom: '0.15rem',
                    }}
                  >
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Atlanta"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      marginBottom: '0.15rem',
                    }}
                  >
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. GA"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="primaryInterest"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginBottom: '0.15rem',
                  }}
                >
                  Primary lanes or interests
                </label>
                <input
                  id="primaryInterest"
                  type="text"
                  value={primaryInterest}
                  onChange={(e) => setPrimaryInterest(e.target.value)}
                  placeholder="e.g. Mortgage occupancy inspections, insurance loss, REO"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.7rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="tools"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginBottom: '0.15rem',
                  }}
                >
                  Tools and platforms you already use
                </label>
                <input
                  id="tools"
                  type="text"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  placeholder="e.g. Aspen iAgent, EZInspections, Spectora, FieldCom"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.7rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginBottom: '0.15rem',
                  }}
                >
                  Notes, goals, or certifications
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="e.g. Aiming for 3 steady firms this year. Licensed adjuster in GA, TX. Comfortable with rural routes."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.7rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.75rem',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.7rem 1.6rem',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: saving ? '#93c5fd' : '#3b82f6',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: saving ? 'default' : 'pointer',
                  }}
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </button>

                <p
                  style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    margin: 0,
                    textAlign: 'right',
                  }}
                >
                  As we roll out more tools, this profile will help auto match you to
                  firms, training, and routes.
                </p>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  )
}
