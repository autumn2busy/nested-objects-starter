import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = path.resolve(runtimeRoot, '../..')
const paths = {
  migration: path.join(repositoryRoot, 'supabase/migrations/20260827140000_create_traceability_and_projection_hardening.sql'),
  hashRepair: path.join(repositoryRoot, 'supabase/migrations/20260902023000_fix_agent_decision_trace_hash.sql'),
  validation: path.join(repositoryRoot, 'supabase/validation/20260827_validate_traceability_and_projection_hardening.sql'),
  projection: path.join(runtimeRoot, 'src/projections/member-projection.ts'),
  projectionStore: path.join(runtimeRoot, 'src/persistence/projection-store.ts'),
  operatingStore: path.join(runtimeRoot, 'src/persistence/operating-workflow-store.ts'),
  traceContracts: path.join(runtimeRoot, 'src/learning/traceability.ts'),
  traceStore: path.join(runtimeRoot, 'src/persistence/learning-trace-store.ts'),
  projectionTests: path.join(runtimeRoot, 'test/phase-c.test.mjs'),
  learningTests: path.join(runtimeRoot, 'test/learning-trace.test.mjs'),
  workflowTests: path.join(runtimeRoot, 'workflows/operating-reviews.integration.test.ts'),
  adminTests: path.join(runtimeRoot, 'test/admin-surface.test.mjs'),
  docs: path.join(repositoryRoot, 'docs/agent-control-plane.md'),
}
const sources = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, filePath]) => (
  [key, await readFile(filePath, 'utf8')]
))))
const failures = []

requireFragments('decision trace hash repair', sources.hashRepair, [
  'CREATE OR REPLACE FUNCTION public.trace_agent_action_decision()',
  'SECURITY DEFINER',
  'SET search_path = public, pg_temp',
  'pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(',
  "'UTF8'",
  'REVOKE ALL ON FUNCTION public.trace_agent_action_decision() FROM PUBLIC, anon, authenticated, service_role',
  'COMMIT;',
])
if (/\bdigest\s*\(/i.test(sources.hashRepair)) {
  failures.push('decision trace hash repair must not depend on pgcrypto schema lookup')
}

requireFragments('migration', sources.migration, [
  'CREATE TABLE IF NOT EXISTS public.agent_trace_links',
  'CREATE TABLE IF NOT EXISTS public.agent_outcomes',
  'CREATE TABLE IF NOT EXISTS public.agent_measurements',
  'CREATE TABLE IF NOT EXISTS public.agent_learnings',
  'CREATE OR REPLACE FUNCTION public.sync_member_identity_links',
  "'revocationReason', 'absent_from_current_projection'",
  'CREATE OR REPLACE FUNCTION public.persist_agent_trace_links',
  'CREATE OR REPLACE FUNCTION public.persist_agent_learning_trace',
  'CREATE OR REPLACE FUNCTION public.trace_agent_action_decision',
  "'action_has_approval_state'",
  'REVOKE ALL ON FUNCTION public.trace_agent_action_decision()',
  'CREATE OR REPLACE FUNCTION public.get_agent_correlation_trace',
  'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER',
  'GRANT SELECT ON TABLE public.agent_learnings TO service_role',
])
requireFragments('rollback validation', sources.validation, [
  'Stale identity link was not auditably revoked while the current link remained active',
  'Changed trace content reused an idempotency key',
  'Approval state did not preserve the action correlation',
  'Approval trace checksum did not match the decision identity',
  'Owner correlation trace omitted part of the operating thread',
  'A private chain-of-thought storage column exists',
  'Synthetic Phase C8 records were rolled back',
  'ROLLBACK;',
])
requireFragments('identity projection', sources.projection, [
  "conflictType: 'anonymous_id_collision'",
  'anonymousOwners',
  'profileIds.size === 1',
])
requireFragments('projection store', sources.projectionStore, [
  "this.client.rpc('sync_member_identity_links'",
  'p_identity_links: writes.identityLinks',
  'projectionObservedAt',
])
if (/from\(['"]member_identity_links['"]\)\.upsert/.test(sources.projectionStore)) {
  failures.push('projection store still directly upserts member_identity_links')
}
requireFragments('operating trace store', sources.operatingStore, [
  'buildOperatingArtifactTraceLinks(batch)',
  "'persist_agent_trace_links'",
  'readonly traceLinks',
])
requireFragments('trace contracts', sources.traceContracts, [
  "'observation_produced_signal'",
  "'signal_created_investigation'",
  "'signal_supported_recommendation'",
  "'signal_proposed_action'",
  "'action_produced_outcome'",
  "'outcome_measured_by'",
  "'measurement_produced_learning'",
  'assertNoPrivateReasoning',
  'Completed measurement requires an outcome and sufficient sample and duration',
])
requireFragments('learning store', sources.traceStore, [
  "this.client.rpc('persist_agent_learning_trace'",
  'record_checksum: payloadDigest(record)',
  'idempotency key was reused with different content',
])
requireFragments('projection tests', sources.projectionTests, [
  'ambiguous anonymous identity is order-independent and never stitches anonymous-only events',
  'anonymous_id_collision',
])
requireFragments('learning tests', sources.learningTests, [
  'planned measurement can link later to a verified outcome and candidate learning',
  'learning contracts reject insufficient completion and private reasoning fields',
  'privateReasoning',
])
requireFragments('workflow tests', sources.workflowTests, [
  "link.relationship === 'observation_produced_signal'",
  "link.relationship === 'signal_created_investigation'",
  "link.relationship === 'signal_supported_recommendation'",
  "link.relationship === 'signal_proposed_action'",
  'operatingStore.traceLinks.size).toBe(firstTraceCount)',
])
requireFragments('admin tests', sources.adminTests, [
  'approved.correlationId, correlationId',
  'approved.executionStarted, false',
])
requireFragments('control-plane documentation', sources.docs, [
  'Observation --> Signal --> Investigation --> Recommendation --> ProposedAction',
  'approval identity and policy',
  'Staging and Production parity',
  'Phase 2 extension points',
])

for (const [label, source] of Object.entries(sources)) {
  for (const forbidden of ['executor.execute(', 'x-vercel-cron', 'searchParams.get(\'secret\')', 'AGENT_MUTATIONS_ENABLED=true']) {
    if (source.includes(forbidden)) failures.push(`${label} contains forbidden C8 boundary fragment: ${forbidden}`)
  }
}
for (const [label, source] of [['migration', sources.migration], ['hash repair', sources.hashRepair], ['validation', sources.validation]]) {
  for (const error of validateSqlShape(source)) failures.push(`${label}: ${error}`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Static Phase C8 traceability, identity revocation, learning integrity, and no-execution checks passed.')
}

function requireFragments(label, source, fragments) {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${label} is missing required fragment: ${fragment}`)
  }
}

function validateSqlShape(source) {
  const errors = []
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')
  const dollarTags = withoutComments.match(/\$[a-zA-Z0-9_]*\$/g) ?? []
  const tagCounts = new Map()
  for (const tag of dollarTags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  for (const [tag, count] of tagCounts) {
    if (count % 2 !== 0) errors.push(`Unbalanced ${tag} function delimiters`)
  }
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
    if (depth < 0) errors.push(`Unexpected closing parenthesis near character ${index}`)
  }
  if (inSingleQuote) errors.push('Unbalanced single quote')
  if (depth !== 0) errors.push(`Unbalanced parentheses: depth ${depth}`)
  return errors
}
