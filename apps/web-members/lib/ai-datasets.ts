import { PLAN_UIDS } from './plan-config'

export type MembershipPlan = {
  name: string
  planUid: string
  price: string
  period: string
  headline: string
  description: string
  highlight: boolean
  waitlist?: boolean
  hidden?: boolean
  features: string[]
}

export const membershipPlans: MembershipPlan[] = [
  {
    name: 'Founders Directory Annual',
    planUid: PLAN_UIDS.FOUNDERS,
    price: '$37',
    period: 'year',
    headline: 'Founding Member',
    description: 'Early adopter plan honoring the original $37/year pricing. Includes everything promised at signup.',
    highlight: true,
    hidden: true,
    features: [
      'Full directory access (400+ verified firms)',
      'Full training portal access',
      'Preview access to the planned member-tool roadmap',
      'Live job board access',
      'Resources, templates, and guides',
      'Priority support',
      'Founding Member badge',
    ],
  },
  {
    name: 'Free',
    planUid: PLAN_UIDS.FREE,
    price: '$0',
    period: 'forever',
    headline: 'Explore the hub. Preview the directory.',
    description:
      'Perfect for checking out the ecosystem before you subscribe. You get limited directory visibility, the income scenario planner, and a preview of training and resources.',
    highlight: false,
    features: [
      'Preview up to 3 free firms',
      'Training preview access',
      'Resources and readiness guides',
      'Income scenario planner using your own assumptions',
      'Upgrade any time',
    ],
  },
  {
    name: 'Starter',
    planUid: PLAN_UIDS.STARTER,
    price: '$99',
    period: 'quarter',
    headline: 'Full directory access. Plus training resources.',
    description:
      'Legacy plan for inspectors who want the full directory, core training, and readiness resources.',
    highlight: false,
    hidden: true, // Legacy plan — no longer shown on pricing page
    features: [
      'Full directory access',
      'Full training portal access',
      'Income scenario planner',
      'Preview access to planned guidance workflows',
      'Preview access to planned resume support',
      'Resources, templates, and guides',
      'Standard support',
      'Standard legacy-plan access',
    ],
  },
  {
    name: 'Pro',
    planUid: PLAN_UIDS.PRO,
    price: '$49',
    period: 'month',
    headline: 'Full firm intel. Full training access.',
    description:
      'The working field-inspector membership: full directory, training library, readiness resources, weekly insights, and the income scenario planner.',
    highlight: true,
    features: [
      'Full firm directory access — all listings, all states',
      'Full training library and course access',
      'Resources, readiness guides, and starter kits',
      'Income scenario planner using your own assumptions',
      'Preview the planned AI Concierge and resume workflows',
      'Preview planned job, weather, and connected workflow tools',
      'Weekly insights and updates',
      '7 day free trial',
    ],
  },
  {
    name: 'Elite',
    planUid: PLAN_UIDS.ELITE,
    price: '$97',
    period: 'month',
    headline: 'Premium leverage. Priority support.',
    description:
      'For high volume operators who want faster support, deeper resources, and a higher-touch strategy path across markets.',
    highlight: false,
    waitlist: false,
    features: [
      'Everything in Pro',
      'Partner referrals — vetted intros to firms like Asteroom',
      '1-to-1 gaming session — strategy call with the team',
      'Concierge calls — 15-min route & onboarding reviews',
      'Priority support (faster response SLA)',
      'Advanced templates and workflows',
      'Route economics calculator',
      'Preview access to connected tools still being verified',
    ],
  },
  {
    name: 'Agency',
    planUid: PLAN_UIDS.AGENCY,
    price: '$297',
    period: 'month',
    headline: 'Member-side team plan in preparation.',
    description:
      'For members who run an inspection business and want to bring the inspectors they manage into Nested Objects. This member-side team plan remains visible while its seats, roles, and admin controls are verified; it is separate from the future hiring-firm product.',
    highlight: false,
    waitlist: true,
    features: [
      'Everything in Elite',
      'Income and route-economics tools for existing Agency members',
      'Planned member-side seats and roles for managed inspectors',
      'Planned team administration and onboarding controls',
      'Separate from the future hiring-firm product',
    ],
  },
]

