'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Gate } from '@/components/Gate'
import { jobBoardEntries, type JobBoardEntry } from '@/lib/ai-datasets'

export default function JobsPage() {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const saveJobToTracker = async (job: JobBoardEntry) => {
    try {
      setSavingId(job.id)
      setMessage(null)

      const res = await fetch('/api/member-jobs', {
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

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(payload?.error || 'Unable to save job to tracker')
      }

      setMessage(`Saved “${job.title}” to your tracker.`)
    } catch (error: any) {
      console.error(error)
      setMessage(error?.message || 'Could not save this job right now.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 md:px-8 lg:py-12">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Link href="/dashboard" className="text-sm font-semibold text-brand-dark hover:text-brand-copper">
            ← Back to dashboard
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-copper">Directory style</p>
            <h1 className="text-3xl font-semibold text-brand-dark md:text-[32px]">Weekly field inspection jobs</h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-slate">
              Fresh vendor opportunities inspired by Indeed’s clean directory layout. Filter by title or location, scan the pay,
              and click through to apply directly.
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-3 text-sm font-semibold text-brand-dark">
          <Link href="/" className="hover:text-brand-copper">
            Home
          </Link>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: '#111827' }}>
            Dashboard
          </Link>
          <Link href="/directory" style={{ textDecoration: 'none', color: '#111827' }}>
            Directory
          </Link>
          <Link href="/membership" style={{ textDecoration: 'none', color: '#111827' }}>
            Membership
          </Link>
        </nav>
      </header>

      <Gate feature="job_board">
        <section style={{ display: 'grid', gap: '1rem' }}>
          {message && (
            <div
              style={{
                border: '1px solid #f3d9d0',
                background: '#fdf5f3',
                color: '#9a3412',
                padding: '0.75rem 1rem',
                borderRadius: 4,
                fontSize: '0.9rem',
              }}
            >
              {message}
            </div>
          )}

          {jobBoardEntries.map((job) => (
            <article
              key={job.id}
              style={{
                border: '1px solid #e5e7eb',
                padding: '1.25rem',
                background: 'white',
                borderRadius: 8,
                boxShadow: '0 10px 20px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>{job.title}</h2>
                  <p style={{ margin: '0.2rem 0', color: '#4b5563' }}>
                    {job.company} • {job.location}
                  </p>
                </div>
                <div style={{ textAlign: 'right', color: '#b45309', fontWeight: 700 }}>{job.pay}</div>
              </div>
              <p style={{ marginTop: '0.5rem', color: '#374151', lineHeight: 1.5 }}>{job.description}</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <Link
                  href={job.link}
                  target="_blank"
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #f97316',
                    color: '#c2410c',
                    textDecoration: 'none',
                    fontWeight: 600,
                    borderRadius: 6,
                  }}
                >
                  View posting
                </Link>
                <button
                  type="button"
                  onClick={() => void saveJobToTracker(job)}
                  disabled={savingId === job.id}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #9ca3af',
                    color: '#111827',
                    background: savingId === job.id ? '#e5e7eb' : '#f9fafb',
                    fontWeight: 700,
                    borderRadius: 6,
                    cursor: savingId === job.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingId === job.id ? 'Saving…' : 'Save/Track'}
                </button>
              </div>
            </article>
          ))}
        </section>
      </Gate>
    </main>
  )
}
