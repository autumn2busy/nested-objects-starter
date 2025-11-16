'use client'
import { Gate } from '@/components/Gate'

export default function BasicTrainingPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Basic Training Track
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Essential skills and knowledge for field service professionals. Learn the fundamentals of property inspection, documentation, and client communication.
      </p>
      <Gate feature="directory_access">
        <p>
          This is where your basic training content will live. For now, consider this a placeholder
          so routing and SEO can see it.
        </p>
      </Gate>
    </main>
  )
}
