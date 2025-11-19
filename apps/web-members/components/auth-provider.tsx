'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

declare global {
  interface Window {
    Outseta?: any
  }
}

type AuthContextValue = {
  user: any | null
  isAuthenticated: boolean
  isLoading: boolean
  planUid: string | null
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [planUid, setPlanUid] = useState<string | null>(null)

  useEffect(() => {
    function applyUser(raw: any) {
      // Outseta sometimes passes { user: {...} } and sometimes just the user
      const currentUser = raw?.user ?? raw ?? null
      setUser(currentUser)
      setIsLoading(false)

      if (currentUser?.subscriptions?.length) {
        const active =
          currentUser.subscriptions.find(
            (s: any) => s.status === 'active',
          ) ?? currentUser.subscriptions[0]

        const uid = active?.plan?.Uid ?? null
        setPlanUid(uid)
      } else {
        setPlanUid(null)
      }
    }

    function initOutseta(tries = 0) {
      if (typeof window === 'undefined') return

      const sdk = window.Outseta
      if (!sdk) {
        if (tries < 80) {
          setTimeout(() => initOutseta(tries + 1), 150)
        } else {
          console.warn('Outseta not found on window after waiting')
          setIsLoading(false)
        }
        return
      }

      try {
        // Subscribe to any events the SDK exposes so future changes update state
        if (typeof sdk.on === 'function') {
          try {
            sdk.on('userUpdated', applyUser)
          } catch {
            /* ignore */
          }
          try {
            sdk.on('identityReady', applyUser)
          } catch {
            /* ignore */
          }
        }

        // Initial load. prefer getUser, fall back to getIdentity if present
        if (typeof sdk.getUser === 'function') {
          sdk
            .getUser()
            .then(applyUser)
            .catch((err: any) => {
              console.error('Outseta.getUser failed', err)
              setIsLoading(false)
            })
        } else if (typeof sdk.getIdentity === 'function') {
          sdk
            .getIdentity()
            .then(applyUser)
            .catch((err: any) => {
              console.error('Outseta.getIdentity failed', err)
              setIsLoading(false)
            })
        } else {
          console.warn(
            'Outseta SDK loaded, but no getUser or getIdentity function was found',
          )
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error initializing Outseta auth', err)
        setIsLoading(false)
      }
    }

    initOutseta()

    return () => {
      if (typeof window === 'undefined') return
      const sdk = window.Outseta
      if (!sdk || typeof sdk.off !== 'function') return

      try {
        sdk.off('userUpdated', applyUser)
      } catch {
        /* ignore */
      }
      try {
        sdk.off('identityReady', applyUser)
      } catch {
        /* ignore */
      }
    }
  }, [])

  const logout = () => {
    if (typeof window !== 'undefined' && window.Outseta?.auth?.logout) {
      window.Outseta.auth.logout()
    }
    setUser(null)
    setPlanUid(null)
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    planUid,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
