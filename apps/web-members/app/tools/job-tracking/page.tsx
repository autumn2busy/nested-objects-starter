'use client'
import { Gate } from '@/components/Gate'

export default function JobTrackingPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Job Tracking Tool
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Track your applications, manage deadlines, and monitor your job pipeline all in one place.
      </p>
      <Gate feature="job_intel">
        <p>
          This is where your job tracking tool will live. For now, consider this a placeholder
          so routing and SEO can see it.
        </p>
      </Gate>
    </main>
  )
}
