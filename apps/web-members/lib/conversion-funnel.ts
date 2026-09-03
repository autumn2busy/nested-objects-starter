import { PAID_PLANS } from './plan-config'

export type ConversionEventRow = {
  id: string
  event_name: string
  anonymous_id: string | null
  member_uid: string | null
  member_email: string | null
  plan_uid: string | null
  plan_name: string | null
  source_page: string | null
  source: string | null
  reason: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  occurred_at: string
  event_data: Record<string, unknown> | null
}

type FunnelStageDefinition = {
  key: string
  label: string
  description: string
  eventNames: string[]
}

export const FUNNEL_STAGES: FunnelStageDefinition[] = [
  {
    key: 'signup',
    label: 'Signup recorded',
    description: 'Recorded an account creation signal',
    eventNames: ['signup_completed'],
  },
  {
    key: 'profile',
    label: 'Profile saved',
    description: 'Added enough information to personalize the product',
    eventNames: ['profile_completed'],
  },
  {
    key: 'value',
    label: 'Directory or firm viewed',
    description: 'Recorded a page view; does not establish value received',
    eventNames: ['directory_viewed', 'firm_view'],
  },
  {
    key: 'paywall',
    label: 'Access restriction signal',
    description: 'May fire when a restriction is displayed, without a click',
    eventNames: ['paywall_hit'],
  },
  {
    key: 'pricing',
    label: 'Pricing viewed',
    description: 'Recorded a pricing page view',
    eventNames: ['pricing_view'],
  },
  {
    key: 'intent',
    label: 'Upgrade intent',
    description: 'Clicked a known paid plan or its trial offer',
    eventNames: ['pricing_cta_click', 'upgrade_clicked', 'upgrade_started', 'start_trial'],
  },
  {
    key: 'checkout',
    label: 'Paid checkout attempted',
    description: 'Requested paid registration or plan change; opening is not confirmed',
    eventNames: ['outseta_modal_open'],
  },
  {
    key: 'paid',
    label: 'Paid-plan signal',
    description: 'Unverified plan lifecycle signal; may include trials and does not confirm payment',
    eventNames: ['purchase', 'subscription_created', 'subscription_upgraded'],
  },
]

export type FunnelStageResult = FunnelStageDefinition & {
  count: number
  observedShare: number
}

export type StuckMember = {
  actorKey: string
  email: string
  memberUid: string | null
  latestStageKey: string
  latestStageLabel: string
  latestAt: string
  source: string
  plan: string
  reason: string | null
}

function memberKey(row: ConversionEventRow) {
  if (row.member_uid) return `member:${row.member_uid}`
  if (row.member_email) return `email:${row.member_email.toLowerCase()}`
  return null
}

function getPlan(row: ConversionEventRow) {
  const dataPlan = typeof row.event_data?.plan === 'string' ? row.event_data.plan : null
  return row.plan_name || dataPlan || 'Unknown'
}

function getSource(row: ConversionEventRow) {
  const signupSource = typeof row.event_data?.signup_source === 'string' ? row.event_data.signup_source : null
  return row.source || row.utm_source || signupSource || row.source_page || 'Direct / unknown'
}

const PAID_PLAN_NAMES = new Set(['starter', 'founders', 'pro', 'elite', 'agency'])
const CHECKOUT_MODES = new Set(['register', 'register_redirect', 'profile_plan_change'])

function hasPaidTarget(row: ConversionEventRow) {
  const targetUid = row.event_data?.targetPlanUid
  if (typeof targetUid === 'string') return PAID_PLANS.includes(targetUid)

  const targetPlan = row.event_data?.targetPlan
  return typeof targetPlan === 'string' && PAID_PLAN_NAMES.has(targetPlan.trim().toLowerCase())
}

function stageIndex(row: ConversionEventRow) {
  const index = FUNNEL_STAGES.findIndex((stage) => stage.eventNames.includes(row.event_name))
  const stage = FUNNEL_STAGES[index]
  if (stage?.key === 'intent' && !hasPaidTarget(row)) return -1
  if (stage?.key === 'checkout') {
    const mode = row.event_data?.mode
    if (!hasPaidTarget(row) || typeof mode !== 'string' || !CHECKOUT_MODES.has(mode)) return -1
  }
  return index
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0
}

