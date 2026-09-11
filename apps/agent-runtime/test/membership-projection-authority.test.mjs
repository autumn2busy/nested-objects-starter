import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildMemberProjectionBatch,
  buildProjectionWriteSet,
  evaluateLifecycleIntegrity,
  resolveMembershipTruth,
  SupabaseProjectionStore,
} from '../dist/index.js'

const memberId = '11111111-1111-4111-8111-111111111111'
const observedAt = '2026-09-11T12:00:00.000Z'
const correlation = { correlationId: '22222222-2222-4222-8222-222222222222', causationId: null }

function project(overrides = {}) {
  return buildMemberProjectionBatch({
    profiles: [{
      id: memberId,
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: observedAt,
      outseta_person_uid: 'person-fixture',
      outseta_account_id: 'account-fixture',
      plan_uid: 'elite-plan-fixture',
      subscription_tier: 'elite',
      subscription_status: 'active',
      subscription_start_date: '2026-08-01T00:00:00.000Z',
      ...overrides,
    }],
    conversionEvents: [],
    observedAt,
    correlation,
  }).projections[0]
}

function snapshot(membership) {
  return { ...membership, observedAt: membership.snapshotAt }
}

function lifecycle(projection) {
  return evaluateLifecycleIntegrity({
    projection,
    productAccess: { memberId, accessTier: 'free', accessStatus: 'disabled', directoryAccess: false, observedAt },
    activeCampaignMirror: { contactId: 'contact-fixture', planName: 'Free', lifecycleStatus: 'active', onboardingEnteredAt: null, observedAt },
    marketingClassification: null,
    correlation,
    now: observedAt,
  })
}

for (const tier of ['free', 'pro', 'elite', 'agency']) {
  test(`${tier} profile remains a mirror, not proof of current membership`, () => {
    const projection = project({ subscription_tier: tier })
    assert.equal(projection.memberships.length, 1)
    const [mirror] = projection.memberships
    assert.equal(mirror.sourceSystem, 'supabase_profiles')
    assert.equal(mirror.sourceRecordId, memberId)
    assert.equal(mirror.isAuthoritative, false)
    assert.equal(mirror.authorityRank, 0)
    assert.equal(mirror.membershipTier, tier)
    assert.equal(mirror.membershipStatus, 'active')
    assert.equal(mirror.provenance.evidenceKind, 'profile_mirror')
    assert.equal(mirror.provenance.projectionVersion, 'profile-membership-v2')
    assert.match(mirror.dataQuality.membershipAuthorityReason, /not a verified Outseta/)
    assert.deepEqual(projection.canonicalMember.dataQualityDetails.authoritativeMembershipSources, [])
    assert.equal(projection.canonicalMember.dataQualityDetails.membershipTruthState, 'unknown')
    assert.ok(projection.identityLinks.some((link) => link.identifierType === 'person_uid'))
    assert.ok(projection.identityLinks.some((link) => link.identifierType === 'account_uid'))
    const truth = resolveMembershipTruth(projection.memberships.map(snapshot))
    assert.equal(truth.state, 'unknown')
    assert.equal(truth.authoritative, null)
    assert.equal(truth.paid, null)
    assert.equal(truth.revenueUsable, false)
  })
}

test('copied person, account, plan and provider timestamp fields cannot create an Outseta snapshot', () => {
  for (const field of [null, 'outseta_person_uid', 'outseta_account_id', 'plan_uid', 'outseta_updated_at']) {
    const projection = project({
      outseta_person_uid: null,
      outseta_account_id: null,
      plan_uid: null,
      outseta_updated_at: null,
      ...(field ? { [field]: field === 'outseta_updated_at' ? observedAt : 'copied-fixture' } : {}),
    })
    assert.equal(projection.memberships.length, 1)
    assert.equal(projection.memberships[0].sourceSystem, 'supabase_profiles')
    assert.equal(projection.memberships[0].isAuthoritative, false)
  }
})

