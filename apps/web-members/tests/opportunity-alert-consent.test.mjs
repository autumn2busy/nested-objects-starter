import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function load(relativePath, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    require(name) {
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import: ${name}`)
    },
  })
  return exports
}

const plans = load('../lib/plan-config.ts')
const consent = load('../lib/opportunity-alert-consent.ts', { './plan-config': plans })
const now = new Date('2026-09-12T12:00:00.000Z')

function fixture() {
  return {
    viewer: {
      sub: 'person-fixture',
      'outseta:accountUid': 'account-fixture',
      'outseta:subscriptionUid': 'subscription-fixture',
      'outseta:planUid': plans.PLAN_UIDS.ELITE,
    },
    profile: {
      outseta_person_uid: 'person-fixture',
      outseta_account_id: 'account-fixture',
      subscription_tier: 'elite',
      subscription_status: 'active',
      subscription_start_date: '2026-08-01T00:00:00.000Z',
      subscription_end_date: '2026-10-01T00:00:00.000Z',
      plan_uid: plans.PLAN_UIDS.ELITE,
      outseta_data: {
        Uid: 'account-fixture',
        IsDemo: false,
        CurrentSubscription: { Uid: 'subscription-fixture' },
      },
    },
  }
}

test('offers the double-opt-in form only with exact active non-demo Elite evidence', () => {
  const input = fixture()
  const result = consent.evaluateEliteOpportunityAlertConsentOffer(input.viewer, input.profile, now)
  assert.equal(result.allowed, true)
  assert.equal(result.reason, 'allowed')
  assert.equal(consent.ELITE_OPPORTUNITY_ALERTS_OPT_IN_URL, 'https://awilliams.activehosted.com/f/88')
})

test('withholds mismatched or incomplete stable identity evidence', () => {
  for (const mutate of [
    (value) => { delete value.viewer.sub },
    (value) => { value.profile.outseta_person_uid = 'different-person' },
    (value) => { value.profile.outseta_account_id = 'different-account' },
    (value) => { value.profile.outseta_data.CurrentSubscription.Uid = 'different-subscription' },
  ]) {
    const input = fixture()
    mutate(input)
    assert.equal(consent.evaluateEliteOpportunityAlertConsentOffer(input.viewer, input.profile, now).allowed, false)
  }
})

test('withholds non-Elite, inactive, expired, future, demo, and unknown-demo records', () => {
  const cases = [
    (value) => { value.viewer['outseta:planUid'] = plans.PLAN_UIDS.PRO },
    (value) => { value.profile.plan_uid = plans.PLAN_UIDS.PRO },
    (value) => { value.profile.subscription_tier = 'pro' },
    (value) => { value.profile.subscription_status = 'past_due' },
    (value) => { value.profile.subscription_end_date = '2026-09-12T12:00:00.000Z' },
    (value) => { value.profile.subscription_start_date = '2026-09-13T00:00:00.000Z' },
    (value) => { value.profile.outseta_data.IsDemo = true },
    (value) => { delete value.profile.outseta_data.IsDemo },
  ]

  for (const mutate of cases) {
    const input = fixture()
    mutate(input)
    assert.equal(consent.evaluateEliteOpportunityAlertConsentOffer(input.viewer, input.profile, now).allowed, false)
  }
})

test('supports person-centric Outseta projection only when the exact account and subscription agree', () => {
  const input = fixture()
  input.profile.outseta_data = {
    Uid: 'person-fixture',
    PersonAccount: [{
      IsPrimary: true,
      Account: {
        Uid: 'account-fixture',
        IsDemo: false,
        LatestSubscription: { Uid: 'subscription-fixture' },
      },
    }],
  }

  assert.equal(consent.evaluateEliteOpportunityAlertConsentOffer(input.viewer, input.profile, now).allowed, true)
})

test('profile surface preserves double opt-in and does not claim consent or send authorization', () => {
  const page = readFileSync(new URL('../app/(portal)/profile/page.tsx', import.meta.url), 'utf8')
  const view = readFileSync(new URL('../app/(portal)/profile/ProfileView.tsx', import.meta.url), 'utf8')

  assert.match(page, /evaluateEliteOpportunityAlertConsentOffer/)
  assert.match(view, /confirm the subscription from your inbox/i)
  assert.match(view, /Alerts begin only after you confirm/i)
  assert.match(view, /checked again before each approved email/i)
  assert.doesNotMatch(view, /fetch\([^)]*opportunity/i)
  assert.doesNotMatch(view, /subscribe.*contact|send.*campaign|schedule.*campaign/i)
})
