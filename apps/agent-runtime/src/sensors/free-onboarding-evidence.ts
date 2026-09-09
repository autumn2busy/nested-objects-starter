import { z } from 'zod'

import { adaptIncomeScenarioMilestone } from './income-scenario-evidence.js'
import type { IncomeScenarioEvidenceInput, MilestoneReadSnapshot } from './income-scenario-evidence.js'
import type { JourneyEligibilityInput, JourneyMilestoneEvidence } from './marketing-eligibility.js'

export interface FreeOnboardingProfileRow {
  id: string
  outseta_person_uid: string | null
  headline?: string | null
  bio?: string | null
  city?: string | null
  state?: string | null
  experience_level?: string | null
  primary_services?: string | null
  // The current member profile form stores service TYPES here, despite the name.
  service_areas?: unknown
  updated_at?: string | null
}

export interface FreeOnboardingEvidenceInput extends Omit<IncomeScenarioEvidenceInput, 'profiles'> {
  profiles: MilestoneReadSnapshot<FreeOnboardingProfileRow>
}

export interface FreeOnboardingEvidenceResult {
  status: 'complete' | 'incomplete' | 'withheld'
  profileInputs: JourneyEligibilityInput['profileInputs']
  activation: (JourneyMilestoneEvidence & { approved: true }) | null
  onboardingCompletion: JourneyMilestoneEvidence | null
  sourceRecordIds: string[]
  reasons: string[]
  mutationAllowed: false
}

const timestamp = z.string().datetime({ offset: true })
const text = z.string().nullable()
const profileSchema = z.object({
  headline: text, bio: text, city: text, state: text,
  experience_level: text, primary_services: text,
  service_areas: z.array(z.string()).nullable(), updated_at: timestamp,
})
const states = new Set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '))
const experience = new Set(['new', 'intermediate', 'experienced', 'expert'])
const serviceTypes = new Set([
  'Property Inspections', 'Occupancy Verification', 'Loss Draft Inspections',
  'REO/Foreclosure', 'Insurance Claims', 'Notary Services', 'Appraisals',
  'Property Preservation', 'Door Knocks', 'Skip Tracing',
])
const nonempty = (value: string | null) => !!value?.trim()

/** Derive completion from saved source rows; no reads, new event store, writes or enrollment. */
export function adaptFreeOnboardingCompletion(input: FreeOnboardingEvidenceInput): FreeOnboardingEvidenceResult {
  const withheld = (reasons: string[]): FreeOnboardingEvidenceResult => ({
    status: 'withheld', reasons, mutationAllowed: false,
    profileInputs: { profile: null, geography: null, experience: null, inspectionTypes: null },
    activation: null, onboardingCompletion: null, sourceRecordIds: [],
  })
  // Reuse the existing unique stable-identity, current-cycle, chronology and freshness checks.
  const receipt = adaptIncomeScenarioMilestone(input)
  if (receipt.status !== 'accepted' || !receipt.evidence) return withheld(receipt.reasons)
  const parsed = profileSchema.safeParse(input.profiles.rows[0])
  if (!parsed.success) return withheld(['saved_profile_columns_missing_or_invalid'])
  const profile = parsed.data
  const savedAt = Date.parse(profile.updated_at)
  const membership = input.currentMemberships.rows[0]
  if (!membership) return withheld(['current_outseta_cycle_unverified'])
  if (savedAt > Date.parse(input.profiles.observedAt)
    || savedAt < Date.parse(membership.memberSince)
    || savedAt < Date.parse(membership.cycleStartedAt)) {
    return withheld(['saved_profile_chronology_unverified'])
  }
  const profileInputs = {
    profile: nonempty(profile.headline) && nonempty(profile.bio),
    geography: nonempty(profile.city) && states.has(profile.state?.trim() ?? ''),
    experience: experience.has(profile.experience_level?.trim() ?? ''),
    inspectionTypes: nonempty(profile.primary_services) && !!profile.service_areas?.length
      && profile.service_areas.every((value) => serviceTypes.has(value)),
  }
  const reasons = Object.entries(profileInputs)
    .filter(([, complete]) => !complete).map(([dimension]) => `saved_${dimension}_incomplete`)
  const profileRef = `profiles:${receipt.evidence.memberId}@${profile.updated_at}`
  return {
    status: reasons.length ? 'incomplete' : 'complete', profileInputs,
    activation: { ...receipt.evidence, approved: true },
    onboardingCompletion: reasons.length ? null : {
      memberId: receipt.evidence.memberId, lifecycleCycleId: receipt.evidence.lifecycleCycleId,
      // This identifies the derivation, not a persisted onboarding event or first-ever completion.
      sourceRecordId: `derived:onboarding:${profileRef}+${receipt.evidence.sourceRecordId}`,
      occurredAt: new Date(Math.max(savedAt, Date.parse(receipt.evidence.occurredAt))).toISOString(),
    },
    sourceRecordIds: [profileRef, receipt.evidence.sourceRecordId], reasons, mutationAllowed: false,
  }
}
