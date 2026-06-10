import { NextResponse } from 'next/server'
import { commitJsonToGitHub } from '@/lib/github-content'
import { runSeoContentMonitor } from '@/lib/seo-content-monitor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const REPORT_PATH = 'apps/web-members/content/seo-content-opportunities.json'

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

function shouldCommitReport(request: Request, url: URL) {
  return request.headers.get('x-vercel-cron') === '1' || url.searchParams.get('commit') === '1'
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dryRun') === '1' || !shouldCommitReport(request, url)
  const report = await runSeoContentMonitor()

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      report,
      commit: {
        committed: false,
        reason: 'Manual monitor runs do not commit unless commit=1 is provided. Vercel cron runs still commit automatically.',
      },
    })
  }

  const commit = await commitJsonToGitHub({
    path: REPORT_PATH,
    data: report,
    message: 'Update SEO content opportunity monitor [skip ci]',
  })

  return NextResponse.json({
    ok: true,
    report,
    commit,
  })
}
