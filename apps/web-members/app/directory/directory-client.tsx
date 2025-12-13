'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const directoryItems = [
  {
    id: 'northwind',
    name: 'Northwind Inspections',
    headline: 'Hybrid property + insurance inspections',
    location: 'Nationwide · HQ in Austin, TX',
    plan: 'Pro',
    category: 'Insurance',
    tools: ['Spectora', 'Adobe Scan'],
    interests: ['Hybrid', 'Rural routes', 'Photo only'],
    verified: true,
    mfa: true,
    completeness: 92,
    saved: true,
  },
  {
    id: 'route-ready',
    name: 'RouteReady Partners',
    headline: 'Vendor marketplace for bank REO',
    location: 'Midwest + Southeast',
    plan: 'Starter',
    category: 'Real estate',
    tools: ['Dropbox', 'Deeplinks'],
    interests: ['REO', 'Drive-by', 'Photo only'],
    verified: false,
    mfa: true,
    completeness: 78,
    saved: false,
  },
  {
    id: 'evergreen',
    name: 'Evergreen Notary Co.',
    headline: 'Mobile notary + signing agent pool',
    location: 'Pacific Northwest',
    plan: 'Elite',
    category: 'Notary',
    tools: ['DocuSign', 'Scanner Pro'],
    interests: ['Signings', 'Mortgage', 'Rural'],
    verified: true,
    mfa: false,
    completeness: 88,
    saved: false,
  },
]

const categories = ['All interests', 'Insurance', 'Real estate', 'Notary', 'Financial', 'Construction']
const plans = ['Any plan', 'Starter', 'Pro', 'Elite', 'Agency']

