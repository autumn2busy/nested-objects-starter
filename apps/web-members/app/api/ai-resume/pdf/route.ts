import { NextResponse } from 'next/server'

type PdfProfile = {
  fullName?: string
  serviceArea?: string
  phone?: string
  [key: string]: unknown
}

type PdfExperience = {
  vendors?: string
  ladderHeights?: string[]
  droneModel?: string
  [key: string]: unknown
}

type PdfOutputs = {
  summary?: string
  experienceBullets?: string[]
  skillsBullets?: string[]
  portalBlurb?: string
  updatedAt?: string
  [key: string]: unknown
}

type PdfPayload = {
  profile?: PdfProfile
  experience?: PdfExperience
  outputs?: PdfOutputs
}

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPdf({ profile, experience, outputs }: PdfPayload) {
  const headerLines = [
    profile?.fullName ? String(profile.fullName) : 'Inspector',
    profile?.serviceArea ? String(profile.serviceArea) : 'Service area pending',
    profile?.phone ? String(profile.phone) : '',
  ]
    .filter(Boolean)
    .join(' \u2022 ')

  const sections = [
    'Summary',
    outputs?.summary || 'Fill in the intake and click Generate copy to produce a summary.',
    '',
    'Experience',
    ...(outputs?.experienceBullets?.length ? outputs.experienceBullets : ['Add vendor counts, geographies, and speeds.']),
    '',
    'Skills + gear',
    ...(outputs?.skillsBullets?.length
      ? outputs.skillsBullets
      : ['List ladders, drones, cameras, and measurement tools.']),
    '',
    'Portal blurb',
    outputs?.portalBlurb || 'Short portal blurb will appear here after generation.',
    '',
    'Details',
    experience?.vendors ? `Vendors: ${experience.vendors}` : 'Vendors: add your mix with counts.',
    experience?.ladderHeights ? `Ladders: ${experience.ladderHeights.join(', ')}` : 'Ladders: add ladder heights.',
    experience?.droneModel ? `Drone: ${experience.droneModel}` : 'Drone: add model or readiness.',
  ].join('\n')

  const textContent = `${headerLines}\n\n${sections}`
  const escaped = escapePdfText(textContent)

  const header = '%PDF-1.4\n'
  const objects: string[] = []

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')

  const contentStream = `BT\n/F1 12 Tf\n72 720 Td\n(${escaped}) Tj\nET`
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`
  )
  objects.push(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`)
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n')

  let body = ''
  const offsets: number[] = []
  let position = header.length

  for (const obj of objects) {
    offsets.push(position)
    body += obj
    position += obj.length
  }

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((offset) => {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  })

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${header.length + body.length}\n%%EOF`

  return new TextEncoder().encode(header + body + xref + trailer)
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json().catch(() => ({}))) as PdfPayload
    const pdfBuffer = buildPdf(payload)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ai-resume.pdf"',
      },
    })
  } catch (error) {
    console.error('[AI_RESUME_PDF_ERROR]', error)
    return NextResponse.json({ error: 'Could not generate PDF right now.' }, { status: 500 })
  }
}
