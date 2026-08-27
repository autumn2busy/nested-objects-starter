import type {
  CorrelationContext,
  IntelligenceSignal,
  MetricSnapshot,
  ProposedAction,
  SourceReference,
} from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import { stableUuid } from '../stable-id.js'
import {
  classifyMarketingContact,
  type ActiveCampaignContactSnapshot,
  type AuthoritativeMembershipTruth,
  type MarketingClassificationConfig,
  type MarketingContactClassificationResult,
} from './activecampaign-audit.js'
import type {
  SensorIngestionBatch,
  SensorObservation,
  SensorProvenanceMode,
  SensorSourceHealth,
} from './contracts.js'
import { checksumFor } from './report-adapters.js'

export type ActiveCampaignReadResource =
  | 'contact_inventory'
  | 'automation'
  | 'campaign'
  | 'list'
  | 'tag'
  | 'field'

export interface ActiveCampaignReadScope {
  resourceType: ActiveCampaignReadResource
  externalId: string
  readAllowed: true
}

export interface OwnerReviewedActiveCampaignAllowlist {
  reviewId: string
  reviewedBy: string
  reviewedAt: string
  accountId: string
  accountHostname: string
  scopes: ActiveCampaignReadScope[]
  mutationAllowed: false
}

export interface ActiveCampaignReadRequest {
  method: 'GET'
  url: string
  headers: Readonly<{ 'Api-Token': string; Accept: 'application/json' }>
  signal: AbortSignal
}

export interface ActiveCampaignReadResponse {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export type ActiveCampaignReadTransport = (
  request: ActiveCampaignReadRequest,
) => Promise<ActiveCampaignReadResponse>

export interface ActiveCampaignReadPage {
  resourceType: ActiveCampaignReadResource
  externalId: string
  offset: number
  limit: number
  body: unknown
  sourceRef: SourceReference
}

export class ActiveCampaignReadOnlyClient {
  private readonly baseUrl: URL
  private readonly scopes: Set<string>

  constructor(private readonly configuration: {
    baseUrl: string
    apiToken: string
    allowlist: OwnerReviewedActiveCampaignAllowlist
    transport?: ActiveCampaignReadTransport
    timeoutMs?: number
  }) {
    this.baseUrl = assertActiveCampaignBaseUrl(configuration.baseUrl)
    assertAllowlist(configuration.allowlist)
    if (this.baseUrl.hostname.toLowerCase() !== configuration.allowlist.accountHostname.toLowerCase()) {
      throw new ActiveCampaignReadBoundaryError('ActiveCampaign base URL does not match the owner-reviewed account hostname')
    }
    if (configuration.apiToken.trim().length < 20) {
      throw new ActiveCampaignReadBoundaryError('ActiveCampaign API token is missing or too short')
    }
    this.scopes = new Set(configuration.allowlist.scopes.map(scopeKey))
  }

  async readPage(input: {
    resourceType: ActiveCampaignReadResource
    externalId: string
    offset?: number
    limit?: number
    observedAt: string
  }): Promise<ActiveCampaignReadPage> {
    const externalId = input.externalId.trim()
    if (!externalId || !this.scopes.has(scopeKey({
      resourceType: input.resourceType,
      externalId,
      readAllowed: true,
    }))) {
      throw new ActiveCampaignReadBoundaryError('ActiveCampaign read scope is not owner-allowlisted')
    }
    const offset = input.offset ?? 0
    const limit = input.limit ?? 100
    if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ActiveCampaignReadBoundaryError('ActiveCampaign pagination must use offset >= 0 and limit 1..100')
    }
    if (!Number.isFinite(Date.parse(input.observedAt))) {
      throw new ActiveCampaignReadBoundaryError('ActiveCampaign observedAt must be a valid timestamp')
    }

