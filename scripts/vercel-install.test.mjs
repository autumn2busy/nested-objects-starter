import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { resolveInstallPlan, resolveInstallPlans } from './vercel-install.mjs'

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
