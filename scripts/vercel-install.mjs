#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isAbsolute, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const INSTALL_PLAN_BY_PROJECT_ID = new Map([
  ['prj_vv4pDxAdR8GXJumgetMhEMHYfIo5', { command: 'ci', directory: 'apps/web-members' }],
  ['prj_eFf2jkgMrUHoSsVKNuEmjsjH64UP', { command: 'install', directory: 'apps/web-public' }],
])

const FALLBACK_INSTALL_PLANS = [
  { command: 'ci', directory: 'apps/web-members' },
  { command: 'install', directory: 'apps/web-public' },
]

export function resolveInstallPlan(projectId) {
  return INSTALL_PLAN_BY_PROJECT_ID.get(projectId) || null
}

export function resolveInstallPlans(projectId) {
  const plan = resolveInstallPlan(projectId)
  return plan ? [plan] : FALLBACK_INSTALL_PLANS
}

export function verifyRootFramework(cwd) {
  const requireFromRoot = createRequire(resolve(cwd, 'package.json'))
  const frameworkPath = requireFromRoot.resolve('next/package.json')
  const installedPath = relative(resolve(cwd, 'node_modules'), frameworkPath)
  if (installedPath.startsWith('..') || isAbsolute(installedPath)) {
    throw new Error('Next.js must resolve from this repository root, not an ancestor cache.')
  }
  const { version } = JSON.parse(readFileSync(frameworkPath, 'utf8'))
  if (typeof version !== 'string' || !version.trim()) {
    throw new Error('Installed Next.js has no version.')
  }
  return version
}

export function runInstall({
  projectId = process.env.VERCEL_PROJECT_ID,
  cwd = process.cwd(),
  platform = process.platform,
  run = spawnSync,
  verify = verifyRootFramework,
  logger = console,
} = {}) {
  const installPlan = resolveInstallPlan(projectId)
  const plans = resolveInstallPlans(projectId)

  if (!installPlan) {
    logger.warn(
      'Vercel install policy: unknown repository-root project; installing both root applications to fail open.'
    )
  }

  const npmCommand = platform === 'win32' ? 'npm.cmd' : 'npm'
  // Vercel detects Next from its root entry before running the custom app build.
  // Suppress the root install lifecycle, which would otherwise install Members twice.
  const steps = [
    { directory: '.', args: ['ci', '--ignore-scripts', '--no-audit', '--no-fund'] },
    ...plans.map(plan => ({
      directory: plan.directory,
      args: [plan.command, '--prefix', plan.directory, '--no-audit', '--no-fund'],
    })),
  ]

  for (const step of steps) {
    logger.log(`Vercel install policy: installing ${step.directory}.`)
    const result = run(
      npmCommand,
      step.args,
      { cwd, stdio: 'inherit', windowsHide: true, shell: platform === 'win32' }
    )

    if (result.error) logger.error(`Vercel install policy failed: ${result.error.message}`)
    if (result.error || result.signal || result.status !== 0) {
      return result.status || 1
    }
    if (step.directory === '.') {
      try {
        logger.log(`Vercel install policy: root Next.js ${verify(cwd)} is resolvable.`)
      } catch {
        logger.error('Vercel install policy: root Next.js detection failed after installation.')
        return 1
      }
    }
  }

  return 0
}

const isDirectInvocation = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectInvocation) process.exitCode = runInstall()
