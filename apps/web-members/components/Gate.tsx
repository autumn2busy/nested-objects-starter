'use client'

import { useAuth } from '@/components/auth-provider'
import { hasFeatureAccess } from '@/lib/feature-gate'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface GateProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
}

export function Gate({ feature, children, fallback, loadingFallback }: GateProps) {
  const { user, isLoading, isAuthenticated, login, signup } = useAuth()

  // Show loading state
  if (isLoading) {
    return loadingFallback || (
      <div className="animate-pulse p-4 bg-gray-100 rounded-lg w-full h-24"></div>
    )
  }

  // Check access using the helper function instead of expecting it from useAuth
  const hasAccess = user ? hasFeatureAccess(user, feature) : false

  // If user has access, show content
  if (hasAccess) {
    return <>{children}</>
  }

  // If specific fallback provided, show it
  if (fallback) {
    return <>{fallback}</>
  }

  // Default fallback: Upsell UI
  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Premium Feature Locked
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        The {feature.replace(/-/g, ' ')} feature is available on our Pro and Elite plans. 
        Upgrade your membership to access this tool.
      </p>
      
      {!isAuthenticated ? (
        <div className="flex gap-4 justify-center">
          <Button onClick={() => login()}>Log In</Button>
          <Button variant="outline" onClick={() => signup()}>Sign Up</Button>
        </div>
      ) : (
        <Button asChild>
          <Link href="/upgrade">View Upgrade Options</Link>
        </Button>
      )}
    </div>
  )
}
