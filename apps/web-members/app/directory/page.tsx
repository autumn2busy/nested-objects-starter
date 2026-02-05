import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck, MapPin, Building2, ExternalLink } from 'lucide-react'
import { generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generatePageMetadata({
  title: 'Firm Directory | Verified Field Inspection Companies',
  description: 'Browse the complete list of verified firms hiring field inspectors and notaries. Filter by coverage, pay rates, and requirements.',
  path: '/directory',
})

// Initialize client directly for server component data fetching
// Note: In a real app we'd use a shared client utility, but this matches MembersDirectoryPage pattern
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type Firm = {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  description: string | null
  geographic_coverage: string | null
  website_url: string | null
  is_verified: boolean
}

async function getFirms(): Promise<Firm[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { data, error } = await supabase
      .from('firms')
      .select('id, name, slug, logo_url, description, geographic_coverage, website_url, is_verified')
      .eq('is_published', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data as Firm[] || []

  } catch (err) {
    console.error('Error fetching firms', err)
    return []
  }
}

export default async function DirectoryPage() {
  const firms = await getFirms()

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Firm Directory</h1>
        <p className="mt-2 text-lg text-slate-600">
          Connect with {firms.length} verified companies hiring for field work.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {firms.map((firm) => (
          <Link
            key={firm.id}
            href={`/firms/${firm.slug || firm.id}`}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-emerald-500 hover:shadow-md"
          >
            <div className="aspect-[3/1] bg-slate-50 border-b border-slate-100 relative">
              {/* Fallback pattern or banner could go here */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100" />
            </div>

            <div className="p-5 pt-0">
              <div className="relative -mt-8 mb-4 h-16 w-16 overflow-hidden rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
                {firm.logo_url ? (
                  <Image
                    src={firm.logo_url}
                    alt={firm.name}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-50 text-xl font-bold text-slate-400">
                    {firm.name.substring(0, 1)}
                  </div>
                )}
              </div>

              <div className="mb-1">
                <h3 className="truncate text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                  {firm.name}
                </h3>
              </div>

              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                {firm.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                    <BadgeCheck className="h-3 w-3" /> Verified Firm
                  </span>
                )}
              </div>

              <p className="mb-4 line-clamp-2 text-sm text-slate-500">
                {firm.description || 'No description provided.'}
              </p>

              <div className="mt-auto flex items-center gap-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[120px]">
                    {firm.geographic_coverage || 'National'}
                  </span>
                </div>
                {firm.website_url && (
                  <div className="flex items-center gap-1 hover:text-brand-copper">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Website</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}

        {firms.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">No firms found</h3>
            <p className="mt-1 text-sm text-slate-500">Check back later for new additions.</p>
          </div>
        )}
      </div>
    </main>
  )
}
