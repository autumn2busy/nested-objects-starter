export type MembershipPlan = {
  name: string
  planUid: string
  price: string
  period: string
  description: string
  highlight: boolean
  features: string[]
}

export const membershipPlans: MembershipPlan[] = [
  {
    name: 'Starter',
    planUid: 'L9nbKV9Z',
    price: '$0',
    period: 'forever',
    description: 'Perfect for testing the waters and browsing firms at your own pace.',
    highlight: false,
    features: [
      'Access to the verified Firm Directory',
      'Basic search by state and service lane',
      'Member hub dashboard access',
      'Community updates and announcements',
      'Access to starter resources and checklists',
    ],
  },
  {
    name: 'Directory',
    planUid: 'zWZD0rQp',
    price: '$99',
    period: '3 months',
    description: 'Full Firm Directory access for 3 months. No hub tools or AI—just the listings you need.',
    highlight: false,
    features: [
      'Unlimited Firm Directory access for 90 days',
      'Expires automatically three months after purchase',
      'Renew for $49 after your pass expires',
      'Directory-only access without hub tools or resources',
    ],
  },
  {
    name: 'Pro',
    planUid: 'rQVqlLm6',
    price: '$37',
    period: 'month',
    description: 'For working pros who want pay intel, better routing, and less guesswork.',
    highlight: true,
    features: [
      'Everything in Starter',
      'AI Concierge to answer firm and industry questions',
      'Firm intel snapshots, rates, and requirements',
      'Advanced filters by region, tools, and experience level',
      'Weekly market and route-planning insights',
      'Export options for firm lists and notes',
    ],
  },
  {
    name: 'Elite',
    planUid: 'NmdnNO90',
    price: '$97',
    period: 'month',
    description: 'For high volume inspectors and team leads who treat routes like a business.',
    highlight: false,
    features: [
      'Everything in Pro',
      'Priority support with faster response times',
      'Deeper intel on volume, gear, and regional demand',
      'Workflow templates for multi-market routes',
      'Early access to new tools and features',
      'Reserved slots for beta programs and pilots',
    ],
  },
  {
    name: 'Agency',
    planUid: 'rmk5Xk9g',
    price: '$297',
    period: 'month',
    description: 'For agencies and coordinators managing crews across multiple markets.',
    highlight: false,
    features: [
      'Everything in Elite',
      'Multi-user accounts for coordinators and staff',
      'Agency-level analytics and reporting',
      'White label options and custom views',
      'Onboarding and training for your team',
      'Quarterly strategy review sessions',
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
    link: 'https://example.com/jobs/atl-inspection-241',
    roles: ['inspector'],
  },
  {
    id: 'remote-data-118',
    title: 'Remote property data collector',
    company: 'Seaboard Analytics',
    location: 'Remote (US-based)',
    pay: '$30/hr contract',
    description: 'Desk research to validate addresses, call occupants, and schedule follow-up photos with field partners.',
    link: 'https://example.com/jobs/remote-data-118',
    roles: ['coordinator', 'gig-worker'],
  },
  {
    id: 'reo-bpo-019',
    title: 'BPO/REO photographer',
    company: 'Riverview Valuations',
    location: 'Charlotte, NC and surrounding counties',
    pay: '$275 per property (rush bonus available)',
    description: 'Photo-heavy assignments with strict shot lists. Weekend availability preferred; mileage reimbursed above 50 miles.',
    link: 'https://example.com/jobs/reo-bpo-019',
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
