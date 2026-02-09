import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyOutsetaToken, getOutsetaUserId, hasAccess, getCurrentUser } from '@/lib/auth-server';
import { rateLimit } from '@/lib/rate-limit';
import { checkAIQuota, trackAIUsage } from '@/lib/ai-quota';
import { createLogger, getRequestId } from '@/lib/logger';

const limiter = rateLimit({ limit: 10, intervalMs: 60 * 1000 }); // 10 requests per minute

export async function POST(request: Request) {
  const requestId = getRequestId(request.headers);
  const logger = createLogger({ requestId, source: 'api/ai/concierge' });

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
    // We update this check to be more lenient because we are handling quota inside checkAIQuota for Starter/Founders
    // But we still need to gate completely unauthorized plans (like Free).
    // existing 'hasAccess' checks FEATURE_ACCESS['ai_chatbot']. 
    // We need to ensure Starter/Founders are NOT in 'ai_chatbot' list in auth-server if valid plans (Pro+) are.
    // OR we just use checkAIQuota to handle the "can I generally access this?" logic?
    // Let's rely on FEATURE_ACCESS for "is this feature enabled at all" and quota for limits.
    // Wait, the prompt says "Starter + Founders... have limited AI Concierge". 
    // So we must ADD them to the allowed list for concierge/chatbot via logic modification OR update auth-server (I did not update ai_chatbot there yet).

    // I need to update auth-server.ts to ALlow Starter/Founders for ai_chatbot first? 
    // Actually, prompt says "confirm pWrBRnWn unlocks... ai_concierge limited".
    // So I should have added them to 'ai_chatbot' in auth-server.ts? 
    // Let's do a quick fix here: If it's Starter/Founders, allow it.

    const isStarterOrFounders = planUid === 'zWZD0rQp' || planUid === 'pWrBRnWn'; // Hardcoded UIDs or import them

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

    const n8nWebhookUrl = process.env.N8N_AI_CONCIERGE_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      logger.error('N8N_AI_CONCIERGE_WEBHOOK_URL not configured');
      return NextResponse.json(
        { error: 'AI Concierge is not configured. Please contact support.' },
        { status: 500 }
      );
    }

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
    logger.error('AI Concierge error', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
