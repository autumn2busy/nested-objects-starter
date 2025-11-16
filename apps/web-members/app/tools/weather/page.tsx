'use client'
import { Gate } from '@/components/Gate'

export default function WeatherPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Weather Conditions Tool
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Check real-time weather conditions for your inspection sites and plan your schedule accordingly.
      </p>
      <Gate feature="directory_access">
        <p>
          This is where your weather tool will live. For now, consider this a placeholder
          so routing and SEO can see it.
        </p>
      </Gate>
    </main>
  )
}
