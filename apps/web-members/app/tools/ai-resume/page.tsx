import Link from 'next/link'

import ResumeBuilder from '@/components/tools/ResumeBuilder'
import { MEMBER_TOOL_IDS } from '@/lib/member-tool-access'

import { MemberToolPageAccess } from '../_components/MemberToolPageAccess'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AiResumePage() {
  return (
    <MemberToolPageAccess tool={MEMBER_TOOL_IDS.AI_RESUME} title="AI resume builder">
      <main className="container py-8">
        <Link href="/tools" className="mb-6 inline-block text-sm font-semibold text-brand-copper hover:text-brand-copperDark">
          ← All tools
        </Link>
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          Resume content and uploaded files are sent to the configured AI processing service. Remove sensitive details
          you do not want processed, and review the generated resume before using it.
        </div>
        <ResumeBuilder />
      </main>
    </MemberToolPageAccess>
  )
}