    const url = endpointFor(this.baseUrl, input.resourceType, externalId)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('offset', String(offset))
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.configuration.timeoutMs ?? 15_000)
    try {
      const response = await (this.configuration.transport ?? defaultTransport)({
        method: 'GET',
        url: url.toString(),
        headers: { 'Api-Token': this.configuration.apiToken, Accept: 'application/json' },
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new ActiveCampaignReadBoundaryError(`ActiveCampaign GET returned ${response.status}`, {
          status: response.status,
          resourceType: input.resourceType,
        })
      }
      return {
        resourceType: input.resourceType,
        externalId,
        offset,
        limit,
        body: await response.json(),
        sourceRef: {
          sourceSystem: 'activecampaign',
          sourceType: input.resourceType,
          sourceId: externalId,
          observedAt: input.observedAt,
          metadata: {
            method: 'GET',
            ownerReviewId: this.configuration.allowlist.reviewId,
            mutationAllowed: false,
          },
        },
      }
    } catch (error) {
      if (error instanceof ActiveCampaignReadBoundaryError) throw error
      throw new ActiveCampaignReadBoundaryError('ActiveCampaign GET failed inside the bounded read-only adapter', {
        resourceType: input.resourceType,
        retryable: true,
      })
    } finally {
      clearTimeout(timeout)
    }
  }
}

export interface ActiveCampaignAutomationObservation {
  automationId: string
  lifecycleRole:
    | 'free_nurture'
    | 'paid_nurture'
    | 'member_onboarding'
    | 'upgrade_sequence'
    | 'reengagement'
    | 'other'
  active: boolean
  lastActivityAt: string | null
  contactIds: string[]
}

export interface ActiveCampaignContactAuditObservation {
  contact: ActiveCampaignContactSnapshot
  membership: AuthoritativeMembershipTruth | null
  planLabel: string | null
  automationIds: string[]
  onboardingEnteredAt: string | null
  purchaseObservedAt: string | null
  currentEngagementCount: number | null
  priorEngagementCount: number | null
  highIntentScore: number | null
}

export interface ActiveCampaignReadOnlySensorInput {
  sensorRunId: string
  provenanceMode: Extract<SensorProvenanceMode, 'live' | 'fixture'>
  observedAt: string
  contacts: ActiveCampaignContactAuditObservation[]
  automations: ActiveCampaignAutomationObservation[]
  marketingConfig: MarketingClassificationConfig
  ownerAllowlist: OwnerReviewedActiveCampaignAllowlist
  correlation: CorrelationContext
}

export interface ActiveCampaignReadOnlySensorResult {
  sensorRunId: string
  observedAt: string
  mutationAllowed: false
  classifications: MarketingContactClassificationResult[]
  metrics: MetricSnapshot[]
  signals: IntelligenceSignal[]
  proposedActions: ProposedAction[]
  sourceHealth: SensorSourceHealth[]
  checksum: string
  ingestionBatch: SensorIngestionBatch
  correlation: CorrelationContext
}

interface Finding {
  findingType: string
  title: string
  summary: string
  severity: IntelligenceSignal['severity']
  priority: number
  contactId: string | null
  automationIds: string[]
  sourceRefs: SourceReference[]
  actionRecommended: boolean
}

