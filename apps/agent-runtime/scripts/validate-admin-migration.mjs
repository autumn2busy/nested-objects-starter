import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = path.resolve(runtimeRoot, '../..')
const paths = {
  migration: path.join(repositoryRoot, 'supabase/migrations/20260827130000_create_protected_admin_approval_surface.sql'),
  validation: path.join(repositoryRoot, 'supabase/validation/20260827_validate_protected_admin_approval_surface.sql'),
  auth: path.join(runtimeRoot, 'src/http/admin-request-auth.ts'),
  contracts: path.join(runtimeRoot, 'src/http/admin-contracts.ts'),
  store: path.join(runtimeRoot, 'src/persistence/admin-control-plane-store.ts'),
  runtime: path.join(runtimeRoot, 'src/runtime/admin-runtime.ts'),
  triggers: path.join(runtimeRoot, 'server/api/admin/triggers.post.ts'),
  decisions: path.join(runtimeRoot, 'server/api/admin/actions/[actionId]/decision.post.ts'),
  tests: path.join(runtimeRoot, 'test/admin-surface.test.mjs'),
}
const sources = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, filePath]) => (
  [key, await readFile(filePath, 'utf8')]
))))
const failures = []

requireFragments('migration', sources.migration, [
  'CREATE TABLE IF NOT EXISTS public.agent_approvers',
  'CREATE UNIQUE INDEX IF NOT EXISTS agent_approvers_single_active_owner_idx',
  'CREATE TABLE IF NOT EXISTS public.agent_admin_request_nonces',
  'approved_payload JSONB',
  'approved_payload_digest TEXT',
  'CREATE OR REPLACE FUNCTION public.consume_agent_admin_nonce',
  'CREATE OR REPLACE FUNCTION public.decide_agent_action',
  "NEW.status IN ('awaiting_approval', 'cancelled')",
  "action_record.status NOT IN ('proposed', 'awaiting_approval')",
  "'executionAttached', false",
  "'delegationEnabled', false",
  "'executionEnabled', false",
  'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER',
  'GRANT EXECUTE ON FUNCTION public.decide_agent_action',
])
requireFragments('rollback validation', sources.validation, [
  'Synthetic records were rolled back',
  'Unauthorized stable subject reached the admin snapshot',
  'Protected trigger nonce replay was accepted',
  'Approved action did not preserve immutable payload or no-execution state',
  'Approved action payload was mutable',
  'Rejection was not guarded and audited',
  'ROLLBACK;',
])
requireFragments('service authentication', sources.auth, [
  'nested-objects-admin-v1',
  'x-intelligence-subject',
  'x-intelligence-nonce',
  'x-intelligence-body-sha256',
  'timingSafeEqual',
  'maximumClockSkewMs',
])
requireFragments('trigger contracts', sources.contracts, [
  "'member_created'",
  "'training_completion'",
  "'critical_integration_failure'",
  "fixtureMode: z.literal('synthetic')",
  'ADMIN_BODY_LIMIT_BYTES',
  'syntheticRequestedAtForKey',
])
requireFragments('control-plane store', sources.store, [
  "this.client, 'consume_agent_admin_nonce'",
  "this.client, 'get_agent_action_for_decision'",
  "this.client, 'decide_agent_action'",
  'expectedPayloadDigest',
  'executionStarted: false',
])
requireFragments('runtime boundary', sources.runtime, [
  "environment.VERCEL_ENV?.trim().toLowerCase() === 'production'",
  "AGENT_ADMIN_ENABLED must be explicitly enabled for reviewed staging",
  'AGENT_ADMIN_AUTUMN_SUBJECT_ID',
  'AGENT_ADMIN_ALLOWED_ORIGIN',
])
requireFragments('trigger endpoint', sources.triggers, [
  'verifyAdminServiceRequest',
  'consumeNonce',
  'createSyntheticOperatingFixture',
  'syntheticRequestedAtForKey(trigger.businessKey)',
  'mutationAllowed: false',
])
requireFragments('decision endpoint', sources.decisions, [
  'verifyAdminServiceRequest',
  'expectedPayloadDigest',
  'decideAction',
])
requireFragments('deterministic tests', sources.tests, [
  'email-only-owner@example.test',
  'Duplicate approval must fail.',
  'Stale version must fail.',
  'executionStarted, false',
  'fixtureMode: \'live\'',
])

for (const [label, source] of Object.entries(sources)) {
  for (const forbidden of ['x-vercel-cron', 'searchParams.get(', 'CRON_SECRET', 'executor.execute(', 'VERCEL_ENV === \'production\'']) {
    if (source.includes(forbidden)) failures.push(`${label} contains forbidden admin-boundary fragment: ${forbidden}`)
  }
}
for (const [label, source] of [['migration', sources.migration], ['validation', sources.validation]]) {
  for (const error of validateSqlShape(source)) failures.push(`${label}: ${error}`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Static Phase C7 stable-subject auth, replay defense, immutable approval, and no-execution checks passed.')
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
