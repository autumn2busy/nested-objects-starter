import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const auth = headersList.get('authorization');

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
        jwt: auth.replace('Bearer ', ''),
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