export function runActiveCampaignReadOnlySensor(
  input: ActiveCampaignReadOnlySensorInput,
): ActiveCampaignReadOnlySensorResult {
  assertSensorInput(input)
  const allowedAutomationIds = new Set(input.ownerAllowlist.scopes
    .filter((scope) => scope.resourceType === 'automation')
    .map((scope) => scope.externalId))
  const automations = input.automations.filter((automation) => allowedAutomationIds.has(automation.automationId))
  const automationById = new Map(automations.map((automation) => [automation.automationId, automation]))
  const classifications = input.contacts.map((observation) => classifyMarketingContact({
    contact: observation.contact,
    membership: observation.membership,
    config: input.marketingConfig,
    correlation: input.correlation,
  }))
  const classificationByContactId = new Map(classifications.map((classification) => [
    classification.sourceContactId,
    classification,
  ]))
  const findings = [
    ...input.contacts.flatMap((contact) => contactFindings(
      contact,
      classificationByContactId.get(contact.contact.contactId) as MarketingContactClassificationResult,
      automationById,
      input.observedAt,
    )),
    ...automationFindings(automations, input.observedAt),
  ]
  const signals = findings.map((finding) => findingSignal(finding, input))
  const proposedActions = findings
    .filter((finding) => finding.actionRecommended)
    .slice(0, 50)
    .map((finding) => findingAction(finding, signals, input))
  const checksum = checksumFor({
    contacts: classifications.map((classification) => ({
      sourceContactId: classification.sourceContactId,
      canonicalMemberId: classification.canonicalMemberId,
      classification: classification.classification,
      engagementState: classification.engagementState,
      membershipTruthState: classification.membershipTruthState,
      excludedFromMarketingAnalysis: classification.excludedFromMarketingAnalysis,
      recommendedDisposition: classification.recommendedDisposition,
    })).sort((left, right) => left.sourceContactId.localeCompare(right.sourceContactId)),
    automations: automations.map((item) => ({
      automationId: item.automationId,
      lifecycleRole: item.lifecycleRole,
      active: item.active,
      lastActivityAt: item.lastActivityAt,
      observedContactCount: item.contactIds.length,
    })).sort((left, right) => left.automationId.localeCompare(right.automationId)),
    findingFingerprints: signals.map((signal) => signal.fingerprint).sort(),
  })
  const durableSensorRunId = stableUuid('nested-objects-sensor-run', `activecampaign-readonly:${input.sensorRunId}:${checksum}`)
  const metrics = marketingMetrics(input, findings, durableSensorRunId)
  const sourceHealth: SensorSourceHealth[] = [{
    sourceId: 'activecampaign:owner-allowlisted-readonly',
    status: 'healthy',
    detail: `Analyzed ${input.contacts.length} contact observations and ${automations.length} owner-allowlisted automation observations through a mutation-free fixture/adapter boundary.`,
    observedAt: input.observedAt,
    recordCount: input.contacts.length + automations.length,
    staleAfterHours: 24,
    errorCode: null,
  }]
  const observations = activeCampaignObservations(
    input,
    durableSensorRunId,
    classifications,
    automations,
    sourceHealth,
  )
  const ingestionBatch: SensorIngestionBatch = {
    sensorName: 'activecampaign-readonly',
    sensorRunId: durableSensorRunId,
    provenanceMode: input.provenanceMode,
    observedAt: input.observedAt,
    sourceGeneratedAt: input.observedAt,
    checksum,
    healthStatus: 'healthy',
    sourceHealth,
    observations,
    metrics,
    signals,
    candidateActions: proposedActions.map((action) => ({
      actionType: action.actionType,
      targetSystem: action.targetSystem,
      payload: action.payload,
      conciseRationale: action.conciseRationale,
      correlation: action.correlation,
    })),
    idempotencyKey: `sensor-run:activecampaign-readonly:${durableSensorRunId}`,
    correlation: input.correlation,
  }
  return {
    sensorRunId: durableSensorRunId,
    observedAt: input.observedAt,
    mutationAllowed: false,
    classifications,
    metrics,
    signals,
    proposedActions,
    sourceHealth,
    checksum,
    ingestionBatch,
    correlation: input.correlation,
  }
}

