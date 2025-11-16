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
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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

        if (!window.Outseta?.getJwtPayload) {
          if (!cancelled) setIsLoading(false)
          return
        }

        // Outseta.getJwtPayload() returns a Promise with the decoded JWT payload
        const payload = await window.Outseta.getJwtPayload()

        if (cancelled) return

        if (payload) {
          // Store the decoded JWT as "user"
          setUser(payload)
          // Plan comes from the custom claim in the token
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

  const logout = () => {
    if (typeof window === 'undefined') return

    try {
      // 1. Tell Outseta there is no token
      if (window.Outseta?.setAccessToken) {
        window.Outseta.setAccessToken(null)
      }

      // 2. Kill the cookie so a fresh load treats the user as anonymous
      document.cookie =
        'outseta_access_token=; path=/; max-age=0; samesite=lax'

      // 3. Immediately reset React state so the UI updates right away
      setUser(null)
      setPlanUid(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Error during logout', error)
    }

    // 4. Hard redirect to home so everything, including any server logic, is in sync
    window.location.href = '/'
  }

  const value: AuthContextValue = {
    user,
    planUid,
    isAuthenticated,
    isLoading,
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
