'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, GraduationCap, ShieldCheck, Briefcase, Star, TrendingUp } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { FieldLabel, Input } from '@/components/ui/input'
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
    service_areas?: string[] | null
    primary_services?: string | null
    training_modules_completed?: number
    training_modules_total?: number
    shield_id?: string | null
    subscription_tier?: string | null
    trust_score?: number | null
    experience_level?: string | null
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
    eliteOnly: boolean
    onStateChange: (value: string) => void
    onSearchChange: (value: string) => void
    onEliteOnlyChange: (value: boolean) => void
}

function FilterBar({
    stateFilter,
    search,
    eliteOnly,
    onSearchChange,
    onStateChange,
    onEliteOnlyChange,
}: FilterBarProps) {
    return (
        <Card className="mb-6 border-border-subtle px-5 py-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)] md:items-end">
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
                        placeholder="Search by name, role, or skills..."
                    />
                </div>

                <div className="flex items-center gap-2 pb-2.5 h-full">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={eliteOnly}
                                onChange={(e) => onEliteOnlyChange(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-amber-600 transition-colors">
                            Elite Only
                        </span>
                    </label>
                </div>
            </div>
        </Card>
    )
}

type MemberCardProps = {
    member: Member
}

function MemberCard({ member }: MemberCardProps) {
    const isElite = member.subscription_tier === 'elite' || member.subscription_tier === 'agency'

    return (
        <Link href={`/members/${member.id}`} className="block h-full">
            <article className={`flex h-full flex-col rounded-md border bg-white p-5 transition-shadow hover:shadow-md ${isElite ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-slate-200'}`}>
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
                                {member.display_name || 'Member'}
                            </h3>
                            <p className="text-sm text-slate-500 truncate">
                                {member.role || 'Field Inspector'}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                                {isElite && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                        <span>Elite member</span>
                                    </div>
                                )}
                                {member.verified_at ? (
                                    <VerifiedBadge date={member.verified_at} />
                                ) : (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded">
                                        <span>MEMBER</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bio snippet */}
                {member.bio && (
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {member.bio}
                    </p>
                )}

                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
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

                    {/* Trust Score + B2B Metrics */}
                    <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                        {/* Trust Score bar */}
                        {member.trust_score != null && (
                            <div className="flex items-center gap-2 text-xs">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span className="text-slate-600 font-medium">Trust: {member.trust_score}</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(member.trust_score, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {member.primary_services && (
                            <div className="flex items-start gap-1.5 text-xs text-slate-600">
                                <Briefcase className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1">{member.primary_services}</span>
                            </div>
                        )}

                        {member.experience_level && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{member.experience_level}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <GraduationCap className="w-3.5 h-3.5" />
                                <span>Training: {member.training_modules_completed || 0}/{member.training_modules_total || 8}</span>
                            </div>
                            {member.shield_id && (
                                <div className="flex items-center gap-1 text-green-700 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Background Checked</span>
                                </div>
                            )}
                        </div>
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
    const [stateFilter, setStateFilter] = useState<string>('ALL')
    const [search, setSearch] = useState<string>('')
    const [eliteOnly, setEliteOnly] = useState<boolean>(false)

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
            (member.role || '').toLowerCase().includes(q) ||
            (member.primary_services || '').toLowerCase().includes(q)
        )
    }

    const matchesElite = (member: Member) => {
        if (!eliteOnly) return true
        return member.subscription_tier === 'elite' || member.subscription_tier === 'agency'
    }

    const filteredMembers = initialMembers
        .filter(matchesStateFilter)
        .filter(matchesSearch)
        .filter(matchesElite)

    // Sort Elite members to the top
    const sortedMembers = [...filteredMembers].sort((a, b) => {
        const aElite = a.subscription_tier === 'elite' || a.subscription_tier === 'agency' ? 1 : 0
        const bElite = b.subscription_tier === 'elite' || b.subscription_tier === 'agency' ? 1 : 0
        if (aElite !== bElite) return bElite - aElite
        return 0
    })

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
                eliteOnly={eliteOnly}
                onSearchChange={setSearch}
                onStateChange={setStateFilter}
                onEliteOnlyChange={setEliteOnly}
            />

            <section className="grid gap-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {sortedMembers.map((member) => (
                        <MemberCard
                            key={member.id}
                            member={member}
                        />
                    ))}
                    {sortedMembers.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded border border-dashed border-slate-200">
                            No members found matching your criteria.
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}
