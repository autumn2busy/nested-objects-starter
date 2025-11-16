'use client'
import { Gate } from '@/components/Gate'

export default function RoutingPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Route Optimization Tool
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Optimize your daily routes, save on gas, and maximize your productivity with intelligent route planning.
      </p>
      <Gate feature="job_intel">
        <p>
          This is where your routing optimization tool will live. For now, consider this a placeholder
          so routing and SEO can see it.
        </p>
      </Gate>
    </main>
  )
}
