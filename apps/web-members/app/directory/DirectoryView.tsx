'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useAuth } from '@/components/auth-provider'
import { Card } from '@/components/ui/card'
import { FieldHelperText, FieldLabel, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { StarRating } from '@/components/ui/StarRating'
import { US_STATES } from './constants'

export type Firm = {
    id: string
    slug: string | null
    name: string
    url: string | null
    vendor_page_url: string | null
    logo_url: string | null
    geographic_coverage: string | null
    categories: any
    pay_min: number | null
    pay_max: number | null
    pay_type: string | null
    company_size: string | null
    industry_focus: string | null
    is_published?: boolean | null
    rating: number | null
    rating_count?: number | null
    verified_at?: string | null
    phone: string | null
    email: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
}

type FilterBarProps = {
    stateFilter: string
    search: string
    isStarter: boolean
    isAuthenticated: boolean
    onStateChange: (value: string) => void
    onSearchChange: (value: string) => void
}

function FilterBar({
    stateFilter,
    search,
    isStarter,
    isAuthenticated,
    onSearchChange,
    onStateChange,
}: FilterBarProps) {
    return (
        <Card className="mb-6 border-border-subtle px-5 py-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-end">
                <div className="space-y-1">
                    <FieldLabel htmlFor="state-filter">SERVICE AREA</FieldLabel>
                    <Select
                        id="state-filter"
                        value={stateFilter}
                        onChange={(e) => onStateChange(e.target.value)}
                    >
                        {US_STATES.map((s) => (
                            <option key={s.code} value={s.code}>
                                {s.label}
                            </option>
                        ))}
                    </Select>
                </div>

                <div className="space-y-1">
                    <FieldLabel htmlFor="keyword-filter">NAME / KEYWORD</FieldLabel>
                    <Input
                        id="keyword-filter"
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Safeguard, mortgage, appraisal, BPO..."
                    />
                    {isStarter && (
                        <FieldHelperText className="text-amber-800">
                            {!isAuthenticated ? 'Log in' : 'Upgrade to Pro or higher'} to unlock full results and advanced filters.{' '}
                            <Link href="/membership" className="font-semibold text-amber-900 underline">
                                View plans
                            </Link>
                        </FieldHelperText>
                    )}
                </div>
            </div>

            <FieldHelperText className="mt-3">
                Tip. Many firms are national or multi-state, so start broad then narrow by state when you are ready.
            </FieldHelperText>
        </Card>
    )
}

function getAccentColor(seed: string): string {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 32%, 58%)`
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
}

type FirmCardProps = {
    firm: Firm
    isHovered: boolean
    onHover: () => void
    onBlur: () => void
}

function FirmCard({ firm, isHovered, onHover, onBlur }: FirmCardProps) {
    const accent = getAccentColor(firm.name)
    const payText =
        firm.pay_min != null || firm.pay_max != null
            ? [
                firm.pay_min != null ? `$${firm.pay_min}` : null,
                firm.pay_max != null ? `$${firm.pay_max}` : null,
            ]
                .filter(Boolean)
                .join(' - ') +
            (firm.pay_type ? ` ${firm.pay_type}` : '')
            : firm.pay_type || 'Shared with members inside the hub'

    const serviceRegion = firm.geographic_coverage || 'Service region not specified'

    const contactMethod = (() => {
        if (firm.email) return `Email · ${firm.email}`
        if (firm.phone) return `Call · ${firm.phone}`
        if (firm.vendor_page_url || firm.url)
            return `Website · ${firm.vendor_page_url ?? firm.url}`
        return 'Contact info shared on profile'
    })()

    return (
        <article
            className="flex h-full flex-col justify-between rounded-md border border-slate-300 px-6 py-5 transition-transform duration-150 hover:-translate-y-1"
            style={{
                backgroundColor: '#f5efe1',
                backgroundImage:
                    `linear-gradient(135deg, rgba(255,255,255,0.94), rgba(244,236,222,0.92)),` +
                    ` radial-gradient(circle at 14% 18%, rgba(255,255,255,0.35), rgba(233,222,202,0)),` +
                    ` radial-gradient(circle at 86% 6%, rgba(255,255,255,0.28), rgba(233,222,202,0)),` +
                    ` url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0.3 0 0 0 0 0 0.3 0 0 0 0 0 0.3 0 0 0 0 0 0.5 0'/></filter><rect width='200' height='200' filter='url(%23noise)' opacity='0.05'/></svg>")`,
                backgroundBlendMode: 'overlay',
                boxShadow: isHovered
                    ? '0 12px 20px rgba(15,23,42,0.25)'
                    : '0 6px 12px rgba(15,23,42,0.15)',
            }}
            tabIndex={0}
            onMouseEnter={onHover}
            onMouseLeave={onBlur}
            onFocus={onHover}
            onBlur={onBlur}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-4 sm:flex-nowrap">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 relative">
                        {firm.logo_url ? (
                            <Image
                                src={firm.logo_url}
                                alt={`${firm.name} logo`}
                                fill
                                sizes="56px"
                                className="object-contain mix-blend-multiply p-1"
                            />
                        ) : (
                            <span className="text-xs font-semibold tracking-[0.18em] text-slate-600">
                                {getInitials(firm.name)}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 space-y-0.5 break-words">
                        <h3 className="text-lg font-semibold leading-tight text-slate-900">{firm.name}</h3>
                        <div className="flex items-center gap-2">
                            {firm.verified_at ? (
                                <VerifiedBadge date={firm.verified_at} />
                            ) : (
                                // Fallback "AI Verified" for legacy data if needed, or remove completely
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <BadgeCheck className="w-3 h-3" />
                                    <span>Directory Listed</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                <div className="text-left">
                    <p className="text-slate-900">Service region</p>
                    <p className="mt-0.5 text-xs normal-case text-slate-700 break-words">
                        {serviceRegion}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-slate-900">Rating</p>
                    <div className="mt-0.5 flex justify-end">
                        <StarRating
                            rating={firm.rating || 0}
                            count={firm.rating_count || 0}
                            className={firm.rating ? "" : "opacity-60 grayscale"}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 border-y border-dashed border-slate-200 py-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                        Compensation
                    </p>
                    <p className="break-words text-sm font-semibold text-emerald-800">{payText}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                        Primary contact
                    </p>
                    <p className="break-words text-sm font-semibold text-slate-900">
                        {contactMethod}
                    </p>
                </div>
            </div>

            <Link
                href={`/firms/${firm.slug ?? firm.id}`}
                className="mt-4 border border-slate-900 bg-slate-900 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-white"
            >
                VIEW PROFILE
            </Link>
        </article>
    )
}

interface DirectoryViewProps {
    initialFirms: Firm[]
    totalCount: number
    page: number
    limit: number
}

export function DirectoryView({ initialFirms, totalCount, page, limit }: DirectoryViewProps) {
    const { isAuthenticated, planUid } = useAuth()
    const [stateFilter, setStateFilter] = useState<string>('ALL')
    const [search, setSearch] = useState<string>('')
    const [hoveredFirmId, setHoveredFirmId] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const firms = initialFirms

    const urlStateFilter = searchParams?.get('state') ?? 'ALL'
    const urlSearch = searchParams?.get('search') ?? ''

    useEffect(() => {
        setStateFilter(urlStateFilter)
        setSearch(urlSearch)
    }, [urlSearch, urlStateFilter])

    const isStarter = planUid === 'L9nbKV9Z' || !isAuthenticated

    const isProOrHigher = !!planUid && !isStarter

    const displayedFirms = isStarter ? firms.slice(0, 6) : firms
    const totalPages = Math.max(1, Math.ceil(totalCount / limit))
    const startIndex = totalCount === 0 ? 0 : (page - 1) * limit + 1
    const endIndex = Math.min(page * limit, totalCount)
    const canGoBack = page > 1
    const canGoForward = page < totalPages
    const paginationHref = useMemo(() => {
        return (nextPage: number) => {
            const params = new URLSearchParams(searchParams?.toString())
            params.set('page', String(nextPage))
            params.set('limit', String(limit))
            if (stateFilter && stateFilter !== 'ALL') {
                params.set('state', stateFilter)
            } else {
                params.delete('state')
            }

            if (search.trim()) {
                params.set('search', search.trim())
            } else {
                params.delete('search')
            }
            const query = params.toString()
            return query ? `/directory?${query}` : '/directory'
        }
    }, [limit, search, searchParams, stateFilter])

    const updateFilters = (nextState: string, nextSearch: string, nextPage = 1) => {
        const params = new URLSearchParams(searchParams?.toString())
        if (nextState && nextState !== 'ALL') {
            params.set('state', nextState)
        } else {
            params.delete('state')
        }

        if (nextSearch.trim()) {
            params.set('search', nextSearch.trim())
        } else {
            params.delete('search')
        }

        params.set('page', String(nextPage))
        params.set('limit', String(limit))
        const query = params.toString()
        router.push(query ? `/directory?${query}` : '/directory')
    }

    const handlePageChange = (nextPage: number) => {
        router.push(paginationHref(nextPage))
    }

    const handleStateChange = (value: string) => {
        setStateFilter(value)
        updateFilters(value, search)
    }

    const handleSearchChange = (value: string) => {
        setSearch(value)
        updateFilters(stateFilter, value)
    }

    // Guest Preview Mode: remove the login gate and let it fall through to render.
    // We handle the "Guest" state via isStarter = true (essentially) or we can make it explicit.
    // Above we set isStarter = planUid === '...' || !isAuthenticated. 
    // So logic below will treat guests as starters (preview mode).

    return (
        <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
            <header className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        DIRECTORY
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">
                        Firms hiring field inspectors
                    </h1>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold tracking-[0.16em]">
                    <Link href="/dashboard" className="text-slate-700 hover:text-slate-900">
                        ← BACK TO DASHBOARD
                    </Link>
                    <Link href="/membership" className="text-slate-700 hover:text-slate-900">
                        MEMBERSHIP & PRICING
                    </Link>
                </div>
            </header>

            <FilterBar
                stateFilter={stateFilter}
                search={search}
                isStarter={isStarter}
                isAuthenticated={isAuthenticated}
                onSearchChange={handleSearchChange}
                onStateChange={handleStateChange}
            />

            {isStarter && (
                <div className="mb-6 border border-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                    <h3 className="text-sm font-semibold">Starter members see a preview.</h3>
                    <p className="mt-1 text-xs">
                        You are viewing a small sample of firms that match your filter. Upgrade to Pro or
                        higher to unlock the full directory and deeper intel.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {!isAuthenticated ? (
                            <a
                                href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                                className="mt-3 inline-flex border border-amber-900 bg-amber-900 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-white"
                            >
                                LOGIN FOR FULL ACCESS
                            </a>
                        ) : (
                            <Link
                                href="/membership"
                                className="mt-3 inline-flex border border-amber-900 bg-amber-900 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-white"
                            >
                                UPGRADE FOR FULL ACCESS
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                {/* Cards */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {displayedFirms.length ? (
                        displayedFirms.map((firm) => (
                            <FirmCard
                                key={firm.id}
                                firm={firm}
                                isHovered={hoveredFirmId === firm.id}
                                onHover={() => setHoveredFirmId(firm.id)}
                                onBlur={() =>
                                    setHoveredFirmId((current) => (current === firm.id ? null : current))
                                }
                            />
                        ))
                    ) : (
                        <Card className="border border-dashed border-slate-300 px-6 py-8 text-sm text-slate-600">
                            No firms match your current filters. Try another state or broader search.
                        </Card>
                    )}
                </div>

                {/* Static Map Image */}
                <aside className="sticky top-8 border border-slate-200 bg-slate-50 px-4 py-4 text-sm shadow-sm h-fit">
                    <h2 className="text-sm font-semibold text-slate-900">Map view</h2>
                    <p className="mb-3 mt-1 text-xs text-slate-600">
                        Firms operate nationwide. Check specific service areas in the listing details.
                    </p>
                    <div className="w-full border border-slate-200 bg-white relative h-48">
                        <Image
                            src="/directory-map.jpg"
                            alt="Map of US Service Coverage"
                            fill
                            sizes="(min-width: 1024px) 300px, 100vw"
                            className="object-cover"
                        />
                    </div>
                </aside>
            </section>

            {isProOrHigher && totalPages > 1 && (
                <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-4 text-xs font-semibold tracking-[0.16em] text-slate-500 sm:flex-row sm:items-center">
                    <span className="text-[11px] uppercase">
                        Showing {startIndex}-{endIndex} of {totalCount}
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={!canGoBack}
                            className="border border-slate-300 px-3 py-2 text-[11px] text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Previous page"
                        >
                            ← Prev
                        </button>
                        <span className="text-[11px] uppercase text-slate-500">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={!canGoForward}
                            className="border border-slate-300 px-3 py-2 text-[11px] text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Next page"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {isStarter && totalCount > displayedFirms.length && (
                <p className="mt-4 text-xs text-slate-600">
                    Showing {displayedFirms.length} of {totalCount} matching firms on the Starter
                    preview.
                </p>
            )}

            {isProOrHigher && (
                <p className="mt-4 text-xs text-slate-600">
                    You have full directory access. As new published firms are added, they will appear
                    here automatically.
                </p>
            )}
        </main>
    )
}
