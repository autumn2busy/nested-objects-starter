import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const validationPath = path.join(root, 'supabase/validation/20261010_validate_free_journey_production_prerequisites.sql')
const sql = readFileSync(validationPath, 'utf8')

for (const required of [
  '20260825090000_create_intelligence_os_foundation.sql',
  '20260827090000_create_durable_workflow_foundation.sql',
  '20261010120000_enable_bounded_free_journey_durable_claims.sql',
  'agent_runs.id',
  'agent_runtime_destination_bindings.binding_key',
  'agent_workflow_steps.claim_token',
  'agent_events.idempotency_key',
  'verify_free_journey_runtime_destination(text,text,text,text)',
  'claim_free_journey_operation_run(text,text,text,text,text,text,jsonb,text,integer,integer,timestamp with time zone,uuid,uuid,text,text)',
  "has_function_privilege('service_role'",
  "has_function_privilege('anon'",
  "has_function_privilege('authenticated'",
  "binding_key = 'nested-objects-free-journey-production'",
  "policy_version IS DISTINCT FROM 'free-journey-production-v1'",
  "project_ref IS DISTINCT FROM 'lzzghrjjsyzlvofpidis'",
  "destination_fingerprint IS DISTINCT FROM '1a1e94c0f81a4880dd2aeb34150bd0c84b8e1cfd4bef375ad2a0e71180a4a2a9'",
  'ROLLBACK;',
]) assert(sql.includes(required), `Missing Production prerequisite validation guard: ${required}`)

assert(!/\b(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE)\b\s+(?:INTO\s+)?public\./i.test(sql),
  'Production prerequisite validation must not mutate durable schema or rows')

console.log('Free journey Production prerequisite inventory is read-only and exact.')
