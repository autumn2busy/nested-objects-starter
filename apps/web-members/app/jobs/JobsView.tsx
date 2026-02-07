'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, List as ListIcon, Loader2, Search, CheckCircle2, DollarSign, Trash2, ExternalLink } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PreviewGate } from '@/components/PreviewGate'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

// --- Types ---

// Data from public "Find Jobs" API
type JobEntry = {
    id: string
    title: string
    company: string
    location: string
    pay: string
    description: string
    link: string
    roles: string[]
}

// Data from private "Member Tracker" API
type TrackerJob = {
    id: string
    job_id: string | null
    title: string
    company: string
    location: string
    pay: string | null
    status: 'interested' | 'applied' | 'interview' | 'offer' | 'rejected'
    notes: string | null
    updated_at: string
}

export function JobsView() {
    const [activeTab, setActiveTab] = useState('find')

    // Tracker State
    const [trackedJobs, setTrackedJobs] = useState<TrackerJob[]>([])
    const [trackerLoading, setTrackerLoading] = useState(true)

    // Fetch Tracker Data when tab changes to 'tracker'
    useEffect(() => {
        if (activeTab === 'tracker') {
            fetchTrackerJobs()
        }
    }, [activeTab])

    async function fetchTrackerJobs() {
        setTrackerLoading(true)
        try {
            const res = await fetch('/api/member-jobs')
            const data = await res.json()
            if (data.jobs) {
                setTrackedJobs(data.jobs)
            }
        } catch (err) {
            console.error('Failed to load tracker', err)
        } finally {
            setTrackerLoading(false)
        }
    }

    return (
        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-8 lg:py-12 bg-slate-50 min-h-screen">

            {/* Header */}
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Command Center</h1>
                    <p className="text-slate-500 text-sm">Find new work or track your existing pipeline.</p>
                </div>

                <nav className="flex gap-2">
                    <Link href="/dashboard" className={buttonVariants({ variant: 'ghost' })}>Dashboard</Link>
                    <Link href="/directory" className={buttonVariants({ variant: 'ghost' })}>Directory</Link>
                </nav>
            </header>

            <PreviewGate
                feature="job_board"
                title="Job Board Locked"
                description="Members get full access to the job board and tracking tools."
            >
                <Tabs defaultValue="find" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <TabsList className="bg-white border p-1 h-auto rounded-lg shadow-sm">
                            <TabsTrigger value="find" className="px-6 py-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">Find Jobs</TabsTrigger>
                            <TabsTrigger value="tracker" className="px-6 py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">My Pipeline</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="find" className="mt-0">
                        <FindJobsView onSave={() => setActiveTab('tracker')} />
                    </TabsContent>

                    <TabsContent value="tracker" className="mt-0">
                        <TrackerView
                            jobs={trackedJobs}
                            loading={trackerLoading}
                            refresh={fetchTrackerJobs}
                        />
                    </TabsContent>
                </Tabs>
            </PreviewGate>

        </main>
    )
}

// --- Sub-Components ---

