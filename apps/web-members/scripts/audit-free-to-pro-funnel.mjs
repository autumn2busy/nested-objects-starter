#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ts from 'typescript'
import vm from 'vm'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')

const checks = []

function read(relativePath) {
  const filePath = path.join(appRoot, relativePath)
  return fs.readFileSync(filePath, 'utf8')
}

function addCheck(name, relativePath, patterns) {
  const source = read(relativePath)
  const missing = patterns.filter((pattern) => {
    if (pattern instanceof RegExp) return !pattern.test(source)
    return !source.includes(pattern)
  })

  checks.push({
    name,
    relativePath,
    ok: missing.length === 0,
    missing: missing.map((pattern) => pattern.toString()),
  })
}

function addScenarioCheck(name, run) {
  try {
    run()
    checks.push({
      name,
      relativePath: 'lib/free-to-pro-lifecycle.ts',
      ok: true,
      missing: [],
    })
  } catch (error) {
    checks.push({
      name,
      relativePath: 'lib/free-to-pro-lifecycle.ts',
      ok: false,
      missing: [error instanceof Error ? error.message : String(error)],
    })
  }
}

function loadLifecycleModule() {
  const source = read('lib/free-to-pro-lifecycle.ts')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText

  const module = { exports: {} }
  const execute = vm.runInNewContext(
    `(function(exports, module) { ${transpiled}\n})`,
    {},
    { filename: 'free-to-pro-lifecycle.ts' },
  )
  execute(module.exports, module)
  return module.exports
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

const lifecycle = loadLifecycleModule()

addCheck('Shared event helpers include the Free-to-Pro event map', 'lib/ac-events.ts', [
  'trackPricingView',
  'trackPricingCtaClick',
  'trackJoinFreeClick',
  'trackSignupCompleted',
  'trackStartTrial',
  'trackUpgradeStarted',
  'trackOutsetaModalOpen',
  'trackDirectoryViewed',
  'trackPaywallHit',
  'trackUpgradeClicked',
  'trackFirmView',
])

addCheck('Welcome page preserves signup and completion tracking', 'app/welcome/WelcomeActivation.tsx', [
  'useAuth',
  'isAuthenticated',
  'shouldShowPendingConfirmation',
  'Check your email to finish setup',
  "window.gtag('event', 'sign_up'",
  "event: 'sign_up'",
  'trackSignupCompleted',
  "body: JSON.stringify({ tag: 'member-activated' })",
])

addCheck('Pricing page tracks pricing intent and Outseta handoff', 'app/membership-pricing/MembershipView.tsx', [
  'trackPricingView',
  'trackPricingCtaClick',
  'trackJoinFreeClick',
  'trackStartTrial',
  'trackUpgradeStarted',
  'trackOutsetaModalOpen',
  "mode: 'profile_plan_change'",
  "mode: 'register'",
])

addCheck('Directory client tracks paywall and upgrade behavior', 'app/hiring-firms/DirectoryView.tsx', [
  'trackDirectoryViewed',
  'trackPaywallHit',
  'trackUpgradeClicked',
  "feature: isGuest ? 'directory_login_required' : 'directory_preview_limit'",
  "trackUpgradeClicked('hiring_firms_blurred_teasers'",
])

addCheck('Directory server enforces restricted preview payload', 'app/hiring-firms/page.tsx', [
  'getCurrentUser',
  'FREE_VISIBLE_COUNT',
  'FREE_TEASER_COUNT',
  'sanitizeFreePreviewFirms',
  "const isRestricted = isGuest || isFree",
  "const stateFilter = isRestricted ? 'ALL'",
  "const search = isRestricted ? ''",
  'const directoryFirms = isGuest ? [] : isFree ? sanitizeFreePreviewFirms(firms) : firms',
])

addCheck('Firm profile view and paywall tracking uses Pro+ firm_intel', 'app/firms/[slug]/FirmViewTracker.tsx', [
  'trackFirmView',
  'trackPaywallHit',
  "hasAccess('firm_intel')",
  "feature: 'firm_intel'",
])

addCheck('Firm detail content gate requires firm_intel', 'app/firms/[slug]/FirmGatedContent.tsx', [
  'feature="firm_intel"',
  'Upgrade to Pro for full firm intel',
])

addCheck('Firm Apply/Contact CTAs require firm_intel', 'app/firms/[slug]/AuthCTA.tsx', [
  "hasAccess('firm_intel')",
  'trackPaywallHit',
  "trackUpgradeClicked('firm_detail_contact_cta'",
  "window.location.href = '/membership-pricing'",
])

addCheck('Outseta webhook emits paid transition events only on paid changes', 'app/api/webhooks/outseta/route.ts', [
  'buildPaidLifecycleDecision',
  'trackPurchase',
  'trackSubscriptionUpgraded',
  'lifecycleDecision.shouldTrack',
  'lifecycleDecision.purchasePayload',
  'no_subscription_event_needed',
])

addCheck('Server event tracking exposes purchase helper', 'lib/ac-event-tracking.ts', [
  'export async function trackPurchase',
  "event: 'purchase'",
])

addCheck('Lifecycle helper exposes deterministic paid transition decision API', 'lib/free-to-pro-lifecycle.ts', [
  'export function buildPaidLifecycleDecision',
  'direct_paid_signup',
  'free_to_paid_upgrade',
  'paid_plan_change',
  'paid_plan_unchanged',
  'new_plan_is_free',
])

addScenarioCheck('Lifecycle scenario: Free member upgrades to Pro', () => {
  const result = lifecycle.buildPaidLifecycleDecision({
    operation: 'update',
    previous: { subscription_tier: 'free', plan_name: 'Free', plan_uid: 'L9nbKV9Z' },
    current: { subscription_tier: 'pro', plan_name: 'Pro', plan_uid: 'rQVqlLm6' },
  })
  assertEqual(result.shouldTrack, true, 'shouldTrack')
  assertEqual(result.reason, 'free_to_paid_upgrade', 'reason')
  assertEqual(result.subscriptionEvent, 'subscription_upgraded', 'subscriptionEvent')
  assertEqual(result.purchasePayload?.value, 49, 'purchase value')
  assertEqual(result.purchasePayload?.transition, 'free_to_paid_upgrade', 'purchase transition')
})

addScenarioCheck('Lifecycle scenario: Direct Pro signup', () => {
  const result = lifecycle.buildPaidLifecycleDecision({
    operation: 'insert',
    previous: null,
    current: { subscription_tier: 'pro', plan_name: 'Pro', plan_uid: 'rQVqlLm6' },
  })
  assertEqual(result.shouldTrack, true, 'shouldTrack')
  assertEqual(result.reason, 'direct_paid_signup', 'reason')
  assertEqual(result.subscriptionEvent, 'subscription_created', 'subscriptionEvent')
  assertEqual(result.purchasePayload?.value, 49, 'purchase value')
})

addScenarioCheck('Lifecycle scenario: Paid plan update without plan change', () => {
  const result = lifecycle.buildPaidLifecycleDecision({
    operation: 'update',
    previous: { subscription_tier: 'pro', plan_name: 'Pro', plan_uid: 'rQVqlLm6' },
    current: { subscription_tier: 'pro', plan_name: 'Pro', plan_uid: 'rQVqlLm6' },
  })
  assertEqual(result.shouldTrack, false, 'shouldTrack')
  assertEqual(result.reason, 'paid_plan_unchanged', 'reason')
})

addScenarioCheck('Lifecycle scenario: Free plan update stays free', () => {
  const result = lifecycle.buildPaidLifecycleDecision({
    operation: 'update',
    previous: { subscription_tier: 'free', plan_name: 'Free', plan_uid: 'L9nbKV9Z' },
    current: { subscription_tier: 'free', plan_name: 'Free', plan_uid: 'L9nbKV9Z' },
  })
  assertEqual(result.shouldTrack, false, 'shouldTrack')
  assertEqual(result.reason, 'new_plan_is_free', 'reason')
})

addScenarioCheck('Lifecycle scenario: Pro member changes to Elite', () => {
  const result = lifecycle.buildPaidLifecycleDecision({
    operation: 'update',
    previous: { subscription_tier: 'pro', plan_name: 'Pro', plan_uid: 'rQVqlLm6' },
    current: { subscription_tier: 'elite', plan_name: 'Elite', plan_uid: 'NmdnNO90' },
  })
  assertEqual(result.shouldTrack, true, 'shouldTrack')
  assertEqual(result.reason, 'paid_plan_change', 'reason')
  assertEqual(result.subscriptionEvent, 'subscription_upgraded', 'subscriptionEvent')
  assertEqual(result.purchasePayload?.value, 97, 'purchase value')
  assertEqual(result.previousPlan, 'Pro', 'previousPlan')
})

const failed = checks.filter((check) => !check.ok)

console.log('# Free-to-Pro Funnel Audit')
console.log(`Run: ${new Date().toISOString()}`)
console.log(`Checks: ${checks.length}`)
console.log('')

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} - ${check.name}`)
  if (!check.ok) {
    console.log(`  file: ${check.relativePath}`)
    for (const missing of check.missing) {
      console.log(`  missing: ${missing}`)
    }
  }
}

console.log('')
console.log(failed.length === 0 ? 'Result: PASS' : `Result: FAIL (${failed.length} failing checks)`)

if (failed.length > 0) {
  process.exitCode = 1
}
