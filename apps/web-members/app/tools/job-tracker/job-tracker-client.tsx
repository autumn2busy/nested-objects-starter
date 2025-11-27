'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { Gate } from '@/components/Gate'
import type { Job, JobStatus, PayoutStatus } from '@/types/jobs'

import { ToolAccessMessage, UpgradeActions } from '../_components/ToolAccessMessage'

const statusOptions: { value: JobStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
]

const payoutStatusOptions: { value: PayoutStatus; label: string }[] = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
]

type JobFormState = {
  title: string
  firm_name: string
  firm_id: string
  region: string
  address: string
  appointment_date: string
  appointment_time: string
  status: JobStatus
  payout: string
  payout_status: PayoutStatus
  mileage: string
  sla_target_hours: string
  notes: string
}

const defaultForm: JobFormState = {
  title: '',
  firm_name: '',
  firm_id: '',
  region: '',
  address: '',
  appointment_date: '',
  appointment_time: '',
  status: 'scheduled',
  payout: '',
  payout_status: 'unpaid',
  mileage: '',
  sla_target_hours: '',
  notes: '',
}

function parseDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfWeek(date = new Date()) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = copy.getDate() - day
  copy.setDate(diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfWeek(date = new Date()) {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function statusBadgeClasses(status: JobStatus) {
  switch (status) {
    case 'completed':
      return 'bg-brand-teal text-white'
    case 'paid':
      return 'bg-brand-teal/80 text-white'
    case 'in_progress':
      return 'bg-brand-copper/10 text-brand-dark border border-brand-copper/40'
    case 'invoiced':
      return 'bg-white text-brand-dark border border-brand-steel/40'
    case 'cancelled':
      return 'bg-brand-steel/10 text-brand-dark border border-brand-steel/40'
    default:
      return 'bg-brand-sand text-brand-dark border border-brand-steel/30'
  }
}

function payoutBadgeClasses(status: PayoutStatus) {
  switch (status) {
    case 'paid':
      return 'bg-brand-teal text-white'
    case 'partial':
      return 'bg-brand-copper/10 text-brand-dark border border-brand-copper/40'
    default:
      return 'bg-white text-brand-dark border border-brand-steel/40'
  }
}

export function JobTrackerClient() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'next7'>('all')
  const [formState, setFormState] = useState<JobFormState>(defaultForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [limitMessage, setLimitMessage] = useState<string | null>(null)

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/jobs')
      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(payload?.error || 'Could not load jobs')
      }

      setJobs(Array.isArray(payload) ? payload : payload.jobs ?? [])
    } catch (err) {
      console.error(err)
      setError('Could not load your jobs just yet. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchJobs()
  }, [])

  const weeklySummary = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)

    const weeklyJobs = jobs.filter((job) => {
      const date = parseDate(job.appointment_date)
      return date && date >= weekStart && date <= weekEnd
    })

    const payoutTotal = weeklyJobs.reduce((sum, job) => sum + (job.payout ?? 0), 0)

    const dueByNow = jobs.filter((job) => {
      const apptDate = parseDate(job.appointment_date)
      if (!apptDate) return false
      const deadline = new Date(apptDate)
      const hours = job.sla_target_hours ?? 0
      deadline.setHours(deadline.getHours() + hours)
      return deadline <= now
    })

    const completedOnTime = dueByNow.filter((job) => job.status === 'completed' || job.status === 'paid')
    const slaScore = dueByNow.length ? Math.round((completedOnTime.length / dueByNow.length) * 100) : 100

    return {
      weeklyJobs: weeklyJobs.length,
      payoutTotal,
      slaScore,
    }
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today)
    const weekEnd = endOfWeek(today)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    const matchesFilters = (job: Job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false

      const apptDate = parseDate(job.appointment_date)

      if (dateFilter === 'today') {
        if (!apptDate) return false
        return apptDate.toDateString() === today.toDateString()
      }

      if (dateFilter === 'week') {
        if (!apptDate) return false
        return apptDate >= weekStart && apptDate <= weekEnd
      }

      if (dateFilter === 'next7') {
        if (!apptDate) return false
        return apptDate >= today && apptDate <= nextWeek
      }

      return true
    }

    return [...jobs]
      .filter(matchesFilters)
      .sort((a, b) => {
        const aDate = parseDate(a.appointment_date)
        const bDate = parseDate(b.appointment_date)

        if (aDate && bDate) return bDate.getTime() - aDate.getTime()
        if (aDate && !bDate) return -1
        if (!aDate && bDate) return 1

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [dateFilter, jobs, statusFilter])

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
    setLimitMessage(null)

    const payload = {
      firm_id: formState.firm_id || null,
      title: formState.title || null,
      firm_name: formState.firm_name || null,
      region: formState.region || null,
      address: formState.address || null,
      appointment_date: formState.appointment_date || null,
      appointment_time: formState.appointment_time || null,
      status: formState.status,
      payout: formState.payout ? Number(formState.payout) : null,
      payout_status: formState.payout_status,
      mileage: formState.mileage ? Number(formState.mileage) : null,
      sla_target_hours: formState.sla_target_hours ? Number(formState.sla_target_hours) : null,
      notes: formState.notes || null,
    }

    try {
      const res = await fetch(editingId ? `/api/jobs/${editingId}` : '/api/jobs', {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 403 && data?.error) {
          setLimitMessage(data.error)
        } else {
          setError(data?.error || 'Could not save this job just yet.')
        }
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

  const handleUpdate = async (id: string, updates: Partial<Job>) => {
    try {
      setActionId(id)
      setError(null)
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(payload?.error || 'Could not update job.')
        return
      }

      await fetchJobs()
    } catch (err) {
      console.error(err)
      setError('Could not update job.')
    } finally {
      setActionId(null)
    }
  }

  const beginEdit = (job: Job) => {
    setEditingId(job.id)
    setFormState({
      title: job.title || '',
      firm_name: job.firm_name || '',
      firm_id: job.firm_id || '',
      region: job.region || '',
      address: job.address || '',
      appointment_date: job.appointment_date || '',
      appointment_time: job.appointment_time || '',
      status: job.status,
      payout: job.payout ? String(job.payout) : '',
      payout_status: job.payout_status,
      mileage: job.mileage ? String(job.mileage) : '',
      sla_target_hours: job.sla_target_hours ? String(job.sla_target_hours) : '',
      notes: job.notes || '',
    })
  }

  return (
    <Gate
      feature="job_tracker"
      loadingFallback={<ToolAccessMessage title="Loading access" description="Checking your account..." loading />}
      fallback={
        <ToolAccessMessage
          title="Authentication required"
          description="Log in or upgrade to start tracking inspections and payouts."
          tone="warning"
          actions={<UpgradeActions />}
        />
      }
    >
      <div className="space-y-6">
          {limitMessage && (
            <ToolAccessMessage
              title="Upgrade for unlimited job tracking"
              description={limitMessage}
              tone="warning"
              actions={
                <Link
                  href="/upgrade"
                  className="rounded-none bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
                >
                  Upgrade to Pro
                </Link>
              }
            />
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-none border border-brand-steel/25 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">This week</p>
              <p className="mt-2 text-3xl font-bold text-brand-dark">{weeklySummary.weeklyJobs}</p>
              <p className="text-sm text-brand-steel">Jobs scheduled</p>
            </div>
            <div className="rounded-none border border-brand-steel/25 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Expected payout</p>
              <p className="mt-2 text-3xl font-bold text-brand-dark">{formatCurrency(weeklySummary.payoutTotal)}</p>
              <p className="text-sm text-brand-steel">Projected this week</p>
            </div>
            <div className="rounded-none border border-brand-steel/25 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">SLA score</p>
              <p className="mt-2 text-3xl font-bold text-brand-dark">{weeklySummary.slaScore}%</p>
              <p className="text-sm text-brand-steel">Completed on time</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr,1.6fr]">
            <section className="rounded-none border border-brand-steel/30 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">New job</p>
                  <h2 className="text-xl font-semibold text-brand-dark">Quick add</h2>
                  <p className="text-sm text-brand-steel">Create a new inspection with status, payout, and notes.</p>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-none border border-brand-steel/40 px-3 py-1 text-xs font-semibold text-brand-dark transition hover:border-brand-copper"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-3">
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Title</span>
                    <input
                      value={formState.title}
                      onChange={(e) => updateForm('title', e.target.value)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                      placeholder="Roof inspection - Atlanta"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Firm</span>
                    <input
                      value={formState.firm_name}
                      onChange={(e) => updateForm('firm_name', e.target.value)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                      placeholder="Acme Insurance"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Region</span>
                    <input
                      value={formState.region}
                      onChange={(e) => updateForm('region', e.target.value)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                      placeholder="Atlanta metro or Route 4"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Appointment date</span>
                    <input
                      type="date"
                      value={formState.appointment_date}
                      onChange={(e) => updateForm('appointment_date', e.target.value)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Appointment time</span>
                    <input
                      value={formState.appointment_time}
                      onChange={(e) => updateForm('appointment_time', e.target.value)}
                      placeholder="9am–12pm"
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Status</span>
                    <select
                      value={formState.status}
                      onChange={(e) => updateForm('status', e.target.value as JobStatus)}
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
                    <span className="block font-semibold">Payout</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formState.payout}
                      onChange={(e) => updateForm('payout', e.target.value)}
                      placeholder="250"
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">Payout status</span>
                    <select
                      value={formState.payout_status}
                      onChange={(e) => updateForm('payout_status', e.target.value as PayoutStatus)}
                      className="w-full rounded-none border border-brand-steel/30 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                    >
                      {payoutStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-brand-dark">
                    <span className="block font-semibold">SLA target (hours)</span>
                    <input
                      type="number"
                      value={formState.sla_target_hours}
                      onChange={(e) => updateForm('sla_target_hours', e.target.value)}
                      placeholder="24"
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
                    placeholder="Access codes, photo requests, or special handling"
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
                    onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
                    className="rounded-none border border-brand-steel/40 bg-white px-3 py-2 text-sm focus:border-brand-copper focus:outline-none"
                  >
                    <option value="all">All statuses</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    {[
                      { value: 'all', label: 'All dates' },
                      { value: 'today', label: 'Today' },
                      { value: 'week', label: 'This week' },
                      { value: 'next7', label: 'Next 7 days' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDateFilter(option.value as typeof dateFilter)}
                        className={`rounded-none border px-3 py-2 text-sm font-semibold transition ${
                          dateFilter === option.value
                            ? 'border-brand-copper bg-brand-copper text-white'
                            : 'border-brand-steel/40 bg-white text-brand-dark hover:border-brand-copper'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
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
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Title</th>
                            <th className="px-3 py-2">Firm</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Payout</th>
                            <th className="px-3 py-2">Payout status</th>
                            <th className="px-3 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-steel/15">
                          {filteredJobs.map((job) => (
                            <tr key={job.id}>
                              <td className="px-3 py-3 text-brand-steel">{job.appointment_date || 'TBD'}</td>
                              <td className="px-3 py-3 font-semibold">{job.title || 'Untitled job'}</td>
                              <td className="px-3 py-3 text-brand-steel">{job.firm_name || '—'}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex rounded-none px-3 py-1 text-xs font-semibold ${statusBadgeClasses(job.status)}`}>
                                  {statusOptions.find((s) => s.value === job.status)?.label || job.status}
                                </span>
                              </td>
                              <td className="px-3 py-3">{job.payout ? `$${job.payout.toFixed(2)}` : '—'}</td>
                              <td className="px-3 py-3">
                                <span
                                  className={`inline-flex rounded-none px-3 py-1 text-xs font-semibold ${payoutBadgeClasses(job.payout_status)}`}
                                >
                                  {job.payout_status}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdate(job.id, { status: 'completed' })}
                                    className="rounded-none border border-brand-steel/40 px-3 py-1 text-xs font-semibold text-brand-dark transition hover:border-brand-copper"
                                    disabled={actionId === job.id}
                                  >
                                    Mark completed
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdate(job.id, { status: 'paid', payout_status: 'paid' })}
                                    className="rounded-none border border-brand-steel/40 px-3 py-1 text-xs font-semibold text-brand-dark transition hover:border-brand-copper"
                                    disabled={actionId === job.id}
                                  >
                                    Mark paid
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => beginEdit(job)}
                                    className="rounded-none border border-brand-steel/40 px-3 py-1 text-xs font-semibold text-brand-dark transition hover:border-brand-copper"
                                  >
                                    Edit
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
                            <p className="text-xs text-brand-steel">{job.firm_name || 'No firm listed'}</p>
                          </div>
                          <span className={`inline-flex rounded-none px-3 py-1 text-[11px] font-semibold ${statusBadgeClasses(job.status)}`}>
                            {statusOptions.find((s) => s.value === job.status)?.label || job.status}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-brand-steel">
                          <span>Date: {job.appointment_date || 'TBD'}</span>
                          <span>Payout: {job.payout ? `$${job.payout.toFixed(2)}` : '—'}</span>
                          <span>Time: {job.appointment_time || '—'}</span>
                          <span>
                            Payout status:{' '}
                            <span className={`inline-flex rounded-none px-2 py-1 text-[11px] font-semibold ${payoutBadgeClasses(job.payout_status)}`}>
                              {job.payout_status}
                            </span>
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdate(job.id, { status: 'completed' })}
                            className="rounded-none border border-brand-steel/40 px-3 py-1 font-semibold text-brand-dark transition hover:border-brand-copper"
                            disabled={actionId === job.id}
                          >
                            Mark completed
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(job.id, { status: 'paid', payout_status: 'paid' })}
                            className="rounded-none border border-brand-steel/40 px-3 py-1 font-semibold text-brand-dark transition hover:border-brand-copper"
                            disabled={actionId === job.id}
                          >
                            Mark paid
                          </button>
                          <button
                            type="button"
                            onClick={() => beginEdit(job)}
                            className="rounded-none border border-brand-steel/40 px-3 py-1 font-semibold text-brand-dark transition hover:border-brand-copper"
                          >
                            Edit
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
    )
}
