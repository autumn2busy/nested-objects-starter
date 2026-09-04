'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type Stop = { id: number; label: string; address: string }

export function RoutePlanner() {
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [stops, setStops] = useState<Stop[]>([])
  const [nextId, setNextId] = useState(1)

  const mapsUrl = useMemo(() => {
    if (stops.length === 0) return null
    const encoded = stops.map((stop) => encodeURIComponent(stop.address))
    if (encoded.length === 1) return `https://www.google.com/maps/search/?api=1&query=${encoded[0]}`
    const origin = encoded[0]
    const destination = encoded[encoded.length - 1]
    const waypoints = encoded.slice(1, -1).join('|')
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`
  }, [stops])

  function addStop(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanAddress = address.trim()
    if (!cleanAddress) return
    setStops((current) => [...current, { id: nextId, label: label.trim() || `Stop ${current.length + 1}`, address: cleanAddress }])
    setNextId((current) => current + 1)
    setLabel('')
    setAddress('')
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= stops.length) return
    setStops((current) => {
      const reordered = [...current]
      ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
      return reordered
    })
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/tools" className="text-sm font-semibold text-brand-copper hover:text-brand-copperDark">← All tools</Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-copper">Pro, Elite and Agency tool</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Route planner</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Build an ordered stop list, adjust it as assignments change, and open the finished route in Google Maps.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr,1.3fr] lg:px-8">
        <form onSubmit={addStop} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Add a stop</h2>
          <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="stop-label">Label or firm</label>
          <input id="stop-label" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={100} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Optional" />
          <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="stop-address">Address</label>
          <input id="stop-address" required value={address} onChange={(event) => setAddress(event.target.value)} maxLength={220} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Street, city, state" />
          <button className="mt-5 w-full rounded-lg bg-brand-copper px-4 py-3 font-semibold text-white">Add stop</button>
          <p className="mt-4 text-xs leading-5 text-slate-500">The planner does not intentionally save or submit stops. Normal site analytics may record the page visit. Opening the route sends the listed addresses to Google Maps.</p>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Route order</h2>
              <p className="text-sm text-slate-500">{stops.length} {stops.length === 1 ? 'stop' : 'stops'}</p>
            </div>
            {stops.length > 0 && <button type="button" onClick={() => setStops([])} className="text-sm font-semibold text-red-700">Clear route</button>}
          </div>

          {stops.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Add your first stop to begin.</p>
          ) : (
            <ol className="mt-5 space-y-3">
              {stops.map((stop, index) => (
                <li key={stop.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-950">{stop.label}</p>
                    <p className="mt-1 break-words text-sm text-slate-600">{stop.address}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" aria-label={`Move ${stop.label} up`} disabled={index === 0} onClick={() => move(index, -1)} className="rounded border px-2 py-1 disabled:opacity-30">↑</button>
                    <button type="button" aria-label={`Move ${stop.label} down`} disabled={index === stops.length - 1} onClick={() => move(index, 1)} className="rounded border px-2 py-1 disabled:opacity-30">↓</button>
                    <button type="button" aria-label={`Remove ${stop.label}`} onClick={() => setStops((current) => current.filter((item) => item.id !== stop.id))} className="rounded border px-2 py-1 text-red-700">×</button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500">
              Open route in Google Maps
            </a>
          )}
        </section>
      </div>
    </main>
  )
}
