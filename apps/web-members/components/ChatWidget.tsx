"use client";

import { useEffect, useRef, useState } from "react";

type Role = "system" | "user" | "assistant";

type ChatMessage = {
  role: Role;
  content: string;
};

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey inspector. I am your AI field services concierge. Ask me about firms, requirements, pay ranges, or inspection workflows.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) {
        let errorMessage = "Something went wrong talking to the concierge.";
        try {
          const data = await res.json();
          if (data?.error) {
            errorMessage = data.error;
          }
        } catch {
          // ignore JSON parse errors
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: errorMessage,
          },
        ]);
      } else {
        const data = await res.json();

        if (data?.message?.content) {
          const reply: ChatMessage = {
            role: data.message.role ?? "assistant",
            content: data.message.content,
          };

          setMessages((prev) => [...prev, reply]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "I did not get a usable reply from the model.",
            },
          ]);
        }
      }
    } catch (err) {
      console.error("[CHAT_WIDGET_ERROR]", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not reach the AI service. Check your connection or try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-[480px] flex-col rounded-2xl border border-brand-copper/25 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                m.role === "user"
                  ? "bg-brand-copper text-white"
                  : "bg-brand-mist/70 text-slate-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about firms, pay ranges, or inspection steps..."
            className="flex-1 rounded-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-copper focus:ring-1 focus:ring-brand-copper"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Thinking" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
