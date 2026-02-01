import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * AI Resume Parser - /api/ai/resume/parse
 * 
 * Accepts uploaded resume files (PDF, DOCX, TXT), extracts text,
 * and sends to n8n webhook for AI processing via Groq.
 * 
 * Returns structured resume data for the ResumeBuilder component.
 */

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain', // .txt
];

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const auth = headersList.get('authorization');
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to use the AI Resume Builder.' },
        { status: 401 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please select a resume file.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF, DOCX, or TXT file.' },
        { status: 400 }
      );
    }

    // Extract text from the file
    let extractedText = '';
    
    try {
      if (file.type === 'text/plain') {
        // Plain text - read directly
        extractedText = await file.text();
      } else if (file.type === 'application/pdf') {
        // PDF - use pdf-parse
        extractedText = await extractPdfText(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        // DOCX/DOC - use mammoth
        extractedText = await extractDocxText(file);
      }
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      return NextResponse.json(
        { error: 'Could not read the file. Please try a different format or enter details manually.' },
        { status: 422 }
      );
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract enough text from the file. Please try a different file or enter details manually.' },
        { status: 422 }
      );
    }

    // Get n8n webhook URL from environment (same webhook handles parse and generate)
    const n8nWebhookUrl = process.env.N8N_AI_RESUME_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      console.error('N8N_AI_RESUME_WEBHOOK_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Resume parser is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Send extracted text to n8n for AI processing
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jwt: auth.replace('Bearer ', ''),
        resumeText: extractedText.trim(),
        fileName: file.name,
        fileType: file.type,
      }),
    });

    if (!n8nResponse.ok) {
      let errorData;
      try {
        errorData = await n8nResponse.json();
      } catch {
        errorData = { error: `AI processing failed with status ${n8nResponse.status}` };
      }
      
      console.error('n8n processing error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to analyze resume. Please try again.' },
        { status: n8nResponse.status }
      );
    }

    const parsedResume = await n8nResponse.json();

    // Return the structured resume data
    return NextResponse.json(parsedResume);

  } catch (error) {
    console.error('Resume parse error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Extract text from PDF file using pdf-parse
 */
async function extractPdfText(file: File): Promise<string> {
  // Dynamic import to avoid bundling issues
  const pdfParse = (await import('pdf-parse')).default;
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const pdfData = await pdfParse(buffer);
  return pdfData.text;
}

/**
 * Extract text from DOCX file using mammoth
 */
async function extractDocxText(file: File): Promise<string> {
  // Dynamic import to avoid bundling issues
  const mammoth = await import('mammoth');
  
  const arrayBuffer = await file.arrayBuffer();
  
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * GET - Check if parse endpoint is available
 */
export async function GET() {
  const webhookUrl = process.env.N8N_AI_RESUME_WEBHOOK_URL;
  
  return NextResponse.json({
    available: !!webhookUrl,
    feature: 'AI Resume Parser',
    status: webhookUrl ? 'active' : 'not_configured',
    acceptedTypes: ['PDF', 'DOCX', 'TXT'],
    maxSizeMB: 5
  });
}