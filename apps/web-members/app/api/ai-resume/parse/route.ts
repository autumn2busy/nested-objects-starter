// app/api/ai-resume/parse/route.ts
// AI Resume Parser - No external dependencies version
// Uses fetch for OpenAI API, handles PDF via built-in methods

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

// Field services role mapping for resume translation
const FIELD_SERVICES_CONTEXT = `
You are an expert career counselor specializing in mortgage field services, property inspections, and related gig economy roles.

Key terminology to use in translations:
- PCR (Property Condition Report) - The primary deliverable
- SLA (Service Level Agreement) - Deadlines
- REO (Real Estate Owned) - Bank-owned properties
- Loss Draft - Insurance repair verification
- Occupancy Determination - Verifying if property is occupied/vacant
- 6-Angle Rule - Standard photo documentation sequence

Skill translations:
- Driving/delivery → Route optimization, territory management
- Customer service → Professional occupant interaction, de-escalation
- Documentation → PCR completion, compliance reporting
- Time management → SLA adherence, efficient scheduling
- Mobile apps → InspectorADE, Focus software proficiency
- Photography → Property documentation, forensic photography
`

// Call OpenAI API directly via fetch
async function analyzeResumeWithOpenAI(resumeText: string): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        throw new Error('OpenAI API key not configured')
    }

    const prompt = `${FIELD_SERVICES_CONTEXT}

Analyze this resume and extract/translate the experience for field services careers.

RESUME TEXT:
${resumeText.substring(0, 8000)}

Provide a JSON response with this exact structure:
{
    "originalProfile": {
        "name": "extracted name or 'Not specified'",
        "email": "extracted email or null",
        "phone": "extracted phone or null",
        "location": "extracted location or null",
        "currentRole": "most recent job title",
        "yearsExperience": number or 0
    },
    "transferableSkills": [
        {
            "originalSkill": "skill from resume",
            "fieldServicesTranslation": "how this applies to field inspection work",
            "relevanceScore": 1-10
        }
    ],
    "experienceTranslations": [
        {
            "originalRole": "job title from resume",
            "originalCompany": "company name",
            "duration": "time period",
            "fieldServicesRelevance": "how this experience translates",
            "keyTakeaways": ["relevant accomplishment 1", "relevant accomplishment 2"]
        }
    ],
    "recommendedPath": {
        "suggestedRole": "Field Inspector | Property Preservation Specialist | etc",
        "readinessLevel": "Ready Now | Training Needed | Significant Prep Required",
        "strengths": ["strength 1", "strength 2", "strength 3"],
        "gaps": ["gap 1", "gap 2"],
        "nextSteps": ["action 1", "action 2", "action 3"]
    },
    "fieldServicesResume": {
        "professionalSummary": "2-3 sentence summary positioning them for field services",
        "coreCompetencies": ["competency 1", "competency 2", "competency 3", "competency 4", "competency 5", "competency 6"],
        "experienceBullets": ["translated bullet 1", "translated bullet 2", "translated bullet 3", "translated bullet 4"]
    }
}

Respond with valid JSON only, no markdown formatting or explanation.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert career counselor. Always respond with valid JSON only, no markdown or explanation.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: "json_object" }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI API error:', errorText)
        throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
        throw new Error('No response from AI analysis')
    }

    try {
        return JSON.parse(content)
    } catch (parseError) {
        console.error('Failed to parse AI response:', content)
        throw new Error('AI response was not valid JSON')
    }
}

// Extract text from file based on type
async function extractTextFromFile(file: File): Promise<string> {
    const fileName = file.name.toLowerCase()
    const fileType = file.type.toLowerCase()

    // Handle plain text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        return await file.text()
    }

    // Handle PDF files - extract via basic text extraction
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        try {
            const arrayBuffer = await file.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            const decoder = new TextDecoder('utf-8', { fatal: false })
            const rawText = decoder.decode(uint8Array)

            let extractedText = ''

            // Method 1: Extract text between stream markers
            const streamMatches = rawText.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g)
            if (streamMatches) {
                for (const match of streamMatches) {
                    const content = match.replace(/stream[\r\n]+/, '').replace(/[\r\n]+endstream/, '')
                    const readable = content.replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim()
                    if (readable.length > 20 && /[a-zA-Z]{3,}/.test(readable)) {
                        extractedText += readable + '\n'
                    }
                }
            }

            // Method 2: Find text in parentheses (PDF text objects)
            const textMatches = rawText.match(/\(([^)]{2,100})\)/g)
            if (textMatches) {
                const parenText = textMatches
                    .map(m => m.slice(1, -1))
                    .filter(t => t.length > 2 && /[a-zA-Z]/.test(t) && !/^[\d\s.]+$/.test(t))
                    .join(' ')
                    .replace(/\\[nrt]/g, ' ')
                    .replace(/\s+/g, ' ')

                if (parenText.length > extractedText.length) {
                    extractedText = parenText
                }
            }

            // Method 3: Look for BT/ET text blocks
            const btMatches = rawText.match(/BT[\s\S]*?ET/g)
            if (btMatches) {
                let btText = ''
                for (const block of btMatches) {
                    const tjMatches = block.match(/\(([^)]+)\)\s*Tj/g)
                    if (tjMatches) {
                        btText += tjMatches.map(m => m.replace(/\)\s*Tj/, '').replace(/\(/, '')).join(' ')
                    }
                }
                if (btText.length > extractedText.length) {
                    extractedText = btText
                }
            }

            // Clean up the extracted text
            extractedText = extractedText
                .replace(/[^\x20-\x7E\n]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()

            if (extractedText.length > 100 && /[a-zA-Z]{4,}/.test(extractedText)) {
                return extractedText
            }

            // If extraction got some text but not enough, return what we have with a note
            if (extractedText.length > 20) {
                return extractedText + '\n\n[Note: Some text may not have been extracted from this PDF]'
            }

            throw new Error('PDF_EXTRACTION_LIMITED')

        } catch (pdfError: any) {
            if (pdfError.message === 'PDF_EXTRACTION_LIMITED') {
                throw new Error(
                    'Could not extract text from this PDF. Please copy and paste your resume text directly into the text box below.'
                )
            }
            throw pdfError
        }
    }

    // Handle DOCX (basic extraction from XML)
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        try {
            const arrayBuffer = await file.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            const decoder = new TextDecoder('utf-8', { fatal: false })
            const rawText = decoder.decode(uint8Array)

            // DOCX files contain XML with text in <w:t> tags
            const textMatches = rawText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)
            if (textMatches && textMatches.length > 0) {
                const text = textMatches
                    .map(m => m.replace(/<[^>]+>/g, ''))
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim()

                if (text.length > 100) {
                    return text
                }
            }

            throw new Error('DOCX_EXTRACTION_LIMITED')

        } catch (docxError: any) {
            if (docxError.message === 'DOCX_EXTRACTION_LIMITED') {
                throw new Error(
                    'Could not extract text from this Word document. Please copy and paste your resume text directly into the text box below.'
                )
            }
            throw docxError
        }
    }

    throw new Error(`Unsupported file type. Please upload a PDF, DOCX, or TXT file, or paste your resume text directly.`)
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Authentication
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized: Please log in to use this feature' },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const textInput = formData.get('text') as string | null

        let resumeText = ''

        // Handle file upload
        if (file && file.size > 0) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: 'File too large. Maximum size is 5MB.' },
                    { status: 400 }
                )
            }

            try {
                resumeText = await extractTextFromFile(file)
            } catch (extractError: any) {
                return NextResponse.json(
                    { error: extractError.message || 'Failed to extract text from file' },
                    { status: 400 }
                )
            }
        }
        // Handle pasted text
        else if (textInput && textInput.trim().length > 0) {
            resumeText = textInput.trim()
        }
        else {
            return NextResponse.json(
                { error: 'Please upload a file or paste your resume text' },
                { status: 400 }
            )
        }

        // Validate extracted text
        if (resumeText.length < 50) {
            return NextResponse.json(
                { error: 'Resume text too short. Please provide more content or try pasting your resume text directly.' },
                { status: 400 }
            )
        }

        // Analyze with OpenAI
        const analysis = await analyzeResumeWithOpenAI(resumeText)

        return NextResponse.json({
            success: true,
            analysis,
            extractedLength: resumeText.length
        })

    } catch (error: any) {
        console.error('Resume parse error:', error)
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        )
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}