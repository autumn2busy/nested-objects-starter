import type {
  CorrelationContext,
  IntelligenceSignal,
  MetricSnapshot,
  ProposedAction,
  SourceReference,
} from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import { createProposedAction } from '../policy.js'
import { stableUuid } from '../stable-id.js'
import type { GrowthAgentOutput, GrowthAnomaly } from './growth-agent.js'
import type { RevenueAgentOutput } from './revenue-agent.js'
import {
  deterministicResult,
  type DeterministicAgentResult,
  uniqueSourceReferences,
} from './specialist-contracts.js'

export interface MarketingAgentInput {
  revenue: RevenueAgentOutput
  growth: GrowthAgentOutput
  marketingMetrics: MetricSnapshot[]
  lifecycleSignals: IntelligenceSignal[]
  correlation: CorrelationContext
  observedAt?: string
}

export interface MarketingRecommendation {
  id: string
  recommendationType: 'lifecycle' | 'engagement' | 'conversion' | 'data_quality'
  title: string
  summary: string
  priority: number
  evidenceReferences: SourceReference[]
  sourceSignalIds: string[]
}

export interface MarketingExperimentProposal {
  id: string
  name: string
  hypothesis: string
  primaryMetric: string
  audienceDefinitionId: string
  minimumSampleSize: number
  minimumDurationDays: number
  guardrails: string[]
  evidenceReferences: SourceReference[]
}

export interface MarketingAudienceDefinition {
  id: string
  name: string
  inclusionRules: string[]
  exclusionRules: string[]
  containsDirectIdentifiers: false
}

export interface MarketingDraftCopy {
  id: string
  purpose: 'internal_review'
  headline: string
  body: string
  audienceDefinitionId: string
  requiresApprovalBeforeExternalUse: true
}

export interface MarketingAgentData extends Record<string, unknown> {
  recommendations: MarketingRecommendation[]
  experiments: MarketingExperimentProposal[]
  audiences: MarketingAudienceDefinition[]
  draftInternalCopy: MarketingDraftCopy[]
  financialTruthAgent: 'revenue-agent'
  financialSuccessDeclared: false
  activeCampaignMutationPerformed: false
}

export type MarketingAgentOutput = DeterministicAgentResult<MarketingAgentData>

export function runMarketingAgent(input: MarketingAgentInput): MarketingAgentOutput {
  if (input.marketingMetrics.length > 5_000) throw new ContractValidationError('Marketing metrics exceed the 5,000-record bound')
  if (input.lifecycleSignals.length > 2_000) throw new ContractValidationError('Lifecycle signals exceed the 2,000-record bound')
  const observedAt = input.observedAt ?? new Date().toISOString()
  const relevantLifecycle = input.lifecycleSignals
    .filter((signal) => signal.domain === 'marketing' && ['new', 'investigating'].includes(signal.status))
    .sort((left, right) => right.priority - left.priority)
  const marketingAnomalies = input.growth.data.anomalies.filter(isMarketingAnomaly)
  const sourceRefs = uniqueSourceReferences([
    ...input.marketingMetrics.flatMap(metricRefs),
    ...relevantLifecycle.flatMap((signal) => signal.sourceRefs),
    ...marketingAnomalies.flatMap((anomaly) => anomaly.evidenceReferences),
  ])
  const audiences = buildAudiences(relevantLifecycle, marketingAnomalies)
  const recommendations = buildRecommendations(relevantLifecycle, marketingAnomalies, input.marketingMetrics)
  const experiments = buildExperiments(marketingAnomalies, audiences)
  const draftInternalCopy = buildDraftCopy(experiments)
  const proposedActions = buildProposedActions(recommendations, experiments, input.correlation, observedAt)
  const signals = marketingAnomalies.map((anomaly) => marketingSignal(anomaly, input.correlation, observedAt))

  return deterministicResult({
    agentName: 'marketing-agent',
    status: recommendations.length === 0 && experiments.length === 0 ? 'quiet' : 'completed',
    summary: recommendations.length === 0 && experiments.length === 0
      ? 'No material marketing recommendation or experiment met the evidence threshold.'
      : `Prepared ${recommendations.length} recommendations and ${experiments.length} proposal-only experiments for review.`,
    data: {
      recommendations,
      experiments,
      audiences,
      draftInternalCopy,
      financialTruthAgent: 'revenue-agent',
      financialSuccessDeclared: false,
      activeCampaignMutationPerformed: false,
    },
    signals,
    recommendations: recommendations.map((recommendation) => ({
      id: recommendation.id,
      domain: 'marketing',
      title: recommendation.title,
      summary: recommendation.summary,
      priority: recommendation.priority,
      evidenceReferences: recommendation.evidenceReferences,
      signalIds: recommendation.sourceSignalIds,
      recommendedFollowUp: 'Review the proposal and its audience rules; no ActiveCampaign change has been made.',
      correlation: recommendation.sourceSignalIds[0]
        ? { ...input.correlation, causationId: recommendation.sourceSignalIds[0] }
        : input.correlation,
    })),
    proposedActions,
    autumnDecisions: proposedActions.filter((action) => action.approvalRequired).map((action) => ({
      id: stableUuid('marketing-agent-decision', action.id),
      decisionType: 'approve_action',
      title: `Review proposed ${action.actionType}`,
      summary: action.conciseRationale,
      priority: action.riskLevel === 'critical' ? 95 : action.riskLevel === 'high' ? 85 : 70,
      actionId: action.id,
      evidenceReferences: action.sourceRefs,
    })),
    evidence: [
      ...relevantLifecycle.flatMap((signal) => signal.evidence),
      ...input.growth.evidence.filter((item) => sourceRefs.some((sourceRef) => sameSource(sourceRef, item.sourceRef))),
    ],
    sourceRefs,
    conciseRationale: `Marketing diagnosis uses Growth Agent behavior and Revenue Agent's ${input.revenue.data.financialTruthSource} boundary; it produces drafts and proposals only.`,
    correlation: input.correlation,
  })
}

