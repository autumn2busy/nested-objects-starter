import { ContractValidationError } from '../contracts.js'

export interface WorkflowRegistration {
  name: string
  version: string
  description: string
  durability: 'in_memory_test' | 'vercel_workflow_extension'
  status: 'implemented' | 'foundation' | 'placeholder'
  enabledByDefault: false
  mutationBoundary: 'internal_only' | 'proposal_only'
}

export const WORKFLOW_REGISTRATIONS: readonly WorkflowRegistration[] = [
  {
    name: 'lifecycle-integrity-check',
    version: 'phase-c3-v1',
    description: 'Durable synthetic staging workflow for identity, membership, lifecycle routing, and source completeness anomalies.',
    durability: 'vercel_workflow_extension',
    status: 'implemented',
    enabledByDefault: false,
    mutationBoundary: 'proposal_only',
  },
  {
    name: 'conversion_review',
    version: 'phase-c5-v1',
    description: 'Durable conversion review invoking Revenue, Growth, and Marketing with verified artifact persistence.',
    durability: 'vercel_workflow_extension',
    status: 'implemented',
    enabledByDefault: false,
    mutationBoundary: 'proposal_only',
  },
  {
    name: 'daily_business_health',
    version: 'phase-c5-v1',
    description: 'Quiet-by-default lifecycle, identity, access, routing, source, collector, and tracking health review.',
    durability: 'vercel_workflow_extension',
    status: 'implemented',
    enabledByDefault: false,
    mutationBoundary: 'proposal_only',
  },
  {
    name: 'weekly_operating_review',
    version: 'phase-c5-v1',
    description: 'Durable weekly specialist review with no more than three priorities and explicit Autumn decisions.',
    durability: 'vercel_workflow_extension',
    status: 'implemented',
    enabledByDefault: false,
    mutationBoundary: 'proposal_only',
  },
] as const

validateWorkflowRegistrations(WORKFLOW_REGISTRATIONS)

export function getWorkflowRegistration(name: string): WorkflowRegistration {
  const registration = WORKFLOW_REGISTRATIONS.find((candidate) => candidate.name === name)
  if (!registration) throw new ContractValidationError(`Unknown workflow registration: ${name}`)
  return registration
}

export function validateWorkflowRegistrations(registrations: readonly WorkflowRegistration[]): void {
  const keys = new Set<string>()
  for (const registration of registrations) {
    const key = `${registration.name}@${registration.version}`
    if (keys.has(key)) throw new ContractValidationError(`Duplicate workflow registration: ${key}`)
    if (!registration.name.trim() || !registration.version.trim() || !registration.description.trim()) {
      throw new ContractValidationError('Workflow registration name, version, and description are required')
    }
    keys.add(key)
  }
}
