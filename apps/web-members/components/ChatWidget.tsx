'use client';

import { useState } from 'react';

export default function ChatWidget() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, input]);
    setInput('');
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
      <div className="space-y-2">
        {messages.map((msg, idx) => (
          <p key={idx} className="text-sm text-slate-800">
            {msg}
          </p>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          className="flex-grow rounded-md border border-slate-300 px-3 py-2 text-sm"
          type="text"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