export function DirectoryClientPage() {
  const { isAuthenticated, user, planUid } = useAuth()
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [planFilter, setPlanFilter] = useState('Any plan')
  const [category, setCategory] = useState('All interests')
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [isSwitching, setIsSwitching] = useState(false)
  const [savedSearch, setSavedSearch] = useState<string | null>('Pro · Insurance · TX')
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false)

  useEffect(() => {
    if (!showSavedConfirmation) return
    const timeout = setTimeout(() => setShowSavedConfirmation(false), 1800)
    return () => clearTimeout(timeout)
  }, [showSavedConfirmation])

  const planName = useMemo(() => {
    switch (planUid) {
      case 'L9nbKV9Z':
        return 'Starter'
      case 'rQVqlLm6':
        return 'Pro'
      case 'NmdnNO90':
        return 'Elite'
      case 'rmk5Xk9g':
        return 'Agency'
      default:
        return 'Member'
    }
  }, [planUid])

  const filtered = useMemo(() => {
    return directoryItems.filter((item) => {
      const matchesSearch =
        !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.headline.toLowerCase().includes(search.toLowerCase())
      const matchesLocation = !location || item.location.toLowerCase().includes(location.toLowerCase())
      const matchesPlan = planFilter === 'Any plan' || item.plan === planFilter
      const matchesCategory = category === 'All interests' || item.category === category
      return matchesSearch && matchesLocation && matchesPlan && matchesCategory
    })
  }, [search, location, planFilter, category])

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Nested Objects Directory',
      itemListElement: filtered.map((item, index) => ({
        '@type': 'Organization',
        position: index + 1,
        name: item.name,
        url: `https://nestedobjects.com/directory/${item.id}`,
        areaServed: item.location,
      })),
    }),
    [filtered],
  )

  const handleToggleView = (next: 'grid' | 'map') => {
    if (next === view) return
    setIsSwitching(true)
    setTimeout(() => {
      setView(next)
      setIsSwitching(false)
    }, 500)
  }

  const activeFilters = [
    search && `Keyword: ${search}`,
    location && `Location: ${location}`,
    planFilter !== 'Any plan' && `Plan: ${planFilter}`,
    category !== 'All interests' && `Interest: ${category}`,
  ].filter(Boolean) as string[]

  return (
    <>
      <Script id="directory-ld-json" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="bg-gradient-to-b from-slate-900 to-slate-950 px-4 pb-10 pt-12 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-100">Directory</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-amber-50">{planName} view</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Greet {user?.email || 'guest'}</span>
              <span className="rounded-full border border-emerald-200/30 bg-emerald-400/10 px-3 py-1">MFA + verified badges</span>
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Discover vetted firms and connect fast.</h1>
            <p className="max-w-3xl text-sm text-slate-200">
              Sticky filters, chip-based active filters, and saved searches make it easy to scan. Authenticated members see richer details
              and upgrade prompts respect plan limits with hosted portal fallbacks.
            </p>
            <div className="flex flex-wrap gap-3" aria-label="Directory quick links">
              <Button variant="primary" className="bg-white text-slate-900 hover:bg-amber-100" asChild>
                <Link href="/profile">Update profile</Link>
              </Button>
              <Button variant="secondary" className="border-white/30 text-white hover:border-white/50" asChild>
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="sticky top-0 z-10 border-b border-white/5 bg-slate-900/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-10" aria-label="Directory filters">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-2 md:items-center lg:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200" htmlFor="search-keyword">
                  Keywords
                </label>
                <Input
                  id="search-keyword"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="firm name, service, tool"
                  aria-label="Search directory"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200" htmlFor="search-location">
                  Location
                </label>
                <Input
                  id="search-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state, or region"
                  aria-label="Location filter"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200" htmlFor="plan-filter">
                  Plan visibility
                </label>
                <Select id="plan-filter" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} aria-label="Plan filter">
                  {plans.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200" htmlFor="category-filter">
                  Interest
                </label>
                <Select id="category-filter" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Interest filter">
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className={cn('text-white hover:bg-white/10', view === 'grid' && 'border border-white/20')}
                onClick={() => handleToggleView('grid')}
                aria-label="Grid view"
              >
                Grid
              </Button>
              <Button
                variant="ghost"
                className={cn('text-white hover:bg-white/10', view === 'map' && 'border border-white/20')}
                onClick={() => handleToggleView('map')}
                aria-label="Map view"
              >
                Map
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-3 flex max-w-6xl flex-wrap items-center gap-2 text-xs text-slate-200" aria-live="polite">
            {activeFilters.length === 0 && <span className="rounded-full bg-white/5 px-3 py-1">No filters applied</span>}
            {activeFilters.map((filter) => (
              <span key={filter} className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                {filter}
              </span>
            ))}
            {activeFilters.length > 0 && (
              <button className="text-amber-100 underline" onClick={() => {
                setSearch('')
                setLocation('')
                setPlanFilter('Any plan')
                setCategory('All interests')
              }}>
                Clear all
              </button>
            )}
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {filtered.length} results
                </span>
                {savedSearch && (
                  <span className="rounded-full border border-emerald-200/30 bg-emerald-500/10 px-3 py-1">Saved: {savedSearch}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  className="bg-white text-slate-900 hover:bg-amber-100"
                  onClick={() => {
                    setSavedSearch(`${planFilter} · ${category} · ${location || 'Any region'}`)
                    setShowSavedConfirmation(true)
                  }}
                  aria-label="Save search"
                >
                  Save search
                </Button>
                {showSavedConfirmation && <span className="text-xs text-emerald-200">Saved — optimistic update</span>}
              </div>
            </div>

            {view === 'map' && (
              <Card className="border-white/10 bg-white/5 p-4">
                {isSwitching ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Skeleton className="h-52 w-full" />
                    <Skeleton className="h-52 w-full" />
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                      <p className="font-semibold text-white">Map preview</p>
                      <p>Lazy-loaded map placeholder. Switch back to grid instantly.</p>
                      <p className="text-xs text-amber-100">Gated details shown when signed in.</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-xs text-slate-200">
                      <p>Selected filters:</p>
                      <p className="mt-2 font-semibold text-white">{activeFilters.join(' · ') || 'None'}</p>
                      <p className="mt-3 text-emerald-200">Inline skeletons while toggling views.</p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              {isSwitching && view === 'grid'
                ? Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-48 w-full rounded-2xl" />)
                : filtered.map((item) => (
                    <Card key={item.id} className="border-white/10 bg-gradient-to-b from-white/5 via-white/0 to-white/5 p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-slate-200">{item.headline}</p>
                        </div>
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-amber-100">
                          {item.plan}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-slate-200">{item.location}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-100">
                        {item.tools.map((tool) => (
                          <span key={tool} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                            {tool}
                          </span>
                        ))}
                        {item.interests.map((interest) => (
                          <span key={interest} className="rounded-full border border-amber-200/30 bg-amber-200/10 px-2.5 py-1 text-amber-50">
                            {interest}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-200">
                        {item.verified && <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2.5 py-1">Verified</span>}
                        {item.mfa ? (
                          <span className="rounded-full border border-sky-300/40 bg-sky-500/10 px-2.5 py-1">MFA enabled</span>
                        ) : (
                          <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2.5 py-1">MFA pending</span>
                        )}
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Profile {item.completeness}%</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="primary" className="bg-white text-slate-900 hover:bg-amber-100" asChild>
                          <Link href={`/directory/${item.id}`}>View profile</Link>
                        </Button>
                        <Button variant="secondary" className="border-white/30 text-white hover:border-white/50" asChild>
                          <Link href={isAuthenticated ? `/directory/${item.id}#message` : '/membership'}>
                            {isAuthenticated ? 'Message' : 'Upgrade to message'}
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
