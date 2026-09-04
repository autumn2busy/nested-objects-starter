import { MEMBER_TOOL_IDS } from '@/lib/member-tool-access'

import { MemberToolPageAccess } from '../_components/MemberToolPageAccess'
import { WeatherWorkspace } from './WeatherWorkspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function WeatherPage() {
  return (
    <MemberToolPageAccess tool={MEMBER_TOOL_IDS.WEATHER} title="Field weather">
      <WeatherWorkspace />
    </MemberToolPageAccess>
  )
}
