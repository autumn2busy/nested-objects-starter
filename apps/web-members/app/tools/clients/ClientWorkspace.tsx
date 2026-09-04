'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type ClientRecord = {
  id: string
  name: string
  primary_contact: string | null
  email: string | null
  phone: string | null
  payment_terms: string | null
  website: string | null
  relationship_status: string
}

const EMPTY_FORM = { name: '', primary_contact: '', email: '', phone: '', payment_terms: '', website: '' }

export function ClientWorkspace() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/client-tracker', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not load clients.')
      setClients(payload.clients ?? [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load clients.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadClients() }, [loadClients])

  async function saveClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/client-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not save this client.')
      setClients((current) => [payload.client, ...current])
      setForm(EMPTY_FORM)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this client.')
    } finally {
      setSaving(false)
    }
  }

  async function removeClient(id: string) {
    setError(null)
    const response = await fetch('/api/client-tracker', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error || 'Could not remove this client.')
      return
    }
    setClients((current) => current.filter((client) => client.id !== id))
  }

  function field(name: keyof typeof EMPTY_FORM, label: string, type = 'text') {
    return (
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        <input type={type} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} maxLength={name === 'website' ? 500 : 254} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" />
      </label>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/tools" className="text-sm font-semibold text-brand-copper hover:text-brand-copperDark">← All tools</Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-copper">Paid member tool</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Client and vendor workspace</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">Keep your firm contacts, portal links, and payment terms tied to your member account.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr,1.25fr] lg:px-8">
        <form onSubmit={saveClient} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Add a client or vendor</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Company name<input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={160} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" /></label>
            {field('primary_contact', 'Contact')}
            {field('payment_terms', 'Payment terms')}
            {field('email', 'Email', 'email')}
            {field('phone', 'Phone', 'tel')}
            <div className="sm:col-span-2">{field('website', 'Portal or website', 'url')}</div>
          </div>
          <button disabled={saving} className="mt-5 w-full rounded-lg bg-brand-copper px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save client'}</button>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Your records</h2>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {loading ? <p className="mt-5 text-sm text-slate-500">Loading…</p> : clients.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No clients saved yet.</p> : (
            <ul className="mt-5 space-y-3">
              {clients.map((client) => (
                <li key={client.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="font-bold text-slate-950">{client.name}</h3><p className="mt-1 text-sm text-slate-600">{[client.primary_contact, client.email, client.phone].filter(Boolean).join(' · ') || 'No contact details yet'}</p>{client.payment_terms && <p className="mt-1 text-xs text-slate-500">Pays: {client.payment_terms}</p>}</div>
                    <button type="button" onClick={() => removeClient(client.id)} className="shrink-0 text-sm font-semibold text-red-700">Remove</button>
                  </div>
                  {client.website && <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-brand-copper">Open portal ↗</a>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
