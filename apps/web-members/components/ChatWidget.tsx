"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

type Role = "system" | "user" | "assistant";

type ChatMessage = {
  role: Role;
  content: string;
};

type ChatWidgetProps = {
  context?: {
    name?: string
    plan?: string
    role?: string
  }
}

import { useAuth } from "./auth-provider";

export default function ChatWidget({ context }: ChatWidgetProps) {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        `Hi ${context?.name ? context.name.split(' ')[0] : 'there'}! I am your AI field services concierge. Ask me about firms, requirements, pay ranges, or inspection workflows.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function getMessageStyles(role: Role) {
    switch (role) {
      case "user":
        return "bg-brand-copper text-white";
      case "system":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      default:
        return "bg-brand-mist/70 text-slate-800 border border-brand-mist/60";
    }
  }

  async function handleSend(e: React.FormEvent, overrideInput?: string) {
    e?.preventDefault();

    const text = overrideInput ?? input.trim();
    if (!text || isLoading) {
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/concierge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messages: nextMessages,
          context: context // Inject context
        }),
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
    <div className="flex min-h-[360px] max-h-[80vh] flex-col rounded-2xl border border-brand-copper/25 bg-white sm:min-h-[480px] sm:max-h-[720px]">
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 text-sm sm:p-6">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${getMessageStyles(
                m.role
              )}`}
            >
              <MarkdownRenderer content={m.content} role={m.role} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-2xl border border-brand-mist/60 bg-brand-mist/70 px-3 py-2 text-slate-800 shadow-sm">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.2s]"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.05s]"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500"></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length < 3 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 border-t border-slate-100 mb-1 scrollbar-hide">
          <button onClick={(e) => handleSend(e, "Check my billing status")} className="whitespace-nowrap rounded-full border border-brand-copper/30 bg-brand-mist/30 px-3 py-1 text-xs text-brand-dark hover:bg-brand-copper/10">
            Billing Help
          </button>
          <button onClick={(e) => handleSend(e, "How do I optimize my route?")} className="whitespace-nowrap rounded-full border border-brand-copper/30 bg-brand-mist/30 px-3 py-1 text-xs text-brand-dark hover:bg-brand-copper/10">
            Routing Support
          </button>
          <button onClick={(e) => handleSend(e, "List top firms in my area")} className="whitespace-nowrap rounded-full border border-brand-copper/30 bg-brand-mist/30 px-3 py-1 text-xs text-brand-dark hover:bg-brand-copper/10">
            Top Firms
          </button>
        </div>
      )}

      <form onSubmit={(e) => handleSend(e)} className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about firms, pay ranges, or inspection steps..."
            aria-label="Chat message input"
            className="flex-1 rounded-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-copper focus:ring-1 focus:ring-brand-copper"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Thinking" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
