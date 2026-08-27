import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = path.resolve(runtimeRoot, '../..')
const paths = {
  migration: path.join(repositoryRoot, 'supabase/migrations/20260827120000_create_sensor_observation_ledger.sql'),
  validation: path.join(repositoryRoot, 'supabase/validation/20260827_validate_sensor_observation_ledger.sql'),
  contracts: path.join(runtimeRoot, 'src/sensors/contracts.ts'),
  reportAdapters: path.join(runtimeRoot, 'src/sensors/report-adapters.ts'),
  activeCampaign: path.join(runtimeRoot, 'src/sensors/activecampaign-readonly.ts'),
  sensorStore: path.join(runtimeRoot, 'src/persistence/sensor-observation-store.ts'),
  projectionStore: path.join(runtimeRoot, 'src/persistence/projection-store.ts'),
  projection: path.join(runtimeRoot, 'src/projections/member-projection.ts'),
  phaseC: path.join(runtimeRoot, 'src/workflows/phase-c-core.ts'),
  activeCampaignAudit: path.join(runtimeRoot, 'src/sensors/activecampaign-audit.ts'),
  operatingWorkflow: path.join(runtimeRoot, 'workflows/operating-reviews.ts'),
  nodeTests: path.join(runtimeRoot, 'test/sensors.test.mjs'),
  workflowTests: path.join(runtimeRoot, 'workflows/operating-reviews.integration.test.ts'),
}
const sources = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, filePath]) => (
  [key, await readFile(filePath, 'utf8')]
))))
const failures = []

requireFragments('migration', sources.migration, [
  'BEGIN;',
  'COMMIT;',
  'CREATE TABLE IF NOT EXISTS public.agent_sensor_runs',
  'CREATE TABLE IF NOT EXISTS public.sensor_observations',
  "provenance_mode IN ('live', 'baseline', 'fixture')",
  'CREATE OR REPLACE FUNCTION public.persist_agent_sensor_batch',
  'IF p_batch IS NULL',
  'sensor run idempotency key was reused with different content',
  'sensor observation idempotency key was reused with different content',
  'CREATE OR REPLACE FUNCTION public.upsert_activecampaign_asset_inventory',
  'IF p_assets IS NULL',
  "public.activecampaign_asset_registry.review_status = 'pending'",
  'ELSE public.activecampaign_asset_registry.business_scope',
  "auth.role() IS DISTINCT FROM 'service_role'",
  'REVOKE ALL ON TABLE public.agent_sensor_runs FROM PUBLIC, anon, authenticated, service_role',
  'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER',
  'GRANT SELECT ON TABLE public.activecampaign_asset_registry TO service_role',
])
if (sources.migration.includes('UNIQUE (sensor_name, source_record_id, checksum)')) {
  failures.push('Sensor observations cannot be globally unique across recurring collector runs')
}
requireFragments('validation', sources.validation, [
  'Synthetic records were rolled back',
  'Duplicate sensor batch was not reused',
  'Changed sensor observation reused an idempotency key',
  'A recurring collector run could not retain an unchanged source observation',
  'Recurring ActiveCampaign inventory reset or changed owner approval state',
  "review_status = 'approved'",
  'AND read_allowed',
  'AND NOT mutation_allowed',
])
requireFragments('sensor contracts', sources.contracts, [
  "export type SensorProvenanceMode = 'live' | 'baseline' | 'fixture'",
  'export interface SensorSourceHealth',
  'export interface SensorObservation',
  'export interface SensorIngestionBatch',
  "name: 'activecampaign-readonly'",
])
requireFragments('report adapters', sources.reportAdapters, [
  'adaptSeoContentReport',
  'adaptAiAeoReport',
  'adaptContentBriefReport',
  'adaptWeeklySensorReports',
  'checksumFor',
  'input.sensorRunId',
  "provenanceMode: input.provenanceMode",
  "signalType: 'growth.seo_content_opportunity'",
  "signalType: 'growth.aeo_visibility_opportunity'",
  'publishAllowed: false',
])
requireFragments('ActiveCampaign sensor', sources.activeCampaign, [
  "method: 'GET'",
  'ActiveCampaign read scope is not owner-allowlisted',
  'accountHostname',
  'scope.readAllowed !== true',
  'limit < 1 || limit > 100',
  'mutationAllowed: false',
  'ingestionBatch',
  "status: 'proposed'",
  'executorKey: null',
  'executionStartedAt: null',
  'paid_member_labeled_free',
  'canceled_member_in_paid_nurture',
  'free_member_in_paid_automation',
  'member_missing_onboarding',
  'upgrade_sequence_after_purchase',
  'overlapping_lifecycle_automations',
  'stale_automation',
  'engagement_decline',
  'deliverability_risk',
  'high_intent_segment',
  'cold_never_engaged_contact',
  'internal_activecampaign_contact',
])
if (sources.activeCampaignAudit.indexOf("} else if (hasWixEvidence) {")
    > sources.activeCampaignAudit.indexOf("} else if (hasColdEvidence) {")) {
  failures.push('Specific Wix-era evidence must take precedence over the generic import marker')
}
requireFragments('sensor store', sources.sensorStore, [
  'persist_agent_sensor_batch',
  'InMemorySensorObservationStore',
  'Sensor observation idempotency key was reused with different content',
  'batch.observations.length > 100',
])
requireFragments('projection store', sources.projectionStore, [
  "this.client.rpc('upsert_activecampaign_asset_inventory'",
  "review_status: 'pending'",
  'read_allowed: false',
  'mutation_allowed: false',
])
if (sources.projectionStore.includes("from('activecampaign_asset_registry').upsert")) {
  failures.push('Projection store still directly upserts ActiveCampaign assets and can reset owner approval')
}
requireFragments('member projection', sources.projection, [
  'ac_contact_id?: string | null',
  "activecampaign_contact_collision",
  "add('activecampaign', 'contact_id', profile.ac_contact_id)",
])
requireFragments('Phase C stable-ID join', sources.phaseC, [
  'membershipByActiveCampaignContactId',
  "link.sourceSystem === 'activecampaign'",
  'membershipByActiveCampaignContactId.get(contact.contactId)',
])
if (sources.phaseC.includes('membershipByEmail')) {
  failures.push('Phase C still joins ActiveCampaign authority by email')
}
requireFragments('weekly operating workflow', sources.operatingWorkflow, [
  'sensorReports: WeeklySensorReportInput[]',
  'adaptWeeklySensorReports',
  'persistOperatingSensorsStep',
  'context.sensorStore.persistBatch',
  'sensorPersistenceVerified: true',
])
requireFragments('deterministic tests', sources.nodeTests, [
  'checked-in SEO/AEO/content reports remain compatible',
  'nextReport.generatedAt',
  'permits only bounded GETs to owner-reviewed stable-ID scopes',
  'without emitting PII or mutations',
  "'legacy_wix_candidate'",
  'store.persistBatch(result.ingestionBatch)',
  'joins by stored ActiveCampaign contact ID, never by email alone',
  'approval-preserving RPC rather than direct table upsert',
])
requireFragments('Workflow tests', sources.workflowTests, [
  'consumes and durably reuses live SEO/AEO sensor observations',
  'sensorStore.observations.size',
])