function contactFindings(
  observation: ActiveCampaignContactAuditObservation,
  classification: MarketingContactClassificationResult,
  automationById: Map<string, ActiveCampaignAutomationObservation>,
  observedAt: string,
): Finding[] {
  const contactId = observation.contact.contactId
  const sourceRef: SourceReference = {
    sourceSystem: 'activecampaign',
    sourceType: 'contact_audit',
    sourceId: contactId,
    observedAt,
  }
  const activeAutomations = observation.automationIds
    .map((automationId) => automationById.get(automationId))
    .filter((automation): automation is ActiveCampaignAutomationObservation => Boolean(automation?.active))
  const activeRoles = activeAutomations.map((automation) => automation.lifecycleRole)
  const automationIds = activeAutomations.map((automation) => automation.automationId)
  const membershipTier = normalizeTier(observation.membership?.membershipTier)
  const membershipStatus = normalizeStatus(observation.membership?.membershipStatus)
  const planLabel = normalizeTier(observation.planLabel)
  const paidRoles = new Set(['paid_nurture', 'member_onboarding'])
  const findings: Finding[] = []
  const add = (finding: Omit<Finding, 'contactId' | 'automationIds' | 'sourceRefs'>) => findings.push({
    ...finding,
    contactId,
    automationIds,
    sourceRefs: [sourceRef],
  })

  if (isPaidTier(membershipTier) && planLabel === 'free') {
    add({
      findingType: 'paid_member_labeled_free',
      title: 'Paid member is labeled Free in ActiveCampaign',
      summary: 'Authoritative membership is paid while the read-only marketing plan label is Free.',
      severity: 'high',
      priority: 90,
      actionRecommended: true,
    })
  }
  if (membershipStatus === 'canceled' && activeRoles.some((role) => paidRoles.has(role))) {
    add({
      findingType: 'canceled_member_in_paid_nurture',
      title: 'Canceled member remains in paid nurture',
      summary: 'Authoritative membership is canceled while an owner-allowlisted paid lifecycle automation is still active.',
      severity: 'high',
      priority: 92,
      actionRecommended: true,
    })
  }
  if (membershipTier === 'free' && activeRoles.some((role) => paidRoles.has(role))) {
    add({
      findingType: 'free_member_in_paid_automation',
      title: 'Free member appears in a paid lifecycle automation',
      summary: 'Authoritative membership is Free while a paid nurture or onboarding automation is active.',
      severity: 'high',
      priority: 88,
      actionRecommended: true,
    })
  }
  if (
    observation.membership
    && membershipStatus === 'active'
    && !observation.onboardingEnteredAt
    && hoursSince(observation.contact.createdAt, observedAt) >= 24
  ) {
    add({
      findingType: 'member_missing_onboarding',
      title: 'Active member is missing onboarding',
      summary: 'No onboarding entry is observed after the 24-hour grace period.',
      severity: 'medium',
      priority: 75,
      actionRecommended: true,
    })
  }
  if (isPaidTier(membershipTier) && activeRoles.includes('upgrade_sequence') && observation.purchaseObservedAt) {
    add({
      findingType: 'upgrade_sequence_after_purchase',
      title: 'Upgrade sequence continues after purchase',
      summary: 'A paid member remains in an owner-allowlisted upgrade sequence after a recorded purchase.',
      severity: 'high',
      priority: 87,
      actionRecommended: true,
    })
  }
  const lifecycleRoles = activeRoles.filter((role) => role !== 'other')
  if (new Set(lifecycleRoles).size < lifecycleRoles.length || conflictingLifecycleRoles(lifecycleRoles)) {
    add({
      findingType: 'overlapping_lifecycle_automations',
      title: 'Contact has overlapping lifecycle automations',
      summary: 'Multiple owner-allowlisted automations represent duplicate or conflicting lifecycle roles.',
      severity: 'high',
      priority: 82,
      actionRecommended: true,
    })
  }
  if (
    observation.currentEngagementCount !== null
    && observation.priorEngagementCount !== null
    && observation.priorEngagementCount >= 5
    && observation.currentEngagementCount < observation.priorEngagementCount * 0.7
  ) {
    add({
      findingType: 'engagement_decline',
      title: 'Contact engagement declined materially',
      summary: 'Current bounded engagement is more than 30% below the prior comparison window.',
      severity: 'medium',
      priority: 65,
      actionRecommended: false,
    })
  }
  if (observation.contact.bounced || observation.contact.unsubscribed) {
    add({
      findingType: 'deliverability_risk',
      title: 'Contact has deliverability risk',
      summary: 'The read-only contact snapshot records a bounce or unsubscribe state.',
      severity: 'high',
      priority: 85,
      actionRecommended: true,
    })
  }
  if ((observation.highIntentScore ?? 0) >= 0.8) {
    add({
      findingType: 'high_intent_segment',
      title: 'Contact meets the high-intent evidence threshold',
      summary: 'The bounded engagement score meets the configured high-intent threshold; this is not membership or revenue truth.',
      severity: 'low',
      priority: 60,
      actionRecommended: false,
    })
  }
  if (classification.classification === 'cold_import' && classification.engagementState === 'never_engaged') {
    add({
      findingType: 'cold_never_engaged_contact',
      title: 'Cold imported contact has never engaged',
      summary: 'Read-only classification identifies a cold import with no observed engagement.',
      severity: 'medium',
      priority: 70,
      actionRecommended: true,
    })
  }
  if (classification.classification === 'internal') {
    add({
      findingType: 'internal_activecampaign_contact',
      title: 'Internal ActiveCampaign contact is excluded from business analysis',
      summary: 'The contact belongs to an internal domain and is excluded unless explicitly approved.',
      severity: 'medium',
      priority: 72,
      actionRecommended: true,
    })
  }
  return findings
}