function buildRecommendations(
  lifecycleSignals: IntelligenceSignal[],
  anomalies: GrowthAnomaly[],
  metrics: MetricSnapshot[],
): MarketingRecommendation[] {
  const lifecycle = lifecycleSignals.map((signal) => ({
    id: stableUuid('marketing-recommendation', signal.fingerprint),
    recommendationType: 'lifecycle' as const,
    title: signal.title,
    summary: signal.recommendedFollowUp ?? signal.summary,
    priority: signal.priority,
    evidenceReferences: signal.sourceRefs,
    sourceSignalIds: [signal.id],
  }))
  const anomalyRecommendations = anomalies.map((anomaly) => ({
    id: stableUuid('marketing-recommendation', anomaly.id),
    recommendationType: anomaly.category === 'paywall' ? 'conversion' as const : 'engagement' as const,
    title: `Review ${anomaly.metric} ${anomaly.direction}`,
    summary: 'Segment the observed behavior and test a bounded response; do not infer revenue impact without Revenue Agent evidence.',
    priority: anomaly.priority,
    evidenceReferences: anomaly.evidenceReferences,
    sourceSignalIds: [anomaly.signalId],
  }))
  const dataQuality = metrics
    .filter((metric) => metric.valueState === 'unknown' || metric.confidence < 0.7 || metric.completeness < 0.8)
    .map((metric) => ({
      id: stableUuid('marketing-recommendation', `quality:${metric.metricName}:${metric.metricDate}`),
      recommendationType: 'data_quality' as const,
      title: `${metric.metricName} is not decision-ready`,
      summary: 'Repair or validate the read-only marketing metric before using it to target an audience.',
      priority: 60,
      evidenceReferences: metricRefs(metric),
      sourceSignalIds: [],
    }))
  return [...lifecycle, ...anomalyRecommendations, ...dataQuality]
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 20)
}

function buildAudiences(
  lifecycleSignals: IntelligenceSignal[],
  anomalies: GrowthAnomaly[],
): MarketingAudienceDefinition[] {
  const audiences: MarketingAudienceDefinition[] = []
  if (lifecycleSignals.length > 0) {
    audiences.push({
      id: stableUuid('marketing-audience', 'lifecycle-review'),
      name: 'Lifecycle state requiring review',
      inclusionRules: ['Has an unresolved, evidence-backed marketing lifecycle signal'],
      exclusionRules: ['Internal contacts', 'Test contacts', 'Unknown identity collisions', 'Any record without owner-reviewed source access'],
      containsDirectIdentifiers: false,
    })
  }
  if (anomalies.some((anomaly) => anomaly.category === 'paywall' || anomaly.category === 'signup_upgrade')) {
    audiences.push({
      id: stableUuid('marketing-audience', 'high-intent-no-confirmed-upgrade'),
      name: 'High intent without confirmed upgrade',
      inclusionRules: ['Aggregate paywall or upgrade-intent behavior is elevated', 'No confirmed authoritative upgrade is attributed'],
      exclusionRules: ['Already-paid members', 'Canceled members', 'Internal contacts', 'Test contacts'],
      containsDirectIdentifiers: false,
    })
  }
  return audiences
}

function buildExperiments(
  anomalies: GrowthAnomaly[],
  audiences: MarketingAudienceDefinition[],
): MarketingExperimentProposal[] {
  const audience = audiences.find((candidate) => candidate.name === 'High intent without confirmed upgrade')
  if (!audience) return []
  const anomaly = anomalies.find((candidate) => candidate.category === 'paywall' || candidate.category === 'signup_upgrade')
  if (!anomaly) return []
  return [{
    id: stableUuid('marketing-experiment', `${anomaly.id}:${audience.id}`),
    name: 'High-intent value-message experiment',
    hypothesis: 'A clearer field-inspector value explanation may improve confirmed upgrades among aggregate high-intent visitors.',
    primaryMetric: 'subscriptions.upgraded.confirmed',
    audienceDefinitionId: audience.id,
    minimumSampleSize: 100,
    minimumDurationDays: 14,
    guardrails: ['No pricing change', 'No entitlement change', 'No send without Autumn approval', 'Use authoritative upgrade events only'],
    evidenceReferences: anomaly.evidenceReferences,
  }]
}

