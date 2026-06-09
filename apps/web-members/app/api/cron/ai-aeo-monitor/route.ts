import { NextResponse } from 'next/server'
import { runAiAeoMonitor } from '@/lib/ai-aeo-monitor'
import { commitJsonToGitHub } from '@/lib/github-content'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const REPORT_PATH = 'apps/web-members/content/ai-aeo-opportunities.json'

function getAllowedSecrets() {
  return [process.env.SEO_MONITOR_CRON_SECRET, process.env.CRON_SECRET].filter(Boolean)
}

function isAuthorized(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const url = new URL(request.url)
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, '') || url.searchParams.get('secret')
  const allowedSecrets = getAllowedSecrets()

  return (
    request.headers.get('x-vercel-cron') === '1' ||
    process.env.NODE_ENV === 'development' ||
    Boolean(providedSecret && allowedSecrets.includes(providedSecret))
  )
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dryRun') === '1'
  const report = await runAiAeoMonitor()

  if (dryRun) {
    return NextResponse.json({ ok: true, dryRun: true, report })
  }

  const commit = await commitJsonToGitHub({
    path: REPORT_PATH,
    data: report,
    message: 'Update AI AEO visibility monitor',
  })

  return NextResponse.json({
    ok: true,
    report,
    commit,
  })
}
