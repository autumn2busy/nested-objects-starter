// app/api/ai-resume/parse/route.ts
// Fixed PDF parsing API route for AI Resume Builder

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Field services role mapping for resume translation
const FIELD_SERVICES_ROLES = {
    keywords: [
        'inspector', 'field services', 'property preservation', 'mortgage field',
        'notary', 'signing agent', 'real estate', 'appraisal', 'surveyor',
        'delivery driver', 'courier', 'logistics', 'route', 'gig worker'
    ],
    skills: {
        'driving': 'Route optimization and territory management',
        'photography': 'Property documentation and forensic photography',
        'customer service': 'Professional occupant interaction and de-escalation',
        'attention to detail': 'Accurate PCR completion and compliance documentation',
        'time management': 'SLA adherence and multi-stop routing efficiency',
        'mobile apps': 'InspectorADE, Focus, and field service software proficiency',
        'documentation': 'Objective reporting and regulatory compliance',
        'navigation': 'GPS-based territory coverage and property location',
        'communication': 'Coordinator relations and professional correspondence',
        'physical stamina': 'All-weather field work and property walk-arounds'
    },
    roleTranslations: {
        'delivery driver': 'Field Inspector Candidate (Routing Expert)',
        'uber driver': 'Field Inspector Candidate (Navigation Specialist)',
        'notary': 'Field Inspector Candidate (Verification Expert)',
        'real estate agent': 'Field Inspector Candidate (Property Knowledge)',
        'realtor': 'Field Inspector Candidate (Property Knowledge)',
        'customer service': 'Field Inspector Candidate (Client Relations)',
        'warehouse': 'Field Inspector Candidate (Logistics Background)',
        'retail': 'Field Inspector Candidate (Documentation Skills)'
    }
}

// Parse PDF using pdf-parse library with error handling
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // Dynamic import to handle edge runtime issues
        const pdfParse = (await import('pdf-parse')).default
        
        // pdf-parse options for better compatibility
        const options = {
            // Limit pages for faster processing
            max: 10,
            // Custom page renderer to handle edge cases
            pagerender: function(pageData: any) {
                return pageData.getTextContent().then(function(textContent: any) {
                    let text = ''
                    for (let item of textContent.items) {
                        text += item.str + ' '
                    }
                    return text
                })
            }
        }
        
        const data = await pdfParse(buffer, options)
        return data.text || ''
    } catch (pdfError: any) {
        console.error('PDF parse error:', pdfError)
        
        // Fallback: Try alternative parsing approach
        try {
            const pdfParse = (await import('pdf-parse')).default
            // Simpler approach without custom renderer
            const data = await pdfParse(buffer)
            return data.text || ''
        } catch (fallbackError) {
            console.error('Fallback PDF parse also failed:', fallbackError)
            throw new Error('Unable to extract text from PDF. Please try a different file or paste your resume text directly.')
        }
    }
}

// Extract text from various file types
async function extractText(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()
    
    // Handle PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await extractTextFromPDF(buffer)
    }
    
    // Handle plain text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        return buffer.toString('utf-8')
    }
    
    // Handle Word documents (.docx)
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        try {
            const mammoth = (await import('mammoth')).default
            const result = await mammoth.extractRawText({ buffer })
            return result.value || ''
        } catch (docxError) {
            console.error('DOCX parse error:', docxError)
            throw new Error('Unable to extract text from Word document. Please try PDF or plain text.')
        }
    }
    
    // Handle older Word documents (.doc)
    if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
        throw new Error('Older .doc format not supported. Please save as .docx or PDF and try again.')
    }
    
    throw new Error(`Unsupported file type: ${fileType}. Please upload a PDF, DOCX, or TXT file.`)
}

// Analyze resume with OpenAI
async function analyzeResume(resumeText: string): Promise<any> {
    const prompt = `You are an expert career counselor specializing in mortgage field services, property inspections, and related gig economy roles.

Analyze this resume and extract/translate the experience for field services careers.

RESUME TEXT:
${resumeText}

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

Focus on translating their experience into field services terminology:
- Driving experience → Route optimization, territory management
- Customer interaction → Occupant communication, professional demeanor
- Documentation → PCR completion, compliance reporting
- Time management → SLA adherence, efficient scheduling
- Mobile app usage → Field service software proficiency
- Physical work → Property walk-arounds, all-weather fieldwork`

    const response = await openai.chat.completions.create({
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

    const content = response.choices[0]?.message?.content
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

export async function POST(request: NextRequest) {
    try {
        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
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
                resumeText = await extractText(file)
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
                { error: 'Resume text too short. Please provide more content or try a different file.' },
                { status: 400 }
            )
        }

        // Analyze with OpenAI
        const analysis = await analyzeResume(resumeText)

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