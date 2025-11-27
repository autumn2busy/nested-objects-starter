'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { Gate } from '@/components/Gate'
import type { MemberJob, MemberJobStatus } from '@/types/member-jobs'

import { ToolAccessMessage, UpgradeActions } from '../_components/ToolAccessMessage'
import { ToolLayout } from '../_components/ToolLayout'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/directory', label: 'Directory' },
  { href: '/membership', label: 'Membership' },
]

const statusOptions: { value: MemberJobStatus; label: string; description?: string }[] = [
  { value: 'interested', label: 'Interested', description: 'Saved to review later' },
  { value: 'applied', label: 'Applied', description: 'Application submitted' },
  { value: 'interviewing', label: 'Interviewing', description: 'In conversation with the firm' },
  { value: 'offer', label: 'Offer', description: 'Offer received or pending acceptance' },
  { value: 'closed', label: 'Closed', description: 'No longer pursuing' },
]

type JobFormState = {
  title: string
  company: string
  location: string
  source_url: string
  job_id: string
  pay: string
  status: MemberJobStatus
  notes: string
}

const defaultForm: JobFormState = {
  title: '',
  company: '',
  location: '',
  source_url: '',
  job_id: '',
  pay: '',
  status: 'interested',
  notes: '',
}

function statusBadgeClasses(status: MemberJobStatus) {
  switch (status) {
    case 'applied':
      return 'bg-brand-copper/10 text-brand-dark border border-brand-copper/40'
    case 'interviewing':
      return 'bg-brand-teal text-white'
    case 'offer':
      return 'bg-brand-teal/80 text-white'
    case 'closed':
      return 'bg-brand-steel/15 text-brand-dark border border-brand-steel/40'
    default:
      return 'bg-brand-sand text-brand-dark border border-brand-steel/30'
  }
}

