import { MEMBER_TOOL_IDS } from '@/lib/member-tool-access'

import { MemberToolPageAccess } from '../_components/MemberToolPageAccess'
import { RoutePlanner } from './RoutePlanner'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function RoutingPage() {
  return (
    <MemberToolPageAccess tool={MEMBER_TOOL_IDS.ROUTING} title="Route planner">
      <RoutePlanner />
    </MemberToolPageAccess>
  )
}