function automationFindings(
  automations: ActiveCampaignAutomationObservation[],
  observedAt: string,
): Finding[] {
  return automations.flatMap((automation) => {
    if (!automation.active || hoursSince(automation.lastActivityAt, observedAt) < 24 * 90) return []
    const sourceRef: SourceReference = {
      sourceSystem: 'activecampaign',
      sourceType: 'automation',
      sourceId: automation.automationId,
      observedAt,
    }
    return [{
      findingType: 'stale_automation',
      title: 'ActiveCampaign automation appears stale',
      summary: 'An owner-allowlisted active automation has no recorded activity within 90 days.',
      severity: 'medium' as const,
      priority: 68,
      contactId: null,
      automationIds: [automation.automationId],
      sourceRefs: [sourceRef],
      actionRecommended: true,
    }]
  })
}

function findingSignal(
  finding: Finding,
  input: ActiveCampaignReadOnlySensorInput,
): IntelligenceSignal {
  const fingerprint = `activecampaign-audit:${finding.findingType}:${finding.contactId ?? 'account'}:${finding.automationIds.slice().sort().join(',') || 'none'}`
  return {
    id: stableUuid('nested-objects-intelligence-signal', fingerprint),
    signalType: `marketing.${finding.findingType}`,
    domain: 'marketing',
    producer: 'activecampaign-readonly',
    title: finding.title,
    summary: finding.summary,
    evidence: finding.sourceRefs.map((sourceRef) => ({
      evidenceType: 'observation',
      summary: 'GET-only ActiveCampaign sensor evidence using stable external IDs.',
      sourceRef,
      value: {
        contactId: finding.contactId,
        automationIds: finding.automationIds,
        mutationAllowed: false,
      },
      confidence: 1,
    })),
    sourceRefs: finding.sourceRefs,
    confidence: 1,
    severity: finding.severity,
    priority: finding.priority,
    businessImpact: 'Lifecycle treatment, engagement interpretation, or deliverability hygiene may require owner review.',
    affectedEntities: [
      ...(finding.contactId ? [{ entityType: 'activecampaign_contact', sourceContactId: finding.contactId }] : []),
      ...finding.automationIds.map((automationId) => ({ entityType: 'activecampaign_automation', externalId: automationId })),
    ],
    recommendedFollowUp: finding.actionRecommended
      ? 'Review the proposed cleanup action and exact stable IDs; no mutation is authorized.'
      : 'Review the evidence before changing targeting or lifecycle state.',
    fingerprint,
    idempotencyKey: `signal:${fingerprint}`,
    status: 'new',
    firstDetectedAt: input.observedAt,
    lastDetectedAt: input.observedAt,
    correlation: input.correlation,
  }
}

