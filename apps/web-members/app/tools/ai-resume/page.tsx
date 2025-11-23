"use client";

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

const dashboardActions = [
  { label: 'New Resume', icon: '➕', description: 'Start a fresh draft with guided intake blocks.' },
  {
    label: 'Start from job description',
    icon: '📄',
    description: 'Paste a posting to tailor bullets and summaries automatically.',
  },
  { label: 'Start from template', icon: '🧩', description: 'Pick a layout that fits your target role.' },
  { label: 'New Cover Letter', icon: '✉️', description: 'Generate a matching cover letter in one click.' },
]

const recentResumes = [
  { title: 'Operations Specialist', tag: 'Match a job', edited: 'Edited 03/12/2025' },
  { title: 'Field Adjuster', tag: 'Match a job', edited: 'Edited 02/24/2025' },
  { title: 'Customer Success Lead', tag: 'Match a job', edited: 'Edited 01/11/2025' },
]

const contentSections = [
  {
    title: 'Contact Information',
    helper: 'Autofill name, phone, location, and links with privacy toggles.',
    pill: 'Header',
  },
  {
    title: 'Target Title',
    helper: 'Set the role you are aiming for so every section mirrors it.',
    pill: 'Role',
  },
  {
    title: 'Professional Summary',
    helper: '3-4 lines customized to the job description you provide.',
    pill: 'Summary',
  },
  {
    title: 'Work Experience',
    helper: 'Add achievements with metrics, scope, and tooling highlights.',
    pill: 'Experience',
  },
  {
    title: 'Education',
    helper: 'Include degrees, certifications, and continuing education.',
    pill: 'Credentials',
  },
  {
    title: 'Skills & Interests',
    helper: 'Group skills by category and reorder to match the target role.',
    pill: 'Skills',
  },
  {
    title: 'Projects',
    helper: 'Show 2-3 projects with impact statements and links.',
    pill: 'Highlights',
  },
]

const templateLibrary = {
  styles: ['Modern', 'Traditional', 'Creative'],
  layouts: ['1 Column', '2 Column', 'Mixed'],
  systemTags: ['Teal', 'Teal+'],
  examples: [
    { title: 'Tina Miller', tag: 'Modern', badge: 'Preview Template' },
    { title: 'Elena Flores', tag: '2 Column', badge: 'Preview Template' },
    { title: 'Jordan Davis', tag: 'Traditional', badge: 'Preview Template' },
    { title: 'Taylor Smith', tag: 'Creative', badge: 'Preview Template' },
  ],
}

const jobMatchInsights = [
  'Aligns keywords from the posting with your summary and bullets.',
  'Flags missing skills and suggests replacements.',
  'Shows match score improvements as you edit.',
  'Keeps a side-by-side preview so you see the impact instantly.',
]

