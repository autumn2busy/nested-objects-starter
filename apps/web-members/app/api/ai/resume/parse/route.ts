import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyOutsetaToken, getOutsetaUserId, hasAccess, getCurrentUser } from '@/lib/auth-server';
import { rateLimit } from '@/lib/rate-limit';
import { checkAIQuota, trackAIUsage } from '@/lib/ai-quota';
import { memberToolsUnavailableResponse } from '@/lib/member-tools-availability';

// ============================================================
// FIX: Removed `pdf-parse` — it pulls in @napi-rs/canvas which
// requires DOMMatrix (browser-only API) and crashes on Vercel
// serverless. Using dynamic import of `unpdf` instead, which is
// built for serverless/edge environments.
//
// mammoth is safe — switching to dynamic import to keep the
// module load lightweight and avoid any tree-shaking issues.
// ============================================================

/**
 * AI Resume Parser - /api/ai/resume/parse
 *
 * Accepts uploaded resume (PDF/DOCX/TXT).
 * PARSING STRATEGY: Local Extraction (Next.js) -> N8N (AI Logic)
 *
 * We extract text LOCALLY using unpdf/mammoth because N8N Cloud
 * has strict restrictions on binary processing (no 'zlib', etc).
 * We then send the RAW TEXT to N8N for LLM processing.
 */

// Force Node.js runtime — required for Buffer / file processing
export const runtime = 'nodejs';
// Allow up to 30s for large file parsing + n8n round-trip
export const maxDuration = 30;

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

const EXTENSION_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain',
};

const limiter = rateLimit({ limit: 10, intervalMs: 60 * 1000 }); // 10 requests per minute

async function extractTextFromFile(buffer: Buffer, fileType: string): Promise<string> {
  try {
    if (fileType === 'application/pdf') {
      // Dynamic import — unpdf has zero native dependencies
      const { extractText } = await import('unpdf');
      const result = await extractText(new Uint8Array(buffer));
      const text = Array.isArray(result.text) ? result.text.join('\n') : result.text;
      return text || '';
    }

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }

    if (fileType === 'text/plain' || fileType === 'application/msword') {
      // Legacy .doc is often not parseable without external binaries; try best effort
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

export async function POST(req: Request) {
  const unavailable = memberToolsUnavailableResponse();
  if (unavailable) return unavailable;

  try {
    // 1. Authentication (Cookie or Header)
    let user = await getCurrentUser(); // Try cookie first
    let token: string | undefined;

    if (user) {
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      token = cookieStore.get('outseta_access_token')?.value;
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

    // 2. Rate Limiting based on IP
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1';

    try {
      await limiter.check(ip);
    } catch {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // 3. User & Quota Check
    const userId = getOutsetaUserId(user);
    const formData = await req.formData();
    const outsetaUid = userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check plan access
    const planUid = user['outseta:planUid'];
    if (!hasAccess(planUid, 'ai_resume')) {
      return NextResponse.json({ error: 'Plan upgrade required.' }, { status: 403 });
    }

    const tier = planUid;
    try {
      await checkAIQuota(userId, planUid, 'ai_resume');
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || 'AI limit reached. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // 4. File Validation
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    const fileType = file.type || EXTENSION_TO_MIME[file.name.slice(file.name.lastIndexOf('.'))] || 'application/octet-stream';

    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: `Invalid file type (${fileType}). Please upload a PDF, DOCX, or TXT file.` },
        { status: 400 }
      );
    }

    // 5. LOCAL EXTRACTION
    // We parse locally to avoid N8N binary limitations
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Resume Parse] Extracting text locally from ${file.name} (${file.size} bytes)...`);
    let extractedText = await extractTextFromFile(buffer, fileType);

    // Fallback logic
    if (!extractedText || extractedText.trim().length < 20) {
      console.warn(`[Resume Parse] Text extraction returned empty or short string (${extractedText?.length || 0} chars).`);

      // If PDF parse failed, maybe try a raw string dump?
      if (fileType.includes('pdf')) {
        console.log('[Resume Parse] Attempting raw PDF string dump as last resort...');
        try {
          const raw = buffer.toString('latin1');
          const matches = raw.matchAll(/\(([^)]+)\)\s*Tj/g);
          const rawExtracted: string[] = [];
          for (const m of matches) rawExtracted.push(m[1]);
          if (rawExtracted.length > 5) {
            extractedText = rawExtracted.join(' ');
            console.log(`[Resume Parse] Raw dump recovered ${extractedText.length} chars.`);
          }
        } catch (e) {
          console.error('[Resume Parse] Raw dump failed:', e);
        }
      }
      if (!extractedText) extractedText = "";
    }

    let regexData = extractRegexData(extractedText);

    // 6. CHECK N8N CONFIG
    const n8nWebhookUrl = process.env.N8N_AI_RESUME_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.error('[Resume Parse] N8N_AI_RESUME_WEBHOOK_URL not set');
      return NextResponse.json(
        { error: 'Resume parser is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    console.log(`[Resume Parse] Text extracted (${extractedText.length} chars). Sending to n8n...`);
    if (extractedText.length > 0) {
      console.log(`[Resume Parse] Preview: ${extractedText.substring(0, 100).replace(/\n/g, ' ')}...`);
    } else {
      console.error('[Resume Parse] CRITICAL: Parsed text is EMPTY.');
    }

    // Track usage
    await trackAIUsage(userId, 'ai_resume');

    // 7. SEND TEXT TO N8N
    const payload = {
      request_type: 'parse',
      jwt: token,
      extractedText: extractedText,
      fileName: file.name,
      fileType: fileType,
      fileSizeBytes: file.size,
      user_id: userId,
      outseta_uid: outsetaUid,
      tier: tier
    };

    console.log(`[Resume Parse] Sending payload to N8N (${JSON.stringify(payload).length} bytes)`);

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // 8. HANDLE N8N RESPONSE
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

      // Fallback: If n8n fails but we have text, return local Regex data
      if (extractedText && extractedText.length > 50) {
        console.warn('[Resume Parse] n8n failed, returning local regex fallback.');
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
          summary: "AI analysis unavailable. Contact info extracted locally.",
          fallback: true
        });
      }

      return NextResponse.json(
        { error: errorData.error || 'Failed to analyze resume. Please try again.' },
        { status }
      );
    }

    // 9. RETURN PARSED RESULT
    const aiResult = await n8nResponse.json();
    if (!aiResult || (!aiResult.contact && !aiResult.experience)) {
      console.warn('[Resume Parse] AI returned empty result. Merging regex data.');
      return NextResponse.json({
        ...aiResult,
        contact: {
          name: regexData.potentialName,
          email: regexData.email,
          phone: regexData.phone,
          websites: regexData.websites
        }
      });
    }

    return NextResponse.json(aiResult);

  } catch (error: any) {
    console.error('[Resume Parse] Unknown Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Health check
 */
export async function GET() {
  const unavailable = memberToolsUnavailableResponse();
  if (unavailable) return unavailable;

  return NextResponse.json({
    available: !!process.env.N8N_AI_RESUME_WEBHOOK_URL,
    feature: 'AI Resume Parser',
    acceptedTypes: ['PDF', 'DOCX', 'TXT'],
    maxSizeMB: 5,
  });
}
