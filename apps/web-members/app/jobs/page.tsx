'use client'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Gate } from '@/components/Gate'

type JobListing = {
  id?: string
  company?: string | null
  job_title?: string | null
  location?: string | null
  pay_salary?: string | null
  posted_date?: string | null
  job_summary?: string | null
  requirements?: string | null
  requirements_qualifications?: string | null
  apply_link?: string | null
  created_at?: string
}

export default function JobsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null
    return createClient(supabaseUrl, supabaseAnonKey)
  }, [supabaseAnonKey, supabaseUrl])

  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [titleQuery, setTitleQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')

  useEffect(() => {
    if (!supabase) {
      setError('Supabase environment variables are missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }

    const fetchJobs = async () => {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(
          'id, company, job_title, location, pay_salary, posted_date, job_summary, requirements, requirements_qualifications, apply_link, created_at'
        )
        .order('posted_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('[JOB_BOARD_SUPABASE_ERROR]', fetchError)
        setError('We could not load jobs right now. Please try again soon.')
        setLoading(false)
        return
      }

      setJobs(data ?? [])
      setLoading(false)
    }

    fetchJobs()
  }, [supabase])

  const filteredJobs = useMemo(() => {
    const normalizedTitle = titleQuery.trim().toLowerCase()
    const normalizedLocation = locationQuery.trim().toLowerCase()

    return jobs.filter((job) => {
      const matchesTitle = normalizedTitle
        ? (job.job_title || '').toLowerCase().includes(normalizedTitle)
        : true
      const matchesLocation = normalizedLocation
        ? (job.location || '').toLowerCase().includes(normalizedLocation)
        : true

      return matchesTitle && matchesLocation
    })
  }, [jobs, locationQuery, titleQuery])

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '2.25rem 2rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1.5rem',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ flex: 1 }}>
          <Link
            href="/dashboard"
            style={{
              fontSize: '0.92rem',
              textDecoration: 'none',
              color: '#4b5563',
              display: 'inline-block',
              marginBottom: '0.6rem',
            }}
          >
            ← Back to dashboard
          </Link>
          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              margin: 0,
              color: '#1f2937',
            }}
          >
            Weekly field inspection job board
          </h1>
          <p
            style={{
              marginTop: '0.35rem',
              fontSize: '1rem',
              color: '#6b7280',
              maxWidth: '720px',
            }}
          >
            Fresh opportunities for mortgage field inspections, occupancy checks, property data collection, and related vendor roles. Styled to mirror the Indeed directory experience for quick scanning.
          </p>
        </div>

        <nav
          style={{
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.95rem',
            flexWrap: 'wrap',
            paddingTop: '0.35rem',
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
        <section
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
            }}
          >
            <label style={{ flex: '1 1 280px' }}>
              <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.35rem' }}>
                Job title
              </div>
              <input
                type="text"
                value={titleQuery}
                onChange={(event) => setTitleQuery(event.target.value)}
                placeholder="e.g. Field inspector, PDC"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.98rem',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                }}
              />
            </label>

            <label style={{ flex: '1 1 220px' }}>
              <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.35rem' }}>
                Location
              </div>
              <input
                type="text"
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder="City, state, or region"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.98rem',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                }}
              />
            </label>
          </div>
        </section>

        <section>
          {loading && (
            <div style={{ padding: '1.5rem', color: '#6b7280' }}>Loading jobs…</div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #fecdd3',
                background: '#fff1f2',
                color: '#b91c1c',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && filteredJobs.length === 0 && (
            <div
              style={{
                padding: '1.5rem',
                border: '1px dashed #d1d5db',
                borderRadius: '12px',
                color: '#6b7280',
              }}
            >
              No jobs found with the current filters.
            </div>
          )}

          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredJobs.map((job) => {
              const requirementsText = job.requirements || job.requirements_qualifications
              return (
                <article
                  key={job.id || `${job.company}-${job.job_title}-${job.location}`}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.15rem 1.25rem',
                    background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '0.15rem' }}>
                        {job.company || 'Unknown company'}
                      </div>
                      <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
                        {job.job_title || 'Untitled role'}
                      </h2>
                      <div style={{ fontSize: '0.97rem', color: '#4b5563' }}>{job.location || 'Remote/various'}</div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '160px' }}>
                      <div
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: '#065f46',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {job.pay_salary || 'Pay not listed'}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Posted {formatDate(job.posted_date)}</div>
                    </div>
                  </div>

                  {job.job_summary && (
                    <p style={{ margin: '0.35rem 0 0.25rem', color: '#374151', lineHeight: 1.5 }}>
                      {job.job_summary}
                    </p>
                  )}

                  {requirementsText && (
                    <div style={{ fontSize: '0.93rem', color: '#4b5563' }}>
                      <strong style={{ color: '#111827' }}>Requirements:</strong> {requirementsText}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.5rem',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', color: '#6b7280', fontSize: '0.92rem' }}>
                      <span style={{ padding: '0.3rem 0.55rem', background: '#eef2ff', color: '#4338ca', borderRadius: '999px' }}>
                        Field work
                      </span>
                      <span style={{ padding: '0.3rem 0.55rem', background: '#ecfeff', color: '#0e7490', borderRadius: '999px' }}>
                        New this week
                      </span>
                    </div>

                    {job.apply_link ? (
                      <a
                        href={job.apply_link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#2563eb',
                          color: '#fff',
                          padding: '0.65rem 1rem',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        View / apply
                      </a>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.92rem' }}>No apply link provided</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </Gate>
    </main>
  )
}
