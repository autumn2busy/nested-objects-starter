import { redirect } from 'next/navigation'

import { MEMBER_TOOL_IDS } from '@/lib/member-tool-access'

import { MemberToolPageAccess } from '../_components/MemberToolPageAccess'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function OpenJobTracker(): never {
  return redirect('/jobs?tab=tracker')
}

export default function JobTrackerPage() {
  return (
    <MemberToolPageAccess tool={MEMBER_TOOL_IDS.JOB_TRACKER} title="Job tracker">
      <OpenJobTracker />
    </MemberToolPageAccess>
  )
}
