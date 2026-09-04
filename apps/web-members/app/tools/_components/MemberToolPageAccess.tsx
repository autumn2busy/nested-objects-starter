import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { getCurrentUser } from '@/lib/auth-server'
import { canAccessMemberTool, type MemberToolId } from '@/lib/member-tool-access'

import { ToolAccessMessage } from './ToolAccessMessage'

const OUTSETA_LOGIN_URL = 'https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous'

type MemberToolPageAccessProps = {
  tool: MemberToolId
  title: string
  children: ReactNode
}

/**
 * Server-authoritative tool gate. Client cards and middleware improve the user
 * journey, but neither is trusted to grant a plan entitlement.
 */
export async function MemberToolPageAccess({ tool, title, children }: MemberToolPageAccessProps) {
  const user = await getCurrentUser()
  if (!user) redirect(OUTSETA_LOGIN_URL)

  if (!canAccessMemberTool(user['outseta:planUid'], tool)) {
    return (
      <div className="mx-auto min-h-[70vh] max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <ToolAccessMessage
          tone="warning"
          title={`${title} is not included with this plan`}
          description="Free members can use the income scenario planner. Pro includes the core member toolset, and Elite includes every member tool."
          actions={(
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full border border-brand-copper/40 px-4 py-2 text-sm font-semibold" href="/membership-pricing">
                Compare plans
              </Link>
              <Link className="rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white" href="/tools">
                Back to tools
              </Link>
            </div>
          )}
        />
      </div>
    )
  }

  return <>{children}</>
}
