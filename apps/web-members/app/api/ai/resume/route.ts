import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyOutsetaToken, getOutsetaUserId, hasAccess, getCurrentUser } from '../../../../lib/auth-server';
import { rateLimit } from '../../../../lib/rate-limit';
import { checkAIQuota, trackAIUsage } from '../../../../lib/ai-quota';

const limiter = rateLimit({ limit: 10, intervalMs: 60 * 1000 }); // 10 requests per minute

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

    if (userId) {
      try {
        await limiter.check(userId);
      } catch {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
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
      )
    }

    const { prompt } = await request.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required. Please provide information about your experience and skills.' },
        { status: 400 }
      );
    }

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = process.env.N8N_AI_RESUME_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.error('N8N_AI_RESUME_WEBHOOK_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Resume builder is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Track usage
    await trackAIUsage(userId, 'ai_resume');

    // Forward request to n8n
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jwt: token,
        user_id: getOutsetaUserId(user),
        prompt: prompt.trim(),
      }),
    });

    const data = await response.json();

    // Handle different response types from n8n
    if (!response.ok) {
      // Return the error from n8n with appropriate status
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }

    // Success - return AI response
    return NextResponse.json(data);

  } catch (error) {
    console.error('AI Resume Builder error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume content. Please try again.' },
      { status: 500 }
    );
  }
}

// Optional: Add GET method to check if resume builder is available
export async function GET() {
  const webhookUrl = process.env.N8N_AI_RESUME_WEBHOOK_URL;

  return NextResponse.json({
    available: !!webhookUrl,
    feature: 'AI Resume Builder',
    status: webhookUrl ? 'active' : 'not_configured'
  });
}
