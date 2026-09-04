import { MEMBER_TOOL_IDS } from '@/lib/member-tool-access'

import { MemberToolPageAccess } from '../_components/MemberToolPageAccess'
import { CompanyTracker } from './CompanyTracker'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function CompaniesPage() {
  return (
    <MemberToolPageAccess tool={MEMBER_TOOL_IDS.COMPANY_TRACKER} title="Company tracker">
      <CompanyTracker />
    </MemberToolPageAccess>
  )
}
