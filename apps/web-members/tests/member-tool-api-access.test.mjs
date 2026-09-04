import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function loadRoute(relativePath) {
  let currentUser = null
  let databaseCalls = 0

  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}

  vm.runInNewContext(code, {
    exports,
    console,
    URL,
    Request,
    fetch() { throw new Error('External fetch must not run before authorization') },
    require(name) {
      if (name === 'next/server') {
        return { NextResponse: { json: (body, init = {}) => ({ body, status: init.status ?? 200 }) } }
      }
      if (name === '@/lib/auth-server') {
        return {
          getCurrentUser: async () => currentUser,
          getOutsetaUserId: (user) => user?.sub ?? null,
        }
      }
      if (name === '@/lib/member-tool-access') {
        return {
          MEMBER_TOOL_IDS: { CLIENT_WORKSPACE: 'client_workspace', COMPANY_TRACKER: 'company_tracker', WEATHER: 'weather' },
          canAccessMemberTool: (planUid) => planUid === 'pro' || planUid === 'elite' || planUid === 'agency',
        }
      }
      if (name === '@/lib/supabase-server' || name === '@/lib/supabase-admin') {
        return { createServiceRoleClient() { databaseCalls += 1; throw new Error('Database should not run') } }
      }
      throw new Error(`Unexpected import in ${relativePath}: ${name}`)
    },
  })

  return {
    route: exports,
    signIn(planUid) { currentUser = { sub: 'member-1', 'outseta:planUid': planUid } },
    signOut() { currentUser = null },
    databaseCalls: () => databaseCalls,
  }
}

for (const [name, relativePath, request] of [
  ['client tracker', '../app/api/client-tracker/route.ts', undefined],
  ['company tracker', '../app/api/company-tracker/route.ts', undefined],
  ['weather', '../app/api/weather/route.ts', new Request('https://example.test/api/weather?q=Denver')],
]) {
  test(`${name} rejects visitors and Free members before database or external access`, async () => {
    const subject = loadRoute(relativePath)

    subject.signOut()
    const visitor = await subject.route.GET(request)
    assert.equal(visitor.status, 401)

    subject.signIn('free')
    const free = await subject.route.GET(request)
    assert.equal(free.status, 403)
    assert.equal(subject.databaseCalls(), 0)
  })
}
