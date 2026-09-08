import type { MarketingContactClassificationResult } from './activecampaign-audit.js'

export type MarketingJourney = 'payment_recovery' | 'onboarding' | 'cancellation_feedback'
  | 'free_to_pro' | 'free_to_elite' | 'trial_offer' | 'reengagement' | 'win_back'

export const JOURNEY_PRIORITY: readonly MarketingJourney[] = [
  'payment_recovery', 'onboarding', 'cancellation_feedback', 'trial_offer',
  'free_to_pro', 'free_to_elite', 'reengagement', 'win_back',
]

// The approved read adapter must resolve these IDs; tags and browser assertions
// alone are not milestone evidence. This contract does not create or store events.
export interface JourneyMilestoneEvidence {
  memberId: string
  lifecycleCycleId: string
  sourceRecordId: string
  occurredAt: string
}

export interface JourneyEligibilityInput {
  classification: MarketingContactClassificationResult
  now: string
  // Dates and cycle are supplied by the approved membership adapter, never AC contact creation.
  memberSince: string | null
  paidSince: string | null
  lifecycleCycleId: string | null
  onboarding: 'not_started' | 'active' | 'complete' | 'unknown'
  onboardingChannel: 'in_app' | 'marketing_email' | null
  onboardingCompletion: JourneyMilestoneEvidence | null
  activation: (JourneyMilestoneEvidence & { approved: boolean }) | null
  profileInputs: { profile: boolean | null; geography: boolean | null; experience: boolean | null; inspectionTypes: boolean | null }
  expressedNeed: 'pro' | 'elite' | 'trial' | null
  offerApproved: boolean
  trialEligible: boolean | null
  serviceDeliveryAllowed: boolean
  meaningfulInactivityDays: number | null
  history: {
    complete: boolean
    activeJourneys: MarketingJourney[]
    enrollmentKeys: string[]
    lastPromotionalAt: string | null
    lastServiceAt: string | null
  }
}

export interface JourneyEligibilityDecision {
  journey: MarketingJourney
  eligible: boolean
  reasons: string[]
  enrollmentKey: string | null
  mutationAllowed: false
}