function findingAction(
  finding: Finding,
  signals: IntelligenceSignal[],
  input: ActiveCampaignReadOnlySensorInput,
): ProposedAction {
  const signal = signals.find((candidate) => candidate.signalType === `marketing.${finding.findingType}`
    && candidate.affectedEntities.some((entity) => entity.sourceContactId === finding.contactId))
    ?? signals.find((candidate) => candidate.signalType === `marketing.${finding.findingType}`) as IntelligenceSignal
  const idempotencyKey = `activecampaign-cleanup-proposal:${signal.fingerprint}`
  return {
    id: stableUuid('nested-objects-agent-action', idempotencyKey),
    actionType: 'activecampaign.review_cleanup',
    targetSystem: 'activecampaign',
    requestedByAgent: 'activecampaign-readonly',
    taskId: null,
    runId: null,
    experimentId: null,
    signalIds: [signal.id],
    payload: {
      findingType: finding.findingType,
      contactId: finding.contactId,
      automationIds: finding.automationIds,
      ownerAllowlistReviewId: input.ownerAllowlist.reviewId,
      mutationAllowed: false,
    },
    evidence: signal.evidence,
    sourceRefs: signal.sourceRefs,
    conciseRationale: `${finding.summary} Autumn must review the exact cleanup target; approval will not execute it.`,
    riskLevel: 'high',
    approvalRequired: true,
    status: 'proposed',
    approval: null,
    rejection: null,
    executorKey: null,
    executionGuardVersion: 'phase-c6-no-executor-v1',
    executionStartedAt: null,
    executedAt: null,
    executionResult: null,
    verificationStatus: 'not_started',
    verifiedAt: null,
    idempotencyKey,
    createdAt: input.observedAt,
    updatedAt: input.observedAt,
    correlation: input.correlation,
  }
}

function marketingMetrics(
  input: ActiveCampaignReadOnlySensorInput,
  findings: Finding[],
  sensorRunId: string,
): MetricSnapshot[] {
  const metricDate = input.observedAt.slice(0, 10)
  const metrics = [
    ['marketing.contacts.audited', input.contacts.length, 'contacts'],
    ['marketing.automations.allowlisted_observed', input.automations.length, 'automations'],
    ['marketing.integrity_findings', findings.length, 'findings'],
    ['marketing.deliverability_risk_contacts', findings.filter((item) => item.findingType === 'deliverability_risk').length, 'contacts'],
    ['marketing.high_intent_contacts', findings.filter((item) => item.findingType === 'high_intent_segment').length, 'contacts'],
  ] as const
  return metrics.map(([metricName, value, unit]) => {
    const idempotencyKey = `metric:${metricDate}:${metricName}:global:${sensorRunId}`
    const sourceRef: SourceReference = {
      sourceSystem: 'activecampaign',
      sourceType: 'readonly_sensor_run',
      sourceId: sensorRunId,
      observedAt: input.observedAt,
    }
    return {
      metricDate,
      metricName,
      domain: 'marketing' as const,
      scopeKey: 'global',
      dimensions: { authority: 'marketing_only', mutationAllowed: false },
      value,
      valueState: 'known' as const,
      unit,
      numerator: null,
      denominator: null,
      observedRecords: input.contacts.length,
      expectedRecords: null,
      completeness: 1,
      confidence: 1,
      sourceSystem: 'activecampaign',
      sourceRunId: sensorRunId,
      sourceRefs: [sourceRef],
      provenance: {
        sensor: 'activecampaign-readonly',
        membershipAuthority: false,
        revenueAuthority: false,
        mutationAllowed: false,
      },
      idempotencyKey,
      observedAt: input.observedAt,
      correlation: input.correlation,
    }
  })
}

