'use client'

import { ReactNode } from 'react'
import { useAuth } from './auth-provider'

interface GateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}

export function Gate({ feature, children, fallback, loadingFallback }: GateProps) {
  const { hasAccess, isLoading, isAuthenticated, login, signup } = useAuth()

  // Show loading state
  if (isLoading) {
    return loadingFallback || (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  // User is not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div style={{ 
        padding: '3rem 2rem', 
        textAlign: 'center',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        margin: '2rem 0'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Authentication Required</h2>
        <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
          Please log in to access this feature.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={login}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Log In
          </button>
          <button
            onClick={signup}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    )
  }

  // User is authenticated but lacks access
  if (!hasAccess(feature)) {
    return fallback || (
      <div style={{ 
        padding: '3rem 2rem', 
        textAlign: 'center',
        border: '2px solid #fbbf24',
        borderRadius: '8px',
        margin: '2rem 0',
        backgroundColor: '#fffbeb'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Upgrade Required</h2>
        <p style={{ marginBottom: '2rem', color: '#92400e' }}>
          This feature is not available on your current plan.
        </p>
        <a
          href="/upgrade"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f59e0b',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '500'
          }}
        >
          View Plans
        </a>
      </div>
    )
  }

  // User has access - render children
  return <>{children}</>
}