for (const [label, source] of [['migration', sources.migration], ['validation', sources.validation]]) {
  for (const error of validateSqlShape(source)) failures.push(`${label}: ${error}`)
}

for (const forbidden of [
  'CREATE TABLE IF NOT EXISTS public.conversion_events',
  'ALTER TABLE public.conversion_events',
  'DELETE FROM public.activecampaign',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ACTIVE_CAMPAIGN_API_KEY',
  'CREATE EXTENSION',
]) {
  if (sources.migration.includes(forbidden)) failures.push(`migration contains forbidden fragment: ${forbidden}`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Static Phase C6 sensor provenance, durable ingestion, weekly consumption, and ActiveCampaign read-only integrity checks passed.')
}

function requireFragments(label, source, fragments) {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${label} is missing required fragment: ${fragment}`)
  }
}

function validateSqlShape(source) {
  const errors = []
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')
  const dollarQuoteCount = (withoutComments.match(/\$\$/g) || []).length
  if (dollarQuoteCount % 2 !== 0) errors.push('Unbalanced $$ function delimiters')
  let depth = 0
  let inSingleQuote = false
  for (let index = 0; index < withoutComments.length; index += 1) {
    const character = withoutComments[index]
    const next = withoutComments[index + 1]
    if (character === "'" && inSingleQuote && next === "'") {
      index += 1
      continue
    }
    if (character === "'") {
      inSingleQuote = !inSingleQuote
      continue
    }
    if (inSingleQuote) continue
    if (character === '(') depth += 1
    if (character === ')') depth -= 1
    if (depth < 0) {
      errors.push(`Unexpected closing parenthesis near character ${index}`)
      depth = 0
    }
  }
  if (inSingleQuote) errors.push('Unbalanced single quote')
  if (depth !== 0) errors.push(`Unbalanced parentheses: depth ${depth}`)
  return errors
}
