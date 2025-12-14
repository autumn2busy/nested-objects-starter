"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type Message = {
    id: string;
    role: "user" | "system";
    content: string;
    type?: "text" | "action" | "insight";
    metadata?: any;
};

const INITIAL_MESSAGES: Message[] = [
    {
        id: "1",
        role: "system",
        content: "Concierge active. Connected to Platform Intelligence v2.4.\nReviewing your recent activity... I see you've just viewed the Commercial Roofing module. Would you like me to find related high-value firms in your radius?",
        type: "insight",
    },
];

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Mock AI Response with delay
        setTimeout(() => {
            const responseMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "system",
                content: generateMockResponse(input),
            };
            setMessages((prev) => [...prev, responseMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto rounded-2xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm relative">
            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-4 max-w-[85%]",
                            msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        {/* Avatar */}
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border",
                            msg.role === "user"
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-gold-500/10 border-gold-500/30 text-gold-500"
                        )}>
                            {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>

                        {/* Bubble */}
                        <div className={cn(
                            "p-4 rounded-2xl text-sm leading-relaxed",
                            msg.role === "user"
                                ? "bg-white text-black font-medium"
                                : "bg-black/40 border border-white/10 text-gray-200"
                        )}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.type === "insight" && (
                                <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
                                    <button className="text-xs bg-gold-600/20 text-gold-500 hover:bg-gold-600/30 px-3 py-1.5 rounded transition-colors border border-gold-600/30">
                                        Find Firms
                                    </button>
                                    <button className="text-xs bg-white/5 text-white/60 hover:bg-white/10 px-3 py-1.5 rounded transition-colors border border-white/5">
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-4 mr-auto max-w-[85%] animate-pulse">
                        <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-gold-500" />
                        </div>
                        <div className="h-10 bg-black/40 border border-white/10 rounded-2xl w-24 flex items-center px-4">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-75" />
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-150" />
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-300" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/20 border-t border-white/10">
                <div className="relative">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Concierge to find jobs, draft emails, or analyze market trends..."
                        className="w-full bg-black/40 border border-white/10 text-white placeholder:text-white/30 rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute right-2 top-2 p-2 bg-gold-600 text-black hover:bg-gold-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar text-xs">
                    {["Draft introduction letter", "Analyze fee structure", "Find commercial leads"].map(prompt => (
                        <button
                            key={prompt}
                            onClick={() => setInput(prompt)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Simple deterministic mock response generator
function generateMockResponse(input: string): string {
    const i = input.toLowerCase();
    if (i.includes("job") || i.includes("work") || i.includes("lead")) {
        return "I've identified 3 firms in the Jacksonville area currently hiring independent adjusters. One matches your Wind Mitigation certification perfectly. Shall I prepare a profile packet for them?";
    }
    if (i.includes("draft") || i.includes("email") || i.includes("letter")) {
        return "Certainly. I'm drafting a professional introduction highlighting your 12 years of experience and recent Commercial Roofing certification. \n\n[Draft Attached: Intro_Letter_v1.pdf]";
    }
    if (i.includes("trend") || i.includes("market")) {
        return "Market Analysis: Field inspection fees in the Southeast have risen 8% YoY. However, commercial loss control is seeing a 15% spillover demand. Recommendation: Focus on your commercial portfolio to maximize Q1 revenue.";
    }
    return "I can help with that. I'm cross-referencing your request with the latest platform data and member guidelines. Give me a moment to synthesize the best approach.";
}
