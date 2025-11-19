'use client'

import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { hasFeatureAccess } from '@/lib/auth-helpers'

interface GateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}

const buttonStyle: CSSProperties = {
  padding: '0.65rem 1.1rem',
  borderRadius: '10px',
  border: '1px solid #1d4ed8',
  backgroundColor: '#1d4ed8',
  color: 'white',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
}

const outlineButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: 'white',
  color: '#1d4ed8',
}

export function Gate({ feature, children, fallback, loadingFallback }: GateProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      loadingFallback || (
        <div
          style={{
            width: '100%',
            minHeight: '96px',
            borderRadius: '12px',
            backgroundColor: '#f3f4f6',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        ></div>
      )
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

  const loginUrl = 'https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous'
  const signupUrl =
    'https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous'

  // Default fallback: Upsell UI
  return (
    <div
      style={{
        border: '1px dashed #d1d5db',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#f9fafb',
      }}
    >
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
        Premium Feature Locked
      </h3>
      <p
        style={{
          color: '#6b7280',
          marginTop: '0.5rem',
          marginBottom: '1.25rem',
          maxWidth: '520px',
          lineHeight: 1.5,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        The {feature.replace(/-/g, ' ')} feature is available on our Pro and Elite plans. Upgrade
        your membership to access this tool.
      </p>

      {!isAuthenticated ? (
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <a href={loginUrl} style={outlineButtonStyle}>
            Log In
          </a>
          <a href={signupUrl} style={buttonStyle}>
            Sign Up
          </a>
        </div>
      ) : (
        <Link href="/upgrade" style={buttonStyle}>
          View Upgrade Options
        </Link>
      )}
    </div>
  )
}
