import { PAID_PLANS } from './plan-config'
import { summarizePricingHandoffs } from './pricing-handoff-report'

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

export function isVerificationConversionEvent(row: ConversionEventRow) {
  const data = row.event_data || {}
  return /release_validation|attribution_20261011|pricing-route-check|route-repair|verification|synthetic|\bqa\b/i.test(
    [row.source, row.utm_source, row.utm_medium, row.utm_campaign,
      ...['first_utm_source', 'last_utm_source', 'first_utm_medium', 'last_utm_medium', 'first_utm_campaign', 'last_utm_campaign'].map(key => data[key])].join(' '),
  )
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
  if (row.source === 'outseta' || row.source_page === 'outseta_webhook') return 'Direct / unknown'
  return row.utm_source || signupSource || row.source || 'Direct / unknown'
}

function signupAttribution(signup: ConversionEventRow, events: ConversionEventRow[], signupTime: number) {
  const browserSignup = events.find(row => row.event_name === 'signup_completed'
    && Date.parse(row.occurred_at) <= signupTime + 5 * 60 * 1000 && getSource(row) !== 'Direct / unknown')
  if (browserSignup) return { source: getSource(browserSignup), basis: 'signup' as const, campaignSource: browserSignup.utm_source || null }
  // Only activity observed before account creation can establish acquisition.
  // A later onboarding-email campaign must not become the signup source.
  const beforeSignup = events.filter(row => Date.parse(row.occurred_at) <= signupTime
    && ['signup_started', 'join_free_click', 'pricing_view', 'pricing_cta_click'].includes(row.event_name))
  const attributed = beforeSignup.find(row => typeof row.event_data?.first_utm_source === 'string' && row.event_data.first_utm_source)
    || beforeSignup.find(row => row.utm_source || row.event_data?.signup_source || row.source)
  if (attributed) {
    const firstSource = attributed.event_data?.first_utm_source
    const campaignSource = typeof firstSource === 'string' && firstSource ? firstSource : attributed.utm_source || null
    return { source: campaignSource || getSource(attributed), basis: 'linked_pre_signup' as const, campaignSource }
  }
  return { source: getSource(signup), basis: getSource(signup) === 'Direct / unknown' ? 'unknown' as const : 'signup' as const, campaignSource: signup.utm_source || null }
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
  if (stage?.key === 'pricing' && row.source === 'firm-profile' && row.reason === 'login-required') return -1
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
  filters: { source?: string; plan?: string; signupSince?: string; signupUntil?: string; excludedMemberUids?: string[] } = {},
) {
  // Propagate explicit QA exclusions across the observed browser's activity.
  const excludedMembers = new Set(filters.excludedMemberUids || [])
  const isExcluded = (row: ConversionEventRow) => isVerificationConversionEvent(row) || (!!row.member_uid && excludedMembers.has(row.member_uid))
  const verificationBrowsers = new Set(rows.filter(isExcluded).map(row => row.anonymous_id).filter(Boolean))
  const excludedEvents = rows.filter(row => isExcluded(row) || verificationBrowsers.has(row.anonymous_id)).length
  rows = rows.filter(row => !isExcluded(row) && !verificationBrowsers.has(row.anonymous_id))
  // An email-only row can resolve to a UID only when that email maps to one UID.
  const emailMembers = new Map<string, Set<string>>()
  for (const row of rows) {
    if (!row.member_uid || !row.member_email) continue
    const email = row.member_email.toLowerCase()
    const ids = emailMembers.get(email) || new Set<string>()
    ids.add(row.member_uid)
    emailMembers.set(email, ids)
  }
  const canonicalMemberKey = (row: ConversionEventRow) => {
    if (row.member_uid) return memberKey(row)
    const ids = row.member_email ? emailMembers.get(row.member_email.toLowerCase()) : undefined
    return ids?.size === 1 ? `member:${[...ids][0]}` : memberKey(row)
  }
  const anonymousToMember = new Map<string, string | null>()
  for (const row of rows) {
    const key = canonicalMemberKey(row)
    if (!key || !row.anonymous_id) continue
    const previous = anonymousToMember.get(row.anonymous_id)
    // Shared browser identifiers cannot safely attribute anonymous actions to
    // either member. Once ambiguous, the identifier stays unstitched.
    anonymousToMember.set(row.anonymous_id, previous === undefined || previous === key ? key : null)
  }

  const actorKey = (row: ConversionEventRow) =>
    canonicalMemberKey(row) ||
    (row.anonymous_id ? anonymousToMember.get(row.anonymous_id) || `anonymous:${row.anonymous_id}` : `event:${row.id}`)

  const eventsByActor = new Map<string, ConversionEventRow[]>()
  for (const row of rows) {
    const key = actorKey(row)
    const actorEvents = eventsByActor.get(key) || []
    actorEvents.push(row)
    eventsByActor.set(key, actorEvents)
  }

  const cohorts = new Map<string, { signup: ConversionEventRow; events: ConversionEventRow[]; source: string; campaignSource: string | null; basis: 'signup' | 'linked_pre_signup' | 'unknown'; signupTime: number }>()
  for (const [key, actorEvents] of eventsByActor) {
    const ordered = [...actorEvents].sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at))
    const signupEvents = ordered.filter((row) => row.event_name === 'signup_completed')
    if (signupEvents.length === 0) continue

    // A recorded webhook can supply signup evidence, while browser events often
    // have better attribution. Neither establishes complete collection coverage.
    const signup = signupEvents[0]

    const signupTime = Math.min(...signupEvents.map((row) => Date.parse(row.occurred_at)))
    if (filters.signupSince && signupTime < Date.parse(filters.signupSince)) continue
    if (filters.signupUntil && signupTime >= Date.parse(filters.signupUntil)) continue
    const attribution = signupAttribution(signup, ordered, signupTime)
    const source = attribution.source
    // The earliest recorded creation event defines the signup plan, not a later duplicate.
    const plan = getPlan(signupEvents[0])
    if (filters.source && filters.source !== 'all' && source !== filters.source) continue
    if (filters.plan && filters.plan !== 'all' && plan.toLowerCase() !== filters.plan.toLowerCase()) continue

    cohorts.set(key, {
      signup: signupEvents[0], source, campaignSource: attribution.campaignSource, basis: attribution.basis, signupTime,
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
      source: cohort.source,
      plan: getPlan(identityEvent),
      reason: latest.row.reason,
    })
  }

  stuckMembers.sort((a, b) => Date.parse(b.latestAt) - Date.parse(a.latestAt))

  const sources = [...new Set([...cohorts.values()].map((cohort) => cohort.source))].sort()
  const plans = [...new Set([...cohorts.values()].map((cohort) => getPlan(cohort.signup)))].sort()

  const ambiguousAnonymousIds = [...anonymousToMember.values()].filter((key) => key === null).length
  const cohortMembers = [...cohorts.entries()].map(([key, cohort]) => ({
    memberUid: key.startsWith('member:') ? key.slice(7) : null,
    signupAt: new Date(cohort.signupTime).toISOString(), source: cohort.source, attributionBasis: cohort.basis, campaignSource: cohort.campaignSource,
  }))
  const attributionCoverage = {
    recovered: cohortMembers.filter(member => member.attributionBasis === 'linked_pre_signup').length,
    unknown: cohortMembers.filter(member => member.attributionBasis === 'unknown').length,
    campaignKnown: cohortMembers.filter(member => member.campaignSource !== null).length,
  }
  const checkoutHandoffs = summarizePricingHandoffs([...cohorts.values()].map(cohort => cohort.events), hasPaidTarget)
  return { cohortSize, stages, stuckMembers, sources, plans, ambiguousAnonymousIds, cohortMembers, attributionCoverage, excludedEvents, checkoutHandoffs }
}
