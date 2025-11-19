'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const error = params.get('error')

    if (error) {
      console.error('Outseta auth error from callback', error)
    }

    // After Outseta finishes its own login work, send the user to the dashboard
    router.replace('/dashboard')
  }, [router, params])

  return (
    <main
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Finishing your sign in
      </h1>
      <p style={{ fontSize: '0.95rem', color: '#4b5563' }}>
        Sit tight for a second while we connect your Nested Objects account.
      </p>
    </main>
  )
}
