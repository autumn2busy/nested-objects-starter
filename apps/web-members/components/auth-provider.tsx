'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'
import { trackOutsetaModalOpen } from '@/lib/ac-events'

type JwtPayload = {
  email?: string
  name?: string
  [key: string]: any
}

type AuthContextValue = {
  user: JwtPayload | null
  planUid: string | null
  profileDisplayName: string | null
  profileAvatarUrl: string | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  hasAccess: (feature?: string) => boolean
  login: () => void
  signup: () => void
  logout: () => void
  refreshAuth: () => Promise<void>
  refreshProfileDisplayName: () => Promise<void>
  updateProfileDisplayName: (name: string | null) => void
  updateProfileAvatarUrl: (url: string | null) => void
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const deriveDisplayName = (payload: JwtPayload | null): string | null => {
  const fallback =
    (payload?.first_name as string | undefined) ??
    (payload?.FirstName as string | undefined) ??
    (payload?.name ? payload.name.split(' ')[0] : undefined) ??
    (payload?.email ? payload.email.split('@')[0] : undefined) ??
    null

  return fallback ? fallback.trim() || null : null
}

// Plan ordering. Starter < Directory pass < Pro < Elite < Agency
// Plan ranking: index determines feature access level.
// Founders (pWrBRnWn) is a hidden legacy plan at the same level as Starter.
// We include both so the Gate component resolves access correctly for either UID.
const PLAN_ORDER = ['L9nbKV9Z', 'zWZD0rQp', 'pWrBRnWn', 'rQVqlLm6', 'NmdnNO90', 'rmk5Xk9g'] as const
type PlanUid = (typeof PLAN_ORDER)[number]

// Minimum plan required for each feature.
// With Starter dropped from the public pricing page, the effective public tiers are:
//   Free (L9nbKV9Z) → Pro (rQVqlLm6) → Elite (NmdnNO90) → Agency (rmk5Xk9g)
// Founders (pWrBRnWn) and Starter (zWZD0rQp) remain valid for legacy/imported members.
const FEATURE_MIN_PLAN: Record<string, PlanUid | null> = {
  // Core app — Free+
  directory_access: 'L9nbKV9Z',
  job_board: 'L9nbKV9Z',

  // Training — Starter/Founders+ (legacy paid)
  basic_training: 'zWZD0rQp',
  advanced_training: 'NmdnNO90',  // Elite+
  training_safety: 'L9nbKV9Z',    // Free+ (safety guides)

  // Tools — varies
  ai_concierge: 'L9nbKV9Z',       // Free+ (quota-limited for Starter/Founders)
  firm_intel: 'rQVqlLm6',         // Pro+
  job_tracking: 'L9nbKV9Z',       // Free+
  job_tracker: 'L9nbKV9Z',        // Free+
  job_routing: 'NmdnNO90',        // Elite+
  weather_tool: 'L9nbKV9Z',       // Free+
  ai_resume: 'zWZD0rQp',          // Starter/Founders+ (limited)
  readiness_guides: 'L9nbKV9Z',   // Free+
  tools_templates: 'rQVqlLm6',    // Pro+

  // Monetization / partners
  sponsor_equipment_links: 'L9nbKV9Z', // Everyone sees
  partner_portal: 'rmk5Xk9g',          // Agency only
  elite_autoassign: 'NmdnNO90',        // Elite+

  // API / vendor feeds
  autoassign_api: 'NmdnNO90',          // Elite+
  agency_directory: 'rmk5Xk9g',        // Agency only
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<JwtPayload | null>(null)
  const [planUid, setPlanUid] = useState<string | null>(null)
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null)
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const hasInitialized = useRef(false)

  const persistProfileDisplayName = useCallback((name: string | null) => {
    const safeName = name?.trim() || null
    setProfileDisplayName(safeName)

    if (typeof window === 'undefined') return

    if (safeName) {
      window.localStorage.setItem('profileDisplayName', safeName)
    } else {
      window.localStorage.removeItem('profileDisplayName')
    }
  }, [])

  const persistProfileAvatarUrl = useCallback((url: string | null) => {
    const safeUrl = url?.trim() || null
    setProfileAvatarUrl(safeUrl)

    if (typeof window === 'undefined') return

    if (safeUrl) {
      window.localStorage.setItem('profileAvatarUrl', safeUrl)
    } else {
      window.localStorage.removeItem('profileAvatarUrl')
    }
  }, [])

  // Hydrate any cached profile name once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const cachedName = window.localStorage.getItem('profileDisplayName')
      if (cachedName) {
        setProfileDisplayName(cachedName)
      }

      const cachedAvatar = window.localStorage.getItem('profileAvatarUrl')
      if (cachedAvatar) {
        setProfileAvatarUrl(cachedAvatar)
      }
    } catch {
      // ignore localStorage issues
    }
  }, [])

  /* ── Core auth loader ─────────────────────────────────
   * This is extracted so it can be called:
   *  1. On initial mount
   *  2. After callback sets the cookie
   *  3. After Outseta widget login
   *  4. Exposed as refreshAuth() for any component that needs it
   * ──────────────────────────────────────────────────── */
  const loadUser = useCallback(async (opts?: { retry?: boolean }) => {
    try {
      const res = await fetch('/api/auth/session')

      if (res.ok) {
        const data = await res.json()

        if (data.user) {
          setUser(data.user)
          setPlanUid(data.user['outseta:planUid'] ?? null)
          setAccessToken(null) // httpOnly cookie manages the token
          setIsAuthenticated(true)

          // Derive display name if missing
          try {
            const cachedName = window.localStorage.getItem('profileDisplayName')
            if (!cachedName) {
              persistProfileDisplayName(deriveDisplayName(data.user))
            }
          } catch {
            persistProfileDisplayName(deriveDisplayName(data.user))
          }
          return true
        }
      }

      // If we're retrying (e.g. right after login redirect), give the cookie
      // a moment to settle and try once more before giving up
      if (opts?.retry) {
        await new Promise((r) => setTimeout(r, 600))
        const retryRes = await fetch('/api/auth/session')
        if (retryRes.ok) {
          const retryData = await retryRes.json()
          if (retryData.user) {
            setUser(retryData.user)
            setPlanUid(retryData.user['outseta:planUid'] ?? null)
            setAccessToken(null)
            setIsAuthenticated(true)
            persistProfileDisplayName(deriveDisplayName(retryData.user))
            return true
          }
        }
      }

      // No valid session
      setUser(null)
      setPlanUid(null)
      setIsAuthenticated(false)
      return false
    } catch (error) {
      console.error('Error loading session', error)
      setUser(null)
      setPlanUid(null)
      setIsAuthenticated(false)
      return false
    }
  }, [persistProfileDisplayName])

  // Initial auth load on mount
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const init = async () => {
      // Check if we just came from a login redirect (callback page sets this)
      const justLoggedIn = typeof window !== 'undefined' &&
        (window.location.search.includes('access_token') ||
          sessionStorage.getItem('outseta_just_logged_in') === '1')

      await loadUser({ retry: justLoggedIn })

      // Clean up the signal
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('outseta_just_logged_in')
      }

      setIsLoading(false)
    }

    init()
  }, [loadUser])

  // Handle access_token in URL (Outseta redirect flow on non-callback pages)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!pathname || pathname.startsWith('/auth/callback')) return

    const url = new URL(window.location.href)
    const token = url.searchParams.get('access_token')

    if (!token) return

    const syncSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token }),
        })

        if (response.ok) {
          if (window.Outseta?.setAccessToken) {
            window.Outseta.setAccessToken(token)
          }
          // Reload user state now that cookie is set
          await loadUser({ retry: true })
        }
      } catch (error) {
        console.error('Error syncing session token', error)
      } finally {
        url.searchParams.delete('access_token')
        const cleanedSearch = url.searchParams.toString()
        const cleanedUrl = `${url.pathname}${cleanedSearch ? `?${cleanedSearch}` : ''}${url.hash}`
        window.history.replaceState({}, '', cleanedUrl)
      }
    }

    void syncSession()
  }, [pathname, loadUser])

  /* ── Outseta widget event listener ────────────────────
   * When a user logs in via the Outseta popup (not the callback page),
   * Outseta fires a custom event. We listen for it and sync the session.
   * This eliminates the "have to refresh" problem for popup-based logins.
   * ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return

    let disposed = false

    const handleOutsetaAuth = async () => {
      // Small delay — Outseta needs a tick to update its internal state
      await new Promise((r) => setTimeout(r, 300))

      const token = window.Outseta?.getAccessToken?.()
      if (!token) return

      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token }),
        })
        if (res.ok) {
          await loadUser({ retry: true })
        }
      } catch (err) {
        console.error('Error syncing Outseta widget login', err)
      }
    }

    // Outseta fires 'o-authenticated' when login/signup completes in the widget
    window.addEventListener('o-authenticated', handleOutsetaAuth)

    const syncExistingOutsetaToken = async () => {
      // The verified cookie is authoritative. Never race the initial session load
      // or let a stale effect restore a previous browser account over a fresh login.
      if (disposed || isLoading || isAuthenticated) return
      if (window.Outseta?.getAccessToken) {
        const existingToken = window.Outseta.getAccessToken()
        if (existingToken) {
          try {
            const res = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: existingToken }),
            })
            if (res.ok && !disposed) {
              await loadUser({ retry: true })
            }
          } catch (err) {
            console.error('Error syncing existing Outseta token', err)
          }
        }
      }
    }

    // Also handle the case where Outseta already has a token on page load
    // (e.g. returning user with tokenStorage: 'local') but our httpOnly cookie is missing
    // Keep the timer cancelable when the cookie check completes or the effect unmounts.
    const existingTokenTimer = window.setTimeout(() => {
      void syncExistingOutsetaToken()
    }, 1500)

    const handleOutsetaReady = () => {
      void syncExistingOutsetaToken()
    }

    window.addEventListener('outseta-ready', handleOutsetaReady)

    return () => {
      disposed = true
      window.clearTimeout(existingTokenTimer)
      window.removeEventListener('o-authenticated', handleOutsetaAuth)
      window.removeEventListener('outseta-ready', handleOutsetaReady)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, loadUser])

  const fetchProfileDisplayName = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
    if (!isAuthenticated || !user) return

    const userEmail =
      (user?.email as string | undefined) ??
      (user?.Email as string | undefined) ??
      null

    if (!userEmail) return

    try {
      const encodedEmail = encodeURIComponent(userEmail)
      const url =
        `${SUPABASE_URL}/rest/v1/profiles` +
        `?user_email=eq.${encodedEmail}` +
        `&select=display_name,avatar_url`

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })

      if (!res.ok) {
        // Fall back to derived name if Supabase doesn't have one yet
        persistProfileDisplayName(deriveDisplayName(user))
        return
      }

      const rows = (await res.json()) as { display_name: string | null; avatar_url: string | null }[]
      const row = rows[0]
      const nameFromDb = row?.display_name?.trim() || null
      const avatarFromDb = row?.avatar_url?.trim() || null

      if (nameFromDb) {
        persistProfileDisplayName(nameFromDb)
      } else {
        persistProfileDisplayName(deriveDisplayName(user))
      }

      if (avatarFromDb) {
        persistProfileAvatarUrl(avatarFromDb)
      }
    } catch (error) {
      console.error('Error loading profile display name', error)
      persistProfileDisplayName(deriveDisplayName(user))
    }
  }, [isAuthenticated, persistProfileAvatarUrl, persistProfileDisplayName, user])

  // hydrate profile name from Supabase once auth is ready
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void fetchProfileDisplayName()
    }
  }, [fetchProfileDisplayName, isAuthenticated, isLoading])

  const hasAccess = (feature?: string) => {
    if (!isAuthenticated) return false
    if (!feature) return true

    const minPlan = FEATURE_MIN_PLAN[feature]
    // Default to "deny" for unknown features so new feature flags are opt-in secure
    if (minPlan === undefined) return false
    if (minPlan === null) return true
    if (!planUid) return false

    const currentIndex = PLAN_ORDER.indexOf(planUid as PlanUid)
    const requiredIndex = PLAN_ORDER.indexOf(minPlan)

    if (currentIndex === -1 || requiredIndex === -1) return false
    return currentIndex >= requiredIndex
  }

  const login = () => {
    if (typeof window === 'undefined') return
    const Outseta = window.Outseta

    try {
      trackOutsetaModalOpen({
        sourcePage: pathname ?? 'unknown',
        mode: 'login',
      })

      if (Outseta?.auth?.open) {
        Outseta.auth.open({ widgetMode: 'login' })
      } else {
        window.location.href =
          'https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous'
      }
    } catch (error) {
      console.error('Error opening Outseta login', error)
    }
  }

  const signup = () => {
    if (typeof window === 'undefined') return
    const Outseta = window.Outseta

    try {
      trackOutsetaModalOpen({
        sourcePage: pathname ?? 'unknown',
        mode: 'register',
      })

      if (Outseta?.auth?.open) {
        Outseta.auth.open({ widgetMode: 'register' })
      } else {
        window.location.href =
          'https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous'
      }
    } catch (error) {
      console.error('Error opening Outseta signup', error)
    }
  }

  const logout = async () => {
    try {
      // Clear server session (httpOnly cookie)
      await fetch('/api/auth/session', { method: 'DELETE' })

      if (typeof window !== 'undefined') {
        const Outseta = window.Outseta
        if (Outseta?.setAccessToken) {
          Outseta.setAccessToken(null)
        }
        // Clear cached profile data
        localStorage.removeItem('profileDisplayName')
        localStorage.removeItem('profileAvatarUrl')
      }

      setUser(null)
      setPlanUid(null)
      setAccessToken(null)
      setIsAuthenticated(false)
      setProfileDisplayName(null)
      setProfileAvatarUrl(null)
    } catch (error) {
      console.error('Error during logout', error)
    }

    window.location.href = '/'
  }

  const value: AuthContextValue = {
    user,
    planUid,
    profileDisplayName,
    profileAvatarUrl,
    accessToken,
    isAuthenticated,
    isLoading,
    hasAccess,
    login,
    signup,
    logout,
    refreshAuth: () => loadUser({ retry: true }).then(() => { }),
    refreshProfileDisplayName: fetchProfileDisplayName,
    updateProfileDisplayName: (name: string | null) =>
      persistProfileDisplayName(name || null),
    updateProfileAvatarUrl: (url: string | null) =>
      persistProfileAvatarUrl(url || null),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

declare global {
  interface Window {
    Outseta: any
  }
}
