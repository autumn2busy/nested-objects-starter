'use client'
import { Gate } from '@/components/Gate'

export default function AutoAssignPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Auto-Assign Job Matching
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Automatically match available jobs with qualified professionals based on location, skills, and availability.
      </p>
      <Gate feature="white_label">
        <p>
          This is where your auto-assign matching system will live. For now, consider this a placeholder
          so routing and SEO can see it.
        </p>
      </Gate>
    </main>
  )
}
