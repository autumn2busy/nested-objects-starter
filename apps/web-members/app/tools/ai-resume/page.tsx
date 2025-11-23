'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'
import { ToolAccessMessage, UpgradeActions } from '../_components/ToolAccessMessage'
import { ToolLayout } from '../_components/ToolLayout'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/directory', label: 'Directory' },
  { href: '/membership', label: 'Membership' },
]

const resumeHighlights = [
  {
    title: 'Inspector-first templates',
    description: 'Layouts built for field service work: coverage regions, work types, pay ranges, and certifications.',
  },
  {
    title: 'Narratives that sell your strengths',
    description: 'Describe gear, response times, and inspection volume in the language vendors expect.',
  },
  {
    title: 'Ready-to-send formats',
    description: 'Export to PDF or copy the text into vendor portals without extra formatting clean up.',
  },
  {
    title: 'Privacy aware defaults',
    description: 'Keep PII and client names redacted unless you decide to include them.',
  },
]

export default function AiResumePage() {
  return (
    <ToolLayout
      title="AI-powered inspector resume builder"
      description="Turn your experience, routes, and gear into a clean resume tailored for field service firms."
      navLinks={navLinks}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {resumeHighlights.map((item) => (
          <div key={item.title} className="rounded-2xl border border-brand-copper/25 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-dark">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{item.description}</p>
          </div>
        ))}
      </div>

      <Gate
        feature="ai_resume"
        loadingFallback={<ToolAccessMessage title="Loading access" description="Checking your account..." loading />}
        fallback={
          <ToolAccessMessage
            title="Authentication required"
            description="Log in or upgrade to start drafting your resume with AI."
            tone="warning"
            actions={<UpgradeActions />}
          />
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.7fr,1fr]">
          <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Drafting workspace</p>
                <h3 className="text-xl font-semibold text-brand-dark">What launches first</h3>
              </div>
              <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Phase 1</span>
            </div>
            <p className="text-sm text-slate-700">
              Phase one will collect your regions, experience, and gear, then send it to an AI backend to generate a
              ready-to-use resume. Expect copy blocks you can paste into Word, Google Docs, or vendor portals.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-mist/50 p-4">
                <h4 className="text-sm font-semibold text-brand-dark">Inputs we collect</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Coverage counties and preferred drive radius.</li>
                  <li>• Work types, certifications, and gear.</li>
                  <li>• Turn times, communication preferences, and pay expectations.</li>
                </ul>
              </div>
              <div className="rounded-xl bg-brand-mist/50 p-4">
                <h4 className="text-sm font-semibold text-brand-dark">Outputs you get</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• A concise summary tailored to your target vendors.</li>
                  <li>• Bullet points for experience and safety practices.</li>
                  <li>• A quick blurb you can reuse in emails or applications.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-brand-dark">Prep your details</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                List your last five vendors, approximate inspection counts, and any standout QA scores.
              </p>
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                Note ladder heights, camera gear, drones, and measuring tools you keep in your kit.
              </p>
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                Capture coverage preferences like rural routes only, rush capacity, or weekend availability.
              </p>
            </div>
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
  )
}
