import Link from 'next/link'

import ChatWidget from '@/components/ChatWidget'
import { MEMBER_TOOL_IDS } from '@/lib/member-tool-access'

import { MemberToolPageAccess } from '../_components/MemberToolPageAccess'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AiConciergePage() {
  return (
    <MemberToolPageAccess tool={MEMBER_TOOL_IDS.AI_CONCIERGE} title="AI concierge">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/tools" className="mb-4 inline-block text-sm font-semibold text-brand-copper hover:text-brand-copperDark">
          ← All tools
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">AI Concierge</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Ask about firms, requirements, and inspection workflows. Review every answer before relying on it in the field.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <section className="h-[600px] overflow-hidden rounded-2xl border border-brand-copper/25 bg-white shadow-sm">
            <ChatWidget context={{ role: 'Inspector' }} />
          </section>
          <aside className="h-fit rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-dark">Before you submit</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Do not enter passwords, account tokens, private customer records, or sensitive property-access details.
              Your prompt is sent to the configured AI processing service to produce an answer.
            </p>
          </aside>
        </div>
      </main>
    </MemberToolPageAccess>
  )
}
