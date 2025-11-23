import ChatWidget from "@/components/ChatWidget";
import ToolLayout from "@/app/tools/_components/ToolLayout";
import ToolAccessMessage from "@/app/tools/_components/ToolAccessMessage";
import Gate from "@/components/Gate";
// import UpgradeActions from "@/components/UpgradeActions"; // removed for now
import Link from "next/link";

export default function AiChatbotPage() {
  return (
    <ToolLayout
      title="AI field services concierge"
      description="Ask questions about firms, requirements, and inspection workflows in plain language."
      navLinks={[]}
    >
      <Gate
        feature="ai_concierge"
        loadingFallback={
          <ToolAccessMessage
            title="Loading access"
            description="Checking your account..."
            loading
          />
        }
        fallback={
          <ToolAccessMessage
            title="Authentication required"
            description="Log in or upgrade to chat with the AI concierge and unlock inspector-specific answers."
            tone="warning"
            // actions={<UpgradeActions />} // temporarily disabled
          />
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <section className="rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <ChatWidget />
          </section>

          <section className="rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
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