export function buildConversionFunnel(
  rows: ConversionEventRow[],
  filters: { source?: string; plan?: string } = {},
) {
  const anonymousToMember = new Map<string, string | null>()
  for (const row of rows) {
    const key = memberKey(row)
    if (!key || !row.anonymous_id) continue
    const previous = anonymousToMember.get(row.anonymous_id)
    // Shared browser identifiers cannot safely attribute anonymous actions to
    // either member. Once ambiguous, the identifier stays unstitched.
    anonymousToMember.set(row.anonymous_id, previous === undefined || previous === key ? key : null)
  }

  const actorKey = (row: ConversionEventRow) =>
    memberKey(row) ||
    (row.anonymous_id ? anonymousToMember.get(row.anonymous_id) || `anonymous:${row.anonymous_id}` : `event:${row.id}`)

  const eventsByActor = new Map<string, ConversionEventRow[]>()
  for (const row of rows) {
    const key = actorKey(row)
    const actorEvents = eventsByActor.get(key) || []
    actorEvents.push(row)
    eventsByActor.set(key, actorEvents)
  }

  const cohorts = new Map<string, { signup: ConversionEventRow; events: ConversionEventRow[] }>()
  for (const [key, actorEvents] of eventsByActor) {
    const ordered = [...actorEvents].sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at))
    const signupEvents = ordered.filter((row) => row.event_name === 'signup_completed')
    if (signupEvents.length === 0) continue

    // A recorded webhook can supply signup evidence, while browser events often
    // have better attribution. Neither establishes complete collection coverage.
    const signup = signupEvents.find((row) => {
      const source = getSource(row)
      return source !== 'outseta' && source !== 'Direct / unknown'
    }) || signupEvents[0]

    const source = getSource(signup)
    const plan = getPlan(signup)
    if (filters.source && filters.source !== 'all' && source !== filters.source) continue
    if (filters.plan && filters.plan !== 'all' && plan.toLowerCase() !== filters.plan.toLowerCase()) continue

    const signupTime = Math.min(...signupEvents.map((row) => Date.parse(row.occurred_at)))
    cohorts.set(key, {
      signup,
      events: ordered.filter((row) => Date.parse(row.occurred_at) >= signupTime),
    })
  }

  const cohortSize = cohorts.size
  const stageActors = FUNNEL_STAGES.map(() => new Set<string>())

  for (const [key, cohort] of cohorts) {
    for (const row of cohort.events) {
      const index = stageIndex(row)
      if (index >= 0) stageActors[index].add(key)
    }
  }

  const stages: FunnelStageResult[] = FUNNEL_STAGES.map((definition, index) => {
    const count = stageActors[index].size
    return {
      ...definition,
      count,
      observedShare: percentage(count, cohortSize),
    }
  })

  const stuckMembers: StuckMember[] = []
  for (const [key, cohort] of cohorts) {
    if (!key.startsWith('member:') && !key.startsWith('email:')) continue

    const stagedEvents = cohort.events
      .map((row) => ({ row, index: stageIndex(row) }))
      .filter((entry) => entry.index >= 0)
      .sort((a, b) => a.index - b.index || Date.parse(a.row.occurred_at) - Date.parse(b.row.occurred_at))

    const latest = stagedEvents.at(-1)
    if (!latest || latest.index === FUNNEL_STAGES.length - 1) continue

    const identityEvent = [...cohort.events].reverse().find((row) => row.member_email) || cohort.signup
    stuckMembers.push({
      actorKey: key,
      email: identityEvent.member_email || 'Email unavailable',
      memberUid: identityEvent.member_uid,
      latestStageKey: FUNNEL_STAGES[latest.index].key,
      latestStageLabel: FUNNEL_STAGES[latest.index].label,
      latestAt: latest.row.occurred_at,
      source: getSource(cohort.signup),
      plan: getPlan(identityEvent),
      reason: latest.row.reason,
    })
  }

  stuckMembers.sort((a, b) => Date.parse(b.latestAt) - Date.parse(a.latestAt))

  const sources = [...new Set([...cohorts.values()].map((cohort) => getSource(cohort.signup)))].sort()
  const plans = [...new Set([...cohorts.values()].map((cohort) => getPlan(cohort.signup)))].sort()

  const ambiguousAnonymousIds = [...anonymousToMember.values()].filter((key) => key === null).length
  return { cohortSize, stages, stuckMembers, sources, plans, ambiguousAnonymousIds }
}
