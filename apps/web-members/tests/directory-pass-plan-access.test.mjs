import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
function load(path, imports = {}, uid = 'PassTest1') {
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, { exports, process: { env: { NEXT_PUBLIC_OUTSETA_DIRECTORY_PASS_PLAN_UID: uid } },
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
