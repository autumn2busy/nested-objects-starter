import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const paths = {
  contracts: 'src/agents/specialist-contracts.ts',
  revenue: 'src/agents/revenue-agent.ts',
  growth: 'src/agents/growth-agent.ts',
  industry: 'src/agents/industry-intelligence-agent.ts',
  marketing: 'src/agents/marketing-agent.ts',
  orchestrator: 'src/agents/operations-orchestrator.ts',
  registry: 'src/agents/registry.ts',
  lifecycle: 'src/workflows/lifecycle-integrity.ts',
  tests: 'test/core-specialists.test.mjs',
}
const sources = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, relativePath]) => [
  key,
  await readFile(path.join(root, relativePath), 'utf8'),
])))
const failures = []

requireFragments('contracts', sources.contracts, [
  "CORE_AGENT_VERSION = 'phase-c4-v1'",
  'inputTokens: null',
  'outputTokens: null',
  'estimatedCost: null',
  'modelUsed: false',
  'mutationsPerformed: false',
])
requireFragments('Revenue Agent', sources.revenue, [
  'runRevenueAgent',
  'currentValue: number | null',
  'comparisonValue: number | null',
  'delta: number | null',
  "financialTruthSource: 'normalized_metrics_only'",
  'isNonAuthoritativeFinancialMetric',
  "return 'non_authoritative'",
])
requireFragments('Growth Agent', sources.growth, [
  'runGrowthAgent',
  'currentWeek: GrowthPeriodValue',
  'priorWeek: GrowthPeriodValue',
  'trailingFourWeeks: GrowthPeriodValue',
  'trailingTwelveWeeks: GrowthPeriodValue',
  "financialTruthAgent: 'revenue-agent'",
  'detectAnomaly',
  'defaultAggregation',
])
requireFragments('Industry Intelligence Agent', sources.industry, [
  'runIndustryIntelligenceAgent',
  'publicationDate: string',
  'eventDate: string | null',
  'licensingCaveat: string',
  'approvedReadOnlyToolConfigured',
  'routedToOrchestrator',
  'liveResearchPerformed: false',
])
requireFragments('Marketing Agent', sources.marketing, [
  'runMarketingAgent',
  "financialTruthAgent: 'revenue-agent'",
  'financialSuccessDeclared: false',
  'activeCampaignMutationPerformed: false',
  'requiresApprovalBeforeExternalUse: true',
  "actionType: 'activecampaign.change_campaign'",
  'mutationAllowed: false',
])
requireFragments('Operations Orchestrator', sources.orchestrator, [
  'runOperationsOrchestrator',
  'OperationsOrchestratorStateStore',
  'InMemoryOperationsOrchestratorStateStore',
  'runRevenueAgent',
  'runGrowthAgent',
  'runIndustryIntelligenceAgent',
  'runMarketingAgent',
  'Math.min(3, input.maximumPriorities ?? 3)',
  'enforceActionPolicy',
  'byMetricSubject',
  'mergeMetrics(input.specialists.growth.metrics, input.persistedMetrics)',
  'hasOpenTask',
  'hasCurrentExperiment',
  'hasCurrentAction',
  'await input.stateStore.persist(operationalState)',
  "status === 'quiet'",
])
requireFragments('lifecycle access integrity', sources.lifecycle, [
  'isAccessEnabled(input.productAccess.accessStatus)',
  "['active', 'enabled', 'granted', 'current'].includes(normalized)",
])
requireFragments('tests', sources.tests, [
  'preserves unknown financial values and rejects ActiveCampaign as financial truth',
  'trailing four and twelve weeks',
  'only drafts or proposes actions',
  'ranks at most three priorities',
  'stays quiet when no meaningful evidence exists',
])

const implementedCoreNames = [
  'operations-orchestrator',
  'revenue-agent',
  'growth-agent',
  'industry-intelligence-agent',
  'marketing-agent',
]
for (const name of implementedCoreNames) {
  const registrationStart = sources.registry.indexOf(`name: '${name}'`)
  const nextRegistration = sources.registry.indexOf("name: '", registrationStart + 7)
  const registration = sources.registry.slice(registrationStart, nextRegistration < 0 ? undefined : nextRegistration)
  if (registrationStart < 0 || !registration.includes("implementationStatus: 'implemented'")) {
    failures.push(`Core registration is not implemented: ${name}`)
  }
}

for (const [label, source] of Object.entries(sources)) {
  if (['tests', 'registry', 'lifecycle'].includes(label)) continue
  for (const forbidden of [
    'fetch(',
    'executeApprovedAction',
    'persistPrivateReasoning: true',
    'modelUsed: true',
    'mutationsPerformed: true',
  ]) {
    if (source.includes(forbidden)) failures.push(`${label} contains forbidden core-agent capability: ${forbidden}`)
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Static Phase C4 typed specialists, deterministic analysis, proposal-only, and quiet-orchestrator checks passed.')
}

function requireFragments(label, source, fragments) {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${label} is missing required fragment: ${fragment}`)
  }
}
