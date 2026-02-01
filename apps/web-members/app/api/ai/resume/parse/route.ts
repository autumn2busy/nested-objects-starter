import { NextResponse } from 'next/server';

/**
 * AI Resume Parser - /api/ai/resume/parse
 * 
 * Accepts uploaded resume (PDF/DOCX/TXT), converts to base64,
 * sends to n8n for text extraction + AI parsing via Groq.
 * 
 * NO local file parsing libraries (pdf-parse, mammoth, etc).
 * All extraction happens in the n8n workflow to avoid Vercel
 * serverless compatibility issues.
 * 
 * Deployed to: app/api/ai/resume/parse/route.ts
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

// Extension fallback map (some browsers send generic MIME)
const EXTENSION_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain',
};

export async function POST(request: Request) {
  try {
    // ---- AUTH CHECK ----
    // Read auth directly from request.headers (avoids Next.js headers() async issues)
    const auth = request.headers.get('authorization');

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to use the AI Resume Builder.' },
        { status: 401 }
      );
    }

    // ---- PARSE FORM DATA ----
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formError: any) {
      console.error('[Resume Parse] FormData parse error:', formError?.message);
      return NextResponse.json(
        { error: 'Invalid request format. Please upload a file.' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please select a resume file.' },
        { status: 400 }
      );
    }

    // ---- DETERMINE FILE TYPE ----
    let fileType = file.type;
    if (!fileType || fileType === 'application/octet-stream') {
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
      fileType = EXTENSION_TO_MIME[ext] || file.type || 'application/octet-stream';
    }

    console.log(`[Resume Parse] File: ${file.name}, Type: ${fileType}, Size: ${file.size}`);

    // ---- VALIDATE SIZE ----
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // ---- VALIDATE TYPE ----
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: `Invalid file type (${fileType}). Please upload a PDF, DOCX, or TXT file.` },
        { status: 400 }
      );
    }

    // ---- CHECK N8N CONFIG ----
    const n8nWebhookUrl = process.env.N8N_AI_RESUME_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.error('[Resume Parse] N8N_AI_RESUME_WEBHOOK_URL not set');
      return NextResponse.json(
        { error: 'Resume parser is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // ---- CONVERT FILE TO BASE64 ----
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    console.log(`[Resume Parse] Sending to n8n (${base64Data.length} base64 chars)...`);

    // ---- SEND TO N8N ----
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

    // ---- HANDLE N8N RESPONSE ----
    if (!n8nResponse.ok) {
      let errorData: any;
      try {
        errorData = await n8nResponse.json();
      } catch {
        errorData = { error: `Processing failed (status ${n8nResponse.status})` };
      }
      console.error('[Resume Parse] n8n error:', JSON.stringify(errorData));
      const status = n8nResponse.status >= 400 && n8nResponse.status < 600
        ? n8nResponse.status
        : 500;
      return NextResponse.json(
        { error: errorData.error || 'Failed to analyze resume. Please try again.' },
        { status }
      );
    }

    // ---- RETURN PARSED RESULT ----
    const result = await n8nResponse.json();
    console.log('[Resume Parse] Success');
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Resume Parse] Unhandled error:', error?.message || error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET - Health check / feature status
 */
export async function GET() {
  return NextResponse.json({
    available: !!process.env.N8N_AI_RESUME_WEBHOOK_URL,
    feature: 'AI Resume Parser',
    acceptedTypes: ['PDF', 'DOCX', 'TXT'],
    maxSizeMB: 5,
  });
}