import { NextResponse } from 'next/server'

import { getCurrentUser, getOutsetaUserId, hasAccess } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-server'

type ProfileIntake = {
  fullName?: string
  phone?: string
  serviceArea?: string
  counties?: string
  payPreferences?: string
  availability?: string
  ruralUrbanMix?: string
  driveRadius?: string
  rushCapacity?: string
  piiRedaction?: boolean
}

type ExperienceGear = {
  vendors?: string
  ladderHeights?: string[]
  cameraGear?: string
  droneModel?: string
  hasDrone?: boolean
  measuringTools?: string
  specialties?: string[]
  weatherConstraints?: string
  safetyNotes?: string
  turnaroundTime?: string
}

type ResumeOutputs = {
  summary: string
  experienceBullets: string[]
  skillsBullets: string[]
  portalBlurb: string
  updatedAt: string
}

function buildPrompt(profile?: ProfileIntake, experience?: ExperienceGear) {
  const counties = profile?.counties ? `Counties or zips: ${profile.counties}.` : ''
  const pay = profile?.payPreferences ? `Preferred pay: ${profile.payPreferences}.` : ''
  const availability = profile?.availability ? `Availability: ${profile.availability}.` : ''
  const ruralUrban = profile?.ruralUrbanMix ? `Rural/urban mix: ${profile.ruralUrbanMix}.` : ''
  const drive = profile?.driveRadius ? `Drive radius: ${profile.driveRadius}.` : ''
  const rush = profile?.rushCapacity ? `Rush capacity: ${profile.rushCapacity}.` : ''

  const ladderHeights = experience?.ladderHeights?.length
    ? `Ladder heights: ${experience.ladderHeights.join(', ')}.`
    : ''
  const specialties = experience?.specialties?.length ? `Specialties: ${experience.specialties.join(', ')}.` : ''
  const vendors = experience?.vendors ? `Vendor mix: ${experience.vendors}.` : ''
  const gear = experience?.cameraGear ? `Camera gear: ${experience.cameraGear}.` : ''
  const drone = experience?.hasDrone
    ? `Drone: ${experience.droneModel || 'Ready to fly, FAA Part 107'}.`
    : experience?.droneModel
      ? `Drone-ready: ${experience.droneModel}.`
      : ''
  const measuring = experience?.measuringTools ? `Measuring tools: ${experience.measuringTools}.` : ''
  const weather = experience?.weatherConstraints ? `Weather constraints: ${experience.weatherConstraints}.` : ''
  const safety = experience?.safetyNotes ? `Safety: ${experience.safetyNotes}.` : ''
  const turnaround = experience?.turnaroundTime ? `Turnaround: ${experience.turnaroundTime}.` : ''
  const redaction = profile?.piiRedaction === false
    ? 'You may include the provided name and phone if present.'
    : 'Redact names, phone numbers, and addresses unless explicitly authorized.'

  return `Use the following intake to write vendor-safe resume blocks for an insurance field vendor. Keep PII redacted unless explicitly provided and keep any addresses or phone numbers generic if redaction is requested. Summaries and bullets should be concise, quantify work completed, and emphasize reliability. Return JSON with keys summary (string), experienceBullets (array of short bullet strings), skillsBullets (array of short bullet strings), portalBlurb (short paragraph for text boxes).\n\nProfile: ${
    profile?.fullName && profile.piiRedaction === false ? profile.fullName : 'Inspector'
  }, ${profile?.serviceArea || 'service area unknown'}. ${counties} ${pay} ${availability} ${ruralUrban} ${drive} ${rush}\nExperience: ${vendors}\nGear: ${ladderHeights} ${gear} ${drone} ${measuring}\nSpecialties: ${specialties}\nLimits: ${weather}\nSafety: ${safety}\nTurnaround: ${turnaround}\nRedaction guidance: ${redaction}`
}

export async function POST(req: Request) {
  try {
    const outsetaUser = await getCurrentUser()

    if (!outsetaUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    if (!hasAccess(outsetaUser['outseta:planUid'], 'ai_resume')) {
      return NextResponse.json({ error: 'Upgrade required for AI resume.' }, { status: 403 })
    }

    const userId = getOutsetaUserId(outsetaUser)
    if (!userId) {
      return NextResponse.json({ error: 'Could not resolve user identity for workspace storage.' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const body = await req.json().catch(() => ({}))
    const profile = body?.profile as ProfileIntake | undefined
    const experience = body?.experience as ExperienceGear | undefined

    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'OpenAI API key missing.',
        },
        { status: 500 }
      )
    }

    const prompt = buildPrompt(profile, experience)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are a resume editor for insurance and inspection vendors. Do not leak or create PII when redaction is requested. Keep content concise and ready to paste into portals.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      console.error('[RESUME_WORKSPACE_GENERATE_ERROR_RESPONSE]', response.status, await response.text())
      return NextResponse.json(
        { error: 'Could not reach the AI service. Try again shortly.' },
        { status: 502 }
      )
    }

    const completion = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'No content returned from the AI. Please retry.' },
        { status: 500 }
      )
    }

    let parsed: { summary?: string; experienceBullets?: string[]; skillsBullets?: string[]; portalBlurb?: string } = {}
    try {
      parsed = JSON.parse(content)
    } catch (error) {
      console.warn('[RESUME_WORKSPACE_PARSE_WARNING]', error)
    }

    const updatedAt = new Date().toISOString()
    const outputs: ResumeOutputs = {
      summary:
        parsed.summary ||
        content.trim() ||
        'AI generation completed, but the content could not be parsed. Re-run generate to try again.',
      experienceBullets: parsed.experienceBullets?.length ? parsed.experienceBullets : [content.slice(0, 180)],
      skillsBullets: parsed.skillsBullets?.length
        ? parsed.skillsBullets
        : ['Add ladder heights, camera gear, drones, and tools.'],
      portalBlurb: parsed.portalBlurb || 'Ready to cover your counties with reliable turnaround and safety controls.',
      updatedAt,
    }

    const { error: upsertError } = await supabase
      .from('resume_workspace')
      .upsert(
        { user_id: userId, profile: profile ?? null, experience: experience ?? null, outputs },
        { onConflict: 'user_id' }
      )
      .single()

    if (upsertError) {
      console.error('[RESUME_WORKSPACE_STORE_ERROR]', upsertError)
      return NextResponse.json(
        { error: 'Could not save workspace output. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json(outputs)
  } catch (error) {
    console.error('[RESUME_WORKSPACE_GENERATE_ERROR]', error)
    return NextResponse.json({ error: 'Unexpected error while generating.' }, { status: 500 })
  }
}
