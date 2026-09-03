import test from 'node:test'
import assert from 'node:assert/strict'

import { buildConversionFunnel, type ConversionEventRow } from './conversion-funnel'
import { PLAN_UIDS } from './plan-config'

function event(
  id: string,
  eventName: string,
  occurredAt: string,
  overrides: Partial<ConversionEventRow> = {},
): ConversionEventRow {
  return {
    id,
    event_name: eventName,
    anonymous_id: 'anon-1',
    member_uid: 'member-1',
    member_email: 'member@example.com',
    plan_uid: 'free-plan',
    plan_name: 'Free',
    source_page: '/welcome',
    source: 'organic',
    reason: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    occurred_at: occurredAt,
    event_data: {},
    ...overrides,
  }
}

test('counts recorded signup identities and independent post-signup signals', () => {
  const rows = [
    event('1', 'signup_completed', '2026-08-01T10:00:00.000Z'),
    event('2', 'profile_completed', '2026-08-01T10:05:00.000Z'),
    event('3', 'directory_viewed', '2026-08-01T10:10:00.000Z'),
    event('4', 'paywall_hit', '2026-08-01T10:15:00.000Z'),
    event('5', 'pricing_view', '2026-08-01T10:16:00.000Z'),
    event('6', 'upgrade_started', '2026-08-01T10:17:00.000Z', {
      event_data: { targetPlan: 'Pro' },
    }),
    event('7', 'outseta_modal_open', '2026-08-01T10:18:00.000Z', {
      event_data: { targetPlan: 'Pro', mode: 'profile_plan_change' },
    }),
    event('8', 'purchase', '2026-08-01T10:20:00.000Z', { plan_name: 'Pro' }),
    event('9', 'pricing_view', '2026-08-01T10:21:00.000Z'),
  ]

  const result = buildConversionFunnel(rows, { plan: 'free' })

  assert.equal(result.cohortSize, 1)
  assert.deepEqual(result.stages.map((stage) => stage.count), [1, 1, 1, 1, 1, 1, 1, 1])
  assert.equal(result.stuckMembers.length, 0)
})

test('stitches an anonymous browser identity to the authenticated member', () => {
  const rows = [
    event('1', 'pricing_view', '2026-08-01T09:55:00.000Z', {
      member_uid: null,
      member_email: null,
    }),
    event('2', 'signup_completed', '2026-08-01T10:00:00.000Z'),
    event('3', 'paywall_hit', '2026-08-01T10:10:00.000Z'),
  ]

  const result = buildConversionFunnel(rows)

  assert.equal(result.cohortSize, 1)
  assert.equal(result.stuckMembers.length, 1)
  assert.equal(result.stuckMembers[0].email, 'member@example.com')
  assert.equal(result.stuckMembers[0].latestStageKey, 'paywall')
  assert.equal(result.stages.find((stage) => stage.key === 'pricing')?.count, 0)
})

test('filters the signup cohort by plan and attribution source', () => {
  const rows = [
    event('1', 'signup_completed', '2026-08-01T10:00:00.000Z'),
    event('2', 'signup_completed', '2026-08-01T11:00:00.000Z', {
      anonymous_id: 'anon-2',
      member_uid: 'member-2',
      member_email: 'paid@example.com',
      plan_name: 'Pro',
      source: 'partner',
    }),
  ]

  const freeOrganic = buildConversionFunnel(rows, { plan: 'free', source: 'organic' })
  const proPartner = buildConversionFunnel(rows, { plan: 'Pro', source: 'partner' })

  assert.equal(freeOrganic.cohortSize, 1)
  assert.equal(proPartner.cohortSize, 1)
  assert.equal(proPartner.stuckMembers[0].email, 'paid@example.com')
})

test('prefers browser signup attribution over the Outseta fallback event', () => {
  const rows = [
    event('1', 'signup_completed', '2026-08-01T10:00:00.000Z', {
      source: 'outseta',
      source_page: 'outseta_webhook',
    }),
    event('2', 'signup_completed', '2026-08-01T10:01:00.000Z', {
      source: 'google-business-profile',
      source_page: '/welcome',
    }),
  ]

  const result = buildConversionFunnel(rows, { source: 'google-business-profile' })

  assert.equal(result.cohortSize, 1)
  assert.equal(result.stuckMembers[0].source, 'google-business-profile')
})

