#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'url'
import ts from 'typescript'
import vm from 'vm'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')

const checks = []
const nodeTestResults = new Map()

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

function runNodeTest(relativePath) {
  if (nodeTestResults.has(relativePath)) return nodeTestResults.get(relativePath)

  const filePath = path.join(appRoot, relativePath)
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', filePath], {
    cwd: appRoot,
    encoding: 'utf8',
    timeout: 120_000,
    windowsHide: true,
  })
  const output = `${result.stdout || ''}\n${result.stderr || ''}`
  const failures = []
  const passCount = Number(output.match(/# pass (\d+)/)?.[1] || 0)
  const skippedCount = Number(output.match(/# skipped (\d+)/)?.[1] || 0)

  if (result.error) failures.push(result.error.message)
  if (result.status !== 0) failures.push(`node --test exited with status ${result.status ?? 'unknown'}`)
  if (passCount === 0) failures.push('node --test reported no passing cases')
  if (skippedCount !== 0) failures.push(`node --test reported ${skippedCount} skipped cases`)

  const testResult = { output, failures }
  nodeTestResults.set(relativePath, testResult)
  return testResult
}

function addBehaviorCheck(name, relativePath, requiredCases, sourceRequirements = []) {
  const result = runNodeTest(relativePath)
  const missing = requiredCases
    .filter((testName) => !result.output.includes(testName))
    .map((testName) => `missing behavior case: ${testName}`)
  for (const requirement of sourceRequirements) {
    const source = read(requirement.relativePath)
    for (const pattern of requirement.patterns) {
      const present = pattern instanceof RegExp ? pattern.test(source) : source.includes(pattern)
      if (!present) missing.push(`missing source contract in ${requirement.relativePath}: ${pattern}`)
    }
  }
  const failures = [...result.failures, ...missing]

  checks.push({
    name,
    relativePath: [relativePath, ...sourceRequirements.map((item) => item.relativePath)].join('; '),
    ok: failures.length === 0,
    missing: failures,
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

  const lifecycleModule = { exports: {} }
  const execute = vm.runInNewContext(
    `(function(exports, module) { ${transpiled}\n})`,
    {},
    { filename: 'free-to-pro-lifecycle.ts' },
  )
  execute(lifecycleModule.exports, lifecycleModule)
  return lifecycleModule.exports
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

addCheck('Pricing page tracks pricing intent and Outseta handoff', 'app/membership-pricing/PricingInteractions.tsx', [
  'trackPricingView',
  'trackPricingCtaClick',
  'trackJoinFreeClick',
  'trackStartTrial',
  'trackUpgradeStarted',
  'trackOutsetaModalOpen',
  "mode: 'profile_plan_change'",
  "mode: 'register'",
])

addCheck('Directory client tracks paywall and upgrade behavior', 'app/hiring-firms/DirectoryActions.tsx', [
  'trackDirectoryViewed',
  'trackPaywallHit',
  'trackUpgradeClicked',
  "feature: accessLevel === 'guest' ? 'directory_login_required' : 'directory_preview_limit'",
  "trackUpgradeClicked('hiring_firms_' + source",
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

addBehaviorCheck('Outseta webhook preserves paid transition routing and withholds unknown billing state', 'tests/outseta-billing-stage.test.mjs', [
  'Outseta numeric stages match the documented billing lifecycle without a label',
  'missing, unrecognized, and contradictory billing evidence is unknown rather than active',
  'real webhook mapping passes correct statuses to sync and preserves stored state on a plan-light update',
  'unknown lifecycle does not write ACTIVE recurring payment or replace existing status tags',
], [{
  relativePath: 'app/api/webhooks/outseta/route.ts',
  patterns: [
    'buildPaidLifecycleDecision',
    'trackPurchase',
    'trackSubscriptionUpgraded',
    'lifecycleDecision.shouldTrack',
    'lifecycleDecision.purchasePayload',
    'no_subscription_event_needed',
    'preserveStoredMembershipContext(profileData, existing)',
    'subscription_end_date: subscription?.RenewalDate || subscription?.EndDate || null',
    'mapAccountStageToStatus(account.AccountStage, account.AccountStageLabel)',
  ],
}])

addBehaviorCheck('ActiveCampaign sync confirms replacement tags before removing conflicts', 'tests/active-campaign-sync.test.mjs', [
  'replacement failure preserves its old dimension while independent status repair continues',
  '422 is not treated as already applied without exact positive readback',
  '422 concurrent exact association readback succeeds without retrying the write',
  'replacement is confirmed before removal; redelivery does not reapply observed tags',
  'failed removal reports partial cleanup without removing the replacement',
  'tag read failure never triggers blind deletion or a claim of complete cleanup',
])

addBehaviorCheck('ActiveCampaign recurring mirrors stay downstream of verified membership state', 'tests/active-campaign-sync.test.mjs', [
  'failed projection lookup prevents side effects instead of fabricating membership context',
  'duplicate-order validation is resolved only through an exact customer/connection/external ID match',
  'GraphQL error or missing receipt is failed, not a completed recurring mirror',
  'order failure is reported while the independent recurring submission still runs',
  'incomplete renewal field lookup prevents blind field creation',
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
