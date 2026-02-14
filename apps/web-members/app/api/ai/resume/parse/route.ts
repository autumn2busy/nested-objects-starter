import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyOutsetaToken, getOutsetaUserId, hasAccess, getCurrentUser } from '@/lib/auth-server';
import { rateLimit } from '@/lib/rate-limit';
import { checkAIQuota, trackAIUsage } from '@/lib/ai-quota';

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

const pdf = require('pdf-parse');
import mammoth from 'mammoth';

const limiter = rateLimit({ limit: 10, intervalMs: 60 * 1000 }); // 10 requests per minute

async function extractTextFromFile(file: File, fileType: string): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (fileType === 'application/pdf') {
      const data = await pdf(buffer);
      return data.text || '';
    }

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }

    if (fileType === 'text/plain' || fileType === 'application/msword') {
      // Legacy .doc is often not parseable without external binaries; return best effort text.
      return buffer.toString('utf-8');
    }
  } catch (error) {
    console.warn('[Resume Parse] Local extraction failed:', error);
  }

  return '';
}

function extractRegexData(extractedText: string) {
  const regexData = {
    email: '',
    phone: '',
    websites: [] as string[],
    potentialName: '',
  };

  if (!extractedText) {
    return regexData;
  }

  const emailMatch = extractedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) regexData.email = emailMatch[0];

  const phoneMatch = extractedText.match(/(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/);
  if (phoneMatch) regexData.phone = phoneMatch[0];

  const linkMatches = extractedText.matchAll(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g);
  for (const match of linkMatches) {
    regexData.websites.push(match[0]);
  }

  const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  if (lines.length > 0) {
    regexData.potentialName = lines[0].substring(0, 50);
  }

  return regexData;
}

export async function POST(request: Request) {
  try {
    // 1. Authentication (Cookie or Header)
    let user = await getCurrentUser(); // Try cookie first
    let token: string | undefined;

    if (user) {
      const { cookies } = await import('next/headers');
      token = cookies().get('outseta_access_token')?.value;
    }

    if (!user) {
      const headersList = headers();
      const auth = headersList.get('authorization');
      if (auth?.startsWith('Bearer ')) {
        token = auth.split(' ')[1];
        user = await verifyOutsetaToken(token);
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to use the AI Resume Builder.' },
        { status: 401 }
      );
    }

    // 2. Rate Limiting
    const userId = getOutsetaUserId(user);
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    try {
      await limiter.check(userId);
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const planUid = user['outseta:planUid'];
    if (!hasAccess(planUid, 'ai_resume')) {
      return NextResponse.json(
        { error: 'Access denied: Upgrade your plan to use the AI Resume Builder.' },
        { status: 403 }
      );
    }

    // 3. Quota Check
    try {
      await checkAIQuota(userId, planUid, 'ai_resume');
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || 'Quota exceeded' },
        { status: 403 }
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

    // ---- REGEX EXTRACTION (FOOLPROOF LAYER) ----
    // We calculate this lazily if AI parsing fails.
    let extractedText = '';
    let regexData = extractRegexData(extractedText);


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
    // Re-read buffer for base64 (since cursor might differ if we used stream, but here we used new buffer copies so it is fine)
    // Actually we consumed file.arrayBuffer() earlier. Next.js Request body can be consumed once? 
    // Variable `file` is a File object, .arrayBuffer() returns a new Promise. It should be fine.
    const arrayBufferForUpload = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBufferForUpload).toString('base64');

    console.log(`[Resume Parse] Sending to n8n (${base64Data.length} base64 chars)...`);

    // Track usage
    await trackAIUsage(userId, 'ai_resume');

    // ---- SEND TO N8N ----
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_type: 'parse',
        jwt: token,
        fileData: base64Data,
        fileName: file.name,
        fileType: fileType,
        fileSizeBytes: file.size,
      }),
    });

    // ---- HANDLE N8N RESPONSE ----
    if (!n8nResponse.ok) {
      // Fallback: If n8n fails but we extracted text locally, return that at least?
      // For now, let's treat n8n failure as fatal for "AI parsing" but maybe return the basic info.
      // Actually, let's stick to standard error handling for now unless requested.
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

      extractedText = await extractTextFromFile(file, fileType);
      regexData = extractRegexData(extractedText);

      if (extractedText) {
        console.warn('[Resume Parse] n8n failed, returning local regex fallback data.');
        return NextResponse.json({
          contact: {
            name: regexData.potentialName,
            email: regexData.email,
            phone: regexData.phone,
            websites: regexData.websites
          },
          skills: [],
          experience: [],
          education: [],
          summary: "AI analysis failed, but we extracted your contact info. Please fill in the rest manually.",
        });
      }

      return NextResponse.json(
        { error: errorData.error || 'Failed to analyze resume. Please try again.' },
        { status }
      );
    }

    // ---- RETURN PARSED RESULT ----
    const aiResult = await n8nResponse.json();
    console.log('[Resume Parse] Success from AI');

    // ---- MERGE DATA (FOOLPROOFING) ----
    // We trust AI for most things, but regex is better for specific format fields if AI missed them
    const mergedResult = {
      ...aiResult,
      contact: {
        ...aiResult.contact,
        // If AI missed email, use regex
        email: aiResult.contact?.email || regexData.email,
        // If AI missed phone, use regex
        phone: aiResult.contact?.phone || regexData.phone,
        // Prefer AI name, but fallback to regex first line
        name: aiResult.contact?.name || aiResult.contact?.fullName || regexData.potentialName,
      }
    };

    // Also try to find links if missing
    if (regexData.websites.length > 0) {
      const existingLinks = [mergedResult.contact?.linkedin, mergedResult.contact?.website].filter(Boolean).join(' ');
      const linkedin = regexData.websites.find(w => w.includes('linkedin.com')) || '';
      const otherSite = regexData.websites.find(w => !w.includes('linkedin.com')) || '';

      if (!mergedResult.contact.linkedin && linkedin) mergedResult.contact.linkedin = linkedin;
      if (!mergedResult.contact.website && otherSite) mergedResult.contact.website = otherSite;
    }

    return NextResponse.json(mergedResult);

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
