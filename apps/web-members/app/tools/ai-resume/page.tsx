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

const launchTimeline = [
  {
    phase: 'Phase 1',
    label: 'Intake + export',
    description: 'Collect service area, experience, and gear. Generate clean text and PDF exports.',
    status: 'In build',
  },
  {
    phase: 'Phase 2',
    label: 'Versions + portal snippets',
    description: 'Save multiple resume versions and grab short blurbs for applications and emails.',
    status: 'Planned',
  },
  {
    phase: 'Phase 3',
    label: 'Tool integrations',
    description: 'Send your resume to job tracking, routing, and firm profiles without retyping.',
    status: 'Planned',
  },
]

const phaseOneIntake = [
  {
    title: 'Service area + availability',
    details: [
      'Home base: Tulsa, OK with a 75-mile drive radius.',
      'Prefers weekday mornings with 24-hour rush capacity when paid at premium.',
      'Comfortable with rural routes and winter travel.',
    ],
  },
  {
    title: 'Pay preferences',
    details: [
      'Standard exterior: $80+, roof + interior: $135+',
      'Rush or weekend: +$35 per order. Travel time included when >50 miles.',
    ],
  },
  {
    title: 'Contacts + redaction',
    details: [
      'Phone and email stored but redacted by default in outputs.',
      'Client names hidden unless toggled per export.',
    ],
  },
]

const experienceEntries = [
  {
    vendor: 'Coterie Field Ops',
    stats: '210 exterior + roof inspections since Feb 2024',
    highlights: [
      '48-hour turnaround with photo sets and measurement exports.',
      'Worked with 6 ladder heights and FAA Part 107 drone flights.',
    ],
  },
  {
    vendor: 'Swyft Adjusting',
    stats: '120 storm claims with interior walkthroughs',
    highlights: [
      'Coordinated access with insureds and mitigated reinspection risk.',
      'Documented safety practices and QA scores above 98%.',
    ],
  },
]

const exportArtifacts = [
  {
    title: 'Plain text resume',
    description: 'Copy blocks formatted for vendor portals and email replies without broken spacing.',
  },
  {
    title: 'PDF export',
    description: 'Polished layout with redaction toggles and template sections tailored to inspectors.',
  },
  {
    title: 'Snippets',
    description: 'One-liners for “about” fields, rush capacity blurbs, and coverage summaries.',
  },
]

