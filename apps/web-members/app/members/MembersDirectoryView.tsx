'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck, MapPin, Search } from 'lucide-react'

import { useAuth } from '@/components/auth-provider'
import { Card } from '@/components/ui/card'
import { FieldHelperText, FieldLabel, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { StarRating } from '@/components/ui/StarRating'

export type Member = {
    id: string
    display_name: string | null
    avatar_url: string | null
    service_area: string | null
    verified_at?: string | null
    rating: number | null
    rating_count?: number | null
    bio?: string | null
    role?: string | null
}

const US_STATES = [
    { code: 'ALL', label: 'All service areas' },
    { code: 'AL', label: 'Alabama' },
    { code: 'AK', label: 'Alaska' },
    { code: 'AZ', label: 'Arizona' },
    { code: 'AR', label: 'Arkansas' },
    { code: 'CA', label: 'California' },
    { code: 'CO', label: 'Colorado' },
    { code: 'CT', label: 'Connecticut' },
    { code: 'DE', label: 'Delaware' },
    { code: 'FL', label: 'Florida' },
    { code: 'GA', label: 'Georgia' },
    { code: 'HI', label: 'Hawaii' },
    { code: 'ID', label: 'Idaho' },
    { code: 'IL', label: 'Illinois' },
    { code: 'IN', label: 'Indiana' },
    { code: 'IA', label: 'Iowa' },
    { code: 'KS', label: 'Kansas' },
    { code: 'KY', label: 'Kentucky' },
    { code: 'LA', label: 'Louisiana' },
    { code: 'ME', label: 'Maine' },
    { code: 'MD', label: 'Maryland' },
    { code: 'MA', label: 'Massachusetts' },
    { code: 'MI', label: 'Michigan' },
    { code: 'MN', label: 'Minnesota' },
    { code: 'MS', label: 'Mississippi' },
    { code: 'MO', label: 'Missouri' },
    { code: 'MT', label: 'Montana' },
    { code: 'NE', label: 'Nebraska' },
    { code: 'NV', label: 'Nevada' },
    { code: 'NH', label: 'New Hampshire' },
    { code: 'NJ', label: 'New Jersey' },
    { code: 'NM', label: 'New Mexico' },
    { code: 'NY', label: 'New York' },
    { code: 'NC', label: 'North Carolina' },
    { code: 'ND', label: 'North Dakota' },
    { code: 'OH', label: 'Ohio' },
    { code: 'OK', label: 'Oklahoma' },
    { code: 'OR', label: 'Oregon' },
    { code: 'PA', label: 'Pennsylvania' },
    { code: 'RI', label: 'Rhode Island' },
    { code: 'SC', label: 'South Carolina' },
    { code: 'SD', label: 'South Dakota' },
    { code: 'TN', label: 'Tennessee' },
    { code: 'TX', label: 'Texas' },
    { code: 'UT', label: 'Utah' },
    { code: 'VT', label: 'Vermont' },
    { code: 'VA', label: 'Virginia' },
    { code: 'WA', label: 'Washington' },
    { code: 'WV', label: 'West Virginia' },
    { code: 'WI', label: 'Wisconsin' },
    { code: 'WY', label: 'Wyoming' },
]

function getInitials(name: string): string {
    const parts = (name || 'Member').trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
}

type FilterBarProps = {
    stateFilter: string
    search: string
    isAuthenticated: boolean
    onStateChange: (value: string) => void
    onSearchChange: (value: string) => void
}

function FilterBar({
    stateFilter,
    search,
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
                    <div className="relative">
                        <Input
                            id="keyword-filter"
                            type="text"
                            value={search}
                            disabled={!isAuthenticated}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={!isAuthenticated ? "Login to search..." : "Search by name, role, or skills..."}
                            className={!isAuthenticated ? "cursor-not-allowed opacity-70" : ""}
                        />
                        {!isAuthenticated && (
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                        )}
                    </div>
                </div>
            </div>
            {!isAuthenticated && (
                <FieldHelperText className="mt-2 text-amber-900">
                    <a
                        href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                        className="font-semibold underline"
                    >
                        Log in
                    </a>{' '}
                    or{' '}
                    <a
                        href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                        className="font-semibold underline"
                    >
                        Create an account
                    </a>{' '}
                    to search the full directory.
                </FieldHelperText>
            )}
        </Card>
    )
}

type MemberCardProps = {
    member: Member
}

function MemberCard({ member }: MemberCardProps) {
    return (
        <Link href={`/members/${member.id}`} className="block h-full">
            <article className="flex h-full flex-col rounded-md border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                            {member.avatar_url ? (
                                <Image
                                    src={member.avatar_url}
                                    alt={member.display_name || 'Member'}
                                    width={48}
                                    height={48}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-sm font-semibold text-slate-500">
                                    {getInitials(member.display_name || '')}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-900 truncate">
                                {member.display_name || 'Verified Member'}
                            </h3>
                            <p className="text-sm text-slate-500 truncate">
                                {member.role || 'Field Inspector'}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                                {member.verified_at ? (
                                    <VerifiedBadge date={member.verified_at} />
                                ) : (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded">
                                        <BadgeCheck className="w-3 h-3" />
                                        <span>MEMBER</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[140px]">
                                {member.service_area || 'Nationwide'}
                            </span>
                        </div>
                        {member.rating ? (
                            <StarRating rating={member.rating} count={member.rating_count || 0} />
                        ) : (
                            <span className="text-xs text-slate-400 italic">New</span>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    )
}

interface MembersDirectoryViewProps {
    initialMembers: Member[]
}

export function MembersDirectoryView({ initialMembers }: MembersDirectoryViewProps) {
    const { isAuthenticated, isLoading } = useAuth()
    const [members] = useState<Member[]>(initialMembers)
    const [stateFilter, setStateFilter] = useState<string>('ALL')
    const [search, setSearch] = useState<string>('')

    const matchesStateFilter = (member: Member) => {
        if (stateFilter === 'ALL') return true
        if (!member.service_area) return false

        const area = member.service_area.toLowerCase()
        const selected = US_STATES.find((s) => s.code === stateFilter)
        if (!selected) return true

        const label = selected.label.toLowerCase()
        const code = selected.code.toLowerCase()

        return area.includes(label) || area.includes(code)
    }

    const matchesSearch = (member: Member) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
            (member.display_name || '').toLowerCase().includes(q) ||
            (member.service_area || '').toLowerCase().includes(q) ||
            (member.role || '').toLowerCase().includes(q)
        )
    }

    const filteredMembers = members.filter(matchesStateFilter).filter(matchesSearch)

    // Guest Preview: Show limited set (e.g. 6) if not authenticated
    // User requested "Firms searching for members" verbiage for logged out state too?
    // Actually user said explicitly "directory is for firms searching for members".
    const displayedMembers = !isAuthenticated ? filteredMembers.slice(0, 6) : filteredMembers

    return (
        <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
            <header className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        DIRECTORY
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">
                        Find Field Inspectors & Notaries
                    </h1>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold tracking-[0.16em]">
                    <Link href="/inspector-dashboard" className="text-slate-700 hover:text-slate-900">
                        ← BACK TO DASHBOARD
                    </Link>
                </div>
            </header>

            <FilterBar
                stateFilter={stateFilter}
                search={search}
                isAuthenticated={isAuthenticated}
                onSearchChange={setSearch}
                onStateChange={setStateFilter}
            />

            {!isAuthenticated && (
                <div className="mb-6 border border-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-900 rounded-md">
                    <h3 className="font-semibold text-slate-900">Preview Mode</h3>
                    <p className="mt-1 mb-3">
                        You are viewing a limited preview of our member directory.
                        Firms can log in to search the full directory of verified professionals.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                            className="inline-flex border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-white hover:bg-slate-800"
                        >
                            FIRM LOGIN
                        </a>
                        <a
                            href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                            className="inline-flex border border-slate-300 bg-white px-4 py-2 text-xs font-semibold tracking-[0.16em] text-slate-900 hover:bg-slate-50"
                        >
                            CREATE ACCOUNT
                        </a>
                    </div>
                </div>
            )}

            <section className="grid gap-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {displayedMembers.map((member) => (
                        <MemberCard
                            key={member.id}
                            member={member}
                        />
                    ))}
                    {displayedMembers.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded border border-dashed border-slate-200">
                            No members found matching your criteria.
                        </div>
                    )}
                </div>
            </section>

            {!isAuthenticated && filteredMembers.length > displayedMembers.length && (
                <p className="mt-6 text-center text-sm text-slate-600">
                    Showing {displayedMembers.length} of {filteredMembers.length} active members.
                    <a href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous" className="ml-1 font-semibold text-blue-600 hover:underline">Log in to view all.</a>
                </p>
            )}
        </main>
    )
}
