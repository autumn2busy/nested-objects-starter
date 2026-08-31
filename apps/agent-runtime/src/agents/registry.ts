import type { AgentRegistration } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'

export const AGENT_REGISTRATIONS: readonly AgentRegistration[] = [
  {
    name: 'operations-orchestrator',
    displayName: 'Operations Orchestrator',
    description: 'Owns correlated business workflows and coordinates specialists through structured tasks and persisted state.',
    implementationStatus: 'implemented',
    riskBoundary: 'proposal_only',
    capabilities: ['workflow_coordination', 'signal_triage', 'task_routing', 'action_proposal'],
    inputContract: 'OperationsOrchestratorInput',
    outputContract: 'OperationsOrchestratorOutput',
    enabledByDefault: false,
  },
  {
    name: 'revenue-agent',
    displayName: 'Revenue Agent',
    description: 'Analyzes defensible membership and revenue metrics from authoritative normalized data.',
    implementationStatus: 'implemented',
    riskBoundary: 'analytical',
    capabilities: ['revenue_analysis', 'membership_authority', 'metric_quality_assessment'],
    inputContract: 'RevenueAgentInput',
    outputContract: 'RevenueAgentOutput',
    enabledByDefault: false,
  },
  {
    name: 'growth-agent',
    displayName: 'Growth Agent',
    description: 'Produces structured growth findings from normalized business metrics and persisted intelligence signals.',
    implementationStatus: 'implemented',
    riskBoundary: 'proposal_only',
    capabilities: ['growth_analysis', 'anomaly_detection', 'experiment_reference'],
    inputContract: 'GrowthAgentInput',
    outputContract: 'GrowthAgentOutput',
    enabledByDefault: false,
  },
  {
    name: 'industry-intelligence-agent',
    displayName: 'Industry Intelligence Agent',
    description: 'Converts approved research evidence into durable, sourced industry signals.',
    implementationStatus: 'implemented',
    riskBoundary: 'analytical',
    capabilities: ['research_synthesis', 'source_provenance', 'industry_signal_proposal'],
    inputContract: 'IndustryIntelligenceAgentInput',
    outputContract: 'IndustryIntelligenceAgentOutput',
    enabledByDefault: false,
  },
  {
    name: 'marketing-agent',
    displayName: 'Marketing Agent',
    description: 'Analyzes lifecycle and campaign evidence while treating ActiveCampaign as a downstream destination.',
    implementationStatus: 'implemented',
    riskBoundary: 'proposal_only',
    capabilities: ['marketing_analysis', 'lifecycle_diagnostics', 'copy_drafting'],
    inputContract: 'MarketingAgentInput',
    outputContract: 'MarketingAgentOutput',
    enabledByDefault: false,
  },
  {
    name: 'opportunity-agent',
    displayName: 'Opportunity Agent',
    description: 'Future specialist for opportunity ingestion, matching, and prioritization.',
    implementationStatus: 'placeholder',
    riskBoundary: 'analytical',
    capabilities: ['opportunity_analysis'],
    inputContract: 'SpecialistInput',
    outputContract: 'SpecialistOutput',
    enabledByDefault: false,
  },
  {
    name: 'member-success-agent',
    displayName: 'Inbox and Member Success Agent',
    description: 'Future specialist for member support and inbox signals.',
    implementationStatus: 'placeholder',
    riskBoundary: 'proposal_only',
    capabilities: ['member_support_analysis'],
    inputContract: 'SpecialistInput',
    outputContract: 'SpecialistOutput',
    enabledByDefault: false,
  },
  {
    name: 'seo-aeo-agent',
    displayName: 'SEO and AEO Agent',
    description: 'Future specialist that consumes existing SEO and AEO sensors.',
    implementationStatus: 'placeholder',
    riskBoundary: 'proposal_only',
    capabilities: ['seo_analysis', 'aeo_analysis'],
    inputContract: 'SpecialistInput',
    outputContract: 'SpecialistOutput',
    enabledByDefault: false,
  },
  {
    name: 'firm-acquisition-agent',
    displayName: 'Lead and Firm Acquisition Agent',
    description: 'Future specialist for firm acquisition research and approved outreach proposals.',
    implementationStatus: 'placeholder',
    riskBoundary: 'proposal_only',
    capabilities: ['firm_research', 'lead_qualification'],
    inputContract: 'SpecialistInput',
    outputContract: 'SpecialistOutput',
    enabledByDefault: false,
  },
  {
    name: 'product-agent',
    displayName: 'Product Agent',
    description: 'Future specialist for product evidence, feedback, and experiment proposals.',
    implementationStatus: 'placeholder',
    riskBoundary: 'proposal_only',
    capabilities: ['product_analysis', 'experiment_proposal'],
    inputContract: 'SpecialistInput',
    outputContract: 'SpecialistOutput',
    enabledByDefault: false,
  },
  {
    name: 'engineering-agent',
    displayName: 'Engineering and Codex Agent',
    description: 'Future proposal-only specialist for engineering actions that continue through branch, tests, pull request, and owner approval.',
    implementationStatus: 'placeholder',
    riskBoundary: 'proposal_only',
    capabilities: ['engineering_recommendation', 'pull_request_proposal'],
    inputContract: 'SpecialistInput',
    outputContract: 'SpecialistOutput',
    enabledByDefault: false,
  },
] as const

validateAgentRegistrations(AGENT_REGISTRATIONS)

export function getAgentRegistration(name: string): AgentRegistration {
  const registration = AGENT_REGISTRATIONS.find((candidate) => candidate.name === name)
  if (!registration) throw new ContractValidationError(`Unknown agent registration: ${name}`)
  return registration
}

export function validateAgentRegistrations(registrations: readonly AgentRegistration[]): void {
  const names = new Set<string>()
  for (const registration of registrations) {
    if (!registration.name.trim() || !registration.displayName.trim() || !registration.description.trim()) {
      throw new ContractValidationError('Agent registration name, displayName, and description are required')
    }
    if (names.has(registration.name)) {
      throw new ContractValidationError(`Duplicate agent registration: ${registration.name}`)
    }
    if (registration.capabilities.length === 0) {
      throw new ContractValidationError(`Agent registration ${registration.name} requires at least one capability`)
    }
    names.add(registration.name)
  }
}
