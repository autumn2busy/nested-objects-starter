
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  // Example: stream from OpenAI responses (or Abacus/DeepAgent). Replace with your provider as needed.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("Server not configured", { status: 500 });
  }

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are the Nested Objects Concierge. Be concise and helpful." },
      { role: "user", content: prompt }
    ],
    stream: true
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const t = await response.text();
    return new Response(t, { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream"
    }
  });
}
