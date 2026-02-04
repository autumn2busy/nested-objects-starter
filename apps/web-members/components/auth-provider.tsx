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
  profileAvatarUrl: string | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  hasAccess: (feature?: string) => boolean
  login: () => void
  signup: () => void
  logout: () => void
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
const PLAN_ORDER = ['L9nbKV9Z', 'zWZD0rQp', 'rQVqlLm6', 'NmdnNO90', 'rmk5Xk9g'] as const
type PlanUid = (typeof PLAN_ORDER)[number]

const DIRECTORY_ONLY_PLAN_UID = 'zWZD0rQp'

// Minimum plan required for each feature
const FEATURE_MIN_PLAN: Record<string, PlanUid | null> = {
  // Core app
  directory_access: 'L9nbKV9Z',   // Starter+
  job_board: 'L9nbKV9Z',          // Starter+, with limits by plan later

  // Training
  basic_training: 'L9nbKV9Z',     // Starter+
  advanced_training: 'NmdnNO90',  // Elite+
  training_safety: 'L9nbKV9Z',    // Starter+ (Safety guides)

  // Tools
  ai_concierge: 'rQVqlLm6',       // Pro+
  firm_intel: 'rQVqlLm6',         // Pro+
  job_tracking: 'L9nbKV9Z',       // Starter+
  job_tracker: 'L9nbKV9Z',        // Starter+
  job_routing: 'NmdnNO90',        // Elite+
  weather_tool: 'L9nbKV9Z',       // Starter+
  ai_resume: 'rQVqlLm6',          // Pro+
  readiness_guides: 'L9nbKV9Z',   // Starter+ (Checklists)
  tools_templates: 'rQVqlLm6',    // Pro+ (AI prompts, etc)

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
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  // Load auth state from server session
  useEffect(() => {
    let cancelled = false

    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/session')

        if (cancelled) return

        if (res.ok) {
          const data = await res.json()

          if (data.user) {
            setUser(data.user)
            setPlanUid(data.user['outseta:planUid'] ?? null)
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
          } else {
            // 401/403 or just null user
            setUser(null)
            setPlanUid(null)
            setIsAuthenticated(false)
          }
        } else {
          setUser(null)
          setPlanUid(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error loading session', error)
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
  }, [persistProfileDisplayName])

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
        // Fall back to derived name if Supabase doesn’t have one yet
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

    if (planUid === DIRECTORY_ONLY_PLAN_UID) {
      return feature === 'directory_access'
    }

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

  const logout = async () => {
    try {
      // Clear server session (httpOnly cookie)
      await fetch('/api/auth/session', { method: 'DELETE' })

      if (typeof window !== 'undefined') {
        const Outseta = window.Outseta
        if (Outseta?.setAccessToken) {
          Outseta.setAccessToken(null)
        }
      }

      setUser(null)
      setPlanUid(null)
      setAccessToken(null)
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
    profileAvatarUrl,
    accessToken,
    isAuthenticated,
    isLoading,
    hasAccess,
    login,
    signup,
    logout,
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
