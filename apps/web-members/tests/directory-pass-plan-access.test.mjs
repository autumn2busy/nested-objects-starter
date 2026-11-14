import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
function load(path, imports = {}, uid = 'PassTest1', checkoutEnabled = false) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, { exports, process: { env: { NEXT_PUBLIC_OUTSETA_DIRECTORY_PASS_PLAN_UID: uid, NEXT_PUBLIC_DIRECTORY_PASS_CHECKOUT_ENABLED: checkoutEnabled ? 'true' : 'false' } },
    require(name) { if (name in imports) return imports[name]; throw Error(`Unexpected import: ${name}`) } })
  return exports
}
const plans = load('../lib/plan-config.ts')
const tools = load('../lib/member-tool-access.ts', { './plan-config': plans })
test('Directory Pass adds directory access and the calculator without inheriting Pro or Elite tools', () => {
  assert.equal(plans.PAID_PLANS.includes('PassTest1'), true)
  assert.equal(plans.PRO_OR_HIGHER.includes('PassTest1'), false)
  assert.equal(plans.getPlanName('PassTest1'), 'Directory Pass')
  for (const tool of Object.values(tools.MEMBER_TOOL_IDS)) {
    assert.equal(tools.canAccessMemberTool('PassTest1', tool), tool === 'income_scenario', tool)
  }
})
test('all six existing plans retain their original tool entitlements', () => {
  const expected = { FREE: 1, STARTER: 6, FOUNDERS: 6, PRO: 8, ELITE: 9, AGENCY: 9 }
  for (const [name, count] of Object.entries(expected)) {
    assert.equal(Object.values(tools.MEMBER_TOOL_IDS).filter(tool => tools.canAccessMemberTool(plans.PLAN_UIDS[name], tool)).length, count, name)
  }
})
test('missing, malformed and legacy-colliding pass configuration never enables a new checkout', () => {
  for (const uid of ['', 'bad uid', ...Object.values(plans.PLAN_UIDS)]) {
    const config = load('../lib/plan-config.ts', {}, uid)
    assert.equal(config.DIRECTORY_PASS_PLAN_UID, '', uid)
    assert.equal(config.isDirectoryPassPlanUid(uid), false, uid)
    assert.equal(config.isPublicPlanUid(config.PLAN_UIDS.ELITE), false)
  }
})

test('a checkout hold blocks new Pass purchases without revoking purchased directory access', () => {
  const held = load('../lib/plan-config.ts')
  const heldPlans = load('../lib/ai-datasets.ts', { './plan-config': held })
  assert.equal(held.DIRECTORY_PASS_CHECKOUT_ENABLED, false)
  assert.equal(held.PAID_PLANS.includes('PassTest1'), true)
  assert.equal(heldPlans.membershipPlans.find(plan => plan.name === 'Directory Pass').checkoutUnavailable, true)
  const enabled = load('../lib/plan-config.ts', {}, 'PassTest1', true)
  const enabledPlans = load('../lib/ai-datasets.ts', { './plan-config': enabled })
  assert.equal(enabledPlans.membershipPlans.find(plan => plan.name === 'Directory Pass').checkoutUnavailable, false)
  assert.equal(enabledPlans.membershipPlans.find(plan => plan.name === 'Pro').price, '$49')
})