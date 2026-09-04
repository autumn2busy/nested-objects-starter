'use client'

import Link from 'next/link'
import { useState } from 'react'

type Forecast = {
  location?: { name?: string }
  current?: { temperature_2m?: number; wind_speed_10m?: number; relative_humidity_2m?: number }
  daily?: {
    time?: string[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    sunrise?: string[]
    sunset?: string[]
  }
}

export function WeatherWorkspace() {
  const [query, setQuery] = useState('')
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function checkWeather(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const location = query.trim()
    if (!location) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/weather?q=${encodeURIComponent(location)}`, { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Weather service unavailable.')
      setForecast(payload)
    } catch (caught) {
      setForecast(null)
      setError(caught instanceof Error ? caught.message : 'Weather service unavailable.')
    } finally {
      setLoading(false)
    }
  }

  const daily = forecast?.daily
  const days = daily?.time?.slice(0, 3) ?? []

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/tools" className="text-sm font-semibold text-brand-copper hover:text-brand-copperDark">← All tools</Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-copper">Pro, Elite and Agency tool</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Field weather</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Check route conditions, wind, humidity, and daylight before you head into the field.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr,1fr] lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={checkWeather} className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="weather-location">City, state, or postal code</label>
            <input
              id="weather-location"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={120}
              placeholder="City, state, or postal code"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-brand-copper focus:ring-2 focus:ring-brand-copper/20"
            />
            <button disabled={loading || !query.trim()} className="rounded-lg bg-brand-copper px-5 py-3 font-semibold text-white disabled:opacity-50">
              {loading ? 'Checking…' : 'Check forecast'}
            </button>
          </form>

          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

          {forecast?.current && (
            <div className="mt-6 rounded-xl bg-slate-950 p-6 text-white">
              <h2 className="text-xl font-bold">{forecast.location?.name || query}</h2>
              <p className="mt-3 text-4xl font-light">{forecast.current.temperature_2m}°F</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
                <p>Wind: {forecast.current.wind_speed_10m} mph</p>
                <p>Humidity: {forecast.current.relative_humidity_2m}%</p>
              </div>
            </div>
          )}

          {days.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {days.map((day, index) => (
                <article key={day} className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-950">{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</h3>
                  <p className="mt-2 text-sm text-slate-700">High {daily?.temperature_2m_max?.[index]}° · Low {daily?.temperature_2m_min?.[index]}°</p>
                  <p className="mt-2 text-xs text-slate-500">Sunrise {daily?.sunrise?.[index]?.split('T')[1] || '—'}</p>
                  <p className="text-xs text-slate-500">Sunset {daily?.sunset?.[index]?.split('T')[1] || '—'}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Field-use reminder</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Forecasts can change. Check vendor safety rules and official local alerts before ladder, roof, drone, or rural work.
          </p>
        </aside>
      </div>
    </main>
  )
}