for (const eventName of ['pricing_cta_click', 'upgrade_clicked', 'upgrade_started', 'start_trial']) {
  test(`${eventName} counts known paid targets but excludes Free and unknown targets`, () => {
    for (const [eventData, expected] of [
      [{ targetPlan: 'Pro' }, 1],
      [{ targetPlanUid: PLAN_UIDS.ELITE }, 1],
      [{ targetPlan: 'Free' }, 0],
      [{ targetPlanUid: PLAN_UIDS.FREE, targetPlan: 'Pro' }, 0],
      [{ targetPlan: 'unrecognized-plan' }, 0],
      [{}, 0],
    ] as const) {
      const result = buildConversionFunnel([
        event('1', 'signup_completed', '2026-08-01T10:00:00.000Z'),
        event('2', eventName, '2026-08-01T10:05:00.000Z', { event_data: eventData }),
      ])
      assert.equal(result.stages.find((stage) => stage.key === 'intent')?.count, expected, JSON.stringify(eventData))
    }
  })
}

test('checkout attempts require a known paid target and registration or plan-change mode', () => {
  for (const [eventData, expected] of [
    [{ targetPlan: 'Pro', mode: 'register' }, 1],
    [{ targetPlan: 'Pro', mode: 'register_redirect' }, 1],
    [{ targetPlanUid: PLAN_UIDS.AGENCY, mode: 'profile_plan_change' }, 1],
    [{ targetPlan: 'Pro', mode: 'login' }, 0],
    [{ targetPlan: 'Pro', mode: 'login_redirect' }, 0],
    [{ targetPlan: 'Free', mode: 'register' }, 0],
    [{ mode: 'register' }, 0],
    [{ targetPlan: 'Pro' }, 0],
    [{}, 0],
  ] as const) {
    const result = buildConversionFunnel([
      event('1', 'signup_completed', '2026-08-01T10:00:00.000Z'),
      event('2', 'outseta_modal_open', '2026-08-01T10:05:00.000Z', { event_data: eventData }),
    ])
    assert.equal(result.stages.find((stage) => stage.key === 'checkout')?.count, expected, JSON.stringify(eventData))
  }
})

test('a shared anonymous identifier stays unstitched regardless of input order', () => {
  const rows = [
    event('1', 'signup_completed', '2026-08-01T10:00:00.000Z'),
    event('2', 'signup_completed', '2026-08-01T10:01:00.000Z', {
      member_uid: 'member-2', member_email: 'second@example.com',
    }),
    event('3', 'pricing_view', '2026-08-01T10:05:00.000Z', {
      member_uid: null, member_email: null,
    }),
    event('4', 'directory_viewed', '2026-08-01T10:06:00.000Z'),
  ]
  for (const ordered of [rows, [...rows].reverse()]) {
    const result = buildConversionFunnel(ordered)
    assert.equal(result.cohortSize, 2)
    assert.equal(result.ambiguousAnonymousIds, 1)
    assert.equal(result.stages.find((stage) => stage.key === 'pricing')?.count, 0)
    assert.equal(result.stages.find((stage) => stage.key === 'value')?.count, 1)
  }
})

test('an unambiguous anonymous post-signup action can be linked to its member', () => {
  const result = buildConversionFunnel([
    event('1', 'signup_completed', '2026-08-01T10:00:00.000Z'),
    event('2', 'pricing_view', '2026-08-01T10:05:00.000Z', {
      member_uid: null, member_email: null,
    }),
  ])
  assert.equal(result.ambiguousAnonymousIds, 0)
  assert.equal(result.stages.find((stage) => stage.key === 'pricing')?.count, 1)
})

test('skipped optional signals do not become a sequential drop-off or payment claim', () => {
  const result = buildConversionFunnel([
    event('1', 'signup_completed', '2026-08-01T10:00:00.000Z'),
    event('2', 'purchase', '2026-08-01T10:05:00.000Z', {
      plan_name: 'Pro', source: 'outseta', source_page: 'outseta_webhook',
    }),
  ])
  assert.equal(result.stages.find((stage) => stage.key === 'profile')?.count, 0)
  const paid = result.stages.find((stage) => stage.key === 'paid')!
  assert.equal(paid.count, 1)
  assert.equal(paid.observedShare, 100)
  assert.match(paid.description, /Unverified.*does not confirm payment/)
  assert.ok(result.stages.every((stage) => !('dropOff' in stage) && !('conversionRate' in stage)))
})