function buildDraftCopy(experiments: MarketingExperimentProposal[]): MarketingDraftCopy[] {
  return experiments.map((experiment) => ({
    id: stableUuid('marketing-copy-draft', experiment.id),
    purpose: 'internal_review',
    headline: 'See what the field-inspector membership includes',
    body: 'Review the current membership benefits and decide whether the directory and field resources fit your work.',
    audienceDefinitionId: experiment.audienceDefinitionId,
    requiresApprovalBeforeExternalUse: true,
  }))
}

function buildProposedActions(
  recommendations: MarketingRecommendation[],
  experiments: MarketingExperimentProposal[],
  correlation: CorrelationContext,
  now: string,
): ProposedAction[] {
  const actions: ProposedAction[] = []
  for (const recommendation of recommendations.filter((item) => item.recommendationType === 'lifecycle').slice(0, 5)) {
    const action = createProposedAction({
      actionType: 'activecampaign.change_campaign',
      targetSystem: 'activecampaign',
      requestedByAgent: 'marketing-agent',
      signalIds: recommendation.sourceSignalIds,
      payload: {
        operation: 'review_lifecycle_routing',
        recommendationId: recommendation.id,
        directContactIdentifiers: [],
        mutationAllowed: false,
      },
      evidence: [],
      sourceRefs: recommendation.evidenceReferences,
      conciseRationale: recommendation.summary,
      idempotencyKey: `marketing-action:${recommendation.id}`,
      correlation,
      now,
    })
    actions.push({ ...action, id: stableUuid('marketing-proposed-action', action.idempotencyKey) })
  }
  for (const experiment of experiments) {
    const action = createProposedAction({
      actionType: 'internal.record_recommendation',
      targetSystem: 'intelligence-os',
      requestedByAgent: 'marketing-agent',
      experimentId: experiment.id,
      payload: { experimentProposalId: experiment.id, mutationAllowed: false },
      evidence: [],
      sourceRefs: experiment.evidenceReferences,
      conciseRationale: `Record ${experiment.name} as a proposal for operating review.`,
      idempotencyKey: `marketing-action:${experiment.id}`,
      correlation,
      now,
    })
    actions.push({ ...action, id: stableUuid('marketing-proposed-action', action.idempotencyKey) })
  }
  return actions
}

function marketingSignal(
  anomaly: GrowthAnomaly,
  correlation: CorrelationContext,
  detectedAt: string,
): IntelligenceSignal {
  const fingerprint = `marketing:${anomaly.id}`
  return {
    id: stableUuid('marketing-agent-signal', fingerprint),
    signalType: 'marketing.behavior_anomaly',
    domain: 'marketing',
    producer: 'marketing-agent',
    title: `${anomaly.metric} requires marketing diagnosis`,
    summary: 'Growth Agent detected a material behavioral change; marketing impact and financial success are not independently asserted.',
    evidence: anomaly.evidenceReferences.map((sourceRef) => ({
      evidenceType: 'metric',
      summary: `${anomaly.metric} ${anomaly.direction}.`,
      sourceRef,
      value: { absoluteChange: anomaly.absoluteChange, relativeChange: anomaly.relativeChange },
      confidence: anomaly.confidence,
    })),
    sourceRefs: anomaly.evidenceReferences,
    confidence: anomaly.confidence,
    severity: anomaly.priority >= 85 ? 'high' : 'medium',
    priority: anomaly.priority,
    businessImpact: 'Behavioral funnel performance may have changed; authoritative financial impact remains with Revenue Agent.',
    affectedEntities: [{ entityType: 'metric', metricName: anomaly.metric, scopeKey: anomaly.scopeKey }],
    recommendedFollowUp: 'Review the proposed audience and experiment before any campaign change.',
    fingerprint,
    idempotencyKey: `signal:${fingerprint}`,
    status: 'new',
    firstDetectedAt: detectedAt,
    lastDetectedAt: detectedAt,
    correlation: { ...correlation, causationId: anomaly.signalId },
  }
}

function isMarketingAnomaly(anomaly: GrowthAnomaly): boolean {
  return ['marketing_engagement', 'acquisition_source', 'paywall', 'signup_upgrade', 'trial'].includes(anomaly.category)
}

function metricRefs(metric: MetricSnapshot): SourceReference[] {
  return metric.sourceRefs.length > 0 ? metric.sourceRefs : [{
    sourceSystem: metric.sourceSystem,
    sourceType: 'business_metric_daily',
    sourceId: `${metric.metricDate}:${metric.metricName}:${metric.scopeKey}`,
    ...(metric.observedAt ? { observedAt: metric.observedAt } : {}),
  }]
}

function sameSource(left: SourceReference, right: SourceReference): boolean {
  return left.sourceSystem === right.sourceSystem
    && left.sourceType === right.sourceType
    && left.sourceId === right.sourceId
}
