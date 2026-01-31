'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, MapPin, DollarSign, Calendar, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/components/auth-provider'

type WorkOrder = {
  id: string
  user_id: string
  job_number: string
  property_address: string
  city: string | null
  state: string | null
  zip_code: string | null
  firm_name: string | null
  due_date: string
  status: 'assigned' | 'completed' | 'submitted' | 'paid' | 'cancelled'
  pay_rate: number | null
  notes: string | null
  created_at: string
}

const STATUS_COLORS = {
  assigned: 'bg-blue-50 text-blue-700 ring-blue-700/10',
  submitted: 'bg-purple-50 text-purple-700 ring-purple-700/10',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  paid: 'bg-green-50 text-green-700 ring-green-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
}

export default function JobTrackerPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [jobs, setJobs] = useState<WorkOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newJob, setNewJob] = useState<Partial<WorkOrder>>({
    status: 'assigned',
    due_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (user) {
      fetchJobs()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchJobs = async () => {
    try {
      // We need to use a custom query or strict typing if possible, but for now we trust the schema
      const { data, error } = await supabase
        .from('job_tracker')
        .select('*')
        .order('due_date', { ascending: true })

      if (error) throw error
      setJobs(data as WorkOrder[])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('job_tracker')
        .insert([{
          user_id: user.sub, // Using Outseta ID
          job_number: newJob.job_number,
          property_address: newJob.property_address,
          firm_name: newJob.firm_name,
          due_date: newJob.due_date,
          pay_rate: newJob.pay_rate ? parseFloat(newJob.pay_rate.toString()) : null,
          status: newJob.status,
          notes: newJob.notes
        }])
        .select()

      if (error) throw error

      setJobs([...(data as WorkOrder[]), ...jobs].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()))
      setIsModalOpen(false)
      setNewJob({ status: 'assigned', due_date: new Date().toISOString().split('T')[0] })
    } catch (error) {
      console.error('Error adding job:', error)
      alert('Failed to add job')
    }
  }

  const deleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work order?')) return;
    try {
      const { error } = await supabase.from('job_tracker').delete().eq('id', id)
      if (error) throw error
      setJobs(jobs.filter(j => j.id !== id))
    } catch (error) {
      console.error('Error deleting job:', error)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('job_tracker').update({ status }).eq('id', id)
      if (error) throw error
      setJobs(jobs.map(j => j.id === id ? { ...j, status: status as any } : j))
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // Stats
  const stats = {
    assigned: jobs.filter(j => j.status === 'assigned').length,
    submitted: jobs.filter(j => j.status === 'submitted').length,
    paid: jobs.filter(j => j.status === 'paid').length,
    revenue: jobs.filter(j => j.status === 'paid').reduce((acc, curr) => acc + (curr.pay_rate || 0), 0)
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-8 h-8 text-brand-copper" />
            Work Order Manager
          </h1>
          <Button onClick={() => setIsModalOpen(true)} className="bg-brand-copper hover:bg-brand-copperDark text-white gap-2">
            <Plus className="w-4 h-4" /> New Work Order
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium">Open Orders</div>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium">Submitted</div>
            <div className="text-2xl font-bold text-purple-600">{stats.submitted}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium">Completed (Paid)</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.paid}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium">Total Revenue</div>
            <div className="text-2xl font-bold text-slate-900">${stats.revenue.toFixed(2)}</div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          {jobs.length === 0 && !isLoading ? (
            <div className="p-12 text-center text-slate-500">
              <p>No work orders found. Add one to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobs.map(job => (
                <div key={job.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group">
                  <div className="col-span-4">
                    <div className="font-bold text-slate-900">{job.job_number}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {job.property_address}
                    </div>
                  </div>
                  <div className="col-span-2 text-sm font-medium text-slate-700">
                    {job.firm_name || 'Unknown Firm'}
                  </div>
                  <div className="col-span-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Due: {new Date(job.due_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="col-span-1 font-mono text-sm text-slate-700">
                    ${job.pay_rate?.toFixed(2)}
                  </div>
                  <div className="col-span-2">
                    <select
                      value={job.status}
                      onChange={(e) => updateStatus(job.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${STATUS_COLORS[job.status] || 'bg-slate-100'}`}
                    >
                      <option value="assigned">Assigned</option>
                      <option value="submitted">Submitted</option>
                      <option value="completed">Completed</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => deleteJob(job.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add Work Order</h2>
            <form onSubmit={addJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Number</label>
                <input required className="w-full border rounded-lg px-3 py-2"
                  value={newJob.job_number || ''}
                  onChange={e => setNewJob({ ...newJob, job_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Property Address</label>
                <input required className="w-full border rounded-lg px-3 py-2"
                  value={newJob.property_address || ''}
                  onChange={e => setNewJob({ ...newJob, property_address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Firm</label>
                <input required className="w-full border rounded-lg px-3 py-2"
                  value={newJob.firm_name || ''}
                  onChange={e => setNewJob({ ...newJob, firm_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input type="date" required className="w-full border rounded-lg px-3 py-2"
                    value={newJob.due_date}
                    onChange={e => setNewJob({ ...newJob, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pay Rate ($)</label>
                  <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2"
                    value={newJob.pay_rate || ''}
                    onChange={e => setNewJob({ ...newJob, pay_rate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-brand-copper text-white">Save Order</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