function FindJobsView({ onSave }: { onSave: () => void }) {
    const [jobs, setJobs] = useState<JobEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchJobs() {
            try {
                const res = await fetch('/api/jobs')
                const data = await res.json()
                setJobs(data.jobs || [])
            } catch (error) {
                console.error('Error fetching jobs:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchJobs()
    }, [])

    const saveJobToTracker = async (job: JobEntry) => {
        try {
            setSavingId(job.id)
            await fetch('/api/member-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: job.id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    pay: job.pay,
                    source_url: job.link,
                    status: 'interested',
                    notes: `Saved from /jobs on ${new Date().toLocaleDateString()}`,
                }),
            })
            // Switch tab to tracker to show the saved job
            onSave()
        } catch (error) {
            console.error(error)
        } finally {
            setSavingId(null)
        }
    }

    if (loading) {
        return (
            <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="p-6 border-slate-200">
                        <div className="flex justify-between items-start gap-4 mb-4">
                            <div className="space-y-2 w-full">
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                            <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4">
            {jobs.length === 0 && (
                <div className="p-12 text-center bg-white border rounded-xl border-dashed">
                    <p className="text-slate-500">No new jobs found this week.</p>
                </div>
            )}

            {jobs.map((job) => (
                <Card key={job.id} className="p-6 transition-all hover:shadow-md border-slate-200">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                {job.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <span className="font-medium text-slate-700">{job.company}</span>
                                <span>•</span>
                                <span>{job.location}</span>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-sm">
                                {job.pay}
                            </div>
                        </div>
                    </div>

                    <p className="mt-4 text-slate-600 text-sm leading-relaxed max-w-3xl">
                        {job.description}
                    </p>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                        <Link
                            href={job.link}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'gap-2 border-slate-300' })}
                        >
                            View External Post <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                        </Link>
                        <Button
                            size="sm"
                            className={savingId === job.id ? "bg-slate-100 text-slate-400" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                            disabled={!!savingId}
                            onClick={() => saveJobToTracker(job)}
                        >
                            {savingId === job.id ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Track Application'
                            )}
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    )
}

function TrackerView({ jobs, loading, refresh }: { jobs: TrackerJob[], loading: boolean, refresh: () => void }) {
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [addingJob, setAddingJob] = useState(false)
    const [newJob, setNewJob] = useState({ company: '', title: '', status: 'applied' })

    const columns = [
        { id: 'interested', label: 'Interested', color: 'bg-slate-100' },
        { id: 'applied', label: 'Applied', color: 'bg-blue-50' },
        { id: 'interview', label: 'Interview', color: 'bg-amber-50' },
        { id: 'offer', label: 'Hired / Offer', color: 'bg-emerald-50' },
    ] as const

    const handleStatusChange = async (jobId: string, newStatus: string) => {
        setUpdatingId(jobId)
        try {
            await fetch(`/api/member-jobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            refresh()
        } catch (error) {
            console.error('Failed to update status', error)
        } finally {
            setUpdatingId(null)
        }
    }

    const handleDelete = async (jobId: string) => {
        if (!confirm('Are you sure you want to remove this job from your tracker?')) return
        setUpdatingId(jobId)
        try {
            await fetch(`/api/member-jobs/${jobId}`, {
                method: 'DELETE',
            })
            refresh()
        } catch (error) {
            console.error('Failed to delete job', error)
        } finally {
            setUpdatingId(null)
        }
    }

    const handleAddJob = async (e: React.FormEvent) => {
        e.preventDefault()
        setUpdatingId('new')
        try {
            await fetch('/api/member-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newJob),
            })
            setAddingJob(false)
            setNewJob({ company: '', title: '', status: 'applied' })
            refresh()
        } catch (error) {
            console.error('Failed to add job', error)
        } finally {
            setUpdatingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex gap-6 min-w-[1000px] overflow-hidden">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Add Job Bar */}
            <div className="flex justify-end">
                {addingJob ? (
                    <form onSubmit={handleAddJob} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <Input
                            placeholder="Company"
                            className="w-40"
                            value={newJob.company}
                            onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                            required
                        />
                        <Input
                            placeholder="Job Title"
                            className="w-40"
                            value={newJob.title}
                            onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                            required
                        />
                        <Select
                            value={newJob.status}
                            onChange={e => setNewJob({ ...newJob, status: e.target.value })}
                            className="w-32"
                        >
                            <option value="interested">Interested</option>
                            <option value="applied">Applied</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                        </Select>
                        <Button type="submit" size="sm" disabled={updatingId === 'new'}>
                            {updatingId === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setAddingJob(false)}>Cancel</Button>
                    </form>
                ) : (
                    <Button onClick={() => setAddingJob(true)} variant="secondary" className="gap-2">
                        <Plus className="w-4 h-4" /> Add Manual Job
                    </Button>
                )}
            </div>

            <div className="overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-[1000px]">
                    {columns.map(col => {
                        const colJobs = jobs.filter(j => j.status === col.id)
                        return (
                            <div key={col.id} className="flex-1 min-w-[280px]">
                                <div className={`p-3 rounded-t-lg border-b-2 border-white ${col.color} flex justify-between items-center`}>
                                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{col.label}</h3>
                                    <span className="bg-white/60 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {colJobs.length}
                                    </span>
                                </div>
                                <div className="bg-slate-50/50 p-2 space-y-3 min-h-[400px] border border-t-0 rounded-b-lg border-slate-200">
                                    {colJobs.map(job => (
                                        <div key={job.id} className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative ${updatingId === job.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                            {updatingId === job.id && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{job.company}</div>
                                                <button
                                                    onClick={() => handleDelete(job.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="text-sm font-bold text-slate-900 leading-tight mb-3">{job.title}</div>

                                            <div className="pt-2 border-t border-slate-50">
                                                <Select
                                                    value={job.status}
                                                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                                                    className="w-full text-xs h-8"
                                                >
                                                    <option value="interested">Mov to: Interested</option>
                                                    <option value="applied">Mov to: Applied</option>
                                                    <option value="interview">Mov to: Interview</option>
                                                    <option value="offer">Mov to: Offer</option>
                                                    <option value="rejected">Mov to: Rejected</option>
                                                </Select>
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                <div className="text-xs text-emerald-600 font-medium">
                                                    {job.pay || 'Pay N/A'}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {new Date(job.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {colJobs.length === 0 && (
                                        <div className="text-center py-8 text-slate-300 text-xs italic">
                                            Empty
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
