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
    function handleIdentity(identity: any) {
      const currentUser = identity?.user ?? null
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

    function waitForOutseta(tries = 0) {
      if (typeof window === 'undefined') return

      if (!window.Outseta) {
        if (tries < 80) {
          setTimeout(() => waitForOutseta(tries + 1), 150)
        } else {
          console.warn('Outseta not found on window after waiting')
          setIsLoading(false)
        }
        return
      }

      window.Outseta.on('identityReady', handleIdentity)

      // Pull current identity on first load
      window.Outseta
        .getIdentity()
        .catch((err: any) => {
          console.error('Outseta.getIdentity failed', err)
          setIsLoading(false)
        })
    }

    waitForOutseta()

    return () => {
      if (typeof window !== 'undefined' && window.Outseta) {
        window.Outseta.off('identityReady', handleIdentity)
      }
    }
  }, [])

  const logout = () => {
    if (typeof window !== 'undefined' && window.Outseta) {
      window.Outseta.auth.logout()
      setUser(null)
      setPlanUid(null)
    }
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
