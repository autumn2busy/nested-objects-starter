import ChatWidget from "@/components/ChatWidget";
import ToolLayout from "@/app/tools/_components/ToolLayout";
import ToolAccessMessage from "@/app/tools/_components/ToolAccessMessage";
import Gate from "@/components/Gate";
import UpgradeActions from "@/components/UpgradeActions";
import Link from "next/link";

export function HomePage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <ChatWidget />
    </main>
  );
}

export default function AiChatbotPage() {
  return (
    <ToolLayout
      title="AI field services concierge"
      description="Ask questions about firms, requirements, and inspection workflows in plain language."
      navLinks={navLinks}
    >
      <Gate
        feature="ai_concierge"
        loadingFallback={<ToolAccessMessage title="Loading access" description="Checking your account..." loading />}
        fallback={
          <ToolAccessMessage
            title="Authentication required"
            description="Log in or upgrade to chat with the AI concierge and unlock inspector-specific answers."
            tone="warning"
            actions={<UpgradeActions />}
          />
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Coming soon</p>
                <h3 className="text-xl font-semibold text-brand-dark">Conversation workspace</h3>
              </div>
              <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Phase 1</span>
            </div>
            <p className="text-sm text-slate-700">
              The chat surface will sit here. It will stay context-aware for firms, inspection types, pay ranges, and safety
              requirements so you can get ready-to-use answers without leaving your workflow.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-mist/50 p-4">
                <h4 className="text-sm font-semibold text-brand-dark">Launch checklist</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Autocomplete for firms, credentials, and states.</li>
                  <li>• Response citations from the Nested Objects knowledge base.</li>
                  <li>• Copy to clipboard for quick sharing.</li>
                </ul>
              </div>
              <div className="rounded-xl bg-brand-mist/50 p-4">
                <h4 className="text-sm font-semibold text-brand-dark">Future iterations</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Save favorite prompts for repeat use.</li>
                  <li>• Hand-off messages to job tracking and routing tools.</li>
                  <li>• Team-level usage history for admins.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-brand-dark">Try these starter prompts</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                “What ladder and roof shots does XYZ appraisal vendor require for hail claims in Colorado?”
              </li>
              <li className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                “List the pay range and coverage counties for inspectors in northern Georgia.”
              </li>
              <li className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                “Draft an email explaining why weather delays will push back my photos by 24 hours.”
              </li>
            </ul>
            <Link
              href="/tools"
              className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
            >
              Explore other tools
            </Link>
          </section>
        </div>
      </Gate>
    </ToolLayout>
  );
}
