import { NextResponse } from 'next/server'

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

function fallbackResponse(body: { summary: string; experienceBullets: string[]; skillsBullets: string[]; portalBlurb: string }) {
  return NextResponse.json({ ...body, updatedAt: new Date().toISOString() })
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

  return `Use the following intake to write vendor-safe resume blocks for an insurance field vendor. Keep PII redacted unless explicitly provided. Summary, bullets, and blurbs should be concise, quantify work completed, and emphasize reliability. Return JSON with keys summary (string), experienceBullets (array of short bullet strings), skillsBullets (array of short bullet strings), portalBlurb (short paragraph for text boxes).\n\nProfile: ${profile?.fullName || 'Inspector'}, ${profile?.serviceArea || 'service area unknown'}. ${counties} ${pay} ${availability} ${ruralUrban} ${drive} ${rush}\nExperience: ${vendors}\nGear: ${ladderHeights} ${gear} ${drone} ${measuring}\nSpecialties: ${specialties}\nLimits: ${weather}\nSafety: ${safety}\nTurnaround: ${turnaround}`
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
    })

    if (!response.ok) {
      console.error('[AI_RESUME_GENERATE_ERROR_RESPONSE]', response.status, await response.text())
      return fallbackResponse({
        summary: 'Could not reach the AI service. Re-run generate or keep editing manually.',
        experienceBullets: ['List the vendors, counts, and geographies you service.'],
        skillsBullets: ['Ladders, cameras, drones, and measurement tools make QA checks easier.'],
        portalBlurb: 'Available for your region with documented safety practices and reliable turnaround.',
      })
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
      })
    }

    let parsed: { summary?: string; experienceBullets?: string[]; skillsBullets?: string[]; portalBlurb?: string } = {}
    try {
      parsed = JSON.parse(content)
    } catch (error) {
      console.warn('[AI_RESUME_PARSE_WARNING]', error)
    }

    const updatedAt = new Date().toISOString()

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('[AI_RESUME_GENERATE_ERROR]', error)
    return fallbackResponse({
      summary: 'Unexpected error while generating. Please try again shortly.',
      experienceBullets: ['Share your vendor mix and inspection counts to tighten results.'],
      skillsBullets: ['Add equipment and safety notes for clearer capability summaries.'],
      portalBlurb: 'Inspector coverage held temporarily; refresh to retry.',
    })
  }
}