const exportOptions = [
  {
    title: 'Export PDF',
    description: 'One-click PDF download with chosen template, colors, and spacing.',
  },
  {
    title: 'Copy as Text',
    description: 'Copy clean text for applicant portals without broken formatting.',
  },
  {
    title: 'Versions',
    description: 'Save role-specific drafts and swap between them quickly.',
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
      title="AI-powered resume builder"
      description="Match the Teal resume builder flow with guided intake, templates, and job matching so phase one feels familiar."
      navLinks={navLinks}
    >
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
        <div className="space-y-8">
          <section className="rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Dashboard start</p>
                <h2 className="text-xl font-semibold text-brand-dark">Phase one mirrors the Teal launcher</h2>
                <p className="mt-1 text-sm text-slate-700">
                  Begin with quick start tiles, a searchable recent list, and a clear handoff into content editing.
                </p>
              </div>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                Explore other tools
              </Link>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {dashboardActions.map((action) => (
                <div
                  key={action.label}
                  className="flex flex-col gap-2 rounded-xl border border-brand-copper/20 bg-brand-mist/50 p-4"
                >
                  <div className="flex items-center gap-2 text-brand-dark">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg">{action.icon}</span>
                    <p className="font-semibold">{action.label}</p>
                  </div>
                  <p className="text-sm text-slate-700">{action.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-dashed border-brand-copper/40 bg-brand-mist/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-brand-dark">Recent Resumes</p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-brand-copper">Search Resumes</span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-brand-copper">Filter</span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {recentResumes.map((resume) => (
                  <div key={resume.title} className="rounded-lg bg-white p-3 shadow-sm">
                    <p className="text-sm font-semibold text-brand-dark">{resume.title}</p>
                    <p className="text-xs text-brand-copper">{resume.tag}</p>
                    <p className="text-xs text-slate-600">{resume.edited}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="grid gap-6 xl:grid-cols-[1.45fr,1fr]">
            <div className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Content editor</p>
                  <h3 className="text-xl font-semibold text-brand-dark">Accordion-style intake, just like Teal</h3>
                  <p className="text-sm text-slate-700">
                    Phase one keeps the left rail for section editing with inline helpers and clear calls to add experience.
                  </p>
                </div>
                <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Editable</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {contentSections.map((section) => (
                  <div key={section.title} className="rounded-xl border border-brand-copper/20 bg-brand-mist/50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-brand-dark">{section.title}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand-copper">
                        {section.pill}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{section.helper}</p>
                    <button className="mt-3 inline-flex items-center justify-center rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand-copper shadow-sm transition hover:bg-brand-mist">
                      + Add item
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-dark">Live preview pane</h3>
                <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">PDF ready</span>
              </div>
              <div className="rounded-xl border border-brand-copper/20 bg-brand-mist/60 p-4">
                <div className="rounded-lg border border-brand-copper/30 bg-white p-4 text-sm text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-copper">Autumn</p>
                  <p className="text-sm font-semibold text-brand-dark">autumn.email@example.com</p>
                  <p className="mt-3 text-sm font-semibold text-brand-dark">Work Experience</p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-700">
                    <li>• Field Adjuster — coordinated storm claims, documented inspections, and delivered reports in 48 hours.</li>
                    <li>• Customer Success Lead — managed onboarding, playbooks, and renewals across enterprise accounts.</li>
                  </ul>
                  <p className="mt-3 text-sm font-semibold text-brand-dark">Skills</p>
                  <p className="text-xs text-slate-700">Estimating • CRM • Drone flights • Reporting templates • Client communication</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {exportOptions.map((option) => (
                  <div key={option.title} className="rounded-lg border border-brand-copper/20 bg-brand-mist/50 p-3">
                    <p className="text-sm font-semibold text-brand-dark">{option.title}</p>
                    <p className="text-xs text-slate-700">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
            <div className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Designer + Templates</p>
                  <h3 className="text-xl font-semibold text-brand-dark">Browse templates the way Teal presents them</h3>
                  <p className="text-sm text-slate-700">
                    Phase one keeps the designer tabs for Presentation, Styling, and Settings so you can swap layouts before exporting.
                  </p>
                </div>
                <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Preview</span>
              </div>
              <div className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
                <div className="space-y-3 rounded-xl bg-brand-mist/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-dark">
                    <span className="rounded-full bg-white px-3 py-1 text-brand-copper">Presentation</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-500">Styling</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-500">Settings</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-500">Advanced</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-brand-copper/20 bg-white p-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-copper">My Templates</p>
                      <div className="flex h-40 w-full items-center justify-center rounded-md border border-dashed border-brand-copper/40 bg-brand-mist/60 text-brand-dark">
                        Browse Template Library
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-lg border border-brand-copper/20 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-copper">Preview</p>
                      <div className="flex h-40 items-center justify-center rounded-md bg-brand-mist/60 text-sm text-brand-dark">
                        Template preview pane
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 rounded-lg border border-dashed border-brand-copper/40 bg-white p-3 text-sm text-slate-700">
                    <p className="font-semibold text-brand-dark">Styling</p>
                    <p>Font: Poppins • Line height: 120% • Accent color: Teal</p>
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-brand-copper/20 bg-white p-4">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                    {templateLibrary.styles.map((style) => (
                      <span key={style} className="rounded-full bg-brand-mist px-3 py-1 font-semibold text-brand-dark">
                        {style}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                    {templateLibrary.layouts.map((layout) => (
                      <span key={layout} className="rounded-full bg-brand-mist px-3 py-1 font-semibold text-brand-dark">
                        {layout}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                    {templateLibrary.systemTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-brand-mist px-3 py-1 font-semibold text-brand-dark">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {templateLibrary.examples.map((template) => (
                      <div key={template.title} className="space-y-2 rounded-lg border border-brand-copper/15 bg-brand-mist/60 p-3">
                        <div className="flex items-center justify-between text-sm text-brand-dark">
                          <p className="font-semibold">{template.title}</p>
                          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-brand-copper">
                            {template.tag}
                          </span>
                        </div>
                        <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-brand-copper/40 bg-white text-xs text-brand-dark">
                          {template.badge}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark">
                    Use Template
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-dark">Compare a job description</h3>
                <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Analyzer</span>
              </div>
              <p className="text-sm text-slate-700">
                Paste a posting, search for keywords, and view a live match score just like Teal’s analyzer tab. Early access focuses on clarity over automation.
              </p>
              <div className="space-y-3 rounded-xl border border-brand-copper/20 bg-brand-mist/60 p-4 text-sm text-slate-700">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-copper">Job Title</label>
                  <input
                    aria-label="Job title"
                    className="rounded-md border border-brand-copper/30 bg-white px-3 py-2 text-sm"
                    placeholder="Enter job title"
                    readOnly
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-copper">Company</label>
                  <input
                    aria-label="Company"
                    className="rounded-md border border-brand-copper/30 bg-white px-3 py-2 text-sm"
                    placeholder="Enter company"
                    readOnly
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-copper">Job Description</label>
                  <textarea
                    aria-label="Job description"
                    className="h-32 rounded-md border border-brand-copper/30 bg-white px-3 py-2 text-sm"
                    placeholder="Paste a job description to see your match score"
                    readOnly
                  />
                </div>
                <button className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-copper shadow-sm transition hover:bg-brand-mist">
                  Search postings
                </button>
              </div>
              <div className="rounded-xl border border-brand-copper/20 bg-brand-mist/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-copper">Match Score</p>
                    <p className="text-2xl font-semibold text-brand-dark">70%</p>
                  </div>
                  <div className="h-20 w-20 rounded-full border-[6px] border-brand-copper/30 bg-white" aria-hidden>
                    <div className="m-2 flex h-full w-full items-center justify-center rounded-full bg-brand-copper/20 text-sm font-semibold text-brand-dark">
                      Preview
                    </div>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {jobMatchInsights.map((insight) => (
                    <li key={insight}>• {insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </Gate>
    </ToolLayout>
  )
}
