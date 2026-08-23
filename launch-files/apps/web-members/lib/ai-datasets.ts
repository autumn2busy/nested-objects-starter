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
    name: 'Free',
    planUid: PLAN_UIDS.FREE,
    price: '$0',
    period: 'forever',
    headline: 'Explore the hub. Preview the directory.',
    description:
      'Perfect for checking out the ecosystem before you subscribe. You get limited directory visibility and a preview of the training and resources.',
    highlight: false,
    features: [
      'Preview up to 3 free firms',
      'Training preview access',
      'Resources and readiness guides',
      'Upgrade any time',
    ],
  },
  {
    name: 'Starter',
    planUid: PLAN_UIDS.STARTER,
    price: '$99',
    period: 'quarter',
    headline: 'Full directory access. Plus light AI support.',
    description:
      'Built for inspectors who want the directory and the core training, with limited AI help for quick answers and resume support.',
    highlight: false,
    hidden: true, // Legacy plan — no longer shown on pricing page
    features: [
      'Full directory access',
      'Full training portal access',
      'Limited AI Concierge usage',
      'Limited AI Resume Builder usage',
      'Resources, templates, and guides',
      'Standard support',
      'Includes limited monthly AI credits',
    ],
  },
  {
    name: 'Pro',
    planUid: PLAN_UIDS.PRO,
    price: '$49',
    period: 'month',
    headline: 'Full hub access. Full AI tools.',
    description:
      'This is the working pro toolkit. You get the full directory, the full training library, and full access to AI tools that save time every week.',
    highlight: true,
    features: [
      'Everything in Starter',
      'Full AI Concierge access',
      'Full AI Resume Builder access',
      'Job tracking tools',
      'Routing and weather tools',
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
      'For high volume operators who want faster support, higher limits, and deeper tools to move smarter across markets.',
    highlight: false,
    waitlist: false,
    features: [
      'Everything in Pro',
      'Partner referrals — vetted intros to firms like Asteroom',
      '1-to-1 gaming session — strategy call with the team',
      'Concierge calls — 15-min route & onboarding reviews',
      'Higher AI limits (2x Pro)',
      'Priority support (faster response SLA)',
      'Advanced templates and workflows',
      'Early access to new tools and features',
    ],
  },
  {
    name: 'Agency',
    planUid: PLAN_UIDS.AGENCY,
    price: '$297',
    period: 'month',
    headline: 'Team ready. Enterprise path.',
    description:
      'For firms and teams who need multi user access, admin controls, and an enterprise packaging path.',
    highlight: false,
    waitlist: false,
    features: [
      'Everything in Elite',
      'Multi user access and roles',
      'White label options',
      'API access',
      'Team onboarding and admin tooling',
      'Enterprise support path',
    ],
  },
  {
    name: 'Founders Directory Annual',
    planUid: PLAN_UIDS.FOUNDERS,
    price: '$37',
    period: 'year',
    headline: 'Founding Member — Locked In for Life',
    description: 'Early adopter plan honoring the original $37/year pricing. Includes everything promised at signup.',
    highlight: false,
    hidden: true,
    features: [
      'Full directory access (200+ verified firms)',
      'Full training portal access',
      'AI Resume Builder access',
      'Live job board access',
      'Resources, templates, and guides',
      'Priority support',
      'Founding Member badge',
      '$37/year pricing locked for life',
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
