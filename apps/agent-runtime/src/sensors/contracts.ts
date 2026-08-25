import type {
  CorrelationContext,
  IntelligenceSignal,
  MetricSnapshot,
  SourceReference,
} from '../contracts.js'
import { ContractValidationError } from '../contracts.js'

export type SensorName =
  | 'conversion-events-ledger'
  | 'seo-content-monitor'
  | 'ai-aeo-monitor'
  | 'content-brief-generator'
  | 'adzuna-opportunity-ingestion'

export interface SensorRegistration {
  name: SensorName
  currentLocation: string
  currentOutput: string
  targetOutput: 'normalized_metrics' | 'intelligence_signals' | 'action_candidate' | 'opportunity_source'
  phaseBChange: 'contract_only' | 'minimal_adapter'
  authorityBoundary: string
}

export interface SensorEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  sensorName: SensorName
  sensorRunId: string
  observedAt: string
  payload: TPayload
  sourceRefs: SourceReference[]
  completeness: number
  confidence: number
  correlation: CorrelationContext
}

export interface SensorAdapterResult {
  metrics: MetricSnapshot[]
  signals: IntelligenceSignal[]
  candidateActions: Array<{
    actionType: string
    targetSystem: string
    payload: Record<string, unknown>
    conciseRationale: string
    correlation: CorrelationContext
  }>
}

export interface SensorAdapter<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  readonly registration: SensorRegistration
  normalize(envelope: SensorEnvelope<TPayload>): Promise<SensorAdapterResult>
}

export const SENSOR_REGISTRATIONS: readonly SensorRegistration[] = [
  {
    name: 'conversion-events-ledger',
    currentLocation: 'apps/web-members/lib/conversion-events.ts',
    currentOutput: 'private first-party conversion_events rows',
    targetOutput: 'normalized_metrics',
    phaseBChange: 'contract_only',
    authorityBoundary: 'Raw behavioral and conversion ledger. It does not own membership, subscription, or revenue truth.',
  },
  {
    name: 'seo-content-monitor',
    currentLocation: 'apps/web-members/lib/seo-content-monitor.ts',
    currentOutput: 'weekly SEO opportunity report using Search Console, GA4, and PageSpeed evidence',
    targetOutput: 'intelligence_signals',
    phaseBChange: 'contract_only',
    authorityBoundary: 'Existing collector remains responsible for Google authentication and source collection.',
  },
  {
    name: 'ai-aeo-monitor',
    currentLocation: 'apps/web-members/lib/ai-aeo-monitor.ts',
    currentOutput: 'weekly AEO visibility opportunity report',
    targetOutput: 'intelligence_signals',
    phaseBChange: 'contract_only',
    authorityBoundary: 'AEO observations are evidence and signals, not automatic publishing instructions.',
  },
  {
    name: 'content-brief-generator',
    currentLocation: 'apps/web-members/lib/content-brief-generator.ts',
    currentOutput: 'candidate content briefs',
    targetOutput: 'action_candidate',
    phaseBChange: 'contract_only',
    authorityBoundary: 'Generated briefs remain drafts. Publishing requires an approved consequential action.',
  },
  {
    name: 'adzuna-opportunity-ingestion',
    currentLocation: 'apps/web-members/app/api/cron/sync-adzuna/route.ts',
    currentOutput: 'deduplicated jobs rows sourced from Adzuna',
    targetOutput: 'opportunity_source',
    phaseBChange: 'contract_only',
    authorityBoundary: 'The existing importer owns source collection. Later opportunity workflows consume persisted job records.',
  },
] as const

validateSensorRegistrations(SENSOR_REGISTRATIONS)

export function getSensorRegistration(name: SensorName): SensorRegistration {
  const registration = SENSOR_REGISTRATIONS.find((candidate) => candidate.name === name)
  if (!registration) throw new ContractValidationError(`Unknown sensor registration: ${name}`)
  return registration
}

export function createEmptySensorAdapterResult(): SensorAdapterResult {
  return { metrics: [], signals: [], candidateActions: [] }
}

export function validateSensorRegistrations(registrations: readonly SensorRegistration[]): void {
  const names = new Set<string>()
  for (const registration of registrations) {
    if (names.has(registration.name)) {
      throw new ContractValidationError(`Duplicate sensor registration: ${registration.name}`)
    }
    if (!registration.currentLocation.trim() || !registration.authorityBoundary.trim()) {
      throw new ContractValidationError(`Sensor ${registration.name} requires a location and authority boundary`)
    }
    names.add(registration.name)
  }
}
