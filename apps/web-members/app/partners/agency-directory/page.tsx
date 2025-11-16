'use client'
import { Gate } from '@/components/Gate'

export default function AgencyDirectoryPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Agency Partner Directory
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Connect with vetted agencies looking to hire field professionals. Exclusive access for agency-tier members.
      </p>
      <Gate feature="white_label">
        <p>
          This is where your agency-facing directory will live. For now, consider this a placeholder
          so routing and SEO can see it.
        </p>
      </Gate>
    </main>
  )
}
