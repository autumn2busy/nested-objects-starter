// React Component: ChatWidget.tsx
import { useState } from 'react';

function ChatWidget() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);

    const response = await fetch("/api/fieldchat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMessage] })
    });

    const data = await response.json();
    setMessages([...messages, userMessage, data.reply]);
    setInput("");
    setLoading(false);
  };

  return (
    <div className="w-full max-w-lg p-4 shadow-xl border rounded bg-white">
      <div className="space-y-2">
        <div className="h-64 overflow-y-auto bg-gray-100 p-2 rounded">
          {messages.map((msg, i) => (
            <p key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
              <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
            </p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Ask about field inspections..."
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWidget;

// API Route: /api/fieldchat.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';

const openai = new OpenAI();

const SYSTEM_PROMPT = `You are an AI Concierge Chatbot for the website “nested-objects-starter.vercel.app” which serves the field-services industry (e.g., notary appointments, field inspections, property appraisals, merging services etc.).
Your role: provide accurate, helpful answers to visitors’ questions about content on the site *and* about field-services business workflows.

[Instructions truncated for brevity, see full version in prior update]
`;

function loadSiteContext(): string {
  try {
    const rawText = fs.readFileSync("/mnt/data/GitHub - openai_openai-cookbook_ Examples and guides for using the OpenAI API.pdf");
    return rawText.toString().slice(0, 10000); // simulate embedding static snapshot content
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const siteContext = loadSiteContext();
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT}\n\nContext from nested-objects-starter.vercel.app:\n\n${siteContext}` },
      ...messages
    ],
    temperature: 0.7
  });

  const reply = completion.choices[0].message;
  return NextResponse.json({ reply });
}
