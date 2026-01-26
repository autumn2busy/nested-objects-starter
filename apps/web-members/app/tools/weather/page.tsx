'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Gate } from '@/components/Gate'
import { ToolAccessMessage, UpgradeActions } from '../_components/ToolAccessMessage'
import { ToolLayout } from '../_components/ToolLayout'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/directory', label: 'Directory' },
  { href: '/membership', label: 'Membership' },
]

const highlights = [
  {
    title: 'Route-aware forecasts',
    description: 'Check weather by city, zip, or coordinates to plan drive time and on-site work.',
  },
  {
    title: 'Safety signals',
    description: 'Flag days that are risky for roof shots, ladders, or long rural drives.',
  },
  {
    title: 'Daylight planning',
    description: 'Track sunrise, sunset, and golden hour so photos and drone shots stay sharp.',
  },
  {
    title: 'Routing handoff',
    description: 'Reorder stops around storms once the routing tool is live.',
  },
]

export default function WeatherToolPage() {
  return (
    <ToolLayout
      title="Field inspection weather tool"
      description="Check weather along your routes so you can plan drive time, ladder work, and photo quality."
      navLinks={navLinks}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {highlights.map((item) => (
          <div key={item.title} className="rounded-2xl border border-brand-copper/25 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-dark">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{item.description}</p>
          </div>
        ))}
      </div>

      <Gate
        feature="weather_tool"
        loadingFallback={<ToolAccessMessage title="Loading access" description="Checking your account..." loading />}
        fallback={
          <ToolAccessMessage
            title="Authentication required"
            description="Log in or upgrade to preview route-aware weather and safety guidance."
            tone="warning"
            actions={<UpgradeActions />}
          />
        }
      >
        <WeatherWorkspace />
      </Gate>
    </ToolLayout>
  )
}

function WeatherWorkspace() {
  const [query, setQuery] = useState('')
  const [weather, setWeather] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/weather?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Location not found')
      const data = await res.json()
      setWeather(data)
    } catch (err) {
      setError('Could not find location. Try a Zip code or City, State.')
    } finally {
      setLoading(false)
    }
  }

  // Simple CSS-based icon
  const WeatherIcon = ({ code }: { code: number }) => {
    // 0=Clear, 1-3=Cloud, 50-60s=Rain, 70s=Snow, 90s=Storm
    if (code === 0) return <div className="h-12 w-12 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse" />
    if (code <= 3) return <div className="h-12 w-12 rounded-full bg-slate-400 shadow-sm" />
    if (code >= 95) return <div className="h-12 w-12 rounded-full bg-purple-600 animate-ping opacity-75" />
    return <div className="h-12 w-12 rounded-full bg-blue-400 opacity-80" />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
      <section className="space-y-6 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Live Forecast</p>
            <h3 className="text-xl font-semibold text-brand-dark">Check route conditions</h3>
          </div>
          <span className="rounded-full bg-emerald-100/50 px-2 py-1 text-[10px] font-medium text-emerald-800 border border-emerald-200">
            Cached (30m)
          </span>
        </header>

        <form onSubmit={fetchWeather} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter City or Zip (e.g. 75201)"
            className="flex-1 rounded-lg border border-brand-steel/40 px-4 py-2 focus:border-brand-copper focus:outline-none"
          />
          <button
            type="button"
            className="rounded-lg bg-brand-copper px-6 py-2 font-semibold text-white transition hover:bg-brand-copperDark disabled:opacity-50"
            disabled={loading}
            onClick={() => fetchWeather()}
          >
            {loading ? 'Checking...' : 'Check'}
          </button>
        </form>

        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

        {weather && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between rounded-xl bg-brand-mist/30 p-6 border border-brand-steel/10">
              <div>
                <h4 className="text-2xl font-bold text-brand-dark">{weather.location?.name}</h4>
                <p className="text-4xl font-light text-slate-700 mt-2">{weather.current?.temperature_2m}°F</p>
                <div className="flex gap-4 mt-2 text-sm text-slate-500">
                  <span>Wind: {weather.current?.wind_speed_10m} mph</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <WeatherIcon code={weather.current?.weather_code} />
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Current</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {weather.daily?.time?.slice(0, 3).map((day: string, i: number) => (
                <div key={day} className="rounded-lg border border-brand-steel/20 p-3 text-center bg-white/50">
                  <p className="text-xs text-slate-500 mb-1">{new Date(day).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                  <p className="font-semibold text-brand-dark">{weather.daily.temperature_2m_max[i]}°</p>
                  <p className="text-xs text-slate-400">{weather.daily.temperature_2m_min[i]}°</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!weather && !loading && (
          <div className="rounded-xl border border-dashed border-brand-steel/40 p-8 text-center text-slate-500">
            Enter a location to see the minimal-token weather summary.
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm h-fit">
        <h3 className="text-lg font-semibold text-brand-dark">Data to gather now</h3>
        <div className="space-y-3 text-sm text-slate-700">
          <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
            Typical ladder heights and when you pivot to drone photos based on wind speed.
          </p>
          <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
            Cities or counties where you need daylight-only photos versus interior shots that can flex.
          </p>
          <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
            Safety thresholds from your vendors so alerts can match their rules.
          </p>
        </div>
        <Link
          href="/tools"
          className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
        >
          Explore other tools
        </Link>
      </section>
    </div>
  )
}