function activeCampaignObservations(
  input: ActiveCampaignReadOnlySensorInput,
  sensorRunId: string,
  classifications: MarketingContactClassificationResult[],
  automations: ActiveCampaignAutomationObservation[],
  sourceHealth: SensorSourceHealth[],
): SensorObservation[] {
  const contactObservations = classifications.map((classification) => {
    const payload = {
      classification: classification.classification,
      engagementState: classification.engagementState,
      membershipTruthState: classification.membershipTruthState,
      canonicalMemberId: classification.canonicalMemberId,
      excludedFromMarketingAnalysis: classification.excludedFromMarketingAnalysis,
      exclusionReason: classification.exclusionReason,
      confidence: classification.confidence,
      recommendedDisposition: classification.recommendedDisposition,
      mutationAllowed: false,
    }
    return sensorObservation({
      sensorRunId,
      observationType: 'marketing_contact_classification',
      sourceRecordId: classification.sourceContactId,
      provenanceMode: input.provenanceMode,
      observedAt: input.observedAt,
      payload,
      sourceRefs: classification.sourceRefs,
      sourceHealth,
      correlation: input.correlation,
    })
  })
  const automationObservations = automations.map((automation) => {
    const payload = {
      lifecycleRole: automation.lifecycleRole,
      active: automation.active,
      lastActivityAt: automation.lastActivityAt,
      observedContactCount: automation.contactIds.length,
      ownerAllowlistReviewId: input.ownerAllowlist.reviewId,
      mutationAllowed: false,
    }
    return sensorObservation({
      sensorRunId,
      observationType: 'activecampaign_automation_state',
      sourceRecordId: automation.automationId,
      provenanceMode: input.provenanceMode,
      observedAt: input.observedAt,
      payload,
      sourceRefs: [{
        sourceSystem: 'activecampaign',
        sourceType: 'automation',
        sourceId: automation.automationId,
        observedAt: input.observedAt,
        metadata: {
          ownerAllowlistReviewId: input.ownerAllowlist.reviewId,
          method: 'GET',
          mutationAllowed: false,
        },
      }],
      sourceHealth,
      correlation: input.correlation,
    })
  })
  return [...contactObservations, ...automationObservations]
}

function sensorObservation(input: {
  sensorRunId: string
  observationType: string
  sourceRecordId: string
  provenanceMode: Extract<SensorProvenanceMode, 'live' | 'fixture'>
  observedAt: string
  payload: Record<string, unknown>
  sourceRefs: SourceReference[]
  sourceHealth: SensorSourceHealth[]
  correlation: CorrelationContext
}): SensorObservation {
  const checksum = checksumFor(input.payload)
  const idempotencyKey = `sensor-observation:activecampaign-readonly:${input.sensorRunId}:${input.observationType}:${input.sourceRecordId}:${checksum}`
  return {
    id: stableUuid('nested-objects-sensor-observation', idempotencyKey),
    sensorName: 'activecampaign-readonly',
    sensorRunId: input.sensorRunId,
    observationType: input.observationType,
    sourceRecordId: input.sourceRecordId,
    provenanceMode: input.provenanceMode,
    observedAt: input.observedAt,
    sourceGeneratedAt: input.observedAt,
    checksum,
    payload: input.payload,
    sourceRefs: input.sourceRefs,
    sourceHealth: input.sourceHealth,
    idempotencyKey,
    correlation: input.correlation,
  }
}

function assertSensorInput(input: ActiveCampaignReadOnlySensorInput): void {
  assertAllowlist(input.ownerAllowlist)
  if (!input.sensorRunId.trim() || !Number.isFinite(Date.parse(input.observedAt))) {
    throw new ContractValidationError('ActiveCampaign sensor requires sensorRunId and valid observedAt')
  }
  if (input.contacts.length > 80 || input.automations.length > 20) {
    throw new ContractValidationError('ActiveCampaign sensor input exceeds bounded records')
  }
  if (!['live', 'fixture'].includes(input.provenanceMode)) {
    throw new ContractValidationError('ActiveCampaign sensor provenance must be live or fixture')
  }
  if (
    input.contacts.length > 0
    && !input.ownerAllowlist.scopes.some((scope) => (
      scope.resourceType === 'contact_inventory'
      && scope.externalId === 'collection'
      && scope.readAllowed
    ))
  ) {
    throw new ContractValidationError('ActiveCampaign contact analysis requires the owner-reviewed contact inventory scope')
  }
  const contactIds = input.contacts.map((item) => item.contact.contactId)
  if (new Set(contactIds).size !== contactIds.length) {
    throw new ContractValidationError('ActiveCampaign sensor contact IDs must be unique')
  }
  const automationIds = input.automations.map((item) => item.automationId)
  if (new Set(automationIds).size !== automationIds.length) {
    throw new ContractValidationError('ActiveCampaign sensor automation IDs must be unique')
  }
  for (const observation of input.contacts) {
    if (observation.membership && observation.membership.memberId.trim() === '') {
      throw new ContractValidationError('Authoritative membership must be joined by a stable member ID')
    }
  }
}

