import { PLAN_UIDS } from './plan-config'

export type MembershipPlan = {
  name: string
  planUid: string
  price: string
  period: string
  description: string
  highlight: boolean
  waitlist?: boolean
  features: string[]
}

export const membershipPlans: MembershipPlan[] = [
  {
    name: 'Free',
    planUid: PLAN_UIDS.FREE,
    price: '$0',
    period: 'forever',
    description: 'Preview the directory and community. Perfect for testing the waters.',
    highlight: false,
    features: [
      'Directory preview (max 5 listings)',
      'Access to selected resources',
      'Training preview (Starter module)',
      'Community updates',
    ],
  },
  {
    name: 'Starter',
    planUid: PLAN_UIDS.STARTER,
    price: '$99',
    period: '3 months',
    description: 'Full Directory access for 90 days. Get the intel you need to get hired.',
    highlight: false,
    features: [
      'Unlimited Firm Directory access',
      'Search and filters enabled',
      'Restricted tools access (No AI)',
      'Starter training library',
    ],
  },
  {
    name: 'Pro',
    planUid: PLAN_UIDS.PRO,
    price: '$49',
    period: 'month',
    description: 'The complete toolkit for working pros. AI tools, full training, and daily utility.',
    highlight: true,
    features: [
      'Everything in Starter',
      'AI Concierge & Chat',
      'AI Resume Builder',
      'Job Tracker & Export tools',
      'Full Training Library access',
    ],
  },
  {
    name: 'Elite',
    planUid: PLAN_UIDS.ELITE,
    price: '$99',
    period: 'month',
    description: 'Higher limits and priority support for high-volume inspectors.',
    highlight: false,
    waitlist: true,
    features: [
      'Everything in Pro',
      'Higher AI limits',
      'Priority support channel',
      'Early access to new tools',
      'Advanced templates',
    ],
  },
  {
    name: 'Agency',
    planUid: PLAN_UIDS.AGENCY,
    price: '$297',
    period: 'month',
    description: 'Multi-seat accounts for teams and coordinators.',
    highlight: false,
    waitlist: true,
    features: [
      'Everything in Elite',
      'Multi-seat Team Management',
      'White label packaging',
      'Admin controls & Analytics',
      'Consolidated billing',
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
