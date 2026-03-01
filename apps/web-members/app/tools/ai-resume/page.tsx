import Link from 'next/link'
import ResumeBuilder from '@/components/tools/ResumeBuilder'
import { Gate } from '@/components/Gate'

export default function AiResumePage() {
  return (
    <div className="container py-8">
      <Link href="/tools" className="text-sm text-slate-500 hover:text-slate-900 mb-6 inline-block">
        ← Back to Tools
      </Link>
      <Gate feature="ai_resume">
        <ResumeBuilder />
      </Gate>
    </div>
  )
}
