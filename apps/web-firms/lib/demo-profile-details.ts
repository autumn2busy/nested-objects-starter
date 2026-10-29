// Fictional presentation only. No member API, résumé workspace, or private identifier is read.
// Score rules mirror apps/web-members/lib/trust-score.ts; parity tests detect drift.
type ScoreProfile = {
  training_modules_completed?: number
  training_modules_total?: number
  background_check_status?: string
}
export function calculateSampleTrustScore(profile: ScoreProfile) {
  const completed = profile.training_modules_completed || 0
  const totalModules = profile.training_modules_total || 8
  const training = totalModules > 0 ? Math.min(Math.round(completed / totalModules * 50), 50) : 0
  const status = profile.background_check_status
  const background = status === 'verified' || status === 'completed' ? 50
    : status === 'pending_verification' || status === 'pending' ? 10 : 0
  const total = training + background
  const tier = total >= 80 ? 'platinum' : total >= 60 ? 'gold' : total >= 40 ? 'silver' : 'bronze'
  return { total, tier, breakdown: { background, training } }
}

export const demoMemberSignals: Record<string, ScoreProfile & { shieldId: string | null }> = {
  'insp-001': { training_modules_completed: 6, training_modules_total: 8, background_check_status: 'verified', shieldId: 'DEMO-ONLY-001' },
  'insp-002': { training_modules_completed: 8, training_modules_total: 8, background_check_status: 'verified', shieldId: 'DEMO-ONLY-002' },
  'insp-003': { training_modules_completed: 3, training_modules_total: 8, background_check_status: 'pending_verification', shieldId: 'DEMO-ONLY-003' },
  'insp-004': { training_modules_completed: 7, training_modules_total: 8, background_check_status: 'verified', shieldId: 'DEMO-ONLY-004' },
  'insp-005': { training_modules_completed: 8, training_modules_total: 8, background_check_status: 'verified', shieldId: 'DEMO-ONLY-005' },
  'insp-006': { training_modules_completed: 5, training_modules_total: 8, background_check_status: 'not_started', shieldId: null },
}

type SamplePerson = { id: string; name: string; location: string; specialties: readonly string[]; yearsExp: number }

type SampleResumeState = 'shared' | 'private' | 'not_uploaded' | 'unavailable'
const sampleResumeStates: Record<string, SampleResumeState> = {
  'insp-001': 'shared', 'insp-002': 'private', 'insp-003': 'not_uploaded',
  'insp-004': 'shared', 'insp-005': 'shared', 'insp-006': 'unavailable',
}
export function getSampleResumeState(id: string): SampleResumeState {
  return sampleResumeStates[id] ?? 'unavailable'
}
export const sampleResumeLabels: Record<SampleResumeState, string> = {
  shared: 'Shared sample résumé', private: 'Private · sample state',
  not_uploaded: 'Not uploaded · sample state', unavailable: 'Unavailable · sample state',
}

export function getDemoProfileDetails(person: SamplePerson) {
  const signals = demoMemberSignals[person.id]
  if (!signals) throw new Error('Unknown fictional profile')
  const summary = `Field professional with ${person.yearsExp} years of illustrative experience in ${person.specialties.join(', ').toLowerCase()}. Focused on clear photographic documentation, accurate reports, and communication with field-service coordinators.`
  const [city, state] = person.location.split(', ')
  // Same seven completeness inputs used by the member profile's completion tracking.
  const profileFields = {
    headline: 'Independent field inspector', bio: summary, city, state,
    primary_services: person.specialties.join(', '), experience_level: `${person.yearsExp} years`,
    service_areas: [person.location],
  }
  const completedFields = [
    profileFields.headline, profileFields.bio, profileFields.city, profileFields.state,
    profileFields.primary_services, profileFields.experience_level,
    profileFields.service_areas.length > 0 ? 'service-area' : '',
  ].filter(Boolean).length
  const splitYear = 2026 - Math.floor(person.yearsExp / 2)
  const workHistory = [
    {
      company: 'Example Field Services A', role: 'Independent field inspector',
      period: `${splitYear}–Present`,
      description: `Sample contract experience supporting ${person.specialties[0].toLowerCase()} assignments in the ${person.location} area.`,
      bullets: ['Documented site conditions with organized photo sets and factual notes.', 'Prepared reports against assignment instructions and communicated access issues.'],
    },
    {
      company: 'Example Property Reporting B', role: 'Field services contractor',
      period: `${2026 - person.yearsExp}–${splitYear}`,
      description: 'Sample prior contract work documenting properties and coordinating field visits.',
      bullets: ['Planned inspection routes and maintained assignment records.', 'Reviewed reports for completeness before submission.'],
    },
  ]
  return {
    signals, score: calculateSampleTrustScore(signals), summary,
    profileCompletion: Math.round(completedFields / 7 * 100),
    workHistory, skills: [...person.specialties, 'Photo documentation', 'Report preparation', 'Route planning'],
    backgroundLabel: signals.background_check_status === 'verified' ? 'Verified · sample status'
      : signals.background_check_status === 'pending_verification' ? 'Pending verification · sample status'
      : 'Not started · sample status',
  }
}

// Keep the downloaded example tied to the same fictional data as the on-screen résumé.
export function createSampleResumeDownload(person: SamplePerson) {
  const details = getDemoProfileDetails(person)
  if (getSampleResumeState(person.id) !== 'shared') throw new Error('Sample résumé is not shared')
  const text = [
    'NESTED OBJECTS — FICTIONAL SAMPLE RÉSUMÉ',
    'Demonstration only. Not a real member résumé or an application for work.',
    '',
    person.name,
    `Independent field inspector · ${person.location}`,
    '',
    'PROFESSIONAL SUMMARY',
    details.summary,
    '',
    'FIRM & CONTRACT EXPERIENCE — FICTIONAL',
    ...details.workHistory.flatMap(work => [
      `${work.company} (fictional)`,
      `${work.role} · ${work.period}`,
      work.description,
      ...work.bullets.map(bullet => `- ${bullet}`),
      '',
    ]),
    'SERVICES & SKILLS',
    ...details.skills.map(skill => `- ${skill}`),
    '',
    'TRAINING & PROFILE SIGNALS — DEMONSTRATION VALUES',
    `Training: ${details.signals.training_modules_completed} of ${details.signals.training_modules_total} modules.`,
    `Illustrative Trust Score: ${details.score.total}/100 (${details.score.tier}).`,
    `Score breakdown: training ${details.score.breakdown.training}/50; background check ${details.score.breakdown.background}/50.`,
    `Profile completion: ${details.profileCompletion}% (shown separately from Trust Score).`,
    `Background check: ${details.backgroundLabel}.`,
    `Sample ShieldID: ${details.signals.shieldId ?? 'Not supplied'}.`,
    '',
    'All experience, companies, scores and screening signals above are fictional.',
    'DEMO-ONLY identifiers are not valid credentials. No screening or availability is verified.',
    'Nested Objects sample — no real member data or contact details included.',
    '',
  ].join('\r\n')
  return { filename: `nested-objects-${person.id}-fictional-resume.txt`, text }
}
