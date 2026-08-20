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
    label: 'Free signups',
    description: 'Created a member account',
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
    label: 'Value experienced',
    description: 'Viewed the directory or a firm',
    eventNames: ['directory_viewed', 'firm_view'],
  },
  {
    key: 'paywall',
    label: 'Paid need reached',
    description: 'Encountered a paid-only detail or action',
    eventNames: ['paywall_hit'],
  },
  {
    key: 'pricing',
    label: 'Pricing viewed',
    description: 'Evaluated plan options',
    eventNames: ['pricing_view'],
  },
  {
    key: 'intent',
    label: 'Upgrade intent',
    description: 'Clicked a paid plan or started a trial',
    eventNames: ['pricing_cta_click', 'upgrade_clicked', 'upgrade_started', 'start_trial'],
  },
  {
    key: 'checkout',
    label: 'Checkout opened',
    description: 'Opened Outseta registration or plan change',
    eventNames: ['outseta_modal_open'],
  },
  {
    key: 'paid',
    label: 'Became paid',
    description: 'Paid subscription confirmed by Outseta',
    eventNames: ['purchase', 'subscription_created', 'subscription_upgraded'],
  },
]

export type FunnelStageResult = FunnelStageDefinition & {
  count: number
  conversionRate: number
  previousStageRate: number
  dropOff: number
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

function stageIndex(eventName: string) {
  return FUNNEL_STAGES.findIndex((stage) => stage.eventNames.includes(eventName))
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0
}

export function buildConversionFunnel(
  rows: ConversionEventRow[],
  filters: { source?: string; plan?: string } = {},
) {
  const anonymousToMember = new Map<string, string>()
  for (const row of rows) {
    const key = memberKey(row)
    if (key && row.anonymous_id) anonymousToMember.set(row.anonymous_id, key)
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

    // The Outseta webhook guarantees the cohort denominator, while the browser
    // signup event usually has the more useful campaign or page attribution.
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
      const index = stageIndex(row.event_name)
      if (index >= 0) stageActors[index].add(key)
    }
  }

  const stages: FunnelStageResult[] = FUNNEL_STAGES.map((definition, index) => {
    const count = stageActors[index].size
    const previousCount = index === 0 ? cohortSize : stageActors[index - 1].size
    return {
      ...definition,
      count,
      conversionRate: percentage(count, cohortSize),
      previousStageRate: percentage(count, previousCount),
      dropOff: Math.max(0, previousCount - count),
    }
  })

  const stuckMembers: StuckMember[] = []
  for (const [key, cohort] of cohorts) {
    if (!key.startsWith('member:') && !key.startsWith('email:')) continue

    const stagedEvents = cohort.events
      .map((row) => ({ row, index: stageIndex(row.event_name) }))
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

  return { cohortSize, stages, stuckMembers, sources, plans }
}
