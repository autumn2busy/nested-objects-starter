'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Outseta user structure from JWT payload
interface OutsetaUser {
  email: string
  name: string
  given_name: string
  family_name: string
  sub: string // user UID
  'outseta:accountUid': string
  'outseta:subscriptionUid': string
  'outseta:planUid': string
  'outseta:addOnUids'?: string[]
}

interface AuthContextType {
  user: OutsetaUser | null
  planUid: string | null
  isLoading: boolean
  isAuthenticated: boolean
  hasAccess: (feature: string) => boolean
  login: () => void
  signup: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Plan UID mapping from your Outseta account
const PLAN_UIDS = {
  STARTER: 'L9nbKV9Z',
  PRO: 'rQVqlLm6',
  ELITE: 'NmdnNO90',
  AGENCY: 'rmk5Xk9g'
}

// Feature access rules based on content groups
const FEATURE_ACCESS: Record<string, string[]> = {
  directory_access: [PLAN_UIDS.STARTER, PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  ai_chatbot: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  job_intel: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  priority_support: [PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  white_label: [PLAN_UIDS.AGENCY]
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OutsetaUser | null>(null)
  const [planUid, setPlanUid] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Wait for Outseta script to load
    const initAuth = () => {
      if (typeof window !== 'undefined' && window.Outseta) {
        // Get the current user from Outseta
        const currentUser = window.Outseta.getUser()
        
        if (currentUser) {
          setUser(currentUser)
          setPlanUid(currentUser['outseta:planUid'] || null)
        }
        
        setIsLoading(false)

        // Listen for auth state changes
        window.Outseta.on('accessToken.set', (data: any) => {
          const payload = data.decodedAccessToken
          if (payload) {
            setUser(payload)
            setPlanUid(payload['outseta:planUid'] || null)
          }
        })

        window.Outseta.on('accessToken.remove', () => {
          setUser(null)
          setPlanUid(null)
        })
      }
    }

    // Check if Outseta is already loaded
    if (window.Outseta) {
      initAuth()
    } else {
      // Wait for Outseta to load
      const checkOutseta = setInterval(() => {
        if (window.Outseta) {
          clearInterval(checkOutseta)
          initAuth()
        }
      }, 100)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkOutseta)
        setIsLoading(false)
      }, 5000)
    }
  }, [])

  const hasAccess = (feature: string): boolean => {
    if (!planUid) return false
    
    const allowedPlans = FEATURE_ACCESS[feature]
    if (!allowedPlans) return false
    
    return allowedPlans.includes(planUid)
  }

  const login = () => {
    if (window.Outseta) {
      window.Outseta.auth.open({
        mode: 'login'
      })
    }
  }

  const signup = () => {
    if (window.Outseta) {
      window.Outseta.auth.open({
        mode: 'register'
      })
    }
  }

const logout = () => {
  console.log('🔴 Logout button clicked')
  console.log('🔴 window.Outseta exists?', !!window.Outseta)
  
  if (window.Outseta) {
    console.log('🔴 Calling Outseta logout')
    try {
      // Correct method: setAccessToken with null
      window.Outseta.setAccessToken(null)
      console.log('🔴 Token cleared, updating state')
      setUser(null)
      setPlanUid(null)
      // Also clear the cookie
      document.cookie = 'outseta_access_token=; path=/; max-age=0'
      console.log('🔴 Logout complete')
    } catch (error) {
      console.error('🔴 Logout failed:', error)
    }
  } else {
    console.error('🔴 Outseta not loaded!')
  }
}

  return (
    <AuthContext.Provider
      value={{
        user,
        planUid,
        isLoading,
        isAuthenticated: !!user,
        hasAccess,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Outseta: any
  }
}
