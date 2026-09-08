import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { resolveInstallPlan, resolveInstallPlans, runInstall, verifyRootFramework } from './vercel-install.mjs'

const MEMBERS = 'prj_vv4pDxAdR8GXJumgetMhEMHYfIo5'
const PUBLIC = 'prj_eFf2jkgMrUHoSsVKNuEmjsjH64UP'
const silentLogger = { log() {}, warn() {}, error() {} }

function exercise(projectId, overrides = {}) {
  const calls = []
  const result = runInstall({
    projectId,
    cwd: '/isolated/project',
    platform: 'linux',
    logger: silentLogger,
    verify: cwd => {
      calls.push(['verify', cwd])
      return '14.2.9'
    },
    run: (command, args, options) => {
      calls.push([command, args, options])
      return { status: 0 }
    },
    ...overrides,
  })
  return { result, calls }
}

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'nested-vercel-install-test-'))
  // Only remove this test's freshly created temporary directory, never a checkout.
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  return directory
}

function addFramework(directory) {
  const location = join(directory, 'node_modules', 'next')
  mkdirSync(location, { recursive: true })
  writeFileSync(join(location, 'package.json'), JSON.stringify({ name: 'next', version: '14.2.9' }))
}

test('falls back to the configured project root when the repository selector is unavailable', () => {
  const vercelConfig = JSON.parse(
    readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')
  )

  assert.equal(
    vercelConfig.installCommand,
    'if [ -f scripts/vercel-install.mjs ]; then node scripts/vercel-install.mjs; else npm install --no-audit --no-fund; fi'
  )
})

test('selects one member app install for the member-site Vercel project', () => {
  assert.deepEqual(resolveInstallPlan('prj_vv4pDxAdR8GXJumgetMhEMHYfIo5'), {
    command: 'ci',
    directory: 'apps/web-members',
  })
})

test('selects one public app install for the public-site Vercel project', () => {
  assert.deepEqual(resolveInstallPlan('prj_eFf2jkgMrUHoSsVKNuEmjsjH64UP'), {
    command: 'install',
    directory: 'apps/web-public',
  })
})

test('does not guess for an unknown repository-root project', () => {
  assert.equal(resolveInstallPlan('prj_unknown'), null)
  assert.deepEqual(resolveInstallPlans('prj_unknown'), [
    { command: 'ci', directory: 'apps/web-members' },
    { command: 'install', directory: 'apps/web-public' },
  ])
})

test('bootstraps root without lifecycle recursion, verifies it, then installs Members once', () => {
  const { result, calls } = exercise(MEMBERS)
  assert.equal(result, 0)
  assert.deepEqual(calls.map(call => call.slice(0, 2)), [
    ['npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund']],
    ['verify', '/isolated/project'],
    ['npm', ['ci', '--prefix', 'apps/web-members', '--no-audit', '--no-fund']],
  ])
  assert.deepEqual(calls[0][2], {
    cwd: '/isolated/project', stdio: 'inherit', windowsHide: true, shell: false,
  })
})

test('public and unknown root installs retain their existing app selection', () => {
  const publicRun = exercise(PUBLIC)
  assert.equal(publicRun.result, 0)
  assert.deepEqual(publicRun.calls[2][1], ['install', '--prefix', 'apps/web-public', '--no-audit', '--no-fund'])
  assert.equal(publicRun.calls.length, 3)
  const unknownRun = exercise('unknown')
  assert.equal(unknownRun.result, 0)
  assert.deepEqual(unknownRun.calls.slice(2).map(call => call[1][2]), ['apps/web-members', 'apps/web-public'])
})

test('root command failure or spawn error prevents verification and app installation', () => {
  for (const failure of [{ status: 7 }, { status: null, error: new Error('spawn failed') }, { status: null, signal: 'SIGTERM' }]) {
    let attempts = 0
    const { result, calls } = exercise(MEMBERS, {
      run: () => { attempts += 1; return failure },
    })
    assert.equal(result, failure.status || 1)
    assert.equal(attempts, 1)
    assert.deepEqual(calls, [])
  }
})

test('failed root framework detection stops before app installation', () => {
  const { result, calls } = exercise(MEMBERS, {
    verify: () => { throw new Error('MODULE_NOT_FOUND') },
  })
  assert.equal(result, 1)
  assert.equal(calls.length, 1)
})

test('selected app failure preserves its exit code', () => {
  let attempts = 0
  const { result } = exercise('unknown', {
    run: () => ({ status: ++attempts === 2 ? 9 : 0 }),
  })
  assert.equal(result, 9)
  assert.equal(attempts, 2)
})

test('Windows uses the shell required to execute npm.cmd with fixed internal arguments', () => {
  const { result, calls } = exercise(MEMBERS, { platform: 'win32' })
  assert.equal(result, 0)
  assert.equal(calls[0][0], 'npm.cmd')
  assert.equal(calls[0][2].shell, true)
})

test('root detection rejects app-only dependencies and accepts installed root Next', t => {
  const directory = fixture(t)
  addFramework(join(directory, 'apps', 'web-members'))
  assert.throws(() => verifyRootFramework(directory), /Cannot find module/)
  addFramework(directory)
  assert.equal(verifyRootFramework(directory), '14.2.9')
})

test('root detection does not accept an ancestor cache', t => {
  const directory = fixture(t)
  addFramework(directory)
  const checkout = join(directory, 'checkout')
  mkdirSync(checkout)
  assert.throws(() => verifyRootFramework(checkout), /ancestor cache/)
})

test('root bootstrap has a matching lockfile and preserves the recursive lifecycle guard', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies)
  assert.deepEqual(lock.packages[''].devDependencies, manifest.devDependencies)
  assert.equal(lock.packages['node_modules/next'].version, manifest.dependencies.next)
  assert.match(manifest.scripts.install, /apps\/web-members/)
})
