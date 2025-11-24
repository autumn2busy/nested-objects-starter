'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Gate } from '@/components/Gate'
import { useAuth } from '@/components/auth-provider'
import { ToolLayout } from '../_components/ToolLayout'
import { ToolAccessMessage, UpgradeActions } from '../_components/ToolAccessMessage'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/directory', label: 'Directory' },
  { href: '/membership', label: 'Membership' },
]

const ladderOptions = ['10 ft', '16 ft', '24 ft', '32 ft', '40 ft']
const specialtyOptions = [
  'Roof inspections',
  'Exterior only',
  'Interior walkthroughs',
  'Agricultural',
  'Disaster response',
  'Small commercial',
  'Large loss support',
]

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type ProfileIntake = {
  fullName: string
  phone: string
  serviceArea: string
  counties: string
  payPreferences: string
  availability: string
  ruralUrbanMix: string
  driveRadius: string
  rushCapacity: string
  piiRedaction: boolean
}

type ExperienceGear = {
  vendors: string
  ladderHeights: string[]
  cameraGear: string
  droneModel: string
  hasDrone: boolean
  measuringTools: string
  specialties: string[]
  weatherConstraints: string
  safetyNotes: string
  turnaroundTime: string
}

type ResumeOutputs = {
  summary: string
  experienceBullets: string[]
  skillsBullets: string[]
  portalBlurb: string
  updatedAt?: string
}

type ResumeWorkspaceState = {
  profile: ProfileIntake
  experience: ExperienceGear
  outputs: ResumeOutputs
}

const defaultWorkspace: ResumeWorkspaceState = {
  profile: {
    fullName: '',
    phone: '',
    serviceArea: '',
    counties: '',
    payPreferences: '',
    availability: '',
    ruralUrbanMix: '',
    driveRadius: '',
    rushCapacity: '',
    piiRedaction: true,
  },
  experience: {
    vendors: '',
    ladderHeights: ['16 ft', '24 ft'],
    cameraGear: '',
    droneModel: '',
    hasDrone: false,
    measuringTools: '',
    specialties: ['Exterior only', 'Roof inspections'],
    weatherConstraints: '',
    safetyNotes: '',
    turnaroundTime: '24-48 hours',
  },
  outputs: {
    summary: 'Click Generate copy to draft a summary tailored to your routes, gear, and availability.',
    experienceBullets: [
      'Add your recent vendor mix with inspection counts so we can quantify your experience.',
      'Call out travel radius, rush capacity, and any weekend or evening availability.',
    ],
    skillsBullets: ['List ladder heights, camera gear, drones, and measurement tools for quick scanning.'],
    portalBlurb: 'We will format a short paragraph for vendor portals without PII until you opt-in.',
    updatedAt: undefined,
  },
}

function mergeWorkspace(partial?: Partial<ResumeWorkspaceState>): ResumeWorkspaceState {
  return {
    profile: { ...defaultWorkspace.profile, ...(partial?.profile ?? {}) },
    experience: { ...defaultWorkspace.experience, ...(partial?.experience ?? {}) },
    outputs: { ...defaultWorkspace.outputs, ...(partial?.outputs ?? {}) },
  }
}

function formatTimestamp(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  })
}

