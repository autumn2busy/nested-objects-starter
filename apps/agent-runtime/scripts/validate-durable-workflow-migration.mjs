import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = path.resolve(runtimeRoot, '../..')
const paths = {
  migration: path.join(repositoryRoot, 'supabase/migrations/20260827090000_create_durable_workflow_foundation.sql'),
  validation: path.join(repositoryRoot, 'supabase/validation/20260827_validate_durable_workflow_foundation.sql'),
  workflow: path.join(runtimeRoot, 'workflows/lifecycle-integrity.ts'),
  destination: path.join(runtimeRoot, 'src/runtime/staging-destination.ts'),
  package: path.join(runtimeRoot, 'package.json'),
  nitro: path.join(runtimeRoot, 'nitro.config.ts'),
  runtime: path.join(runtimeRoot, 'src/runtime/durable-runtime.ts'),
  operatorGuide: path.join(repositoryRoot, 'docs/intelligence-os/phase-c3-durable-staging-workflows.md'),
  fingerprintScript: path.join(runtimeRoot, 'scripts/compute-staging-destination-fingerprint.mjs'),
}

const [
  migration,
  validation,
  workflow,
  destination,
  packageSource,
  nitro,
  runtime,
  operatorGuide,
  fingerprintScript,
] = await Promise.all(
  Object.values(paths).map((filePath) => readFile(filePath, 'utf8')),
)
const packageJson = JSON.parse(packageSource)
const failures = []

requireFragments('migration', migration, [
  'BEGIN;',
  'COMMIT;',
  'CREATE TABLE IF NOT EXISTS public.agent_runtime_destination_bindings',
  'CREATE TABLE IF NOT EXISTS public.agent_workflow_steps',
  'CREATE OR REPLACE FUNCTION public.verify_agent_runtime_destination',
  'CREATE OR REPLACE FUNCTION public.claim_agent_workflow_run',
  'CREATE OR REPLACE FUNCTION public.claim_agent_workflow_step',
  'CREATE OR REPLACE FUNCTION public.complete_agent_workflow_step',
  'CREATE OR REPLACE FUNCTION public.fail_agent_workflow_step',
  'CREATE OR REPLACE FUNCTION public.persist_agent_workflow_signals',
  'CREATE OR REPLACE FUNCTION public.complete_agent_workflow_run',
  'CREATE OR REPLACE FUNCTION public.fail_agent_workflow_run',
  'CREATE OR REPLACE FUNCTION public.mark_stale_agent_workflow_runs',
  "run_record.status = 'succeeded'",
  "disposition := 'reused'",
  "run_record.status = 'failed' AND run_record.retry_after > now_at",
  "step_record.status = 'failed' AND step_record.retry_after > now_at",
  'FOR UPDATE SKIP LOCKED',
  "auth.role() IS DISTINCT FROM 'service_role'",
  'durable signal batch exceeds the 50-record bound',
  'REVOKE ALL ON TABLE public.agent_runtime_destination_bindings FROM PUBLIC, anon, authenticated, service_role',
  'GRANT SELECT ON TABLE public.agent_runtime_destination_bindings TO service_role',
])
requireFragments('validation', validation, [
  'Synthetic records were rolled back',
  'Duplicate durable run delivery did not converge on the first run',
  'Completed durable step output was not reused on resume',
  'Retry backoff was not enforced before retry_after',
  'Retry did not become claimable after retry_after',
  'A duplicate delivery reset or failed to reuse a completed run',
  'Idempotency key incorrectly accepted a different payload',
  'Expired durable run was not marked stale',
])
requireFragments('workflow', workflow, [
  "'use workflow'",
  "'use step'",
  'getWorkflowMetadata()',
  'getStepMetadata()',
  'persistLifecycleSignalsStep',
  'recordRunFailureStep',
  'signalCount !== output.persistedSignalCount',
])
requireFragments('destination', destination, [
  "reviewedProjectRefs: Object.freeze(['wqstirwszdbsygstnvbn'])",
  "deniedProjectRefs: Object.freeze([MEMBER_SITE_PRODUCTION_PROJECT_REF])",
  'configuredProjectRef !== urlProjectRef',
  '!policy.reviewedProjectRefs.includes(configuredProjectRef)',
])
requireFragments('nitro', nitro, [
  "modules: ['workflow/nitro']",
  "dirs: ['./workflows']",
  "runtime: 'nodejs22.x'",
])
requireFragments('runtime', runtime, [
  'assertServerOnlyControlPlaneAccess',
  "runtime.environment !== 'preview'",
  "vercelEnvironment === 'production'",
  "runtime.workflowProvider !== 'vercel_workflow'",
  'Durable staging Supabase credentials are not server-only credentials',
])
requireFragments('operator guide', operatorGuide, [
  'The repository implementation is complete and deny-by-default.',
  'The application service role deliberately has SELECT-only table access and cannot approve itself',
  '20260827_validate_durable_workflow_foundation.sql',
  'Deliver the same business idempotency key again.',
  'Do not delete run history.',
])
requireFragments('fingerprint script', fingerprintScript, [
  "const policyVersion = 'phase-c3-v1'",
  "[policyVersion, projectRef, hostname].join('\\n')",
  "digest('hex')",
])

for (const [label, source] of [['migration', migration], ['validation', validation]]) {
  for (const error of validateSqlShape(source)) failures.push(`${label}: ${error}`)
}

if (packageJson.dependencies?.workflow !== '4.8.5') failures.push('workflow dependency is not pinned to 4.8.5')
if (packageJson.dependencies?.nitro !== '3.0.260610-beta') failures.push('nitro dependency is not pinned to 3.0.260610-beta')
if (packageJson.devDependencies?.['@workflow/vitest'] !== '4.0.21') {
  failures.push('@workflow/vitest dependency is not pinned to 4.0.21')
}
for (const dependencyName of Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies })) {
  if (/queue/i.test(dependencyName)) failures.push(`Queue dependency is not approved for Phase C3: ${dependencyName}`)
}

const forbiddenMigrationFragments = [
  'CREATE TABLE IF NOT EXISTS public.conversion_events',
  'ALTER TABLE public.conversion_events',
  'SUPABASE_SERVICE_ROLE_KEY',
  'sb_secret_',
  'sb_publishable_',
]
for (const fragment of forbiddenMigrationFragments) {
  if (migration.includes(fragment)) failures.push(`migration contains forbidden fragment: ${fragment}`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Static Phase C3 durable workflow, destination binding, retry, resume, and SQL shape checks passed.')
}

function requireFragments(label, source, fragments) {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${label} is missing required fragment: ${fragment}`)
  }
}

function validateSqlShape(source) {
  const errors = []
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
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
