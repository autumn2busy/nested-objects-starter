'use client'
import { Gate } from '@/components/Gate'

export default function EquipmentSponsorsPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Equipment & Sponsor Partners
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Exclusive discounts on inspection equipment, tools, and supplies from our trusted partner brands.
      </p>
      <Gate feature="directory_access">
        <p>
          This is where your equipment sponsor listings will live. For now, consider this a placeholder
          so routing and SEO can see it.
        </p>
      </Gate>
    </main>
  )
}
