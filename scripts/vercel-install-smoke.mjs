#!/usr/bin/env node

import assert from 'node:assert/strict'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { runInstall, verifyRootFramework } from './vercel-install.mjs'

// Real install/detection acceptance without copying credentials, running Next builds,
// or replacing dependencies in a developer's checkout. npm's download cache may
// be reused; no node_modules or Vercel build artifact is copied into this fixture.
const temporaryParent = resolve(tmpdir())
const temporaryRoot = mkdtempSync(join(temporaryParent, 'nested-vercel-cold-install-'))
assert.equal(dirname(temporaryRoot), temporaryParent)
const manifests = [
  'package.json',
  'package-lock.json',
  'apps/web-members/package.json',
  'apps/web-members/package-lock.json',
]

try {
  for (const file of manifests) {
    const destination = join(temporaryRoot, file)
    mkdirSync(dirname(destination), { recursive: true })
    copyFileSync(new URL(`../${file}`, import.meta.url), destination)
  }
  assert.equal(existsSync(join(temporaryRoot, 'node_modules')), false)
  assert.equal(existsSync(join(temporaryRoot, 'apps/web-members/node_modules')), false)
  assert.throws(() => verifyRootFramework(temporaryRoot))

  const result = runInstall({
    cwd: temporaryRoot,
    projectId: 'prj_vv4pDxAdR8GXJumgetMhEMHYfIo5',
  })
  assert.equal(result, 0, 'cold install must succeed')
  const manifest = JSON.parse(readFileSync(join(temporaryRoot, 'package.json'), 'utf8'))
  assert.equal(verifyRootFramework(temporaryRoot), manifest.dependencies.next)
  assert.equal(
    verifyRootFramework(join(temporaryRoot, 'apps/web-members')),
    manifest.dependencies.next
  )
  for (const file of manifests) {
    assert.deepEqual(readFileSync(join(temporaryRoot, file)), readFileSync(new URL(`../${file}`, import.meta.url)))
  }
  assert.equal(existsSync(join(temporaryRoot, '.next')), false)
  assert.equal(existsSync(join(temporaryRoot, 'apps/web-members/.next')), false)
  console.log('Cold install smoke passed: root/member Next resolved, manifests unchanged, no build run.')
} finally {
  // Only this invocation's generated fixture; never a workspace or shared cache.
  assert.equal(dirname(temporaryRoot), temporaryParent)
  assert.match(temporaryRoot.slice(temporaryParent.length + 1), /^nested-vercel-cold-install-/)
  rmSync(temporaryRoot, { recursive: true, force: true, maxRetries: 2 })
}
