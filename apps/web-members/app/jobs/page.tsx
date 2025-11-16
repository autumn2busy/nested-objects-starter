'use client'
import { Gate } from '@/components/Gate'

export default function JobsPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Weekly Field Inspection Job Board
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        New opportunities for mortgage field inspections, occupancy checks, and property data collection.
      </p>
      <Gate feature="directory_access">
        <p>
          This is where your job board UI will live. For now, consider this a placeholder
          so routing and SEO can see it.
        </p>
      </Gate>
    </main>
  )
}
