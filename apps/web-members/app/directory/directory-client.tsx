'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import Script from 'next/script'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldHelperText, FieldLabel, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const directoryItems = [
  {
    id: '1',
    name: 'Alex Martin',
    headline: 'Hybrid inspector & UAV pilot',
    location: 'Austin, TX',
    plan: 'Pro',
    services: ['Inspections', 'Roof imaging'],
    tools: ['Matterport', 'DJI Mini 4'],
    completeness: 92,
    verified: true,
    mfa: true,
  },
  {
    id: '2',
    name: 'Beacon Field Ops',
    headline: 'National vendor network',
    location: 'Remote / Nationwide',
    plan: 'Elite',
    services: ['Vendor management', 'Training'],
    tools: ['Salesforce', 'Slack'],
    completeness: 88,
    verified: true,
    mfa: false,
  },
  {
    id: '3',
    name: 'Taylor Brooks',
    headline: 'Mobile notary & REO specialist',
    location: 'Phoenix, AZ',
    plan: 'Starter',
    services: ['Notary', 'Property photos'],
    tools: ['Snapdocs'],
    completeness: 76,
    verified: false,
    mfa: true,
  },
]

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListOrder: 'https://schema.org/ItemListUnordered',
  name: 'Nested Objects directory',
  itemListElement: directoryItems.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `https://nestedobjects.com/directory#member-${item.id}`,
    name: item.name,
  })),
}

const planFilters = ['All plans', 'Starter', 'Pro', 'Elite']

export default function DirectoryClient() {
  const { profileDisplayName, planUid } = useAuth()
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('All plans')
  const [layout, setLayout] = useState<'grid' | 'map'>('grid')
  const [isSavingSearch, startTransition] = useTransition()

  const filtered = useMemo(() => {
    return directoryItems.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.services.some((s) => s.toLowerCase().includes(search.toLowerCase()))

      const matchesPlan = planFilter === 'All plans' || item.plan === planFilter

      return matchesSearch && matchesPlan
    })
  }, [planFilter, search])

  const handleSaveSearch = () => {
    startTransition(() => {})
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <Script
        id="directory-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Directory</p>
            <h1 className="text-2xl font-semibold">Discover peers and partners</h1>
            <p className="text-sm text-slate-300">
              Welcome {profileDisplayName || 'guest'}. Plan badge: {planUid || 'Starter'}.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setLayout('grid')} active={layout === 'grid'}>
              Grid
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setLayout('map')} active={layout === 'map'}>
              Map preview
            </Button>
          </div>
        </div>
      </div>

      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="border-white/10 bg-white/5 p-5 shadow-lg">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div className="space-y-3">
                <FieldLabel htmlFor="directory-search">Search</FieldLabel>
                <Input
                  id="directory-search"
                  placeholder="Search by keyword, service, or tool"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Directory search"
                />
                <FieldHelperText className="text-slate-200">
                  Debounced searches trigger analytics events: directory_search.
                </FieldHelperText>
              </div>
              <div className="space-y-3">
                <FieldLabel htmlFor="plan-filter">Plan</FieldLabel>
                <Select
                  id="plan-filter"
                  aria-label="Filter by plan"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                >
                  {planFilters.map((plan) => (
                    <option key={plan}>{plan}</option>
                  ))}
                </Select>
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={() => setPlanFilter('All plans')}>
                    Clear
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleSaveSearch} disabled={isSavingSearch}>
                    {isSavingSearch ? 'Saving...' : 'Save search'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200" aria-label="Active filters">
              {planFilter !== 'All plans' && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  {planFilter}
                  <button
                    className="text-amber-200"
                    onClick={() => setPlanFilter('All plans')}
                    aria-label="Remove plan filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  {search}
                  <button className="text-amber-200" onClick={() => setSearch('')} aria-label="Clear search">
                    ×
                  </button>
                </span>
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="border-b border-white/5 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          {layout === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <Card
                  key={item.id}
                  id={`member-${item.id}`}
                  className="flex flex-col border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-emerald-200">
                      {item.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm uppercase text-emerald-200">{item.plan} plan</p>
                      <h2 className="text-lg font-semibold text-white">{item.name}</h2>
                      <p className="text-sm text-slate-200">{item.headline}</p>
                      <p className="text-xs text-slate-300">{item.location}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
                    {item.services.map((service) => (
                      <span key={service} className="rounded-full bg-white/10 px-3 py-1">
                        {service}
                      </span>
                    ))}
                    {item.tools.map((tool) => (
                      <span key={tool} className="rounded-full bg-white/5 px-3 py-1 text-amber-200">
                        {tool}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-200">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                      Completeness {item.completeness}%
                    </span>
                    <div className="flex items-center gap-2">
                      {item.verified && <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-100">Verified</span>}
                      {item.mfa && <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-cyan-100">MFA</span>}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button asChild fullWidth>
                      <Link href={`/profile/${item.id}`}>View profile</Link>
                    </Button>
                    <Button variant="secondary" asChild fullWidth>
                      <Link href={`/dashboard?message=${item.id}`}>Message</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-white/10 bg-white/5 p-6">
              <p className="text-sm text-slate-200">Switching to map preview...</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-32 rounded-xl bg-white/10" />
                <Skeleton className="h-32 rounded-xl bg-white/10" />
              </div>
              <FieldHelperText className="mt-3 text-slate-200">
                Map view lazy-loads to keep performance high. Hosted-portal fallback is available if embeds fail.
              </FieldHelperText>
            </Card>
          )}

          {filtered.length === 0 && (
            <Card className="mt-6 border-dashed border-white/20 bg-transparent p-6 text-center text-slate-200">
              <p>No matches yet. Try clearing filters or upgrade for full visibility.</p>
              <Button className="mt-3" asChild>
                <Link href="/membership">View plans</Link>
              </Button>
            </Card>
          )}
        </div>
      </section>
    </main>
  )
}
