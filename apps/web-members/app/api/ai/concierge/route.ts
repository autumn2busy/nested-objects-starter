import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PLAN_UIDS } from '../../../../lib/plan-config';
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
      // Best effort to get token from cookie if user validated that way
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
        { error: 'Unauthorized' },
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
    const isStarterOrFounders = planUid === PLAN_UIDS.STARTER || planUid === PLAN_UIDS.FOUNDERS;

    if (!hasAccess(planUid, 'ai_chatbot') && !isStarterOrFounders) {
      return NextResponse.json(
        { error: 'Access denied: Upgrade to Pro or Elite to use the AI Concierge.' },
        { status: 403 }
      );
    }

    // 3. Quota Check
    try {
      await checkAIQuota(userId, planUid, 'ai_concierge');
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || 'Quota exceeded' },
        { status: 403 }
      )
    }

    const body = await request.json();
    const prompt = body.messages ? body.messages[body.messages.length - 1].content : body.prompt;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Track usage *before* sending to n8n to be safe, or concurrent requests could bypass.
    // However, if n8n fails, we "charged" them. Prompt says "Enforce limits... Return friendly 403".
    await trackAIUsage(userId, 'ai_concierge');

    const n8nWebhookUrl = process.env.N8N_AI_CONCIERGE_WEBHOOK_URL!;

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jwt: token, // Send valid token to n8n if needed, or user info
        user_id: userId,
        prompt: prompt.trim(),
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

    // Format for ChatWidget
    if (data.response) {
      return NextResponse.json({
        message: {
          role: 'assistant',
          content: data.response
        },
        ...data
      });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('AI Concierge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
