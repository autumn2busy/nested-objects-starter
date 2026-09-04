import { MEMBER_TOOL_IDS } from '@/lib/member-tool-access'

import { MemberToolPageAccess } from '../_components/MemberToolPageAccess'
import { ClientWorkspace } from './ClientWorkspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ClientsPage() {
  return (
    <MemberToolPageAccess tool={MEMBER_TOOL_IDS.CLIENT_WORKSPACE} title="Client and vendor workspace">
      <ClientWorkspace />
    </MemberToolPageAccess>
  )
}
