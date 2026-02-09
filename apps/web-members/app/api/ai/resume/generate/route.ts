import { NextResponse } from 'next/server';  
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger, getRequestId } from '@/lib/logger';

const limiter = rateLimit({ limit: 10, intervalMs: 60 * 1000 });

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || forwardedFor;
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
  const requestId = getRequestId(request.headers);
  const logger = createLogger({ requestId, source: 'api/ai/resume/generate' });

  try {
    const clientId = getClientIdentifier(request);
    try {
      await limiter.check(clientId);
    } catch {
      logger.warn('Rate limit exceeded', { clientId });
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const headersList = headers();
    const auth = headersList.get('authorization');
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to generate a resume.' },
        { status: 401 }
      );
    }

    const { resume_data } = await request.json();
    
    // Validate required data
    if (!resume_data || !resume_data.contact || !resume_data.target_roles || resume_data.target_roles.length === 0) {
      return NextResponse.json(
        { error: 'Resume data must include contact information and at least one target role.' },
        { status: 400 }
      );
    }

    // Get n8n webhook URL
    const n8nWebhookUrl = process.env.N8N_AI_RESUME_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      logger.error('N8N_AI_RESUME_WEBHOOK_URL not configured');
      return NextResponse.json(
        { error: 'Resume builder is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Forward request to n8n
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jwt: auth.replace('Bearer ', ''),
        resume_data: resume_data,
      }),
    });

    const data = await response.json();
    
    // Handle errors from n8n
    if (!response.ok) {
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }

    // Success - return AI-generated resume
    return NextResponse.json(data);
    
  } catch (error) {
    logger.error('AI Resume generation error', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Failed to generate resume. Please try again.' },
      { status: 500 }
    );
  }
}
