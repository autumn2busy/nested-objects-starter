import { PLAN_UIDS } from './plan-config'

export const MEMBER_TOOL_IDS = {
  INCOME_SCENARIO: 'income_scenario',
  ROUTE_ECONOMICS: 'route_economics',
} as const

export type MemberToolId = (typeof MEMBER_TOOL_IDS)[keyof typeof MEMBER_TOOL_IDS]

export const MEMBER_TOOL_PATHS: Record<MemberToolId, string> = {
  [MEMBER_TOOL_IDS.INCOME_SCENARIO]: '/tools/income-calculator',
  [MEMBER_TOOL_IDS.ROUTE_ECONOMICS]: '/tools/notary-route-calculator',
}

export const ENABLED_MEMBER_TOOL_PATHS = Object.freeze(
  Object.values(MEMBER_TOOL_PATHS),
)

export const KNOWN_MEMBER_PLAN_UIDS = Object.freeze([
  PLAN_UIDS.FREE,
  PLAN_UIDS.STARTER,
  PLAN_UIDS.PRO,
  PLAN_UIDS.ELITE,
  PLAN_UIDS.AGENCY,
  PLAN_UIDS.FOUNDERS,
])

const TOOL_PLAN_ACCESS: Record<MemberToolId, readonly string[]> = {
  [MEMBER_TOOL_IDS.INCOME_SCENARIO]: KNOWN_MEMBER_PLAN_UIDS,
  [MEMBER_TOOL_IDS.ROUTE_ECONOMICS]: [PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
}

/**
 * Allow only the two reviewed calculator routes. Matching is deliberately exact;
 * the only accepted variant is a single trailing slash.
 */
export function isEnabledMemberToolPath(pathname: string): boolean {
  return ENABLED_MEMBER_TOOL_PATHS.some(
    (allowedPath) => pathname === allowedPath || pathname === `${allowedPath}/`,
  )
}

/**
 * Return a reviewed plan decision for a supported tool. Missing and unknown
 * plans/tools always fail closed.
 */
export function canAccessMemberTool(
  planUid: string | null | undefined,
  tool: MemberToolId,
): boolean {
  if (!planUid) return false

  const allowedPlans = TOOL_PLAN_ACCESS[tool]
  return Boolean(allowedPlans?.includes(planUid))
}
