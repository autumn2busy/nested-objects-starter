import { NextResponse } from 'next/server'
import { commitJsonToGitHub } from '@/lib/github-content'
import { runSeoContentMonitor } from '@/lib/seo-content-monitor'
import { authenticateMonitorRequest, checkPublicationGate } from '@/lib/monitor-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const REPORT_PATH = 'apps/web-members/content/seo-content-opportunities.json'

export async function GET(request: Request) {
  const auth = authenticateMonitorRequest(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const publication = checkPublicationGate()

  let report: unknown
  try {
    report = await runSeoContentMonitor()
  } catch (err) {
    return NextResponse.json(
      { error: 'Monitor execution failed.', detail: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }

  if (!publication.publish) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      report,
      commit: {
        committed: false,
        reason: publication.reason,
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