export default function AiResumePage() {
  const auth = useAuth() as any
  const userId: string | null =
    (auth?.user?.sub as string | undefined) ??
    (auth?.user?.user_id as string | undefined) ??
    (auth?.user?.uid as string | undefined) ??
    (auth?.user?.id as string | undefined) ??
    (auth?.user?.UserAccountUid as string | undefined) ??
    null

  const [workspace, setWorkspace] = useState<ResumeWorkspaceState>(defaultWorkspace)
  const [loading, setLoading] = useState(true)
  const [hasExistingRecord, setHasExistingRecord] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [autosaveError, setAutosaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function loadWorkspace() {
      if (!userId) {
        setLoading(false)
        return
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setAutosaveError('Workspace storage is unavailable. Add your details and keep them open locally for now.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const encodedUserId = encodeURIComponent(userId)
        const url =
          `${SUPABASE_URL}/rest/v1/resume_workspace` +
          `?user_id=eq.${encodedUserId}` +
          `&select=profile,experience,outputs,created_at,updated_at`

        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        })

        if (!res.ok) {
          throw new Error(`Supabase returned ${res.status} ${res.statusText}`)
        }

        const rows = (await res.json()) as {
          profile?: ResumeWorkspaceState['profile'] | null
          experience?: ResumeWorkspaceState['experience'] | null
          outputs?: ResumeWorkspaceState['outputs'] | null
          updated_at?: string
        }[]
        const row = rows[0]

        if (row) {
          setWorkspace(
            mergeWorkspace({
              profile: row.profile ?? undefined,
              experience: row.experience ?? undefined,
              outputs: row.outputs ?? undefined,
            })
          )
          setHasExistingRecord(true)
          setLastSaved(row.updated_at ?? null)
          setGeneratedAt(row.outputs?.updatedAt ?? null)
        } else {
          setWorkspace(defaultWorkspace)
        }
      } catch (error) {
        console.error('Error loading AI resume workspace', error)
        setAutosaveError('Could not load your saved workspace. We will keep changes local until the service recovers.')
      } finally {
        if (!cancelled) {
          setLoading(false)
          hasHydratedRef.current = true
        }
      }
    }

    loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!hasHydratedRef.current) return
    if (!userId) return

    setAutosaveStatus('saving')
    setAutosaveError(null)

    const timeout = window.setTimeout(async () => {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setAutosaveStatus('error')
        setAutosaveError('Missing Supabase configuration. Updates are not synced yet.')
        return
      }

      try {
        const encodedUserId = encodeURIComponent(userId)
        const baseUrl = `${SUPABASE_URL}/rest/v1/resume_workspace`
        const url = hasExistingRecord ? `${baseUrl}?user_id=eq.${encodedUserId}` : baseUrl

        const res = await fetch(url, {
          method: hasExistingRecord ? 'PATCH' : 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            user_id: userId,
            profile: workspace.profile,
            experience: workspace.experience,
            outputs: workspace.outputs,
          }),
        })

        if (!res.ok) {
          throw new Error(`Supabase returned ${res.status} ${res.statusText}`)
        }

        setHasExistingRecord(true)
        const rows = (await res.json()) as {
          profile?: ResumeWorkspaceState['profile'] | null
          experience?: ResumeWorkspaceState['experience'] | null
          outputs?: ResumeWorkspaceState['outputs'] | null
          updated_at?: string
        }[]

        const updatedRow = rows[0]
        setWorkspace((prev) =>
          mergeWorkspace({
            profile: updatedRow?.profile ?? prev.profile,
            experience: updatedRow?.experience ?? prev.experience,
            outputs: updatedRow?.outputs ?? prev.outputs,
          })
        )
        const updated = updatedRow?.updated_at ?? new Date().toISOString()
        setLastSaved(updated)
        setGeneratedAt((updatedRow?.outputs ?? workspace.outputs)?.updatedAt ?? generatedAt)
        setAutosaveStatus('saved')
      } catch (error) {
        console.error('Error autosaving AI resume workspace', error)
        setAutosaveStatus('error')
        setAutosaveError('Autosave failed. We will retry when you continue editing.')
      }
    }, 900)

    return () => window.clearTimeout(timeout)
  }, [workspace, userId, hasExistingRecord, generatedAt])

  const lastSavedLabel = useMemo(() => formatTimestamp(lastSaved), [lastSaved])
  const generatedLabel = useMemo(() => formatTimestamp(generatedAt ?? workspace.outputs.updatedAt ?? null), [generatedAt, workspace.outputs.updatedAt])

  const handleToggle = (list: string[], value: string) => {
    if (list.includes(value)) {
      return list.filter((item) => item !== value)
    }
    return [...list, value]
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai-resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: workspace.profile, experience: workspace.experience }),
      })

      if (!res.ok) {
        throw new Error(`Generation failed with status ${res.status}`)
      }

      const data = (await res.json()) as { summary: string; experienceBullets: string[]; skillsBullets: string[]; portalBlurb: string; updatedAt?: string }
      const timestamp = data.updatedAt ?? new Date().toISOString()

      setWorkspace((prev) => ({
        ...prev,
        outputs: {
          summary: data.summary,
          experienceBullets: data.experienceBullets,
          skillsBullets: data.skillsBullets,
          portalBlurb: data.portalBlurb,
          updatedAt: timestamp,
        },
      }))
      setGeneratedAt(timestamp)
    } catch (error) {
      console.error('Error generating resume copy', error)
      setWorkspace((prev) => ({
        ...prev,
        outputs: {
          summary:
            'We could not reach the AI right now. Try again shortly or continue editing these fields for a manual export.',
          experienceBullets: prev.outputs.experienceBullets,
          skillsBullets: prev.outputs.skillsBullets,
          portalBlurb: prev.outputs.portalBlurb,
          updatedAt: prev.outputs.updatedAt,
        },
      }))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyAll = async () => {
    const combined = [
      workspace.outputs.summary,
      '',
      'Experience bullets:',
      ...workspace.outputs.experienceBullets.map((item) => `• ${item}`),
      '',
      'Skills:',
      ...workspace.outputs.skillsBullets.map((item) => `• ${item}`),
      '',
      'Portal blurb:',
      workspace.outputs.portalBlurb,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(combined)
    } catch (error) {
      console.error('Clipboard copy failed', error)
    }
  }

  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch('/api/ai-resume/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: workspace.profile,
          experience: workspace.experience,
          outputs: workspace.outputs,
        }),
      })

      if (!res.ok) {
        throw new Error(`PDF export failed with status ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'ai-resume.pdf'
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading resume PDF', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <ToolLayout
      title="AI-powered inspector resume builder"
      description="Capture routes, pay preferences, and gear in one workspace. Autosave, generate copy, and export when ready."
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
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Resume workspace</p>
              <h2 className="text-xl font-semibold text-brand-dark">Profile, experience, and outputs stay synced</h2>
              <p className="text-sm text-slate-700">
                We autosave to Supabase and regenerate copy whenever you adjust your intake. Download a PDF or copy the vendor-safe text blocks.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <div className="flex items-center gap-2 rounded-full bg-brand-mist px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                <span>{autosaveStatus === 'saving' ? 'Saving draft…' : autosaveStatus === 'saved' ? 'Saved' : autosaveStatus === 'error' ? 'Save paused' : 'Autosave ready'}</span>
                {lastSavedLabel && <span className="text-xs text-slate-500">{lastSavedLabel}</span>}
              </div>
              <div className="flex items-center gap-2 rounded-full bg-brand-mist px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-brand-copper" aria-hidden />
                <span>AI outputs</span>
                {generatedLabel && <span className="text-xs text-slate-500">Updated {generatedLabel}</span>}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-dashed border-brand-copper/50 px-3 py-1 text-brand-copper">
                <span>Versions</span>
                <span className="text-xs">Coming soon</span>
              </div>
            </div>
          </div>

          {autosaveError && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {autosaveError}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Profile intake</p>
                  <h3 className="text-lg font-semibold text-brand-dark">Contact, service area, and preferences</h3>
                  <p className="text-sm text-slate-700">Name, phone, counties, and pay expectations feed the resume header.</p>
                </div>
                <div className="text-xs font-semibold text-brand-copper">PII redaction</div>
              </header>

              <div className="space-y-3">
                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-brand-dark">Full name</span>
                  <input
                    value={workspace.profile.fullName}
                    onChange={(e) => setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, fullName: e.target.value } }))}
                    className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                    placeholder="First and last name"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-brand-dark">Phone</span>
                    <input
                      value={workspace.profile.phone}
                      onChange={(e) => setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, phone: e.target.value } }))}
                      className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                      placeholder="(555) 123-4567"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-brand-dark">Service area</span>
                    <input
                      value={workspace.profile.serviceArea}
                      onChange={(e) => setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, serviceArea: e.target.value } }))}
                      className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                      placeholder="Dallas / Fort Worth, TX"
                    />
                  </label>
                </div>
                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-brand-dark">Counties covered</span>
                  <textarea
                    value={workspace.profile.counties}
                    onChange={(e) => setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, counties: e.target.value } }))}
                    className="min-h-[70px] w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                    placeholder="Add county names or zips separated by commas"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-brand-dark">Pay preferences</span>
                  <textarea
                    value={workspace.profile.payPreferences}
                    onChange={(e) => setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, payPreferences: e.target.value } }))}
                    className="min-h-[60px] w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                    placeholder="Flat fees, per inspection minimums, or travel rates"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-brand-dark">Availability windows</span>
                  <textarea
                    value={workspace.profile.availability}
                    onChange={(e) => setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, availability: e.target.value } }))}
                    className="min-h-[60px] w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                    placeholder="Weekdays 8a-6p, Saturdays 9a-1p, 24-hour rush slots"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-brand-dark">Rural / urban mix</span>
                    <input
                      value={workspace.profile.ruralUrbanMix}
                      onChange={(e) => setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, ruralUrbanMix: e.target.value } }))}
                      className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                      placeholder="70% suburban, 30% rural"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-brand-dark">Drive radius</span>
                    <input
                      value={workspace.profile.driveRadius}
                      onChange={(e) => setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, driveRadius: e.target.value } }))}
                      className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                      placeholder="Up to 60 miles"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-brand-dark">Rush capacity</span>
                    <input
                      value={workspace.profile.rushCapacity}
                      onChange={(e) => setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, rushCapacity: e.target.value } }))}
                      className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                      placeholder="Same-day: 2 slots; 24-hour: 3 slots"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-brand-steel/40 bg-brand-mist/60 px-3 py-2 text-sm font-semibold text-brand-dark">
                    <span>Redact PII until export</span>
                    <input
                      type="checkbox"
                      checked={workspace.profile.piiRedaction}
                      onChange={(e) => setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, piiRedaction: e.target.checked } }))}
                      className="h-4 w-4 rounded border-brand-steel/60 text-brand-copper focus:ring-brand-copper"
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Experience + gear</p>
                  <h3 className="text-lg font-semibold text-brand-dark">Recent vendors and equipment</h3>
                  <p className="text-sm text-slate-700">Include inspection counts, ladder heights, drones, and safety notes.</p>
                </div>
                <div className="text-xs font-semibold text-brand-copper">Field proof</div>
              </header>

              <div className="space-y-3">
                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-brand-dark">Vendors + counts</span>
                  <textarea
                    value={workspace.experience.vendors}
                    onChange={(e) => setWorkspace((prev) => ({ ...prev, experience: { ...prev.experience, vendors: e.target.value } }))}
                    className="min-h-[70px] w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                    placeholder="Example: WonderClaim (310 roof/ladder), Acme IA (180 exterior), Aurora Desk (QA partner)"
                  />
                </label>

                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-brand-dark">Ladder heights</p>
                  <div className="flex flex-wrap gap-2">
                    {ladderOptions.map((option) => {
                      const active = workspace.experience.ladderHeights.includes(option)
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setWorkspace((prev) => ({
                              ...prev,
                              experience: {
                                ...prev.experience,
                                ladderHeights: handleToggle(prev.experience.ladderHeights, option),
                              },
                            }))
                          }
                          className={`rounded-full border px-3 py-1 text-sm transition ${
                            active
                              ? 'border-brand-copper bg-brand-copper/10 text-brand-copper'
                              : 'border-brand-steel/40 bg-white text-brand-dark hover:border-brand-copper'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-brand-dark">Camera gear</span>
                    <input
                      value={workspace.experience.cameraGear}
                      onChange={(e) => setWorkspace((prev) => ({ ...prev, experience: { ...prev.experience, cameraGear: e.target.value } }))}
                      className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                      placeholder="DSLR, 20MP+, wide angle lens"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-brand-dark">Measuring tools</span>
                    <input
                      value={workspace.experience.measuringTools}
                      onChange={(e) => setWorkspace((prev) => ({ ...prev, experience: { ...prev.experience, measuringTools: e.target.value } }))}
                      className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                      placeholder="Leica Disto D2, pitch gauge, moisture meter"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1.2fr,0.8fr]">
                  <label className="block space-y-1 text-sm">
                    <span className="font-semibold text-brand-dark">Drone model</span>
                    <input
                      value={workspace.experience.droneModel}
                      onChange={(e) => setWorkspace((prev) => ({ ...prev, experience: { ...prev.experience, droneModel: e.target.value } }))}
                      className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                      placeholder="DJI Mini 4 Pro, FAA Part 107"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-brand-steel/40 bg-brand-mist/60 px-3 py-2 text-sm font-semibold text-brand-dark">
                    <span>Drone on hand</span>
                    <input
                      type="checkbox"
                      checked={workspace.experience.hasDrone}
                      onChange={(e) => setWorkspace((prev) => ({ ...prev, experience: { ...prev.experience, hasDrone: e.target.checked } }))}
                      className="h-4 w-4 rounded border-brand-steel/60 text-brand-copper focus:ring-brand-copper"
                    />
                  </label>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-brand-dark">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {specialtyOptions.map((option) => {
                      const active = workspace.experience.specialties.includes(option)
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setWorkspace((prev) => ({
                              ...prev,
                              experience: {
                                ...prev.experience,
                                specialties: handleToggle(prev.experience.specialties, option),
                              },
                            }))
                          }
                          className={`rounded-full border px-3 py-1 text-sm transition ${
                            active
                              ? 'border-brand-copper bg-brand-copper/10 text-brand-copper'
                              : 'border-brand-steel/40 bg-white text-brand-dark hover:border-brand-copper'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-brand-dark">Weather constraints</span>
                  <input
                    value={workspace.experience.weatherConstraints}
                    onChange={(e) => setWorkspace((prev) => ({ ...prev, experience: { ...prev.experience, weatherConstraints: e.target.value } }))}
                    className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                    placeholder="No steep ladder work above 20mph winds"
                  />
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-brand-dark">Safety notes</span>
                  <textarea
                    value={workspace.experience.safetyNotes}
                    onChange={(e) => setWorkspace((prev) => ({ ...prev, experience: { ...prev.experience, safetyNotes: e.target.value } }))}
                    className="min-h-[60px] w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                    placeholder="Harnessed for 6/12+, PPE list, QA scores, background check status"
                  />
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-brand-dark">Turnaround time</span>
                  <input
                    value={workspace.experience.turnaroundTime}
                    onChange={(e) => setWorkspace((prev) => ({ ...prev, experience: { ...prev.experience, turnaroundTime: e.target.value } }))}
                    className="w-full rounded-lg border border-brand-steel/40 bg-white px-3 py-2 focus:border-brand-copper focus:outline-none"
                    placeholder="Standard 24-48 hours; rush same-day when requested"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Outputs + export</p>
                  <h3 className="text-lg font-semibold text-brand-dark">Generate, copy, or download</h3>
                  <p className="text-sm text-slate-700">AI drafts are timestamped. Copy everything or export to PDF with your current details.</p>
                </div>
                <div className="flex flex-col items-stretch gap-2 text-sm sm:flex-row">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-copperDark disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isGenerating || loading}
                  >
                    {isGenerating ? 'Generating…' : 'Generate copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="inline-flex items-center justify-center rounded-full border border-brand-copper/50 px-4 py-2 font-semibold text-brand-copper transition hover:border-brand-copper hover:bg-brand-copper/10"
                  >
                    Copy all
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="inline-flex items-center justify-center rounded-full border border-brand-steel/50 px-4 py-2 font-semibold text-brand-dark transition hover:border-brand-copper hover:text-brand-copper disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDownloading ? 'Preparing PDF…' : 'Download PDF'}
                  </button>
                </div>
              </header>

              <div className="space-y-3 rounded-xl border border-brand-steel/30 bg-brand-mist/50 p-4 text-sm text-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">Versions</span>
                  <select className="rounded-full border border-brand-steel/40 bg-white px-3 py-1 text-sm text-slate-700" disabled>
                    <option>Current draft (saving)</option>
                  </select>
                  <span className="text-xs text-slate-500">Multi-version management ships next.</span>
                </div>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-full border border-dashed border-brand-copper/70 px-3 py-1 text-xs font-semibold text-brand-copper opacity-60"
                >
                  Send to vendor portal / routing tools (coming soon)
                </button>
              </div>

              <div className="space-y-3">
                <article className="space-y-2 rounded-xl border border-brand-steel/30 bg-white px-4 py-3">
                  <header className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-brand-dark">Summary</p>
                    {generatedLabel && <p className="text-xs text-slate-500">Updated {generatedLabel}</p>}
                  </header>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{workspace.outputs.summary}</p>
                </article>

                <article className="space-y-2 rounded-xl border border-brand-steel/30 bg-white px-4 py-3">
                  <header className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-brand-dark">Experience bullets</p>
                    <p className="text-xs text-slate-500">Counts, geographies, and speed</p>
                  </header>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {workspace.outputs.experienceBullets.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="space-y-2 rounded-xl border border-brand-steel/30 bg-white px-4 py-3">
                  <header className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-brand-dark">Skills + gear bullets</p>
                    <p className="text-xs text-slate-500">Ladders, drones, cameras, and tools</p>
                  </header>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {workspace.outputs.skillsBullets.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="space-y-2 rounded-xl border border-brand-steel/30 bg-white px-4 py-3">
                  <header className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-brand-dark">Portal blurb</p>
                    <p className="text-xs text-slate-500">Short paragraph for vendor portals</p>
                  </header>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{workspace.outputs.portalBlurb}</p>
                </article>
              </div>
            </section>
          </div>
        </div>
      </Gate>
    </ToolLayout>
  )
}
