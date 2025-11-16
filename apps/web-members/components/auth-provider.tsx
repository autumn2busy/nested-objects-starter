'use client'

import React, {
  createContext,
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
  isAuthenticated: boolean
  isLoading: boolean
  hasAccess: (feature?: string) => boolean
  login: () => void
  signup: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Plan ordering. Starter < Pro < Elite < Agency
const PLAN_ORDER = ['L9nbKV9Z', 'rQVqlLm6', 'NmdnNO90', 'rmk5Xk9g'] as const
type PlanUid = (typeof PLAN_ORDER)[number]

// Minimum plan required for each feature
const FEATURE_MIN_PLAN: Record<string, PlanUid | null> = {
  // Core app
  directory_access: 'L9nbKV9Z',   // Starter+
  job_board: 'L9nbKV9Z',          // Starter+

  // Training
  basic_training: 'L9nbKV9Z',     // Starter+
  advanced_training: 'NmdnNO90',  // Elite+

  // Tools
  job_tracking: 'rQVqlLm6',       // Pro+
  job_routing: 'NmdnNO90',        // Elite+
  weather_tool: 'L9nbKV9Z',       // Starter+
  ai_resume: 'rQVqlLm6',          // Pro+
  ai_chatbot: 'rQVqlLm6',       // Elite+

  // Resources
   firm_intel: 'rQVqlLm6',         // Pro+

  // Monetization / partners
  sponsor_equipment_links: 'L9nbKV9Z', // Everyone
  partner_portal: 'rmk5Xk9g',          // Agency only
  elite_autoassign: 'NmdnNO90',        // Elite vetted pool

  // API style auto assign for vendor feeds like WeGoLook
  autoassign_api: 'NmdnNO90',          // Elite
  agency_directory: 'rmk5Xk9g',        // Agency facing view
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null)
  const [planUid, setPlanUid] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
  }, [])

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
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Error during logout', error)
    }

    window.location.href = '/'
  }

  const value: AuthContextValue = {
    user,
    planUid,
    isAuthenticated,
    isLoading,
    hasAccess,
    login,
    signup,
    logout,
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