const starterPrompts = [
  'Draft a resume summary for hail inspections within a 60-mile radius of Dallas.',
  'List bullet points for 300+ roof inspections with ladder work and drone photos.',
  'Write a short portal blurb about 24-hour rush capacity and preferred pay ranges.',
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

const workspaceTracks = [
  {
    title: 'Profile intake',
    description:
      'Guided questions for name, phone, service area, pay preferences, and availability so the AI can format the header.',
    bullets: ['Default redactions for PII until you opt-in.', 'Capture rural/urban mix, drive radius, and rush capacity.'],
  },
  {
    title: 'Experience + gear',
    description: 'Log recent vendors, inspection counts, ladder heights, camera gear, drones, and measuring tools.',
    bullets: ['Quick toggles for interior/exterior specialties.', 'Note safety practices and QA scores for credibility.'],
  },
  {
    title: 'Outputs + export',
    description: 'Generate copy blocks for email, PDF export, and vendor portal text areas without broken formatting.',
    bullets: ['One-click copy and PDF.', 'Save versions for different vendors or regions.'],
  },
]

const templateSections = [
  {
    title: 'Inspector header',
    points: ['Name, phone, email, service counties, and drive radius.', 'Preferred pay ranges and appointment windows.'],
  },
  {
    title: 'Summary + specialties',
    points: ['2-3 sentence overview tuned to your target vendors.', 'Top work types, safety practices, and QA stats.'],
  },
  {
    title: 'Experience stories',
    points: ['Bullet points with volume, turnaround time, and geography.', 'Vendor-safe phrasing with optional redactions.'],
  },
  {
    title: 'Credentials + gear',
    points: ['Licenses, certifications, and background checks.', 'Ladder heights, cameras, drones, and measuring tools.'],
  },
  {
    title: 'Routes + availability',
    points: ['Typical counties and seasonal preferences.', 'Rush capacity, weekend work, and weather limitations.'],
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
        <div className="space-y-6">
          <section className="space-y-5 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Phase 1 preview</p>
                <h3 className="text-xl font-semibold text-brand-dark">Intake + export workspace in progress</h3>
              </div>
              <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Building</span>
            </div>
            <p className="text-sm text-slate-700">
              We are stitching together the first version of the drafting surface. It focuses on capturing your availability,
              pay preferences, and recent inspection volume, then generating exports you can send immediately.
            </p>
            <div className="grid gap-5 xl:grid-cols-[1.35fr,1fr]">
              <div className="space-y-4 rounded-xl bg-brand-mist/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-copper">Intake</p>
                    <h4 className="text-base font-semibold text-brand-dark">What you will fill out</h4>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-copper">Editable</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {phaseOneIntake.map((item) => (
                    <div key={item.title} className="rounded-lg border border-brand-copper/20 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-brand-dark">{item.title}</p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-700">
                        {item.details.map((detail) => (
                          <li key={detail}>• {detail}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-brand-mist/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-copper">Outputs</p>
                    <h4 className="text-base font-semibold text-brand-dark">Exports available in phase one</h4>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-copper">One click</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {exportArtifacts.map((artifact) => (
                    <li key={artifact.title} className="rounded-lg border border-brand-copper/15 bg-white/80 p-3">
                      <p className="text-sm font-semibold text-brand-dark">{artifact.title}</p>
                      <p className="text-xs text-slate-700">{artifact.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
            <section className="space-y-5 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Drafting workspace</p>
                  <h3 className="text-xl font-semibold text-brand-dark">How the resume builder will work</h3>
                </div>
                <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Phase 1</span>
              </div>
              <p className="text-sm text-slate-700">
                We are designing the AI-powered workspace that turns your routes, gear, and experience into recruiter-ready copy.
                Each track below represents the first UI blocks we are building so you can see exactly what is coming.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {workspaceTracks.map((track) => (
                  <div key={track.title} className="space-y-2 rounded-xl bg-brand-mist/60 p-4">
                    <div>
                      <h4 className="text-sm font-semibold text-brand-dark">{track.title}</h4>
                      <p className="mt-1 text-sm text-slate-700">{track.description}</p>
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {track.bullets.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-dark">Phase 1 drafting details</h3>
                <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Early access</span>
              </div>
              <p className="text-sm text-slate-700">
                The first release ships with editable intake blocks and pre-formatted copy so you can send a resume without
                waiting on the full workflow. Here’s what the data capture cards look like.
              </p>
              <div className="space-y-3">
                {experienceEntries.map((entry) => (
                  <div key={entry.vendor} className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-brand-dark">{entry.vendor}</p>
                        <p className="text-xs text-slate-700">{entry.stats}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand-copper">Experience</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-slate-700">
                      {entry.highlights.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="rounded-xl border border-brand-copper/20 bg-white p-4 text-xs text-slate-700">
                  <p className="font-semibold text-brand-dark">Inline editing</p>
                  <p className="mt-1">
                    Phase one keeps all fields editable. Adjust pay preferences, toggle redactions, and regenerate snippets
                    without leaving the workspace.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-dark">Launch timeline</h3>
                <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Roadmap</span>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                {launchTimeline.map((item) => (
                  <div key={item.phase} className="rounded-xl border border-brand-copper/15 bg-brand-mist/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-copper">{item.phase}</p>
                        <p className="text-sm font-semibold text-brand-dark">{item.label}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-copper">{item.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <p className="font-semibold text-brand-dark">What you can prepare now</p>
                <ul className="space-y-1">
                  <li>• Your last 5 vendors and approximate inspection counts.</li>
                  <li>• Ladder heights, camera gear, drones, and measuring tools.</li>
                  <li>• Coverage preferences like rural routes only, rush capacity, or weekend availability.</li>
                </ul>
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
            <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-dark">Template preview</h3>
                <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Built for inspectors</span>
              </div>
              <p className="text-sm text-slate-700">
                The resume builder will output a concise template tailored to field service vendors. These are the sections we
                will populate automatically from your answers.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {templateSections.map((section) => (
                  <div key={section.title} className="rounded-xl bg-brand-mist/50 p-4">
                    <h4 className="text-sm font-semibold text-brand-dark">{section.title}</h4>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {section.points.map((point) => (
                        <li key={point}>• {point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-brand-dark">Try these prompts soon</h3>
              <p className="text-sm text-slate-700">
                When the AI workspace goes live, you will be able to ask for tailored drafts and quick snippets. Start with
                these prompts or save your own.
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                {starterPrompts.map((prompt) => (
                  <li key={prompt} className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                    &ldquo;{prompt}&rdquo;
                  </li>
                ))}
              </ul>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                Explore other tools
              </Link>
            </section>
          </div>
        </div>
      </Gate>
    </ToolLayout>
  )
}
