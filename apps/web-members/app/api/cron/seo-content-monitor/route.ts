import { NextResponse } from 'next/server'
import { commitJsonToGitHub } from '@/lib/github-content'
import { runSeoContentMonitor } from '@/lib/seo-content-monitor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const REPORT_PATH = 'apps/web-members/content/seo-content-opportunities.json'

function isAuthorized(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const url = new URL(request.url)
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, '') || url.searchParams.get('secret')

  return (
    request.headers.get('x-vercel-cron') === '1' ||
    process.env.NODE_ENV === 'development' ||
    Boolean(process.env.CRON_SECRET && providedSecret === process.env.CRON_SECRET)
  )
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dryRun') === '1'
  const report = await runSeoContentMonitor()

  if (dryRun) {
    return NextResponse.json({ ok: true, dryRun: true, report })
  }

  const commit = await commitJsonToGitHub({
    path: REPORT_PATH,
    data: report,
    message: 'Update SEO content opportunity monitor',
  })

  return NextResponse.json({
    ok: true,
    report,
    commit,
  })
}
