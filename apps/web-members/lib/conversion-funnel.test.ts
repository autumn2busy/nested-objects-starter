import test from 'node:test'
import assert from 'node:assert/strict'

import { buildConversionFunnel, type ConversionEventRow } from './conversion-funnel'

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

test('builds a unique-member Free to Paid funnel', () => {
  const rows = [
    event('1', 'signup_completed', '2026-08-01T10:00:00.000Z'),
    event('2', 'profile_completed', '2026-08-01T10:05:00.000Z'),
    event('3', 'directory_viewed', '2026-08-01T10:10:00.000Z'),
    event('4', 'paywall_hit', '2026-08-01T10:15:00.000Z'),
    event('5', 'pricing_view', '2026-08-01T10:16:00.000Z'),
    event('6', 'upgrade_started', '2026-08-01T10:17:00.000Z'),
    event('7', 'outseta_modal_open', '2026-08-01T10:18:00.000Z'),
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
