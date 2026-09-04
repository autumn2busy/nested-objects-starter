import { NextResponse } from 'next/server'

export const MEMBER_TOOL_EXECUTION_ENABLED = false
export const MEMBER_TOOLS_DISABLED_CODE = 'MEMBER_TOOLS_PREVIEW_ONLY'

export function memberToolsUnavailableResponse(): NextResponse | null {
  if (MEMBER_TOOL_EXECUTION_ENABLED) return null

  return NextResponse.json(
    {
      error: 'This connected member tool is not enabled yet. No data was submitted.',
      code: MEMBER_TOOLS_DISABLED_CODE,
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
