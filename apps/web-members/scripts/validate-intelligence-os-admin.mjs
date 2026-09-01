import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const paths = {
  helper: path.join(appRoot, 'lib/intelligence-os-admin.ts'),
  actions: path.join(appRoot, 'app/(portal)/admin/intelligence-os/actions.ts'),
  page: path.join(appRoot, 'app/(portal)/admin/intelligence-os/page.tsx'),
  auth: path.join(appRoot, 'lib/auth-server.ts'),
}
const sources = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, filePath]) => (
  [key, await readFile(filePath, 'utf8')]
))))
const failures = []

requireFragments('server helper', sources.helper, [
  "const subject = user?.sub?.trim()",
  'subject !== configuredSubject',
  'nested-objects-admin-v1',
  'nested-objects-admin-form-v1',
  "requestHeaders.get('origin')",
  "requestHeaders.get('sec-fetch-site')",
  'randomUUID()',
  "process.env.VERCEL_ENV?.trim().toLowerCase() === 'production'",
  'AbortSignal.timeout(REQUEST_TIMEOUT_MS)',
  "'x-intelligence-body-sha256'",
])
requireFragments('Server Actions', sources.actions, [
  "'use server'",
  'assertIntelligenceAdminSameOrigin()',
  'verifyIntelligenceAdminFormToken',
  'expectedPayloadDigest',
  'response.result.executionStarted !== false',
  'revalidatePath',
])
requireFragments('protected owner page', sources.page, [
  "export const dynamic = 'force-dynamic'",
  "export const runtime = 'nodejs'",
  "if (!session) redirect('/profile')",
  'Start a bounded synthetic run',
  'Awaiting Autumn',
  'Decision evidence and provenance',
  'Source and data warnings',
  'Experiment readiness',
  'Approve record only',
])

const adminSources = `${sources.helper}\n${sources.actions}\n${sources.page}`
for (const forbidden of [
  'getOutsetaUserId',
  'CONVERSION_ADMIN_EMAILS',
  'ADMIN_OUTSETA_IDS',
  'hasAdminClaims',
  'x-vercel-cron',
  'CRON_SECRET',
  'searchParams.get(',
  'executor.execute(',
  'NEXT_PUBLIC_INTELLIGENCE',
]) {
  if (adminSources.includes(forbidden)) failures.push(`Protected admin surface contains forbidden fragment: ${forbidden}`)
}
if (/Verifying token[\s\S]{0,120}(substring|slice)\(/.test(sources.auth)) {
  failures.push('Authentication logs still expose a token prefix')
}
if (sources.page.includes("'use client'")) failures.push('Protected owner page must remain a Server Component')

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Protected Intelligence OS Server Component, stable-subject auth, CSRF, replay, and no-execution checks passed.')
}

function requireFragments(label, source, fragments) {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${label} is missing required fragment: ${fragment}`)
  }
}
