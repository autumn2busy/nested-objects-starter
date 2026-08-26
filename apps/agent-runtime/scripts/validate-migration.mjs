import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationPath = path.resolve(
  runtimeRoot,
  '../../supabase/migrations/20260825090000_create_intelligence_os_foundation.sql',
)
const sql = await readFile(migrationPath, 'utf8')

const requiredFragments = [
  'BEGIN;',
  'COMMIT;',
  'CREATE TABLE IF NOT EXISTS public.canonical_members',
  'CREATE TABLE IF NOT EXISTS public.member_identity_links',
  'CREATE TABLE IF NOT EXISTS public.member_memberships',
  'CREATE TABLE IF NOT EXISTS public.member_operational_profiles',
  'CREATE TABLE IF NOT EXISTS public.business_metrics_daily',
  'CREATE TABLE IF NOT EXISTS public.intelligence_signals',
  'CREATE TABLE IF NOT EXISTS public.experiments',
  'CREATE TABLE IF NOT EXISTS public.agent_events',
  'CREATE TABLE IF NOT EXISTS public.agent_tasks',
  'CREATE TABLE IF NOT EXISTS public.agent_actions',
  'CREATE TABLE IF NOT EXISTS public.agent_runs',
  'CREATE OR REPLACE VIEW public.member_360',
  'CREATE OR REPLACE VIEW public.member_authority_conflicts',
  "source_system <> 'activecampaign' OR is_authoritative = false",
  "value_state IN ('unknown', 'not_applicable') AND numeric_value IS NULL",
  'observed_sample_size >= minimum_sample_size',
  'observed_duration_days >= minimum_duration_days',
  'explicit owner approval is required before consequential action execution',
  'approved or approval-pending action contract is immutable',
  'REVOKE ALL ON TABLE public.member_360 FROM anon, authenticated',
  'REVOKE ALL ON TABLE public.member_authority_conflicts FROM anon, authenticated',
]

const forbiddenFragments = [
  'CREATE TABLE IF NOT EXISTS public.raw_events',
  'CREATE TABLE IF NOT EXISTS public.behavior_events',
  'CREATE TABLE IF NOT EXISTS public.conversion_events',
  'ALTER TABLE public.conversion_events',
  'activecampaign_contact_id TEXT NOT NULL UNIQUE',
]

const missing = requiredFragments.filter((fragment) => !sql.includes(fragment))
const forbidden = forbiddenFragments.filter((fragment) => sql.includes(fragment))
const syntaxShapeErrors = validateSqlShape(sql)

if (missing.length > 0 || forbidden.length > 0 || syntaxShapeErrors.length > 0) {
  if (missing.length > 0) console.error(`Missing migration contracts:\n${missing.join('\n')}`)
  if (forbidden.length > 0) console.error(`Forbidden migration patterns:\n${forbidden.join('\n')}`)
  if (syntaxShapeErrors.length > 0) console.error(`SQL shape errors:\n${syntaxShapeErrors.join('\n')}`)
  process.exitCode = 1
} else {
  console.log('Static migration contract and SQL shape checks passed.')
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
