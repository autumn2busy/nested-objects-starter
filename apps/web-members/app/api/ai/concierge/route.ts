import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyOutsetaToken, getOutsetaUserId, hasAccess } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const auth = headersList.get('authorization');

    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = auth.split(' ')[1];
    const user = await verifyOutsetaToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const planUid = user['outseta:planUid'];
    if (!hasAccess(planUid, 'ai_concierge')) {
      return NextResponse.json(
        { error: 'Access denied: Upgrade to Pro or Elite to use the AI Concierge.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const prompt = body.messages ? body.messages[body.messages.length - 1].content : body.prompt;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const n8nWebhookUrl = process.env.N8N_AI_CONCIERGE_WEBHOOK_URL!;

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jwt: token, // Send valid token to n8n if needed, or user info
        user_id: getOutsetaUserId(user),
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
