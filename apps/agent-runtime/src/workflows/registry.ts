import { ContractValidationError } from '../contracts.js'

export interface WorkflowRegistration {
  name: string
  version: string
  description: string
  durability: 'in_memory_test' | 'vercel_workflow_extension'
  status: 'foundation' | 'placeholder'
  enabledByDefault: false
  mutationBoundary: 'internal_only' | 'proposal_only'
}

export const WORKFLOW_REGISTRATIONS: readonly WorkflowRegistration[] = [
  {
    name: 'lifecycle-integrity-check',
    version: 'phase-c3-v1',
    description: 'Durable synthetic staging workflow for identity, membership, lifecycle routing, and source completeness anomalies.',
    durability: 'vercel_workflow_extension',
    status: 'foundation',
    enabledByDefault: false,
    mutationBoundary: 'proposal_only',
  },
  {
    name: 'weekly-operating-review',
    version: 'phase-b-v1',
    description: 'Future correlated operating review that consumes normalized metrics and persisted intelligence signals.',
    durability: 'vercel_workflow_extension',
    status: 'placeholder',
    enabledByDefault: false,
    mutationBoundary: 'proposal_only',
  },
  {
    name: 'industry-intelligence-scan',
    version: 'phase-b-v1',
    description: 'Future sourced research workflow that persists industry signals without executing external actions.',
    durability: 'vercel_workflow_extension',
    status: 'placeholder',
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