export type FirmDirectoryEntry = {
  name: string
  niche: string
  url: string
  payRange: string
  requirements: string
  coverage: string
  roles: string[]
  states?: string[]
}

// Derived from infra/sql/seed.sql to keep AI tools grounded in the same sample firms
export const firmDirectoryDataset: FirmDirectoryEntry[] = [
  {
    name: 'Acuity Field Services',
    niche: 'Residential & Commercial',
    url: 'https://acuity.com',
    payRange: '$30 - $60 per inspection',
    requirements: 'Background check, reliable transportation, smartphone',
    coverage: 'Residential and commercial inspections with broad US coverage.',
    roles: ['inspector'],
    states: ['US'],
  },
  {
    name: 'InspectorPro Connect',
    niche: 'Commercial Property',
    url: 'https://inspectorpro.com',
    payRange: '$75 - $150 per inspection',
    requirements: '2+ years experience, E&O insurance, commercial certification',
    coverage: 'Commercial-focused inspections in larger metros and regional hubs.',
    roles: ['inspector'],
    states: ['US'],
  },
  {
    name: 'GigInspect USA',
    niche: 'Gig Economy / On-Demand',
    url: 'https://giginspect.com',
    payRange: '$20 - $45 per task',
    requirements: "Smartphone with high-res camera, valid driver's license",
    coverage: 'On-demand verification tasks with nationwide reach.',
    roles: ['gig-worker', 'inspector'],
    states: ['US'],
  },
  {
    name: 'Notary Asset Watch',
    niche: 'Notary / Financial',
    url: 'https://notaryasset.com',
    payRange: '$25 - $50 per site visit',
    requirements: 'Active Notary Public commission, background check',
    coverage: 'Loan and asset protection visits aligned with lender requests.',
    roles: ['notary'],
    states: ['US'],
  },
]

export type JobBoardEntry = {
  id: string
  title: string
  company: string
  location: string
  pay: string
  description: string
  link: string
  roles: string[]
}

export const jobBoardEntries: JobBoardEntry[] = [
  {
    id: 'atl-inspection-241',
    title: 'Residential property inspector',
    company: 'Peachtree Field Services',
    location: 'Atlanta, GA (local travel)',
    pay: '$240 per completed inspection',
    description:
      'Route-based inspections focused on photos, occupancy checks, and short reports. Expect 6–10 stops per day.',
    link: 'https://nestedobjects.com/jobs/',
    roles: ['inspector'],
  },
  {
    id: 'remote-data-118',
    title: 'Remote property data collector',
    company: 'Seaboard Analytics',
    location: 'Remote (US-based)',
    pay: '$30/hr contract',
    description: 'Desk research to validate addresses, call occupants, and schedule follow-up photos with field partners.',
    link: 'https://nestedobjects.com/jobs/',
    roles: ['coordinator', 'gig-worker'],
  },
  {
    id: 'reo-bpo-019',
    title: 'BPO/REO photographer',
    company: 'Riverview Valuations',
    location: 'Charlotte, NC and surrounding counties',
    pay: '$275 per property (rush bonus available)',
    description: 'Photo-heavy assignments with strict shot lists. Weekend availability preferred; mileage reimbursed above 50 miles.',
    link: 'https://nestedobjects.com/jobs/',
    roles: ['inspector', 'photographer'],
  },
  {
    id: 'on-demand-verifier-001',
    title: 'On-Demand Property Verifier',
    company: 'GigInspect USA',
    location: 'Remote (Nationwide)',
    pay: '$20 - $45 per task',
    description:
      'Quick property verifications requiring 5-10 photos and a short checklist. Must complete tasks within 24 hours.',
    link: 'https://giginspect.com/apply/verifier',
    roles: ['gig-worker'],
  },
]
