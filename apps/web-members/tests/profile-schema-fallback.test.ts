import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDegradedProfile,
  buildFallbackProfileSchemaInfo,
  buildProfileQueryColumns,
} from '../app/api/profile/schema'

test('profile GET keeps trust values when schema probe is unavailable', () => {
  const schemaInfo = buildFallbackProfileSchemaInfo()
  const queryColumns = buildProfileQueryColumns(schemaInfo.availableColumns)

  assert.ok(queryColumns.includes('trust_score'))
  assert.ok(queryColumns.includes('trust_tier'))
  assert.ok(queryColumns.includes('trust_score_breakdown'))

  const persistedProfile = {
    trust_score: 87,
    trust_tier: 'gold',
    trust_score_breakdown: { training: 45, background: 42 },
  }

  const profile = buildDegradedProfile(
    { first_name: 'Avery', last_name: 'Inspector' },
    'avery@example.com',
    null,
    persistedProfile
  )

  assert.equal(profile.trust_score, 87)
  assert.equal(profile.trust_tier, 'gold')
  assert.deepEqual(profile.trust_score_breakdown, { training: 45, background: 42 })
})