function assertAllowlist(allowlist: OwnerReviewedActiveCampaignAllowlist): void {
  const allowedResourceTypes = new Set<ActiveCampaignReadResource>([
    'contact_inventory',
    'automation',
    'campaign',
    'list',
    'tag',
    'field',
  ])
  if (
    !allowlist.reviewId.trim()
    || !allowlist.reviewedBy.trim()
    || !allowlist.accountId.trim()
    || !allowlist.accountHostname.trim()
    || !Number.isFinite(Date.parse(allowlist.reviewedAt))
    || allowlist.mutationAllowed !== false
  ) {
    throw new ActiveCampaignReadBoundaryError('ActiveCampaign reads require an owner-reviewed mutation-disabled allowlist')
  }
  if (allowlist.scopes.length > 500) throw new ActiveCampaignReadBoundaryError('ActiveCampaign allowlist exceeds 500 scopes')
  const keys = allowlist.scopes.map(scopeKey)
  if (
    new Set(keys).size !== keys.length
    || allowlist.scopes.some((scope) => (
      scope.readAllowed !== true
      || !allowedResourceTypes.has(scope.resourceType)
      || !scope.externalId.trim()
    ))
  ) {
    throw new ActiveCampaignReadBoundaryError('ActiveCampaign allowlist scopes must be read-enabled, supported, and use unique stable IDs')
  }
}

function assertActiveCampaignBaseUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new ActiveCampaignReadBoundaryError('ActiveCampaign base URL is invalid')
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new ActiveCampaignReadBoundaryError('ActiveCampaign base URL must be an origin-only HTTPS URL')
  }
  return url
}

function endpointFor(baseUrl: URL, resourceType: ActiveCampaignReadResource, externalId: string): URL {
  const paths: Record<ActiveCampaignReadResource, string> = {
    contact_inventory: '/api/3/contacts',
    automation: '/api/3/automations',
    campaign: '/api/3/campaigns',
    list: '/api/3/lists',
    tag: '/api/3/tags',
    field: '/api/3/fields',
  }
  const path = externalId === 'collection'
    ? paths[resourceType]
    : `${paths[resourceType]}/${encodeURIComponent(externalId)}`
  return new URL(path, baseUrl)
}

async function defaultTransport(request: ActiveCampaignReadRequest): Promise<ActiveCampaignReadResponse> {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    signal: request.signal,
    cache: 'no-store',
  })
  return response
}

function scopeKey(scope: ActiveCampaignReadScope): string {
  return `${scope.resourceType}:${scope.externalId.trim()}`
}

function normalizeTier(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase() ?? 'unknown'
  if (normalized.includes('agency')) return 'agency'
  if (normalized.includes('elite')) return 'elite'
  if (normalized.includes('pro')) return 'pro'
  if (normalized.includes('founder')) return 'founders'
  if (normalized.includes('starter')) return 'starter'
  if (normalized.includes('free')) return 'free'
  return 'unknown'
}

function normalizeStatus(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, '_') ?? 'unknown'
}

function isPaidTier(value: string): boolean {
  return !['free', 'unknown'].includes(value)
}

function hoursSince(older: string | null, newer: string): number {
  if (!older) return Number.POSITIVE_INFINITY
  const difference = Date.parse(newer) - Date.parse(older)
  return Number.isFinite(difference) ? Math.max(0, difference / 3_600_000) : Number.POSITIVE_INFINITY
}

function conflictingLifecycleRoles(roles: string[]): boolean {
  const roleSet = new Set(roles)
  return (
    roleSet.has('free_nurture') && (roleSet.has('paid_nurture') || roleSet.has('member_onboarding'))
  ) || (
    roleSet.has('upgrade_sequence') && (roleSet.has('paid_nurture') || roleSet.has('member_onboarding'))
  )
}

export class ActiveCampaignReadBoundaryError extends Error {
  readonly code = 'ACTIVECAMPAIGN_READ_BOUNDARY_FAILED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ActiveCampaignReadBoundaryError'
    this.details = details
  }
}
