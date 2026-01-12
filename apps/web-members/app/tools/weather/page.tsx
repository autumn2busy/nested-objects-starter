'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gate } from '@/components/Gate'
import { ToolAccessMessage, UpgradeActions } from '../_components/ToolAccessMessage'
import { ToolLayout } from '../_components/ToolLayout'
import { Search, MapPin, Wind, Droplets, Sun, Moon, AlertTriangle } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tools', label: 'Tools' },
  { href: '/membership', label: 'Membership' },
]

type ForecastDay = {
  date: string
  tempMax: number
  tempMin: number
  precipitationSum: number
  windSpeedMax: number
  weatherCode: number
  sunrise: string
  sunset: string
}

type SafetyWarning = {
  type: 'wind' | 'rain' | 'lightning'
  severity: 'low' | 'medium' | 'high'
  message: string
}

type WeatherData = {
  location: string
  latitude: number
  longitude: number
  timezone: string
  forecast: ForecastDay[]
  safetyWarnings: SafetyWarning[]
}

function getWeatherEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 86) return '🌦️'
  if (code >= 95) return '⛈️'
  return '🌤️'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(isoTime: string): string {
  return new Date(isoTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function WeatherToolPage() {
  const [location, setLocation] = useState('')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!location.trim()) return

    setLoading(true)
    setError(null)

    try {
      // First, geocode the location using free Nominatim API
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
      const geocodeRes = await fetch(geocodeUrl, {
        headers: { 'User-Agent': 'NestedObjectsWeatherTool/1.0' }
      })

      if (!geocodeRes.ok) {
        throw new Error('Failed to find location')
      }

      const geocodeData = await geocodeRes.json()
      if (!geocodeData || geocodeData.length === 0) {
        throw new Error('Location not found. Try a more specific address.')
      }

      const { lat, lon, display_name } = geocodeData[0]

      // Fetch weather data from our API (which uses caching)
      const weatherRes = await fetch(
        `/api/weather?lat=${lat}&lon=${lon}&location=${encodeURIComponent(display_name)}`
      )

      if (!weatherRes.ok) {
        throw new Error('Failed to fetch weather data')
      }

      const weather: WeatherData = await weatherRes.json()
      setWeatherData(weather)
    } catch (err) {
      console.error('Weather search error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch weather')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolLayout
      title="Weather planning for field inspectors"
      description="Check forecasts, wind speeds, and daylight hours along your routes so you can plan safer, more efficient days."
      navLinks={navLinks}
    >
      <Gate
        feature="weather_tool"
        loadingFallback={<ToolAccessMessage title="Loading access" description="Checking your account..." loading />}
        fallback={
          <ToolAccessMessage
            title="Authentication required"
            description="Log in to access weather planning for your routes."
            tone="warning"
            actions={<UpgradeActions />}
          />
        }
      >
        <div className="space-y-6">
          {/* Search Section */}
          <section className="rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-brand-dark">
                  Location
                </label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="City, zip code, or address"
                    className="w-full rounded-lg border border-brand-steel/40 bg-white py-2 pl-10 pr-4 focus:border-brand-copper focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !location.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-copper px-6 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-copperDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Searching...' : 'Get Forecast'}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}
          </section>

          {/* Safety Warnings */}
          {weatherData && weatherData.safetyWarnings.length > 0 && (
            <section className="space-y-3">
              {weatherData.safetyWarnings.map((warning, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${warning.severity === 'high'
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : warning.severity === 'medium'
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-blue-300 bg-blue-50 text-blue-900'
                    }`}
                >
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{warning.message}</p>
                </div>
              ))}
            </section>
          )}

          {/* Forecast Grid */}
          {weatherData && (
            <section className="rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-brand-dark">7-Day Forecast</h3>
                  <p className="text-sm text-slate-600">{weatherData.location}</p>
                </div>
                <span className="rounded-full bg-brand-mist px-3 py-1 text-xs font-semibold text-brand-copper">
                  {weatherData.timezone}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {weatherData.forecast.map((day, idx) => (
                  <div
                    key={day.date}
                    className="rounded-xl border border-brand-steel/30 bg-brand-mist/30 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-dark">
                        {formatDate(day.date)}
                      </span>
                      <span className="text-2xl">{getWeatherEmoji(day.weatherCode)}</span>
                    </div>

                    <div className="mb-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-brand-dark">{day.tempMax}°</span>
                      <span className="text-sm text-slate-600">{day.tempMin}°</span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <Wind className="h-3.5 w-3.5 text-slate-500" />
                        <span>Wind: {Math.round(day.windSpeedMax)} mph</span>
                      </div>
                      {day.precipitationSum > 0 && (
                        <div className="flex items-center gap-2">
                          <Droplets className="h-3.5 w-3.5 text-slate-500" />
                          <span>Rain: {day.precipitationSum.toFixed(1)}"</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Sun className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatTime(day.sunrise)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Moon className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatTime(day.sunset)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!weatherData && !loading && !error && (
            <div className="rounded-2xl border border-dashed border-brand-steel/40 bg-brand-mist/30 p-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-brand-steel/60" />
              <h3 className="mt-4 text-lg font-semibold text-brand-dark">No location selected</h3>
              <p className="mt-2 text-sm text-slate-600">
                Enter a city, zip code, or address above to see the 7-day forecast with safety insights.
              </p>
            </div>
          )}
        </div>
      </Gate>
    </ToolLayout>
  )
}
