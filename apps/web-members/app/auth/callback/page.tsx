'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<string>('Processing...')

  useEffect(() => {
    const proceedWithToken = (accessToken: string, redirectTo: string) => {
      console.log('🟢 Processing token...')

      // Store the token in a cookie (accessible by server side code)
      document.cookie = `outseta_access_token=${accessToken}; path=/; max-age=604800; samesite=lax`
      console.log('🟢 Token stored in cookie')

      // Initialize Outseta with the token if it is loaded
      if (window.Outseta) {
        window.Outseta.setAccessToken(accessToken)
        console.log('🟢 Token set in Outseta')
      }

      setStatus('Success! Redirecting...')

      const target = redirectTo || '/dashboard'
      console.log('🟢 Redirecting to:', target)

      // Small delay to ensure cookie and Outseta token are fully set
      setTimeout(() => {
        window.location.href = target
      }, 500)
    }

    const handleCallback = async () => {
      try {
        console.log('🟢 Callback page loaded')
        console.log('🟢 Full URL:', window.location.href)
        console.log('🟢 Search params:', window.location.search)

        // Some Next typings treat this as possibly null, so guard it
        if (!searchParams) {
          setStatus('No search parameters found. Please try logging in again.')
          setTimeout(() => router.push('/'), 3000)
          return
        }

        // Compute redirect target once
        const redirectTo = searchParams.get('redirect') || '/dashboard'

        // Get the access token from URL query params
        const accessToken = searchParams.get('access_token')

        console.log('🟢 Access token found?', !!accessToken)

        if (!accessToken) {
          setStatus('No access token received. Checking Outseta...')

          // Wait a moment for Outseta to load and try to grab token from there
          setTimeout(() => {
            if (window.Outseta) {
              const token = window.Outseta.getAccessToken()
              if (token) {
                console.log('🟢 Got token from Outseta directly')
                proceedWithToken(token, redirectTo)
              } else {
                setStatus('Error: No access token found. Please try logging in again.')
                setTimeout(() => router.push('/'), 3000)
              }
            } else {
              setStatus('Error: Authentication service not available. Please try again.')
              setTimeout(() => router.push('/'), 3000)
            }
          }, 1000)

          return
        }

        // Normal success path
        proceedWithToken(accessToken, redirectTo)
      } catch (err) {
        console.error('🔴 Auth callback error:', err)
        setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setTimeout(() => router.push('/'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div
      style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ marginBottom: '1rem' }}>
        {status.includes('Error') ? '⚠️' : '✓'} Authentication
      </h1>
      <p
        style={{
          fontSize: '1.125rem',
          color: status.includes('Error') ? '#ef4444' : '#6b7280',
        }}
      >
        {status}
      </p>
      {status.includes('Error') && (
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '2rem',
            color: '#3b82f6',
            textDecoration: 'underline',
          }}
        >
          Return to home
        </a>
      )}
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}

declare global {
  interface Window {
    Outseta: any
  }
}
