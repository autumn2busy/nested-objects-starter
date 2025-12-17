'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Kanban, List as ListIcon, Loader2, Search, CheckCircle2, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Gate } from '@/components/Gate'

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

export default function JobsPage() {
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
          <Button variant="ghost" asChild><Link href="/dashboard">Dashboard</Link></Button>
          <Button variant="ghost" asChild><Link href="/directory">Directory</Link></Button>
        </nav>
      </header>

      <Gate feature="job_board">
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
            <TrackerView jobs={trackedJobs} loading={trackerLoading} refresh={fetchTrackerJobs} />
          </TabsContent>
        </Tabs>
      </Gate>

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
      // Optional: switch tab or show toast
      // onSave() 
    } catch (error) {
      console.error(error)
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <div className="p-12 text-center text-slate-500">Loading opportunities...</div>

  return (
    <div className="grid gap-4">
      {jobs.length === 0 && (
        <div className="p-12 text-center bg-white border rounded-xl border-dashed">
          <p>No new jobs found this week.</p>
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
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-slate-300"
              asChild
            >
              <a href={job.link} target="_blank" rel="noreferrer">
                View External Post <ArrowRight className="w-3 h-3 ml-1 opacity-50" />
              </a>
            </Button>
            <Button
              size="sm"
              className={savingId === job.id ? "bg-slate-100 text-slate-400" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
              disabled={savingId === job.id}
              onClick={() => saveJobToTracker(job)}
            >
              {savingId === job.id ? 'Saving...' : 'Track Application'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

function TrackerView({ jobs, loading, refresh }: { jobs: TrackerJob[], loading: boolean, refresh: () => void }) {
  if (loading) return <div className="p-12 text-center text-slate-500">Loading pipeline...</div>

  const columns = [
    { id: 'interested', label: 'Interested', color: 'bg-slate-100' },
    { id: 'applied', label: 'Applied', color: 'bg-blue-50' },
    { id: 'interview', label: 'Interview', color: 'bg-amber-50' },
    { id: 'offer', label: 'Hired / Offer', color: 'bg-emerald-50' },
  ] as const

  return (
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
                  <div key={job.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group">
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{job.company}</div>
                    <div className="text-sm font-bold text-slate-900 leading-tight mb-2">{job.title}</div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
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
  )
}

function ArrowRight({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
}
