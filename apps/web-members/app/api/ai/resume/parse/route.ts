import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * AI Resume Parser - /api/ai/resume/parse
 * 
 * Sends uploaded resume file to n8n for text extraction and AI processing.
 * This avoids serverless compatibility issues with pdf-parse and mammoth.
 * 
 * The n8n workflow handles:
 * 1. File decoding (base64 → binary)
 * 2. Text extraction (PDF/DOCX/TXT)
 * 3. AI parsing via Groq
 */

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

// File extension to MIME type mapping (for browsers that don't set correct MIME)
const EXTENSION_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain',
};

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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please select a resume file.' },
        { status: 400 }
      );
    }

    // Determine file type (use extension as fallback if MIME is generic)
    let fileType = file.type;
    if (!fileType || fileType === 'application/octet-stream') {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      fileType = EXTENSION_TO_MIME[ext] || file.type;
    }

    console.log(`[Resume Parse] File: ${file.name}, Type: ${fileType}, Size: ${file.size}`);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: `Invalid file type. Please upload a PDF, DOCX, or TXT file.` },
        { status: 400 }
      );
    }

    // Get n8n webhook URL
    const n8nWebhookUrl = process.env.N8N_AI_RESUME_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      console.error('[Resume Parse] N8N_AI_RESUME_WEBHOOK_URL not set');
      return NextResponse.json(
        { error: 'Resume parser is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Convert file to base64 for transport
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    console.log(`[Resume Parse] Sending ${base64Data.length} bytes to n8n...`);

    // Send to n8n for extraction and AI processing
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_type: 'parse',
        jwt: auth.replace('Bearer ', ''),
        fileData: base64Data,
        fileName: file.name,
        fileType: fileType,
        fileSizeBytes: file.size,
      }),
    });

    // Handle n8n response
    if (!n8nResponse.ok) {
      let errorData;
      try {
        errorData = await n8nResponse.json();
      } catch {
        errorData = { error: `Processing failed with status ${n8nResponse.status}` };
      }
      console.error('[Resume Parse] n8n error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to analyze resume. Please try again.' },
        { status: n8nResponse.status >= 400 && n8nResponse.status < 600 ? n8nResponse.status : 500 }
      );
    }

    const result = await n8nResponse.json();
    console.log('[Resume Parse] Success');
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Resume Parse] Error:', error?.message || error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET - Health check
 */
export async function GET() {
  return NextResponse.json({
    available: !!process.env.N8N_AI_RESUME_WEBHOOK_URL,
    feature: 'AI Resume Parser',
    acceptedTypes: ['PDF', 'DOCX', 'TXT'],
    maxSizeMB: 5,
  });
}