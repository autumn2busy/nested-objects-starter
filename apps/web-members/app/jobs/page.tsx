'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Gate } from '@/components/Gate'

interface JobBoardEntry {
  id: string
  title: string
  company: string
  location: string
  pay: string
  description: string
  link: string
}

const jobBoard: JobBoardEntry[] = [
  {
    id: 'atl-inspection-241',
    title: 'Residential property inspector',
    company: 'Peachtree Field Services',
    location: 'Atlanta, GA (local travel)',
    pay: '$240 per completed inspection',
    description:
      'Route-based inspections focused on photos, occupancy checks, and short reports. Expect 6–10 stops per day.',
    link: 'https://example.com/jobs/atl-inspection-241',
  },
  {
    id: 'remote-data-118',
    title: 'Remote property data collector',
    company: 'Seaboard Analytics',
    location: 'Remote (US-based)',
    pay: '$30/hr contract',
    description: 'Desk research to validate addresses, call occupants, and schedule follow-up photos with field partners.',
    link: 'https://example.com/jobs/remote-data-118',
  },
  {
    id: 'reo-bpo-019',
    title: 'BPO/REO photographer',
    company: 'Riverview Valuations',
    location: 'Charlotte, NC and surrounding counties',
    pay: '$275 per property (rush bonus available)',
    description: 'Photo-heavy assignments with strict shot lists. Weekend availability preferred; mileage reimbursed above 50 miles.',
    link: 'https://example.com/jobs/reo-bpo-019',
  },
]

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
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
      {/* Header with back link and nav */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <Link
            href="/dashboard"
            style={{
              fontSize: '0.9rem',
              textDecoration: 'none',
              color: '#4b5563',
              display: 'inline-block',
              marginBottom: '0.5rem',
            }}
          >
            ← Back to dashboard
          </Link>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Weekly field inspection job board
          </h1>
          <p
            style={{
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              color: '#6b7280',
            }}
          >
            Fresh opportunities for mortgage field inspections, occupancy checks, and property data collection.
          </p>
        </div>

        <nav
          style={{
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.9rem',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', color: '#111827' }}>
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

          {jobBoard.map((job) => (
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
