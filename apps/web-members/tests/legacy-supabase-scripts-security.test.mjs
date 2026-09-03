import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { requireSupabaseServiceEnv } = require('../scripts/lib/supabase-service-env.js')
const testsDirectory = path.dirname(fileURLToPath(import.meta.url))
const scriptsDirectory = path.resolve(testsDirectory, '..', 'scripts')

const LEGACY_SCRIPT_NAMES = [
  'fetch-batch7.js',
  'update-enriched-firms-batch10.js',
  'update-enriched-firms-batch11.js',
  'update-enriched-firms-batch12.js',
  'update-enriched-firms-batch13.js',
  'update-enriched-firms-batch14.js',
  'update-enriched-firms-batch15.js',
  'update-enriched-firms-batch16.js',
  'update-enriched-firms-batch17.js',
  'update-enriched-firms-batch18.js',
  'update-enriched-firms-batch19.js',
  'update-enriched-firms-batch2.js',
  'update-enriched-firms-batch20.js',
  'update-enriched-firms-batch21.js',
  'update-enriched-firms-batch22.js',
  'update-enriched-firms-batch23.js',
  'update-enriched-firms-batch3.js',
  'update-enriched-firms-batch4.js',
  'update-enriched-firms-batch5.js',
  'update-enriched-firms-batch6.js',
  'update-enriched-firms-batch7.js',
  'update-enriched-firms-batch8.js',
  'update-enriched-firms-batch9.js',
  'update-enriched-firms.js',
  'update-problem-urls.js',
  'update-vendor-contacts-b1.js',
  'update-vendor-contacts-b2.js',
  'update-vendor-contacts-b3.js',
  'update-vendor-contacts-b4.js',
  'update-vendor-contacts-b5.js',
  'update-vendor-contacts-b6.js',
  'update-vendor-contacts-b7.js',
  'update-vendor-contacts-b8.js',
  'verify-and-fetch-batch8.js',
]

test('legacy Supabase maintenance scripts contain no embedded service credential', () => {
  assert.equal(LEGACY_SCRIPT_NAMES.length, 34)

  for (const scriptName of LEGACY_SCRIPT_NAMES) {
    const source = readFileSync(path.join(scriptsDirectory, scriptName), 'utf8')

    assert.match(source, /requireSupabaseServiceEnv/)
    assert.doesNotMatch(source, /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/)
    assert.doesNotMatch(source, /https:\/\/[a-z0-9-]+\.supabase\.co/i)
    assert.doesNotMatch(
      source,
      /SUPABASE_SERVICE_(?:ROLE_)?KEY\s*=\s*['"`][^'"`]+['"`]/,
    )
  }
})

test('the shared guard refuses to run without a service-role environment', () => {
  assert.throws(
    () => requireSupabaseServiceEnv({}),
    /SUPABASE_URL.*SUPABASE_SERVICE_ROLE_KEY/,
  )
  assert.throws(
    () =>
      requireSupabaseServiceEnv({
        SUPABASE_URL: 'https://example.invalid',
        SUPABASE_SERVICE_ROLE_KEY: '   ',
      }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  )
})

test('the shared guard accepts explicit server-only credentials without exposing them', () => {
  const explicit = requireSupabaseServiceEnv({
    SUPABASE_URL: 'https://example.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'fixture-service-role',
  })
  const publicUrlFallback = requireSupabaseServiceEnv({
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'fixture-service-role',
  })

  assert.equal(explicit.url, 'https://example.invalid')
  assert.equal(explicit.serviceRoleKey, 'fixture-service-role')
  assert.equal(publicUrlFallback.url, 'http://127.0.0.1:54321')
})
