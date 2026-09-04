import { PLAN_UIDS } from './plan-config'

export const MEMBER_TOOL_IDS = {
  INCOME_SCENARIO: 'income_scenario',
  CLIENT_WORKSPACE: 'client_workspace',
  COMPANY_TRACKER: 'company_tracker',
  AI_CONCIERGE: 'ai_concierge',
  AI_RESUME: 'ai_resume',
  JOB_TRACKER: 'job_tracker',
  WEATHER: 'weather',
  ROUTING: 'routing',
  ROUTE_ECONOMICS: 'route_economics',
} as const

export type MemberToolId = (typeof MEMBER_TOOL_IDS)[keyof typeof MEMBER_TOOL_IDS]

export const MEMBER_TOOL_PATHS: Record<MemberToolId, string> = {
  [MEMBER_TOOL_IDS.INCOME_SCENARIO]: '/tools/income-calculator',
  [MEMBER_TOOL_IDS.CLIENT_WORKSPACE]: '/tools/clients',
  [MEMBER_TOOL_IDS.COMPANY_TRACKER]: '/tools/companies',
  [MEMBER_TOOL_IDS.AI_CONCIERGE]: '/tools/ai-concierge',
  [MEMBER_TOOL_IDS.AI_RESUME]: '/tools/ai-resume',
  [MEMBER_TOOL_IDS.JOB_TRACKER]: '/tools/job-tracker',
  [MEMBER_TOOL_IDS.WEATHER]: '/tools/weather',
  [MEMBER_TOOL_IDS.ROUTING]: '/tools/routing',
  [MEMBER_TOOL_IDS.ROUTE_ECONOMICS]: '/tools/notary-route-calculator',
}

export const ENABLED_MEMBER_TOOL_PATHS = Object.freeze(
  [...Object.values(MEMBER_TOOL_PATHS), '/tools/job-tracking'],
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
  // Starter and Founders are paid legacy plans. Preserve the tools promised
  // to those members while keeping the current public Free plan calculator-only.
  [MEMBER_TOOL_IDS.CLIENT_WORKSPACE]: [
    PLAN_UIDS.STARTER,
    PLAN_UIDS.FOUNDERS,
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
  ],
  [MEMBER_TOOL_IDS.COMPANY_TRACKER]: [
    PLAN_UIDS.STARTER,
    PLAN_UIDS.FOUNDERS,
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
  ],
  [MEMBER_TOOL_IDS.AI_CONCIERGE]: [
    PLAN_UIDS.STARTER,
    PLAN_UIDS.FOUNDERS,
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
  ],
  [MEMBER_TOOL_IDS.AI_RESUME]: [
    PLAN_UIDS.STARTER,
    PLAN_UIDS.FOUNDERS,
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
  ],
  [MEMBER_TOOL_IDS.JOB_TRACKER]: [
    PLAN_UIDS.STARTER,
    PLAN_UIDS.FOUNDERS,
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
  ],
  [MEMBER_TOOL_IDS.WEATHER]: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  [MEMBER_TOOL_IDS.ROUTING]: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
  [MEMBER_TOOL_IDS.ROUTE_ECONOMICS]: [PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
}

/**
 * Allow only catalogued member-tool routes. Matching is deliberately exact;
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
