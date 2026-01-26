import { NextResponse } from 'next/server'

const OPENAI_TIMEOUT_MS = 30_000

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

function fallbackResponse(
  body: { summary: string; experienceBullets: string[]; skillsBullets: string[]; portalBlurb: string },
  status = 200,
) {
  return NextResponse.json({ ...body, updatedAt: new Date().toISOString() }, { status })
}

function buildPrompt(profile?: ProfileIntake, experience?: ExperienceGear) {
  // Compress input context using minimal labels
  const p = [
    profile?.fullName,
    profile?.serviceArea,
    profile?.counties ? `Counties:${profile.counties}` : '',
    profile?.payPreferences ? `Pay:${profile.payPreferences}` : '',
    profile?.availability ? `Avail:${profile.availability}` : '',
    profile?.driveRadius ? `Drive:${profile.driveRadius}` : '',
    profile?.rushCapacity ? `Rush:${profile.rushCapacity}` : '',
  ].filter(Boolean).join(' | ')

  const e = [
    experience?.vendors ? `Vendors:${experience.vendors}` : '',
    experience?.ladderHeights?.length ? `Ladders:${experience.ladderHeights.join(',')}` : '',
    experience?.specialties?.length ? `Specs:${experience.specialties.join(',')}` : '',
    experience?.cameraGear ? `Cam:${experience.cameraGear}` : '',
    experience?.droneModel ? `Drone:${experience.droneModel}` : '',
    experience?.measuringTools ? `Tools:${experience.measuringTools}` : '',
    experience?.safetyNotes ? `Safe:${experience.safetyNotes}` : '',
    experience?.turnaroundTime ? `TAT:${experience.turnaroundTime}` : '',
  ].filter(Boolean).join(' | ')

  return `Write vendor-safe resume blocks for a field inspector. Redact PII. Return strictly valid JSON with keys: s (summary string), eb (experience bullets array), sb (skills bullets array), pb (portal blurb string). Keep it concise.\n\nProfile: ${p}\nExperience: ${e}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const profile = body?.profile as ProfileIntake | undefined
    const experience = body?.experience as ExperienceGear | undefined

    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY

    if (!apiKey) {
      return fallbackResponse({
        summary: 'AI output unavailable. Use the fields above to provide a clear header and we will regenerate once the model is back online.',
        experienceBullets: ['Share vendors with counts and geographies to quantify your experience.'],
        skillsBullets: ['Add ladders, cameras, drones, and tools so portals pick up your capabilities.'],
        portalBlurb: 'Inspector supporting your counties with ladder and photo documentation. Rush and weekend capacity noted above.',
      })
    }

    const prompt = buildPrompt(profile, experience)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(new Error('OpenAI request timed out')), OPENAI_TIMEOUT_MS)

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
            content: 'You are a resume editor for insurance and inspection vendors. Keep content concise and ready to paste into portals.',
          },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const errorBody = await response.text()
      const errorDetail = errorBody.trim()
      console.error('[AI_RESUME_GENERATE_ERROR_RESPONSE]', response.status, errorBody)
      return fallbackResponse({
        summary: `Could not reach the AI service (status ${response.status}). ${errorDetail ? `Details: ${errorDetail.slice(0, 240)}` : 'Re-run generate or keep editing manually.'}`,
        experienceBullets: ['List the vendors, counts, and geographies you service.'],
        skillsBullets: ['Ladders, cameras, drones, and measurement tools make QA checks easier.'],
        portalBlurb: 'Available for your region with documented safety practices and reliable turnaround.',
      }, 502)
    }

    const completion = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      return fallbackResponse({
        summary: 'No content returned from the AI. Try again in a moment.',
        experienceBullets: ['Share more about your volume and routes.'],
        skillsBullets: ['Note equipment, safety practices, and turnaround times.'],
        portalBlurb: 'Inspector ready for assignments in your counties.',
      }, 500)
    }

    let parsed: { s?: string; eb?: string[]; sb?: string[]; pb?: string } = {}
    try {
      parsed = JSON.parse(content)
    } catch (error) {
      console.warn('[AI_RESUME_PARSE_WARNING]', error)
    }

    const updatedAt = new Date().toISOString()

    return NextResponse.json({
      summary:
        parsed.s ||
        content.trim() ||
        'AI generation completed, but the content could not be parsed. Re-run generate to try again.',
      experienceBullets: parsed.eb?.length ? parsed.eb : [content.slice(0, 180)],
      skillsBullets: parsed.sb?.length
        ? parsed.sb
        : ['Add ladder heights, camera gear, drones, and tools.'],
      portalBlurb: parsed.pb || 'Ready to cover your counties with reliable turnaround and safety controls.',
      updatedAt,
    })
  } catch (error) {
    if ((error as Error | undefined)?.name === 'AbortError') {
      return fallbackResponse({
        summary: 'OpenAI timed out. Retry generation or simplify the intake to speed up responses.',
        experienceBullets: ['Share your vendor mix and inspection counts to tighten results.'],
        skillsBullets: ['Add equipment and safety notes for clearer capability summaries.'],
        portalBlurb: 'Inspector coverage held temporarily; refresh to retry.',
      }, 504)
    }

    console.error('[AI_RESUME_GENERATE_ERROR]', error)
    return fallbackResponse({
      summary: 'Unexpected error while generating. Please try again shortly.',
      experienceBullets: ['Share your vendor mix and inspection counts to tighten results.'],
      skillsBullets: ['Add equipment and safety notes for clearer capability summaries.'],
      portalBlurb: 'Inspector coverage held temporarily; refresh to retry.',
    }, 500)
  }
}