export default function JobTrackerPage() {
  const [jobs, setJobs] = useState<MemberJob[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | MemberJobStatus>('all')
  const [formState, setFormState] = useState<JobFormState>(defaultForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/member-jobs')
      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(payload?.error || 'Could not load saved jobs')
      }

      setJobs(Array.isArray(payload) ? payload : payload.jobs ?? [])
    } catch (err) {
      console.error(err)
      setError('Could not load your tracked jobs yet. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchJobs()
  }, [])

  const summary = useMemo(() => {
    const active = jobs.filter((job) => job.status !== 'closed').length
    const interviewing = jobs.filter((job) => job.status === 'interviewing').length
    const offers = jobs.filter((job) => job.status === 'offer').length

    const weekStart = (() => {
      const now = new Date()
      const copy = new Date(now)
      const day = copy.getDay()
      const diff = copy.getDate() - day
      copy.setDate(diff)
      copy.setHours(0, 0, 0, 0)
      return copy
    })()

    const weekEnd = (() => {
      const start = new Date(weekStart)
      start.setDate(start.getDate() + 6)
      start.setHours(23, 59, 59, 999)
      return start
    })()

    const createdThisWeek = jobs.filter((job) => {
      const createdAt = new Date(job.created_at)
      return createdAt >= weekStart && createdAt <= weekEnd
    }).length

    return { active, interviewing, offers, createdThisWeek }
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const list = statusFilter === 'all' ? jobs : jobs.filter((job) => job.status === statusFilter)

    return [...list].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }, [jobs, statusFilter])

  const updateForm = (field: keyof JobFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormState(defaultForm)
    setEditingId(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      job_id: formState.job_id || null,
      title: formState.title || null,
      company: formState.company || null,
      location: formState.location || null,
      source_url: formState.source_url || null,
      pay: formState.pay || null,
      status: formState.status,
      notes: formState.notes || null,
    }

    try {
      const res = await fetch(editingId ? `/api/member-jobs/${editingId}` : '/api/member-jobs', {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'Could not save this job entry yet.')
        return
      }

      await fetchJobs()
      resetForm()
    } catch (err) {
      console.error(err)
      setError('Something went wrong saving your job. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string, updates: Partial<MemberJob>) => {
    try {
      setActionId(id)
      setError(null)
      const res = await fetch(`/api/member-jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(payload?.error || 'Could not update job entry.')
        return
      }

      await fetchJobs()
    } catch (err) {
      console.error(err)
      setError('Could not update job entry.')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setActionId(id)
      setError(null)
      const res = await fetch(`/api/member-jobs/${id}`, { method: 'DELETE' })
      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(payload?.error || 'Could not delete job entry.')
        return
      }

      await fetchJobs()
    } catch (err) {
      console.error(err)
      setError('Could not delete job entry.')
    } finally {
      setActionId(null)
    }
  }

  const beginEdit = (job: MemberJob) => {
    setEditingId(job.id)
    setFormState({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      source_url: job.source_url || '',
      job_id: job.job_id || '',
      pay: job.pay || '',
      status: job.status,
      notes: job.notes || '',
    })
  }

  return (
    <ToolLayout
      title="Job tracker"
      description="Save jobs, log where you applied, and track interviews and offers with notes in one place."
      navLinks={navLinks}
    >
      <Gate
        feature="job_tracker"
        loadingFallback={<ToolAccessMessage title="Loading access" description="Checking your account..." loading />}
        fallback={
          <ToolAccessMessage
            title="Authentication required"
            description="Log in or upgrade to start tracking applications and offers."
            tone="warning"
            actions={<UpgradeActions />}
          />
        }
      >
        <div className="space-y-6">
          <section className="rounded-none border border-brand-steel/30 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Job tracker</p>
                <h2 className="text-xl font-semibold text-brand-dark">Pipeline at a glance</h2>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="rounded-none border border-brand-steel/30 bg-brand-sand px-3 py-2">
                  Active: <span className="font-semibold text-brand-dark">{summary.active}</span>
                </div>
                <div className="rounded-none border border-brand-steel/30 bg-brand-sand px-3 py-2">
                  Interviews: <span className="font-semibold text-brand-dark">{summary.interviewing}</span>
                </div>
                <div className="rounded-none border border-brand-steel/30 bg-brand-sand px-3 py-2">
                  Offers: <span className="font-semibold text-brand-dark">{summary.offers}</span>
                </div>
                <div className="rounded-none border border-brand-steel/30 bg-brand-sand px-3 py-2">
                  Added this week: <span className="font-semibold text-brand-dark">{summary.createdThisWeek}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-none border border-brand-steel/30 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">
                    {editingId ? 'Edit job' : 'Add a job'}
                  </p>
                  <h2 className="text-xl font-semibold text-brand-dark">
                    {editingId ? 'Update tracked job' : 'Save a new job'}
                  </h2>
                </div>
                {editingId && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-steel underline"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-3">
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Job title</span>
                    <input
                      value={formState.title}
                      onChange={(e) => updateForm('title', e.target.value)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                      placeholder="Property inspector - Atlanta"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Company</span>
                    <input
                      value={formState.company}
                      onChange={(e) => updateForm('company', e.target.value)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                      placeholder="Acme Field Services"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Location</span>
                    <input
                      value={formState.location}
                      onChange={(e) => updateForm('location', e.target.value)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                      placeholder="Atlanta, GA (Remote friendly)"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Job link</span>
                    <input
                      value={formState.source_url}
                      onChange={(e) => updateForm('source_url', e.target.value)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                      placeholder="https://example.com/job/123"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Job ID or reference</span>
                    <input
                      value={formState.job_id}
                      onChange={(e) => updateForm('job_id', e.target.value)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                      placeholder="REQ-9481"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Status</span>
                    <select
                      value={formState.status}
                      onChange={(e) => updateForm('status', e.target.value as MemberJobStatus)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Pay or rate</span>
                    <input
                      value={formState.pay}
                      onChange={(e) => updateForm('pay', e.target.value)}
                      placeholder="$250 per inspection"
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                    />
                  </label>
                </div>

                <label className="space-y-1 text-sm text-brand-dark">
                  <span className="block font-semibold">Notes</span>
                  <textarea
                    value={formState.notes}
                    onChange={(e) => updateForm('notes', e.target.value)}
                    rows={4}
                    className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                    placeholder="Scripts, contacts, follow-up dates, or interview prep"
                  />
                </label>

                {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-none bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark disabled:opacity-70"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save job'}
                  </button>
                  <Link
                    href="/tools"
                    className="rounded-none border border-brand-steel/40 bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand-copper"
                  >
                    View all tools
                  </Link>
                </div>
              </form>
            </section>

            <section className="rounded-none border border-brand-steel/30 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Job list</p>
                  <h2 className="text-xl font-semibold text-brand-dark">Filter and update</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as MemberJobStatus | 'all')}
                    className="rounded-none border border-brand-steel/40 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                  >
                    <option value="all">All statuses</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <p className="mt-4 text-sm text-brand-steel">Loading jobs…</p>
              ) : filteredJobs.length === 0 ? (
                <p className="mt-4 text-sm text-brand-steel">No jobs match these filters yet.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-brand-dark">
                        <thead>
                          <tr className="border-b border-brand-steel/20 text-left text-xs uppercase tracking-[0.12em] text-brand-steel">
                            <th className="px-3 py-2">Title</th>
                            <th className="px-3 py-2">Company</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Location</th>
                            <th className="px-3 py-2">Pay</th>
                            <th className="px-3 py-2">Source</th>
                            <th className="px-3 py-2">Notes</th>
                            <th className="px-3 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-steel/15">
                          {filteredJobs.map((job) => (
                            <tr key={job.id}>
                              <td className="px-3 py-3 font-semibold">{job.title || 'Untitled job'}</td>
                              <td className="px-3 py-3 text-brand-steel">{job.company || '—'}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex rounded-none px-3 py-1 text-xs font-semibold ${statusBadgeClasses(job.status)}`}>
                                  {statusOptions.find((s) => s.value === job.status)?.label || job.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-brand-steel">{job.location || '—'}</td>
                              <td className="px-3 py-3 text-brand-steel">{job.pay || '—'}</td>
                              <td className="px-3 py-3 text-brand-steel">
                                {job.source_url ? (
                                  <a
                                    href={job.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-copper underline"
                                  >
                                    View job
                                  </a>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="px-3 py-3 text-brand-steel">
                                {job.notes ? job.notes.slice(0, 60) + (job.notes.length > 60 ? '…' : '') : '—'}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdate(job.id, { status: 'applied' })}
                                    className="rounded-none border border-brand-steel/40 px-3 py-1 text-xs font-semibold text-brand-dark transition hover:border-brand-copper"
                                    disabled={actionId === job.id}
                                  >
                                    Mark applied
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdate(job.id, { status: 'offer' })}
                                    className="rounded-none border border-brand-steel/40 px-3 py-1 text-xs font-semibold text-brand-dark transition hover:border-brand-copper"
                                    disabled={actionId === job.id}
                                  >
                                    Log offer
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => beginEdit(job)}
                                    className="rounded-none border border-brand-steel/40 px-3 py-1 text-xs font-semibold text-brand-dark transition hover:border-brand-copper"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(job.id)}
                                    className="rounded-none border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-400"
                                    disabled={actionId === job.id}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {filteredJobs.map((job) => (
                      <div key={job.id} className="rounded-none border border-brand-steel/25 bg-brand-sand p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-brand-dark">{job.title || 'Untitled job'}</p>
                            <p className="text-xs text-brand-steel">{job.company || 'No company listed'}</p>
                          </div>
                          <span className={`inline-flex rounded-none px-3 py-1 text-[11px] font-semibold ${statusBadgeClasses(job.status)}`}>
                            {statusOptions.find((s) => s.value === job.status)?.label || job.status}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-brand-steel">
                          <span>Location: {job.location || '—'}</span>
                          <span>Pay: {job.pay || '—'}</span>
                          <span>Job ID: {job.job_id || '—'}</span>
                          <span>
                            Link: {' '}
                            {job.source_url ? (
                              <a href={job.source_url} target="_blank" rel="noreferrer" className="text-brand-copper underline">
                                Open
                              </a>
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>
                        {job.notes && <p className="mt-2 text-xs text-brand-dark">{job.notes}</p>}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdate(job.id, { status: 'applied' })}
                            className="rounded-none border border-brand-steel/40 px-3 py-1 font-semibold text-brand-dark transition hover:border-brand-copper"
                            disabled={actionId === job.id}
                          >
                            Mark applied
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(job.id, { status: 'offer' })}
                            className="rounded-none border border-brand-steel/40 px-3 py-1 font-semibold text-brand-dark transition hover:border-brand-copper"
                            disabled={actionId === job.id}
                          >
                            Log offer
                          </button>
                          <button
                            type="button"
                            onClick={() => beginEdit(job)}
                            className="rounded-none border border-brand-steel/40 px-3 py-1 font-semibold text-brand-dark transition hover:border-brand-copper"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(job.id)}
                            className="rounded-none border border-red-200 bg-red-50 px-3 py-1 font-semibold text-red-700 transition hover:border-red-400"
                            disabled={actionId === job.id}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </Gate>
    </ToolLayout>
  )
}
