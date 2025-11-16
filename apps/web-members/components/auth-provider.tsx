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
  // used by <Gate>
  hasAccess: (feature?: string) => boolean
  login: () => void
  signup: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null)
  const [planUid, setPlanUid] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load auth state from Outseta on first mount
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

        // Prefer the decoded JWT payload
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

  // Very simple gating for now. any authenticated user passes
  // You can expand this later based on planUid and feature name
  const hasAccess = (_feature?: string) => {
    return isAuthenticated
  }

  const login = () => {
    if (typeof window === 'undefined') return
    const Outseta = window.Outseta

    try {
      if (Outseta?.auth?.open) {
        Outseta.auth.open({ widgetMode: 'login' })
      } else {
        // Fallback to hosted page if embed is not ready
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
        // Fallback to hosted page if embed is not ready
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

      // 1. Tell Outseta there is no token
      if (Outseta?.setAccessToken) {
        Outseta.setAccessToken(null)
      }

      // 2. Kill our cookie so a fresh load treats the user as anonymous
      document.cookie =
        'outseta_access_token=; path=/; max-age=0; samesite=lax'

      // 3. Immediately reset React state so the UI updates right away
      setUser(null)
      setPlanUid(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Error during logout', error)
    }

    // 4. Hard redirect to home so everything is in sync
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
