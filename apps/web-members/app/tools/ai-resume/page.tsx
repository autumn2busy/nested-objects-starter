'use client'
import { Gate } from '@/components/Gate'

export default function AIResumePage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        AI Resume Builder
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Create professional, ATS-optimized resumes tailored for field service positions using AI assistance.
      </p>
      <Gate feature="ai_chatbot">
        <p>
          This is where your AI resume builder will live. For now, consider this a placeholder
          so routing and SEO can see it.
        </p>
      </Gate>
    </main>
  )
}
