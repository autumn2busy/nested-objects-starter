'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Loader2, Search, DollarSign, Trash2, ExternalLink, Briefcase, Shield, Zap, MapPin, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Gate } from '@/components/Gate'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/components/auth-provider'

// --- Types ---

type Job = {
    id: string
    title: string
    company: string | null
    description: string | null
    location_display: string | null
    state: string | null
    salary_min: number | null
    salary_max: number | null
    salary_type: string | null
    salary_is_predicted: boolean
    service_vertical: string | null
    category: string | null
    source: string
    source_url: string
    posted_date: string | null
}

type TrackerJob = {
    id: string
    job_id: string | null
    title: string
    company: string
    location: string
    pay: string | null
    source_url: string | null
    status: 'interested' | 'applied' | 'interview' | 'offer' | 'rejected'
    notes: string | null
    updated_at: string
}

type FiltersData = {
    verticals: string[]
    states: string[]
}

// --- Registration URL ---
const REGISTER_URL = 'https://nested-objects.outseta.com/auth?widgetMode=register&planFamilyUid=BWzE6P9E&planPaymentTerm=month&skipPlanOptions=true#o-anonymous'

// --- Helpers ---
function formatSalary(min: number | null, max: number | null, type: string | null): string {
    if (!min && !max) return ''
    const fmt = (n: number) => {
        if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`
        return `$${n.toFixed(0)}`
    }
    let salary = ''
    if (min && max && min !== max) {
        salary = `${fmt(min)} – ${fmt(max)}`
    } else if (min) {
        salary = fmt(min)
    } else if (max) {
        salary = `Up to ${fmt(max)}`
    }
    if (type && type !== 'annual') {
        salary += ` / ${type.replace('per_', '')}`
    } else if (salary) {
        salary += ' / yr'
    }
    return salary
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return '1d ago'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return `${Math.floor(days / 30)}mo ago`
}

// --- Custom Gate Fallback ---
function JobBoardFallback() {
    const { isAuthenticated, login } = useAuth()

    return (
        <section className="mx-auto mt-4 max-w-3xl rounded-2xl border border-brand-steel/35 bg-white/95 p-8 shadow-brand-card">
            <div className="flex flex-col items-center text-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-copper/10 to-brand-copper/5">
                    <Briefcase className="w-8 h-8 text-brand-copper" />
                </div>

                <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-copper">Job command center</p>
                    <h2 className="text-2xl font-bold text-brand-dark">Find work. Track your pipeline.</h2>
                    <p className="text-sm text-brand-slate max-w-md mx-auto">
                        Access job listings from field service firms, save opportunities to your personal pipeline, and track your application status — all in one place.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full max-w-sm text-center">
                    <div className="rounded-xl bg-brand-mist p-3">
                        <Search className="w-5 h-5 text-brand-copper mx-auto mb-1" />
                        <p className="text-xs font-semibold text-brand-dark">Find jobs</p>
                    </div>
                    <div className="rounded-xl bg-brand-mist p-3">
                        <Shield className="w-5 h-5 text-brand-copper mx-auto mb-1" />
                        <p className="text-xs font-semibold text-brand-dark">Track apps</p>
                    </div>
                    <div className="rounded-xl bg-brand-mist p-3">
                        <Zap className="w-5 h-5 text-brand-copper mx-auto mb-1" />
                        <p className="text-xs font-semibold text-brand-dark">Get alerts</p>
                    </div>
                </div>

                <div className="flex flex-col items-stretch gap-3 w-full max-w-xs">
                    {!isAuthenticated ? (
                        <>
                            <button
                                onClick={login}
                                className="inline-flex items-center justify-center rounded-full bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white shadow-brand-soft transition hover:bg-brand-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
                            >
                                Log in securely
                            </button>
                            <a
                                href={REGISTER_URL}
                                className="inline-flex items-center justify-center rounded-full border border-brand-steel/60 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:border-brand-copper hover:text-brand-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
                            >
                                Create vendor account
                            </a>
                        </>
                    ) : (
                        <Link
                            href="/membership-pricing"
                            className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-copperDark"
                        >
                            Upgrade to access jobs
                        </Link>
                    )}
                </div>
            </div>
        </section>
    )
}

// ============================================
// MAIN EXPORT
// ============================================
export function JobsView() {
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState(() => {
        const tab = searchParams.get('tab')
        return tab === 'tracker' ? 'tracker' : 'find'
    })
    const [trackedJobs, setTrackedJobs] = useState<TrackerJob[]>([])
    const [trackerLoading, setTrackerLoading] = useState(true)

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
                    <Link href="/inspector-dashboard" className={buttonVariants({ variant: 'ghost' })}>Dashboard</Link>
                    <Link href="/hiring-firms" className={buttonVariants({ variant: 'ghost' })}>Directory</Link>
                </nav>
            </header>

            <Gate feature="job_board" fallback={<JobBoardFallback />}>
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
            </Gate>

        </main>
    )
}

// ============================================
// FIND JOBS VIEW — now with search, filters, pagination
// ============================================
function FindJobsView({ onSave }: { onSave: () => void }) {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [filtersData, setFiltersData] = useState<FiltersData>({ verticals: [], states: [] })
    const [showFilters, setShowFilters] = useState(false)
    const limit = 25

    // Filters
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [vertical, setVertical] = useState('')
    const [state, setState] = useState('')

    const fetchJobs = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set('page', String(page))
            params.set('limit', String(limit))
            if (search) params.set('search', search)
            if (vertical) params.set('vertical', vertical)
            if (state) params.set('state', state)

            const res = await fetch(`/api/jobs?${params}`)
            const data = await res.json()
            setJobs(data.jobs || [])
            setTotal(data.total || 0)
            if (data.filters) setFiltersData(data.filters)
        } catch (error) {
            console.error('Error fetching jobs:', error)
        } finally {
            setLoading(false)
        }
    }, [page, search, vertical, state])

    useEffect(() => {
        fetchJobs()
    }, [fetchJobs])

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1)
    }, [search, vertical, state])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setSearch(searchInput)
    }

    const clearFilters = () => {
        setSearch('')
        setSearchInput('')
        setVertical('')
        setState('')
        setPage(1)
    }

    const hasFilters = search || vertical || state
    const totalPages = Math.ceil(total / limit)

    const saveJobToTracker = async (job: Job) => {
        try {
            setSavingId(job.id)
            await fetch('/api/member-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: job.id,
                    title: job.title,
                    company: job.company || 'Unknown',
                    location: job.location_display || '',
                    pay: formatSalary(job.salary_min, job.salary_max, job.salary_type),
                    source_url: job.source_url,
                    status: 'interested',
                    notes: `Saved from /jobs on ${new Date().toLocaleDateString()}`,
                }),
            })
            onSave()
        } catch (error) {
            console.error(error)
        } finally {
            setSavingId(null)
        }
    }

    return (
        <div className="space-y-4">
            {/* Search + Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex gap-2">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search jobs by title, company, or keyword..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                    <Button
                        variant="secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? 'border-brand-copper text-brand-copper' : ''}
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-1" />
                        Filters
                        {hasFilters && (
                            <span className="ml-1 bg-brand-copper text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {[search, vertical, state].filter(Boolean).length}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Service Vertical</label>
                            <Select value={vertical} onChange={e => setVertical(e.target.value)} className="w-full">
                                <option value="">All Verticals</option>
                                {filtersData.verticals.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">State</label>
                            <Select value={state} onChange={e => setState(e.target.value)} className="w-full">
                                <option value="">All States</option>
                                {filtersData.states.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </Select>
                        </div>
                        {hasFilters && (
                            <div className="flex items-end">
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                                    <X className="w-3.5 h-3.5 mr-1" /> Clear all
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Results count */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>
                        {loading ? 'Loading...' : `${total.toLocaleString()} job${total !== 1 ? 's' : ''} found`}
                        {hasFilters && !loading && (
                            <button onClick={clearFilters} className="ml-2 text-brand-copper hover:underline text-xs">
                                Clear filters
                            </button>
                        )}
                    </span>
                    {!loading && total > 0 && (
                        <span className="text-xs">
                            Page {page} of {totalPages}
                        </span>
                    )}
                </div>
            </div>

            {/* Job Cards */}
            {loading ? (
                <div className="grid gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Card key={i} className="p-5 border-slate-200">
                            <div className="flex justify-between items-start gap-4 mb-3">
                                <div className="space-y-2 w-full">
                                    <Skeleton className="h-5 w-2/5" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                                <Skeleton className="h-8 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </Card>
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <Card className="p-12 text-center border-slate-200">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900">No jobs match your search</h3>
                    <p className="text-slate-500 mt-1">
                        {hasFilters ? 'Try broadening your filters or clearing your search.' : 'Check back soon — we update listings every few hours.'}
                    </p>
                    {hasFilters && (
                        <Button variant="secondary" className="mt-4" onClick={clearFilters}>
                            Clear all filters
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid gap-3">
                    {jobs.map((job) => {
                        const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type)
                        return (
                            <Card key={job.id} className="p-5 border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-slate-900 truncate">{job.title}</h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                            {job.company && (
                                                <span className="text-sm text-slate-600">{job.company}</span>
                                            )}
                                            {job.location_display && (
                                                <span className="text-sm text-slate-500 flex items-center gap-0.5">
                                                    <MapPin className="w-3 h-3" /> {job.location_display}
                                                </span>
                                            )}
                                            {salary && (
                                                <span className="text-sm font-semibold text-emerald-600 flex items-center gap-0.5">
                                                    <DollarSign className="w-3 h-3" /> {salary}
                                                    {job.salary_is_predicted && (
                                                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">est.</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {job.source_url && (
                                            <a
                                                href={job.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Apply
                                            </a>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={() => saveJobToTracker(job)}
                                            disabled={savingId === job.id}
                                        >
                                            {savingId === job.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Plus className="w-3.5 h-3.5 mr-1" /> Save
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                {job.description && (
                                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{job.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {job.service_vertical && (
                                        <button
                                            onClick={() => { setVertical(job.service_vertical!); setShowFilters(true) }}
                                            className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                                        >
                                            {job.service_vertical}
                                        </button>
                                    )}
                                    {job.posted_date && (
                                        <span className="text-xs text-slate-400">
                                            {timeAgo(job.posted_date)}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-300 capitalize">
                                        via {job.source}
                                    </span>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (page <= 3) {
                                pageNum = i + 1
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = page - 2 + i
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                                        ? 'bg-brand-copper text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    )
}

// ============================================
// TRACKER VIEW — fixed with PATCH and source_url link
// ============================================
function TrackerView({ jobs, loading, refresh }: { jobs: TrackerJob[]; loading: boolean; refresh: () => void }) {
    const [addingJob, setAddingJob] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [newJob, setNewJob] = useState({
        company: '',
        title: '',
        location: '',
        pay: '',
        source_url: '',
        status: 'interested'
    })
    const [showRejected, setShowRejected] = useState(false)

    const columns = [
        { id: 'interested', label: 'Interested', color: 'bg-blue-50' },
        { id: 'applied', label: 'Applied', color: 'bg-amber-50' },
        { id: 'interview', label: 'Interview', color: 'bg-purple-50' },
        { id: 'offer', label: 'Offer', color: 'bg-emerald-50' },
    ] as const

    const rejectedJobs = jobs.filter(j => j.status === 'rejected')

    const handleStatusChange = async (jobId: string, newStatus: string) => {
        setUpdatingId(jobId)
        try {
            await fetch(`/api/member-jobs/${jobId}`, {
                method: 'PATCH',
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
            await fetch(`/api/member-jobs/${jobId}`, { method: 'DELETE' })
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
            setNewJob({ company: '', title: '', location: '', pay: '', source_url: '', status: 'interested' })
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
            <div className="flex justify-end">
                {addingJob ? (
                    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Add Job to Pipeline</h3>
                            <Button variant="ghost" size="sm" onClick={() => setAddingJob(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Company *</label>
                                <Input
                                    placeholder="e.g. National Field Reps"
                                    value={newJob.company}
                                    onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Job Title *</label>
                                <Input
                                    placeholder="e.g. Property Inspector"
                                    value={newJob.title}
                                    onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Location</label>
                                <Input
                                    placeholder="e.g. Atlanta, GA"
                                    value={newJob.location}
                                    onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Pay</label>
                                <Input
                                    placeholder="e.g. $45/inspection"
                                    value={newJob.pay}
                                    onChange={e => setNewJob({ ...newJob, pay: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Job Posting URL</label>
                                <Input
                                    placeholder="https://..."
                                    type="url"
                                    value={newJob.source_url}
                                    onChange={e => setNewJob({ ...newJob, source_url: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Status</label>
                                <Select value={newJob.status} onChange={e => setNewJob({ ...newJob, status: e.target.value })} className="w-full">
                                    <option value="interested">Interested</option>
                                    <option value="applied">Applied</option>
                                    <option value="interview">Interview</option>
                                    <option value="offer">Offer</option>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                            <Button variant="ghost" onClick={() => setAddingJob(false)}>Cancel</Button>
                            <Button
                                disabled={updatingId === 'new' || !newJob.company.trim() || !newJob.title.trim()}
                                onClick={handleAddJob}
                            >
                                {updatingId === 'new' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Add to Pipeline
                            </Button>
                        </div>
                    </div>
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
                                    <span className="bg-white/60 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{colJobs.length}</span>
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
                                                <div className="flex items-center gap-1">
                                                    {job.source_url && (
                                                        <a
                                                            href={job.source_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-brand-copper"
                                                            title="View original posting"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                    <button onClick={() => handleDelete(job.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500" title="Delete">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-sm font-bold text-slate-900 leading-tight mb-3">{job.title}</div>
                                            {job.location && (
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                                    <MapPin className="w-3 h-3" /> {job.location}
                                                </div>
                                            )}
                                            <div className="pt-2 border-t border-slate-50">
                                                <Select value={job.status} onChange={(e) => handleStatusChange(job.id, e.target.value)} className="w-full text-xs h-8">
                                                    <option value="interested">Move to: Interested</option>
                                                    <option value="applied">Move to: Applied</option>
                                                    <option value="interview">Move to: Interview</option>
                                                    <option value="offer">Move to: Offer</option>
                                                    <option value="rejected">Move to: Rejected</option>
                                                </Select>
                                            </div>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="text-xs text-emerald-600 font-medium">{job.pay || 'Pay N/A'}</div>
                                                <div className="text-[10px] text-slate-400">
                                                    {new Date(job.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {colJobs.length === 0 && (
                                        <div className="text-center py-8 text-slate-300 text-xs italic">Empty</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Rejected Jobs Section */}
            {rejectedJobs.length > 0 && (
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                    <button
                        onClick={() => setShowRejected(!showRejected)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="font-semibold text-slate-700">Rejected</span>
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                {rejectedJobs.length}
                            </span>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showRejected ? 'rotate-90' : ''}`} />
                    </button>

                    {showRejected && (
                        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {rejectedJobs.map(job => (
                                    <div key={job.id} className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm group relative ${updatingId === job.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {updatingId === job.id && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{job.company}</div>
                                            <div className="flex items-center gap-1">
                                                {job.source_url && (
                                                    <a
                                                        href={job.source_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-brand-copper"
                                                        title="View original posting"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                <button onClick={() => handleDelete(job.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500" title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-slate-900 leading-tight mb-2">{job.title}</div>
                                        <Select value={job.status} onChange={(e) => handleStatusChange(job.id, e.target.value)} className="w-full text-xs h-8">
                                            <option value="interested">Move to: Interested</option>
                                            <option value="applied">Move to: Applied</option>
                                            <option value="interview">Move to: Interview</option>
                                            <option value="offer">Move to: Offer</option>
                                            <option value="rejected">Keep Rejected</option>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}