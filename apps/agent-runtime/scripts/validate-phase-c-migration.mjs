import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationPath = path.resolve(
  runtimeRoot,
  '../../supabase/migrations/20260826090000_create_phase_c_projection_and_marketing_registry.sql',
)
const validationPath = path.resolve(
  runtimeRoot,
  '../../supabase/validation/20260826_validate_phase_c_projection_and_marketing_registry.sql',
)
const [sql, validationSql] = await Promise.all([
  readFile(migrationPath, 'utf8'),
  readFile(validationPath, 'utf8'),
])

const requiredFragments = [
  'BEGIN;',
  'COMMIT;',
  'CREATE TABLE IF NOT EXISTS public.projection_runs',
  'CREATE TABLE IF NOT EXISTS public.activecampaign_asset_registry',
  'CREATE TABLE IF NOT EXISTS public.marketing_contact_classifications',
  "mutation_allowed = false",
  "review_status = 'approved'",
  "business_scope = 'nested_objects'",
  'excluded_from_marketing_analysis',
  'REVOKE ALL ON TABLE public.%I FROM anon, authenticated',
  'No contact email or message content is stored here',
]

const requiredValidationFragments = [
  'Phase C staging validation',
  'Synthetic records were rolled back',
  'marketing_contact_classifications must not persist contact email addresses',
  'Phase C incorrectly allowed an ActiveCampaign mutation executor',
  'Asset read access incorrectly bypassed owner review',
]

const forbiddenFragments = [
  'CREATE TABLE IF NOT EXISTS public.conversion_events',
  'ALTER TABLE public.conversion_events',
  'mutation_allowed BOOLEAN NOT NULL DEFAULT true',
  'email TEXT',
  'activecampaign_api_key',
  'activecampaign_token',
]

const missing = requiredFragments.filter((fragment) => !sql.includes(fragment))
const missingValidation = requiredValidationFragments.filter((fragment) => !validationSql.includes(fragment))
const forbidden = forbiddenFragments.filter((fragment) => sql.toLowerCase().includes(fragment.toLowerCase()))
const shapeErrors = [
  ...validateSqlShape(sql).map((error) => `migration: ${error}`),
  ...validateSqlShape(validationSql).map((error) => `validation: ${error}`),
]

if (missing.length > 0 || missingValidation.length > 0 || forbidden.length > 0 || shapeErrors.length > 0) {
  if (missing.length > 0) console.error(`Missing Phase C migration contracts:\n${missing.join('\n')}`)
  if (missingValidation.length > 0) console.error(`Missing Phase C validation contracts:\n${missingValidation.join('\n')}`)
  if (forbidden.length > 0) console.error(`Forbidden Phase C migration patterns:\n${forbidden.join('\n')}`)
  if (shapeErrors.length > 0) console.error(`Phase C SQL shape errors:\n${shapeErrors.join('\n')}`)
  process.exitCode = 1
} else {
  console.log('Static Phase C migration, privacy, mutation-boundary, and SQL shape checks passed.')
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
