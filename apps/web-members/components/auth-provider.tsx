'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

type JwtPayload = {
  email?: string
  name?: string
  [key: string]: any
}

type AuthContextValue = {
  user: JwtPayload | null
  planUid: string | null
  profileDisplayName: string | null
  isAuthenticated: boolean
  isLoading: boolean
  hasAccess: (feature?: string) => boolean
  login: () => void
  signup: () => void
  logout: () => void
  refreshProfileDisplayName: () => Promise<void>
  updateProfileDisplayName: (name: string | null) => void
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

// Plan ordering. Starter < Pro < Elite < Agency
const PLAN_ORDER = ['L9nbKV9Z', 'rQVqlLm6', 'NmdnNO90', 'rmk5Xk9g'] as const
type PlanUid = (typeof PLAN_ORDER)[number]

// Minimum plan required for each feature
const FEATURE_MIN_PLAN: Record<string, PlanUid | null> = {
  // Core app
  directory_access: 'L9nbKV9Z',   // Starter+
  job_board: 'L9nbKV9Z',          // Starter+, with limits by plan later

  // Training
  basic_training: 'L9nbKV9Z',     // Starter+
  advanced_training: 'NmdnNO90',  // Elite+

  // Tools
  ai_concierge: 'rQVqlLm6',       // Pro+
  firm_intel: 'rQVqlLm6',         // Pro+
  job_tracking: 'rQVqlLm6',       // Pro+
  job_routing: 'NmdnNO90',        // Elite+
  weather_tool: 'L9nbKV9Z',       // Starter+
  ai_resume: 'rQVqlLm6',          // Pro+

  // Monetization / partners
  sponsor_equipment_links: 'L9nbKV9Z', // Everyone sees, sponsors pay
  partner_portal: 'rmk5Xk9g',          // Agency only
  elite_autoassign: 'NmdnNO90',        // Elite vetted pool

  // API style auto assign for vendor feeds like WeGoLook
  autoassign_api: 'NmdnNO90',          // Elite (supply side)
  agency_directory: 'rmk5Xk9g',        // Agency facing view
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null)
  const [planUid, setPlanUid] = useState<string | null>(null)
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const persistProfileDisplayName = useCallback((name: string | null) => {
    setProfileDisplayName(name || null)

    if (typeof window === 'undefined') return

    if (name) {
      window.localStorage.setItem('profileDisplayName', name)
    } else {
      window.localStorage.removeItem('profileDisplayName')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const cachedName = window.localStorage.getItem('profileDisplayName')
    if (cachedName) {
      setProfileDisplayName(cachedName)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadUser = async () => {
      try {
        if (typeof window === 'undefined') {
          if (!cancelled) setIsLoading(false)
          return
        }

        const Outseta = window.Outseta
        if (!Outseta?.getJwtPayload) {
          if (!cancelled) setIsLoading(false)
          return
        }

        const payload = await Outseta.getJwtPayload()

        if (cancelled) return

        if (payload) {
          setUser(payload)
          setPlanUid(payload['outseta:planUid'] ?? null)
          setIsAuthenticated(true)
          if (!profileDisplayName) {
            persistProfileDisplayName(deriveDisplayName(payload))
          }
        } else {
          setUser(null)
          setPlanUid(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error loading auth state from Outseta', error)
        if (!cancelled) {
          setUser(null)
          setPlanUid(null)
          setIsAuthenticated(false)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadUser()

    return () => {
      cancelled = true
    }
  }, [profileDisplayName, persistProfileDisplayName])

  const loadProfileDisplayName = useCallback(async () => {
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
        `&select=display_name`

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })

      if (!res.ok) {
        persistProfileDisplayName(deriveDisplayName(user))
        return
      }

      const rows = (await res.json()) as { display_name: string | null }[]
      const row = rows[0]
      persistProfileDisplayName(row?.display_name || deriveDisplayName(user))
    } catch (error) {
      console.error('Error loading profile display name', error)
      persistProfileDisplayName(deriveDisplayName(user))
    }
  }, [isAuthenticated, persistProfileDisplayName, user])

  useEffect(() => {
    let cancelled = false

    const hydrateProfileName = async () => {
      await loadProfileDisplayName()
      if (cancelled) return
    }

    if (!isLoading && isAuthenticated) {
      hydrateProfileName()
    }

    if (!isAuthenticated) {
      persistProfileDisplayName(null)
    }

    return () => {
      cancelled = true
    }
  }, [isLoading, isAuthenticated, loadProfileDisplayName, persistProfileDisplayName])

  const refreshProfileDisplayName = useCallback(async () => {
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
        `&select=display_name`

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })

      if (!res.ok) {
        persistProfileDisplayName(null)
        return
      }

      const rows = (await res.json()) as { display_name: string | null }[]
      const row = rows[0]
      persistProfileDisplayName(row?.display_name || null)
    } catch (error) {
      console.error('Error loading profile display name', error)
      persistProfileDisplayName(null)
    }
  }, [isAuthenticated, persistProfileDisplayName, user])

  useEffect(() => {
    let cancelled = false

    const hydrateProfileName = async () => {
      await refreshProfileDisplayName()
      if (cancelled) return
    }

    if (!isLoading && isAuthenticated) {
      hydrateProfileName()
    }

    if (!isAuthenticated) {
      persistProfileDisplayName(null)
    }

    return () => {
      cancelled = true
    }
  }, [isLoading, isAuthenticated, refreshProfileDisplayName, persistProfileDisplayName])

  const hasAccess = (feature?: string) => {
    if (!isAuthenticated) return false
    if (!feature) return true

    const minPlan = FEATURE_MIN_PLAN[feature]
    if (!minPlan) return true
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

  const logout = () => {
    if (typeof window === 'undefined') return

    try {
      const Outseta = window.Outseta

      if (Outseta?.setAccessToken) {
        Outseta.setAccessToken(null)
      }

      document.cookie =
        'outseta_access_token=; path=/; max-age=0; samesite=lax'

      setUser(null)
      setPlanUid(null)
      persistProfileDisplayName(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Error during logout', error)
    }

    window.location.href = '/'
  }

  const value: AuthContextValue = {
    user,
    planUid,
    profileDisplayName,
    isAuthenticated,
    isLoading,
    hasAccess,
    login,
    signup,
    logout,
    refreshProfileDisplayName: loadProfileDisplayName,
    updateProfileDisplayName: (name: string | null) =>
      persistProfileDisplayName(name || null),
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
