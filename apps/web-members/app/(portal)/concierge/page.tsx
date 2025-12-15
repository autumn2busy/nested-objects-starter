"use client";

import ChatWidget from "@/components/ChatWidget";
import { Gate } from "@/components/Gate";
import { ToolAccessMessage } from "@/app/tools/_components/ToolAccessMessage";
import { Card } from "@/components/ui/card";

export default function ConciergePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Concierge</h1>
                <p className="text-muted-foreground">
                    Your field services expert. Ask about firms, requirements, and workflows.
                </p>
            </div>

            <Gate
                feature="ai_concierge"
                loadingFallback={
                    <div className="flex h-96 w-full items-center justify-center rounded-xl border bg-white shadow-sm">
                        <ToolAccessMessage
                            title="Loading access"
                            description="Checking your account..."
                            loading
                        />
                    </div>
                }
                fallback={
                    <div className="flex h-96 w-full items-center justify-center rounded-xl border bg-white shadow-sm">
                        <ToolAccessMessage
                            title="Authentication required"
                            description="This feature is available to Pro members. Upgrade to unlock your personal field expert."
                            tone="warning"
                        />
                    </div>
                }
            >
                <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
                    <section className="h-[600px] overflow-hidden rounded-2xl border border-brand-copper/25 bg-white shadow-sm">
                        <ChatWidget />
                    </section>

                    <section className="h-fit rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-dark">
                            Try these starter prompts
                        </h3>
                        <ul className="mt-4 space-y-3 text-sm text-slate-700">
                            <li className="cursor-pointer rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3 transition hover:bg-brand-mist">
                                “What ladder and roof shots does XYZ appraisal vendor require for hail claims in Colorado?”
                            </li>
                            <li className="cursor-pointer rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3 transition hover:bg-brand-mist">
                                “List the pay range and coverage counties for inspectors in northern Georgia.”
                            </li>
                            <li className="cursor-pointer rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3 transition hover:bg-brand-mist">
                                “Draft an email explaining why weather delays will push back my photos by 24 hours.”
                            </li>
                        </ul>
                    </section>
                </div>
            </Gate>
        </div>
    );
}
