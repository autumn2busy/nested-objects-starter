'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface OutsetaUser {
  email: string
  name: string
  given_name: string
  family_name: string
  sub: string
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

const PLAN_UIDS = {
  STARTER: 'L9nbKV9Z',
  PRO: 'rQVqlLm6',
  ELITE: 'NmdnNO90',
  AGENCY: 'rmk5Xk9g'
}

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
    const initAuth = async () => {
      if (typeof window !== 'undefined' && window.Outseta) {
        console.log('🟢 Outseta loaded, checking auth state')
        
        try {
          // getUser() is async - we need to await it
          const currentUser = await window.Outseta.getUser()
          
          console.log('🟢 User data:', currentUser)
          
          if (currentUser && currentUser.email) {
            console.log('🟢 User is authenticated:', currentUser.email)
            setUser(currentUser)
            setPlanUid(currentUser['outseta:planUid'] || null)
          } else {
            console.log('🟡 No authenticated user')
            setUser(null)
            setPlanUid(null)
          }
        } catch (error) {
          console.error('🔴 Error getting user:', error)
          setUser(null)
          setPlanUid(null)
        }
        
        setIsLoading(false)

        // Listen for auth state changes
        window.Outseta.on('accessToken.set', async (data: any) => {
          console.log('🟢 Token set event:', data)
          const payload = data.decodedAccessToken
          if (payload) {
            setUser(payload)
            setPlanUid(payload['outseta:planUid'] || null)
          }
        })

        window.Outseta.on('accessToken.remove', () => {
          console.log('🟢 Token removed event')
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
      let attempts = 0
      const checkOutseta = setInterval(() => {
        attempts++
        console.log(`⏳ Waiting for Outseta... (attempt ${attempts})`)
        
        if (window.Outseta) {
          clearInterval(checkOutseta)
          console.log('✅ Outseta loaded!')
          initAuth()
        }
        
        if (attempts > 50) {
          clearInterval(checkOutseta)
          console.error('❌ Outseta failed to load after 5 seconds')
          setIsLoading(false)
        }
      }, 100)
    }
  }, [])

  const hasAccess = (feature: string): boolean => {
    if (!planUid) return false
    const allowedPlans = FEATURE_ACCESS[feature]
    if (!allowedPlans) return false
    return allowedPlans.includes(planUid)
  }

  const login = () => {
    console.log('🔵 Login clicked')
    if (window.Outseta) {
      window.Outseta.auth.open({ mode: 'login' })
    }
  }

  const signup = () => {
    console.log('🔵 Signup clicked')
    if (window.Outseta) {
      window.Outseta.auth.open({ mode: 'register' })
    }
  }

  const logout = () => {
    console.log('🔴 Logout clicked')
    if (window.Outseta) {
      try {
        window.Outseta.setAccessToken(null)
        setUser(null)
        setPlanUid(null)
        document.cookie = 'outseta_access_token=; path=/; max-age=0'
        console.log('🔴 Logout complete')
      } catch (error) {
        console.error('🔴 Logout error:', error)
      }
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

declare global {
  interface Window {
    Outseta: any
  }
}
