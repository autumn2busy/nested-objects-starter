#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
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

function main() {
  const installPlan = resolveInstallPlan(process.env.VERCEL_PROJECT_ID)
  const plans = resolveInstallPlans(process.env.VERCEL_PROJECT_ID)

  if (!installPlan) {
    console.warn(
      'Vercel install policy: unknown repository-root project; installing both root applications to fail open.'
    )
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  for (const plan of plans) {
    console.log(`Vercel install policy: installing ${plan.directory}.`)
    const result = spawnSync(
      npmCommand,
      [plan.command, '--prefix', plan.directory, '--no-audit', '--no-fund'],
      { cwd: process.cwd(), stdio: 'inherit', windowsHide: true }
    )

    if (result.error) console.error(`Vercel install policy failed: ${result.error.message}`)
    if (result.status !== 0) {
      process.exitCode = result.status ?? 1
      return
    }
  }

  process.exitCode = 0
}

const isDirectInvocation = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectInvocation) main()
