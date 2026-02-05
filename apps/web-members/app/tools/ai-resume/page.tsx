import Link from 'next/link'
import ResumeBuilder from '@/components/tools/ResumeBuilder'
import { Gate } from '@/components/Gate'

export default function AiResumePage() {
  return (
    <div className="container py-8">
      <Gate feature="ai_resume">
        <ResumeBuilder />
      </Gate>
    </div>
  )
}
