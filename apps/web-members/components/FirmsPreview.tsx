'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck, MapPin } from 'lucide-react'

// Simplified type
type Firm = {
    id: string
    name: string
    slug: string | null
    logo_url: string | null
    geographic_coverage: string | null
    category_tags?: string[] // Assuming we might mock or use categories
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function FirmsPreview({ filterTag }: { filterTag?: string }) {
    const [firms, setFirms] = useState<Firm[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchFirms() {
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return

            // Fetch latest 4 firms
            // In a real scenario, we'd filter by 'categories' using Supabase array operators if schema supported it cleanly
            // For now, we fetch 'is_published' firms
            const url = `${SUPABASE_URL}/rest/v1/firms?select=id,name,slug,logo_url,geographic_coverage&is_published=eq.true&limit=4&order=created_at.desc`

            try {
                const res = await fetch(url, {
                    headers: {
                        apikey: SUPABASE_ANON_KEY,
                        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    },
                })
                if (res.ok) {
                    const data = await res.json()
                    setFirms(data)
                }
            } catch (err) {
                console.error('Failed to load preview firms', err)
            } finally {
                setLoading(false)
            }
        }
        fetchFirms()
    }, [])

    if (loading) return <div className="h-24 w-full animate-pulse bg-slate-100 rounded-lg"></div>

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {firms.map((firm) => (
                <Link
                    key={firm.id}
                    href={`/firms/${firm.slug || firm.id}`}
                    className="group block rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-500 hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded bg-slate-50 border border-slate-100">
                            {firm.logo_url ? (
                                <Image
                                    src={firm.logo_url}
                                    alt=""
                                    width={32}
                                    height={32}
                                    unoptimized
                                    className="h-8 w-8 object-contain mix-blend-multiply"
                                />
                            ) : (
                                <span className="text-xs font-bold text-slate-400">{firm.name.substring(0, 2)}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-700">{firm.name}</p>
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                                <BadgeCheck className="w-3 h-3" /> VERIFIED
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{firm.geographic_coverage || 'National'}</span>
                    </div>
                </Link>
            ))}
        </div>
    )
}
