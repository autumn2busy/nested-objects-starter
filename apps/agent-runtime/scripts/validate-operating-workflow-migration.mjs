import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = path.resolve(runtimeRoot, '../..')
const paths = {
  migration: path.join(repositoryRoot, 'supabase/migrations/20260827110000_create_operating_workflow_artifacts.sql'),
  validation: path.join(repositoryRoot, 'supabase/validation/20260827_validate_operating_workflow_artifacts.sql'),
  workflow: path.join(runtimeRoot, 'workflows/operating-reviews.ts'),
  store: path.join(runtimeRoot, 'src/persistence/operating-workflow-store.ts'),
  tests: path.join(runtimeRoot, 'workflows/operating-reviews.integration.test.ts'),
  registry: path.join(runtimeRoot, 'src/workflows/registry.ts'),
}
const [migration, validation, workflow, store, tests, registry] = await Promise.all(
  Object.values(paths).map((filePath) => readFile(filePath, 'utf8')),
)
const failures = []

requireFragments('migration', migration, [
  'BEGIN;',
  'COMMIT;',
  'CREATE TABLE IF NOT EXISTS public.agent_orchestrator_states',
  'CREATE TABLE IF NOT EXISTS public.agent_recommendations',
  'CREATE TABLE IF NOT EXISTS public.agent_operating_reviews',
  'CREATE OR REPLACE FUNCTION public.persist_agent_orchestrator_state',
  'CREATE OR REPLACE FUNCTION public.persist_agent_operating_workflow_batch',
  "workflow_name IN ('conversion_review', 'daily_business_health', 'weekly_operating_review')",
  'jsonb_array_length(priorities) <= 3',
  'jsonb_array_length(autumn_decisions) <= 3',
  'operating workflow artifact batch exceeds a committed bound',
  'PERFORM public.persist_agent_workflow_signals(p_run_id, p_signals)',
  "item->>'status' <> 'proposed'",
  "item#>>'{payload,mutationAllowed}'",
  "NULLIF(item->>'executor_key', '') IS NOT NULL",
  'recommendation idempotency key was reused with different output',
  'task idempotency key was reused with different output',
  'experiment idempotency key was reused with different output',
  'action idempotency key was reused with different output',
  "auth.role() IS DISTINCT FROM 'service_role'",
  'REVOKE ALL ON TABLE public.agent_operating_reviews FROM PUBLIC, anon, authenticated, service_role',
])
requireFragments('validation', validation, [
  'Synthetic records were rolled back',
  'Duplicate orchestrator state was not reused',
  'Duplicate operating batch did not return stable verification counts',
  'Proposed action escaped the no-execution approval boundary',
  'Healthy daily workflow did not persist a quiet zero-signal review',
])
requireFragments('workflow', workflow, [
  "CONVERSION_REVIEW_WORKFLOW_NAME = 'conversion_review'",
  "DAILY_BUSINESS_HEALTH_WORKFLOW_NAME = 'daily_business_health'",
  "WEEKLY_OPERATING_REVIEW_WORKFLOW_NAME = 'weekly_operating_review'",
  "'use workflow'",
  "'use step'",
  'claimOperatingRunStep',
  'evaluateOperatingReviewStep',
  'persistOperatingArtifactsStep',
  'completeOperatingRunStep',
  'recordOperatingRunFailureStep',
  'notificationRequired: !quiet && autumnDecisions.length > 0',
  'maximumPriorities: 3',
  'sourceHealthSignals',
  'assertCountsEqual',
])
requireFragments('store', store, [
  'OperatingWorkflowStore extends OperationsOrchestratorStateStore',
  'persist_agent_orchestrator_state',
  'persist_agent_operating_workflow_batch',
  "['signals', batch.signals.length, 50]",
  "['recommendations', batch.recommendations.length, 20]",
  "['tasks', batch.tasks.length, 10]",
  "['experiments', batch.experiments.length, 10]",
  "['actions', batch.actions.length, 10]",
])
requireFragments('Workflow tests', tests, [
  'conversion_review persists a verified specialist trace and reuses duplicate delivery',
  'daily_business_health completes quietly with no notification or signal when healthy',
  'weekly_operating_review ranks no more than three priorities',
])
for (const workflowName of ['conversion_review', 'daily_business_health', 'weekly_operating_review']) {
  const start = registry.indexOf(`name: '${workflowName}'`)
  const next = registry.indexOf("name: '", start + 7)
  const registration = registry.slice(start, next < 0 ? undefined : next)
  if (start < 0 || !registration.includes("version: 'phase-c5-v1'") || !registration.includes("status: 'implemented'")) {
    failures.push(`Workflow registry is not implemented at phase-c5-v1: ${workflowName}`)
  }
}

for (const [label, source] of [['migration', migration], ['validation', validation]]) {
  for (const error of validateSqlShape(source)) failures.push(`${label}: ${error}`)
}

for (const forbidden of [
  'CREATE TABLE IF NOT EXISTS public.conversion_events',
  'ALTER TABLE public.conversion_events',
  'SUPABASE_SERVICE_ROLE_KEY',
  'activecampaign.start_stop_automation',
  'CREATE EXTENSION',
]) {
  if (migration.includes(forbidden)) failures.push(`migration contains forbidden fragment: ${forbidden}`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Static Phase C5 operating workflows, bounded artifact persistence, approval boundary, and quiet health checks passed.')
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
