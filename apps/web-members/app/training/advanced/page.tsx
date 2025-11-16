'use client'
import { Gate } from '@/components/Gate'

export default function AdvancedTrainingPage() {
  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Advanced AI-Driven Training Track
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Master advanced techniques with AI-powered coaching, scenario analysis, and personalized learning paths for experienced professionals.
      </p>
      <Gate feature="ai_chatbot">
        <p>
          This is where your AI-driven advanced training content will live. For now, consider this a placeholder
          so routing and SEO can see it.
        </p>
      </Gate>
    </main>
  )
}
