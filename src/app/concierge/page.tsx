import { ChatInterface } from "@/components/concierge/ChatInterface";
import { Sparkles } from "lucide-react";

export default function ConciergePage() {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-gold-500" />
                    AI Concierge
                </h1>
                <p className="text-muted-foreground mt-1 max-w-2xl">
                    Your dedicated operations partner. Connected to platform intelligence and trained on top-tier field service protocols.
                </p>
            </div>

            <ChatInterface />
        </div>
    );
}
