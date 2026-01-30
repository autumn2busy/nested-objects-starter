'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, MoreHorizontal, ChevronRight, Briefcase, MapPin, DollarSign, Calendar, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

type JobStage = 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Negotiating' | 'Accepted'

type Job = {
  id: string
  title: string
  company: string
  location: string
  salary: string
  status: JobStage
  dateSaved: string
  dateApplied?: string
  followUpDate?: string
  excitement: number // 1-5
}

const STAGES: JobStage[] = ['Bookmarked', 'Applying', 'Applied', 'Interviewing', 'Negotiating', 'Accepted']

export default function JobTrackerPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Stats
  const stats = {
    bookmarked: jobs.filter(j => j.status === 'Bookmarked').length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interviewing: jobs.filter(j => j.status === 'Interviewing').length,
    offers: jobs.filter(j => j.status === 'Accepted').length // or Negotiating
  }

  useEffect(() => {
    const saved = localStorage.getItem('teal_job_tracker')
    if (saved) {
      setJobs(JSON.parse(saved))
    }
  }, [])

  const saveToLocal = (newJobs: Job[]) => {
    setJobs(newJobs)
    localStorage.setItem('teal_job_tracker', JSON.stringify(newJobs))
  }

  const addJob = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newJob: Job = {
      id: crypto.randomUUID(),
      title: formData.get('title') as string,
      company: formData.get('company') as string,
      location: formData.get('location') as string || 'Remote',
      salary: formData.get('salary') as string || '$0',
      status: 'Bookmarked',
      dateSaved: new Date().toLocaleDateString(),
      excitement: 3
    }
    saveToLocal([newJob, ...jobs])
    setIsModalOpen(false)
  }

  const updateStatus = (id: string, newStatus: JobStage) => {
    const updated = jobs.map(j => j.id === id ? { ...j, status: newStatus } : j)
    saveToLocal(updated)
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/tools" className="text-xl font-bold text-brand-dark flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-copper text-white rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              Job Tracker
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="#" className="text-brand-copper border-b-2 border-brand-copper pb-4 -mb-4">Jobs</Link>
              <Link href="/tools/companies" className="hover:text-brand-dark transition-colors">Companies</Link>
              <Link href="/tools/clients" className="hover:text-brand-dark transition-colors">People</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-copper hover:bg-brand-copperDark text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Add a New Job
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-0 mb-8 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {STAGES.map((stage, i) => {
            const count = jobs.filter(j => j.status === stage).length
            const isLast = i === STAGES.length - 1
            return (
              <div key={stage} className={`p-4 flex flex-col items-center justify-center relative ${!isLast ? 'border-r border-slate-100' : ''}`}>
                {!isLast && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-200 bg-white rounded-full">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}
                <span className="text-2xl font-bold text-slate-900 mb-1">{count}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stage}</span>
              </div>
            )
          })}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input placeholder="Search jobs..." className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/50 w-64" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Group by: None</Button>
              <Button variant="outline" size="sm">Columns</Button>
              <Button variant="outline" size="sm">Menu</Button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4 pl-8">Job Position</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-1">Salary</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Date Saved</div>
            <div className="col-span-2 text-right">Excitement</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {jobs.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-brand-copper/10 text-brand-copper rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">You don't have any saved jobs</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">Save jobs from across the web or add them manually to track your progress.</p>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-brand-copper text-white hover:bg-brand-copperDark">
                  <Plus className="w-4 h-4" /> Add a new job
                </Button>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group">
                  <div className="col-span-4 flex items-center gap-3">
                    <input type="checkbox" className="rounded border-slate-300 text-brand-copper focus:ring-brand-copper" />
                    <div>
                      <div className="font-semibold text-brand-dark">{job.title}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        {job.location}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-slate-700 font-medium">{job.company}</div>
                  <div className="col-span-1 text-sm text-slate-500">{job.salary}</div>
                  <div className="col-span-2">
                    <select
                      value={job.status}
                      onChange={(e) => updateStatus(job.id, e.target.value as JobStage)}
                      className={`text-xs font-semibold px-2 py-1 rounded-md border-0 ring-1 ring-inset focus:ring-2 focus:ring-inset w-full max-w-[140px] ${job.status === 'Bookmarked' ? 'bg-slate-100 text-slate-700 ring-slate-600/20' :
                          job.status === 'Applied' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                            job.status === 'Interviewing' ? 'bg-purple-50 text-purple-700 ring-purple-700/10' :
                              job.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                                'bg-amber-50 text-amber-700 ring-amber-600/20'
                        }`}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1 text-sm text-slate-500">{job.dateSaved}</div>
                  <div className="col-span-2 flex justify-end gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= job.excitement ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add a New Job</h2>
            <form onSubmit={addJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                <input name="title" required placeholder="e.g. Field Inspector" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <input name="company" required placeholder="e.g. Acme Corp" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input name="location" placeholder="e.g. Remote" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary (Optional)</label>
                  <input name="salary" placeholder="e.g. $60k" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-copper outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-brand-copper text-white hover:bg-brand-copperDark">Save Job</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