test('an explicit Outseta fixture wins over a newer contradictory profile mirror', () => {
  const [mirror] = project().memberships
  const authority = {
    ...snapshot(mirror),
    sourceSystem: 'outseta',
    sourceRecordId: 'account-fixture',
    subscriptionUid: 'subscription-fixture',
    membershipTier: 'pro',
    membershipStatus: 'canceled',
    planUid: 'pro-plan-fixture',
    isAuthoritative: true,
    authorityRank: 100,
    observedAt: '2026-09-11T11:59:00.000Z',
  }
  for (const records of [[snapshot(mirror), authority], [authority, snapshot(mirror)]]) {
    const result = resolveMembershipTruth(records)
    assert.equal(result.authoritative, authority)
    assert.equal(result.state, 'conflict')
    assert.equal(result.revenueUsable, false)
    assert.deepEqual(new Set(result.conflicts.map((conflict) => conflict.conflictType)),
      new Set(['tier_mismatch', 'status_mismatch', 'plan_mismatch']))
  }
})

test('profile-only lifecycle checks report missing authority without proposing subscription-based repairs', () => {
  for (const status of ['active', 'canceled', 'trialing']) {
    const signals = lifecycle(project({ subscription_status: status }))
    assert.deepEqual(signals.map((signal) => signal.signalType), ['lifecycle.membership_authority_missing'])
    assert.equal(signals[0].evidence[0].value.membershipTruthState, 'unknown')
    assert.match(signals[0].recommendedFollowUp, /separately approved/)
  }
})

test('lifecycle ignores old profile-derived Outseta labels and non-authoritative high ranks', () => {
  for (const overrides of [
    { sourceSystem: 'supabase_profiles', isAuthoritative: true, authorityRank: 80 },
    { sourceSystem: 'outseta', isAuthoritative: true, authorityRank: 100, provenance: { sourceTable: 'profiles', projectionVersion: 'phase-c-v1' }, sourceRefs: [] },
    { sourceSystem: 'outseta', isAuthoritative: true, authorityRank: 100, provenance: {} },
    { sourceSystem: 'outseta', isAuthoritative: false, authorityRank: 100, provenance: {}, sourceRefs: [] },
  ]) {
    const projection = project()
    Object.assign(projection.memberships[0], overrides)
    const signals = lifecycle(projection)
    assert.deepEqual(signals.map((signal) => signal.signalType), ['lifecycle.membership_authority_missing'])
  }
})

test('membership write payloads retain non-authority and deterministic replay keys', () => {
  const first = buildProjectionWriteSet(project())
  const repeat = buildProjectionWriteSet(project())
  assert.deepEqual(first.memberships, repeat.memberships)
  assert.equal(first.memberships.length, 1)
  const [row] = first.memberships
  assert.equal(row.source_system, 'supabase_profiles')
  assert.equal(row.is_authoritative, false)
  assert.equal(row.authority_rank, 0)
  assert.equal(row.mrr, null)
  assert.equal(row.arr, null)
  assert.equal(row.lifetime_revenue, null)
  assert.equal(row.revenue_state, 'unknown')
  assert.equal(row.idempotency_key, `membership:${memberId}:supabase_profiles:${observedAt}`)
  assert.equal(row.provenance.sourceTable, 'profiles')
})

test('mock persistence writes only the profile mirror and never retires provider snapshots', async () => {
  const calls = []
  const client = {
    async rpc(name, parameters) {
      calls.push({ name, parameters })
      return { data: null, error: null }
    },
    from(table) {
      const result = { data: null, error: null }
      return {
        upsert(values, options) {
          calls.push({ table, operation: 'upsert', values, options })
          return Promise.resolve(result)
        },
        update(values) {
          const call = { table, operation: 'update', values, filters: [] }
          calls.push(call)
          const query = {
            eq(column, value) { call.filters.push([column, value]); return query },
            then(resolve, reject) { return Promise.resolve(result).then(resolve, reject) },
          }
          return query
        },
      }
    },
  }
  await new SupabaseProjectionStore(client).persistMemberProjection(project())
  const membershipCalls = calls.filter((call) => call.table === 'member_memberships')
  assert.equal(membershipCalls.length, 2)
  const retirement = membershipCalls.find((call) => call.operation === 'update')
  assert.deepEqual(retirement.filters, [
    ['member_id', memberId], ['source_system', 'supabase_profiles'], ['is_current', true],
  ])
  const write = membershipCalls.find((call) => call.operation === 'upsert')
  assert.equal(write.values.is_authoritative, false)
  assert.equal(write.values.authority_rank, 0)
  assert.equal(write.values.source_system, 'supabase_profiles')
  assert.deepEqual(write.options, { onConflict: 'idempotency_key' })
})
