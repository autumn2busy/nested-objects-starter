import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const migrationPath = path.join(root, 'supabase/migrations/20261010120000_enable_bounded_free_journey_durable_claims.sql')
const sql = readFileSync(migrationPath, 'utf8')

for (const required of [
  "CHECK (environment IN ('staging', 'production'))",
  'verify_free_journey_runtime_destination',
  'claim_free_journey_operation_run',
  "p_agent_name IS DISTINCT FROM 'activecampaign-lifecycle'",
  "p_workflow_name IS DISTINCT FROM 'free_journey_operation'",
  "binding_key = 'nested-objects-free-journey-production'",
  "policy_version = 'free-journey-production-v1'",
  "environment = 'production'",
  "project_ref = 'lzzghrjjsyzlvofpidis'",
  "destination_fingerprint = '1a1e94c0f81a4880dd2aeb34150bd0c84b8e1cfd4bef375ad2a0e71180a4a2a9'",
  "review_status = 'approved'",
  'binding.active',
  'service_role',
  'ON CONFLICT (idempotency_key) DO NOTHING',
  'Operational rollback preserves evidence',
]) assert(sql.includes(required), `Missing Free journey durable migration guard: ${required}`)

assert(!/INSERT\s+INTO\s+public\.agent_runtime_destination_bindings/i.test(sql),
  'Migration must not create or activate the Production destination binding')
assert(!/DELETE\s+FROM\s+public\.(agent_runs|agent_workflow_steps|agent_events)/i.test(sql),
  'Migration rollback must preserve durable execution evidence')
assert(!/environment\s+IN\s*\([^)]*development/i.test(sql),
  'Migration must not allow a development durable destination')

console.log('Free journey Production destination and exact durable-claim migration checks passed.')