// Proposed policy only. A result is never permission to enroll, subscribe, or send.
export function evaluateMarketingJourneys(input: JourneyEligibilityInput): JourneyEligibilityDecision[] {
  const c = input.classification
  const daysSince = (date: string | null): number | null => {
    if (!date) return null
    const age = (Date.parse(input.now) - Date.parse(date)) / 86_400_000
    return Number.isFinite(age) && age >= 0 ? age : null
  }
  const memberAge = daysSince(input.memberSince)
  const paidAge = daysSince(input.paidSince)
  const activationAge = daysSince(input.activation?.occurredAt ?? null)
  const completionAge = daysSince(input.onboardingCompletion?.occurredAt ?? null)
  const belongsToMemberCycle = (evidence: JourneyMilestoneEvidence | null): boolean =>
    !!evidence && evidence.memberId === c.canonicalMemberId
      && evidence.lifecycleCycleId === input.lifecycleCycleId
      && !!evidence.sourceRecordId?.trim()
  const activationVerified = input.activation?.approved === true
    && belongsToMemberCycle(input.activation) && activationAge !== null
    && memberAge !== null && activationAge <= memberAge
  const completionVerified = belongsToMemberCycle(input.onboardingCompletion)
    && completionAge !== null && memberAge !== null && completionAge <= memberAge
    && activationVerified && activationAge !== null && completionAge <= activationAge
  const common: string[] = []
  if (!Number.isFinite(Date.parse(input.now))) common.push('invalid_observation_time')
  if (c.membershipTruthState !== 'known' || !c.canonicalMemberId) common.push('unknown_or_conflicting_membership')
  if (c.audienceTraits.length > 0) common.push('excluded_audience')
  if (!input.history.complete) common.push('incomplete_journey_history')
  if (!input.lifecycleCycleId?.trim()) common.push('missing_lifecycle_cycle')
  const promotional: MarketingJourney[] = ['free_to_pro', 'free_to_elite', 'trial_offer', 'reengagement', 'win_back']
  const decisions = JOURNEY_PRIORITY.map((journey): JourneyEligibilityDecision => {
    const reasons = [...common]
    const isPromotion = promotional.includes(journey)
    const enrollmentKey = c.canonicalMemberId && input.lifecycleCycleId?.trim()
      ? JSON.stringify([c.canonicalMemberId, journey, input.lifecycleCycleId]) : null
    if (enrollmentKey && input.history.enrollmentKeys.includes(enrollmentKey)) reasons.push('already_enrolled_this_cycle')
    if (input.history.activeJourneys.includes(journey)) reasons.push('already_active')
    if (isPromotion) {
      if (c.consent !== 'granted') reasons.push('marketing_consent_not_granted')
      if (memberAge === null || memberAge < 30) reasons.push('first_30_days_or_unknown_member_age')
      if (input.onboarding !== 'complete' || !completionVerified) reasons.push('onboarding_incomplete_or_unknown')
      if (!activationVerified) reasons.push('approved_first_value_missing')
      if (Object.values(input.profileInputs).some((value) => value !== true)) reasons.push('profile_inputs_incomplete')
      if (c.lifecycle === 'trialing') reasons.push('active_trial')
      if (!['active', 'canceled', 'inactive'].includes(c.lifecycle)) reasons.push('lifecycle_not_promotional')
      if (c.membershipTier !== 'free' && (paidAge === null || paidAge < 30)) reasons.push('new_paid_or_unknown_paid_age')
      if (input.history.activeJourneys.length > 0) reasons.push('another_journey_active')
      if (input.history.lastPromotionalAt && (daysSince(input.history.lastPromotionalAt) ?? 0) < 7) reasons.push('promotional_frequency_limit')
    } else {
      // First-30-day and promotional consent exclusions must not block necessary service.
      if (!input.serviceDeliveryAllowed) reasons.push('service_channel_not_authorized')
      if (input.history.lastServiceAt && (daysSince(input.history.lastServiceAt) ?? 0) < 1) reasons.push('service_frequency_limit')
    }
    if (journey === 'payment_recovery' && c.lifecycle !== 'past_due') reasons.push('not_past_due')
    if (journey === 'onboarding') {
      if (!['in_app', 'marketing_email'].includes(input.onboardingChannel ?? '')) reasons.push('onboarding_channel_unknown')
      if (input.onboardingChannel === 'marketing_email' && c.consent !== 'granted') reasons.push('marketing_consent_not_granted')
      if (!['active', 'trialing'].includes(c.lifecycle)) reasons.push('not_active_or_trialing')
      if (!['not_started', 'active'].includes(input.onboarding)) reasons.push('onboarding_complete_or_unknown')
    }
    if (journey === 'cancellation_feedback' && !['canceling', 'canceled'].includes(c.lifecycle)) reasons.push('not_canceling_or_canceled')
    if (['free_to_pro', 'free_to_elite', 'trial_offer'].includes(journey)) {
      if (c.membershipTier !== 'free' || c.lifecycle !== 'active') reasons.push('not_active_free_member')
      const need = journey === 'free_to_pro' ? 'pro' : journey === 'free_to_elite' ? 'elite' : 'trial'
      if (input.expressedNeed !== need) reasons.push('no_matching_expressed_need')
      if (!input.offerApproved) reasons.push('offer_not_approved')
      if (journey === 'trial_offer' && input.trialEligible !== true) reasons.push('trial_eligibility_not_confirmed')
    }
    if (journey === 'reengagement') {
      if (c.lifecycle !== 'active') reasons.push('not_active_member')
      if (input.meaningfulInactivityDays === null || !Number.isFinite(input.meaningfulInactivityDays) || input.meaningfulInactivityDays < 90) reasons.push('meaningful_inactivity_not_established')
    }
    if (journey === 'win_back') {
      if (!['canceled', 'inactive'].includes(c.lifecycle)) reasons.push('not_churned_or_inactive')
      if (!input.offerApproved) reasons.push('offer_not_approved')
    }
    return { journey, eligible: reasons.length === 0, reasons, enrollmentKey, mutationAllowed: false }
  })
  const activePriority = input.history.activeJourneys.map((journey) => JOURNEY_PRIORITY.indexOf(journey))
  let selected = false
  for (const decision of decisions) {
    if (!decision.eligible) continue
    if (selected || activePriority.some((priority) => priority < JOURNEY_PRIORITY.indexOf(decision.journey))) {
      decision.eligible = false
      decision.reasons.push('higher_priority_journey')
    } else selected = true
  }
  return decisions
}
