'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type ResearchStatus = 'not_started' | 'contacted' | 'registered' | 'active' | 'archived'
type Company = { id: string; company_name: string; website: string | null; research_status: ResearchStatus; notes: string | null }

const STATUS_LABELS: Record<ResearchStatus, string> = {
  not_started: 'Not started', contacted: 'Contacted', registered: 'Registered', active: 'Active', archived: 'Archived',
}

export function CompanyTracker() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/company-tracker', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not load companies.')
      setCompanies(payload.companies ?? [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load companies.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadCompanies() }, [loadCompanies])

  async function addCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/company-tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_name: name, website, notes }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not save this company.')
      if (!payload.alreadyTracked && payload.company) setCompanies((current) => [payload.company, ...current])
      setName(''); setWebsite(''); setNotes('')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save this company.') }
    finally { setSaving(false) }
  }

  async function updateStatus(id: string, research_status: ResearchStatus) {
    const response = await fetch('/api/company-tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, research_status }) })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) { setError(payload.error || 'Could not update this company.'); return }
    setCompanies((current) => current.map((company) => company.id === id ? payload.company : company))
  }

  async function removeCompany(id: string) {
    const response = await fetch('/api/company-tracker', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) { setError(payload.error || 'Could not remove this company.'); return }
    setCompanies((current) => current.filter((company) => company.id !== id))
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/tools" className="text-sm font-semibold text-brand-copper hover:text-brand-copperDark">← All tools</Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-copper">Paid member tool</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Company tracker</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">Keep your target-firm list and application progress tied to your member account.</p>
      </div></section>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr,1.25fr] lg:px-8">
        <form onSubmit={addCompany} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Add a target firm</h2>
          <label className="mt-4 block text-sm font-semibold text-slate-700">Company name<input required value={name} onChange={(event) => setName(event.target.value)} maxLength={160} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">Website<input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} maxLength={500} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>
          <button disabled={saving} className="mt-5 w-full rounded-lg bg-brand-copper px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Track company'}</button>
        </form>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Your target list</h2>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {loading ? <p className="mt-5 text-sm text-slate-500">Loading…</p> : companies.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No target firms saved yet.</p> : (
            <ul className="mt-5 space-y-3">{companies.map((company) => <li key={company.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-bold text-slate-950">{company.company_name}</h3>{company.notes && <p className="mt-1 text-sm text-slate-600">{company.notes}</p>}</div><button type="button" onClick={() => removeCompany(company.id)} className="shrink-0 text-sm font-semibold text-red-700">Remove</button></div>
              <div className="mt-3 flex flex-wrap items-center gap-3"><label className="text-xs font-semibold text-slate-600">Status <select value={company.research_status} onChange={(event) => updateStatus(company.id, event.target.value as ResearchStatus)} className="ml-1 rounded border border-slate-300 px-2 py-1 text-sm">{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{company.website && <a href={company.website} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-copper">Open website ↗</a>}</div>
            </li>)}</ul>
          )}
        </section>
      </div>
    </main>
  )
}
