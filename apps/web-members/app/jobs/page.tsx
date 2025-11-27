'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

import { Gate } from '@/components/Gate'

type JobRow = {
  id: string
  company: string | null
  job_title: string | null
  location: string | null
  pay_salary: string | null
  posted_date: string | null
  job_summary: string | null
  requirements_qualifications: string | null
  apply_link: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [titleFilter, setTitleFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  useEffect(() => {
    const loadJobs = async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        setError('Supabase environment variables are missing.')
        setIsLoading(false)
        return
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data, error: queryError } = await supabase
        .from('jobs')
        .select(
          'id, company, job_title, location, pay_salary, posted_date, job_summary, requirements_qualifications, apply_link'
        )
        .order('posted_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200)

      if (queryError) {
        console.error('Failed to load jobs', queryError)
        setError('Could not load jobs right now. Please try again later.')
        setIsLoading(false)
        return
      }

      setJobs(data ?? [])
      setIsLoading(false)
    }

    loadJobs()
  }, [])

  const filteredJobs = useMemo(() => {
    const titleTerm = titleFilter.trim().toLowerCase()
    const locationTerm = locationFilter.trim().toLowerCase()

    return jobs.filter((job) => {
      const matchesTitle = titleTerm
        ? (job.job_title || '').toLowerCase().includes(titleTerm) || (job.company || '').toLowerCase().includes(titleTerm)
        : true

      const matchesLocation = locationTerm
        ? (job.location || '').toLowerCase().includes(locationTerm)
        : true

      return matchesTitle && matchesLocation
    })
  }, [jobs, titleFilter, locationFilter])

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
          <Link href="/dashboard" className="hover:text-brand-copper">
            Dashboard
          </Link>
          <Link href="/directory" className="hover:text-brand-copper">
            Directory
          </Link>
          <Link href="/membership" className="hover:text-brand-copper">
            Membership
          </Link>
        </nav>
      </header>

      <Gate feature="job_board">
        <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1 md:w-1/2">
              <label className="text-[11px] font-semibold tracking-[0.22em] text-brand-slate" htmlFor="title-filter">
                JOB TITLE OR COMPANY
              </label>
              <input
                id="title-filter"
                type="text"
                value={titleFilter}
                onChange={(event) => setTitleFilter(event.target.value)}
                placeholder="Mortgage inspections, occupancy, BPO, notary…"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-inner outline-none transition focus:border-brand-copper focus:ring-2 focus:ring-brand-copper/20"
              />
            </div>

            <div className="space-y-1 md:w-1/2">
              <label className="text-[11px] font-semibold tracking-[0.22em] text-brand-slate" htmlFor="location-filter">
                LOCATION
              </label>
              <input
                id="location-filter"
                type="text"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
                placeholder="City, state, or region"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-inner outline-none transition focus:border-brand-copper focus:ring-2 focus:ring-brand-copper/20"
              />
            </div>
          </div>

          <div className="space-y-3 pt-5 text-sm text-brand-slate">
            <p className="text-brand-dark">
              Showing {filteredJobs.length} job{filteredJobs.length === 1 ? '' : 's'} from Supabase.
            </p>
            {error && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                {error}
              </div>
            )}
            {isLoading ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-brand-dark">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-copper border-t-transparent" aria-hidden />
                Loading the latest inspection leads…
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-brand-dark">
                <p className="font-semibold">No matches yet.</p>
                <p className="text-sm text-brand-slate">Try adjusting your title or location filters.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {filteredJobs.map((job) => (
                  <li
                    key={job.id}
                    className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_6px_32px_-20px_rgba(0,0,0,0.35)] transition hover:border-brand-copper/70 hover:shadow-[0_18px_42px_-28px_rgba(231,122,61,0.55)]"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">
                          {job.company || 'Untitled vendor'}
                        </p>
                        <h2 className="text-xl font-semibold text-brand-dark">{job.job_title || 'Open role'}</h2>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate">
                        {job.location && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-brand-dark">{job.location}</span>
                        )}
                        {job.pay_salary && (
                          <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-brand-copper">{job.pay_salary}</span>
                        )}
                        {job.posted_date && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-brand-dark">
                            Posted {job.posted_date}
                          </span>
                        )}
                      </div>
                    </div>

                    {job.job_summary && <p className="mt-3 text-sm text-brand-dark">{job.job_summary}</p>}

                    {job.requirements_qualifications && (
                      <p className="mt-2 text-sm text-brand-slate">
                        <span className="font-semibold text-brand-dark">Requirements:</span> {job.requirements_qualifications}
                      </p>
                    )}

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-brand-slate">
                        {job.location ? 'Onsite/territory specific' : 'Remote or varied locations'} · Updated weekly
                      </div>
                      {job.apply_link ? (
                        <a
                          href={job.apply_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
                        >
                          View / apply
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-brand-slate">No application link provided</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </Gate>
    </main>
  )
}
