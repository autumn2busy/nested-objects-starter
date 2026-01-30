import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
const OPENAI_TIMEOUT_MS = 60_000

// Polyfill for pdf-parse which relies on DOMMatrix (missing in Node)
if (typeof global.DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix {
        constructor() { }
        // Add basic methods if needed by pdf.js
        transform() { return this; }
        translate() { return this; }
        scale() { return this; }
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        let textContent = ''

        if (file.type === 'application/pdf') {
            try {
                // Lazy load pdf-parse to avoid cold-start crashes
                const pdf = require('pdf-parse')

                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const data = await pdf(buffer)
                textContent = data.text
            } catch (err: any) {
                console.error('PDF parsing failed:', err)
                return NextResponse.json(
                    { error: `PDF parsing failed on server: ${err.message}` },
                    { status: 500 }
                )
            }
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.name.endsWith('.docx')
        ) {
            try {
                // Lazy load mammoth
                const mammoth = require('mammoth')

                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const result = await mammoth.extractRawText({ buffer })
                textContent = result.value
            } catch (err: any) {
                console.error('DOCX parsing failed:', err)
                return NextResponse.json(
                    { error: `DOCX parsing failed on server: ${err.message}` },
                    { status: 500 }
                )
            }
        } else {
            return NextResponse.json({ error: 'Unsupported file type. Use PDF or DOCX.' }, { status: 400 })
        }

        // Truncate if too long to save tokens/avoid limits (approx 20k chars is enough for most resumes)
        textContent = textContent.slice(0, 25000)

        const apiKey =
            process.env.OPENAI_API_KEY ||
            process.env.OPENAI_KEY ||
            process.env.NEXT_PUBLIC_OPENAI_API_KEY

        if (!apiKey) {
            return NextResponse.json(
                { error: 'AI service unavailable (missing key). Request manual entry.' },
                { status: 503 }
            )
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                temperature: 0.2,
                messages: [
                    {
                        role: 'system',
                        content: `You are a resume parser. Extract data into this JSON structure:
{
  "contact": { "fullName": "", "email": "", "phone": "", "city": "", "state": "", "zipCode": "", "linkedin": "", "website": "" },
  "summary": "Professional summary...",
  "experience": [{ "company": "", "title": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "current": boolean, "description": "", "bullets": [""] }],
  "skills": ["skill1"],
  "education": [{ "school": "", "degree": "", "field": "", "graduationDate": "YYYY" }],
  "certifications": [{ "name": "", "issuer": "", "date": "YYYY" }]
}
Identify 4-6 transferable skills relevant to field inspection (e.g. attention to detail, route planning).
Return ONLY valid JSON.`,
                    },
                    { role: 'user', content: `Resume text:\n${textContent}` },
                ],
            }),
            signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`)
        }

        const completion = await response.json()
        const content = completion.choices?.[0]?.message?.content

        if (!content) {
            throw new Error('No content from OpenAI')
        }

        // Clean markdown code blocks if present
        const cleaned = content.replace(/^```json\n?/, '').replace(/\n?```$/, '')
        const parsedData = JSON.parse(cleaned)

        return NextResponse.json(parsedData)
    } catch (error) {
        console.error('Resume parsing error:', error)
        return NextResponse.json(
            { error: 'Failed to parse resume. Please enter details manually.' },
            { status: 500 }
        )
    }
}
