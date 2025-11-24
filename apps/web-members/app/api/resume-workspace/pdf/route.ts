import { NextResponse } from 'next/server'

import { getCurrentUser, hasAccess } from '@/lib/auth-server'
import { htmlToPdfBuffer } from '@/lib/pdf'
import { createClient } from '@/lib/supabase-server'

type ResumeWorkspaceRow = {
  profile?: {
    fullName?: string
    serviceArea?: string
    phone?: string
    piiRedaction?: boolean
  }
  outputs?: {
    summary?: string
    experienceBullets?: string[]
    skillsBullets?: string[]
    portalBlurb?: string
  }
  updated_at?: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function GET() {
  try {
    const outsetaUser = await getCurrentUser()

    if (!outsetaUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    if (!hasAccess(outsetaUser['outseta:planUid'], 'ai_resume')) {
      return NextResponse.json({ error: 'Upgrade required for AI resume.' }, { status: 403 })
    }

    const supabase = createClient()
    const {
      data: { user: supabaseUser },
      error: supabaseUserError,
    } = await supabase.auth.getUser()

    if (supabaseUserError || !supabaseUser) {
      return NextResponse.json({ error: 'Could not verify Supabase session for workspace storage.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('resume_workspace')
      .select('profile, outputs, updated_at')
      .eq('user_id', supabaseUser.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single<ResumeWorkspaceRow>()

    if (error || !data) {
      console.error('[RESUME_WORKSPACE_PDF_FETCH_ERROR]', error)
      return NextResponse.json({ error: 'No workspace found to export.' }, { status: 404 })
    }

    const profile = data.profile ?? {}
    const outputs = data.outputs ?? {}

    const displayName = profile.fullName && profile.piiRedaction === false ? profile.fullName : 'Inspector'
    const phoneLine = profile.phone && profile.piiRedaction === false ? ` • ${profile.phone}` : ''
    const serviceArea = profile.serviceArea ? ` • ${profile.serviceArea}` : ''
    const summary = outputs.summary || 'Fill in the intake and click Generate copy to produce a summary.'
    const experienceBullets = outputs.experienceBullets?.length
      ? outputs.experienceBullets
      : ['Add vendor counts, geographies, and speeds.']
    const skillsBullets = outputs.skillsBullets?.length
      ? outputs.skillsBullets
      : ['List ladders, drones, cameras, and measurement tools.']

    const portalBlurb = outputs.portalBlurb || 'Short portal blurb will appear here after generation.'

    const html = [
      '<!doctype html>',
      '<html>',
      '  <head>',
      '    <meta charset="utf-8" />',
      '    <title>AI Resume</title>',
      '  </head>',
      '  <body>',
      `    <h1>${escapeHtml(displayName)}${escapeHtml(serviceArea)}${escapeHtml(phoneLine)}</h1>`,
      `    <p>${escapeHtml(summary)}</p>`,
      '    <h2>Experience</h2>',
      `    <ul>${experienceBullets.map((bullet) => `<li>${escapeHtml(String(bullet))}</li>`).join('')}</ul>`,
      '    <h2>Skills + Gear</h2>',
      `    <ul>${skillsBullets.map((bullet) => `<li>${escapeHtml(String(bullet))}</li>`).join('')}</ul>`,
      '    <h2>Portal Blurb</h2>',
      `    <p>${escapeHtml(portalBlurb)}</p>`,
      '  </body>',
      '</html>',
    ].join('\n')

    const pdfBuffer = htmlToPdfBuffer(html)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume-workspace.pdf"',
      },
    })
  } catch (error) {
    console.error('[RESUME_WORKSPACE_PDF_ERROR]', error)
    return NextResponse.json({ error: 'Could not generate PDF right now.' }, { status: 500 })
  }
}
