import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyOutsetaToken, getOutsetaUserId, hasAccess, getCurrentUser } from '@/lib/auth-server';
import { isRateLimitUnavailableError, rateLimit } from '@/lib/rate-limit';
import { checkAIQuota, trackAIUsage } from '@/lib/ai-quota';

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
      } catch (error) {
        if (isRateLimitUnavailableError(error)) {
          return NextResponse.json(
            { error: 'Request protection is temporarily unavailable. Please try again.' },
            { status: 503, headers: { 'Retry-After': '30' } },
          );
        }
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    const planUid = user['outseta:planUid'];
    if (!hasAccess(planUid, 'ai_chatbot')) {
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
    const prompt = body.messages ? body.messages[body.messages.length - 1]?.content : body.prompt;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0 || prompt.length > 8_000) {
      return NextResponse.json(
        { error: 'Prompt is required and must be 8,000 characters or fewer.' },
        { status: 400 }
      );
    }

    const n8nWebhookUrl = process.env.N8N_AI_CONCIERGE_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      return NextResponse.json({ error: 'AI Concierge is temporarily unavailable.' }, { status: 503 });
    }

    // Track usage *before* sending to n8n to be safe, or concurrent requests could bypass.
    // However, if n8n fails, we "charged" them. Prompt says "Enforce limits... Return friendly 403".
    await trackAIUsage(userId, 'ai_concierge');

    // A provider login/error page is not a model answer. Do not expose its body,
    // follow redirects with the submitted prompt, or retry an already billed call.
    const unavailable = { error: 'AI Concierge is temporarily unavailable. Please try again later.' };
    let response: Response;
    try {
      response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, plan_uid: planUid, prompt: prompt.trim() }),
        redirect: 'error',
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      console.error('[AI Concierge] Provider request unavailable');
      return NextResponse.json(unavailable, { status: 503 });
    }
    if (!response.ok) {
      console.error('[AI Concierge] Provider response unsuccessful', response.status);
      return NextResponse.json(unavailable, { status: 502 });
    }
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      console.error('[AI Concierge] Provider response was not JSON');
      return NextResponse.json(unavailable, { status: 502 });
    }
    const result = data !== null && typeof data === 'object' && !Array.isArray(data)
      ? data as { response?: unknown; message?: { content?: unknown } } : null;
    const content = typeof result?.message?.content === 'string' ? result.message.content : result?.response;
    if (typeof content !== 'string' || content.trim().length === 0) {
      console.error('[AI Concierge] Provider response contained no answer');
      return NextResponse.json(unavailable, { status: 502 });
    }
    return NextResponse.json({ message: { role: 'assistant', content } });

  } catch (error) {
    console.error('AI Concierge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
