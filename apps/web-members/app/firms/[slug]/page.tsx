import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Globe, ExternalLink, Users,
  DollarSign, Clock, FileText, ChevronRight, Star,
  ShieldCheck, TrendingUp, CalendarDays
} from 'lucide-react'
import { FirmServiceArea } from '@/components/FirmServiceArea'
import { generatePageMetadata, getHiringFirmSchema, getBreadcrumbSchema, SITE_URL } from '@/lib/seo'
import { FirmDetailTabs } from './FirmDetailTabs'
import { FirmReviews } from '@/components/directory/FirmReviews'
import { FirmGatedContent } from './FirmGatedContent'
import { AuthCTA } from './AuthCTA'
import { formatPay, parseCategories, parseSocialLinks } from './firm-helpers'

/* Dev SSL fix */
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}


/* ── Types ─────────────────────────────────────────────── */

export type FirmRow = {
  id: string
  name: string
  slug: string | null
  url: string | null
  vendor_page_url: string | null
  description: string | null
  geographic_coverage: string | null
  company_size: string | null
  company_type: string | null
  industry_focus: string | null
  assignment_process: string | null
  specializations: string | null
  services: string | null
  categories: string[] | string | null
  pay_range: string | null
  pay_min: number | null
  pay_max: number | null
  pay_type: string | null
  compensation_structure: string | null
  payment_frequency: string | null
  job_volume: string | null
  phone: string | null
  email: string | null
  address: string | null
  rating: number | null
  contractor_rating: number | null
  logo_url: string | null
  qualifications: string | null
  required_technology: string | null
  equipment_requirements: string | null
  equipment_provision: string | null
  training_provided: string | null
  onboarding_process: string | null
  bbb_status: string | null
  industry_recognition: string | null
  client_reviews: string | null
  founded: string | null
  source: string | null
  social_links: string | null
  recruiter_contact: string | null
  latitude: number | null
  longitude: number | null
  vendor_verified: boolean | null
  is_published: boolean | null
  brand_primary: string | null
  brand_secondary: string | null
}

/* ── Supabase helpers ──────────────────────────────────── */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Missing Supabase env vars')
  return createClient(supabaseUrl, supabaseAnonKey)
}

const _getFirmBySlug = async (slug: string): Promise<FirmRow | null> => {
  const { data, error } = await getSupabase()
    .from('firms')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (error) { console.error('Error loading firm by slug', error); return null }
  return data as FirmRow | null
}

const getFirmBySlugCached = unstable_cache(
  _getFirmBySlug,
  ['firm-by-slug'],
  { tags: ['firms'] }
)

const _getSimilarFirms = async (firmId: string): Promise<FirmRow[]> => {
  const { data } = await getSupabase()
    .from('firms')
    .select('id, name, slug, industry_focus, geographic_coverage, pay_min, pay_max, pay_type, logo_url, url, vendor_verified, contractor_rating')
    .eq('is_published', true)
    .neq('id', firmId)
    .limit(4)
  return (data || []) as FirmRow[]
}

const getSimilarFirmsCached = unstable_cache(
  _getSimilarFirms,
  ['similar-firms'],
  { tags: ['firms'] }
)

function isTrustedLogoUrl(logoUrl: string | null): logoUrl is string {
  if (!logoUrl) return false
  if (logoUrl.startsWith('/')) return true

  try {
    const parsedLogo = new URL(logoUrl)
    const parsedSite = new URL(SITE_URL)
    return parsedLogo.hostname === parsedSite.hostname
  } catch {
    return false
  }
}

/* ── Metadata ──────────────────────────────────────────── */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const firm = await getFirmBySlugCached(slug)
  if (!firm) return {}
  const pay = formatPay(firm)
  const desc = firm.description
    ? firm.description.slice(0, 155).replace(/\n/g, ' ')
    : `${firm.name} hiring profile — coverage: ${firm.geographic_coverage || 'National'}${pay ? `, pay: ${pay}` : ''}. Requirements, onboarding, and apply info.`

  return generatePageMetadata({
    title: `${firm.name} Hiring Profile`,
    description: desc,
    path: `/firms/${firm.slug}`,
    type: 'profile',
    image: isTrustedLogoUrl(firm.logo_url) ? firm.logo_url : undefined,
  })
}

/* ── Page ──────────────────────────────────────────────── */

export default async function FirmDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const firm = await getFirmBySlugCached(slug)
  if (!firm) notFound()

  const pay = formatPay(firm)
  const categories = parseCategories(firm.categories)
  const socialLinks = parseSocialLinks(firm.social_links)
  const hasCoordinates = firm.latitude != null && firm.longitude != null
  const similarFirms = await getSimilarFirmsCached(firm.id)

  const contactHref =
    firm.vendor_page_url ||
    (firm.email ? `mailto:${firm.email}?subject=${encodeURIComponent(`Vendor inquiry — ${firm.name}`)}` : null) ||
    (firm.phone ? `tel:${firm.phone}` : null)

  /* JSON-LD */
  const jsonLd = getHiringFirmSchema({
    name: firm.name,
    description: firm.description || `${firm.name} — field services hiring firm`,
    url: firm.url || `${SITE_URL}/firms/${firm.slug}`,
    logo: isTrustedLogoUrl(firm.logo_url) ? firm.logo_url : '',
    telephone: firm.phone || '',
    email: firm.email || '',
    address: firm.address || '',
    geo: hasCoordinates ? { latitude: firm.latitude!, longitude: firm.longitude! } : undefined,
    areaServed: firm.geographic_coverage || undefined,
    priceRange: pay || undefined,
  })
  const breadcrumbLd = getBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Hiring Firms', url: `${SITE_URL}/hiring-firms` },
    { name: firm.name, url: `${SITE_URL}/firms/${firm.slug}` },
  ])

  /* Quick stats */
  const quickStats = [
    pay ? { icon: DollarSign, label: 'Pay range', value: pay } : null,
    firm.payment_frequency ? { icon: Clock, label: 'Frequency', value: firm.payment_frequency } : null,
    firm.geographic_coverage ? { icon: MapPin, label: 'Coverage', value: firm.geographic_coverage } : null,
    firm.company_size ? { icon: Users, label: 'Size', value: firm.company_size } : null,
    firm.job_volume ? { icon: TrendingUp, label: 'Volume', value: firm.job_volume } : null,
    firm.founded ? { icon: CalendarDays, label: 'Founded', value: firm.founded } : null,
  ].filter(Boolean) as { icon: any; label: string; value: string }[]

  /* Section flags */
  const hasCompensation = !!(pay || firm.compensation_structure || firm.payment_frequency || firm.pay_type || firm.job_volume)
  const hasRequirements = !!(firm.qualifications || firm.required_technology || firm.equipment_requirements || firm.equipment_provision || firm.training_provided || firm.onboarding_process)
  const hasReputation = !!(firm.contractor_rating || firm.bbb_status || firm.industry_recognition || firm.client_reviews)
  const hasContact = !!(firm.phone || firm.email || firm.address || firm.assignment_process)

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Script id="firm-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="firm-bc-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="transition hover:text-brand">Home</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link href="/hiring-firms" className="transition hover:text-brand">Hiring firms</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-medium text-text-primary">{firm.name}</span>
      </nav>

      {/* ═══ Hero card ═══ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-brand via-brand-copper to-amber-400" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Identity */}
            <div className="flex items-start gap-4 sm:gap-5">
              <LogoBlock name={firm.name} logoUrl={firm.logo_url} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">{firm.name}</h1>
                  {firm.vendor_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-text-muted">
                  {firm.industry_focus || 'Field services & inspections'}
                  {firm.company_type && <span> · {firm.company_type}</span>}
                </p>

                {firm.contractor_rating != null && firm.contractor_rating > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className={`h-4 w-4 ${i <= Math.round(firm.contractor_rating!) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-amber-700">{firm.contractor_rating.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">contractor rating</span>
                  </div>
                )}

                {categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <span key={cat} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/60">{cat}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CTAs — guests get login prompt instead of real links */}
            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col lg:items-end">
              {contactHref && (
                <AuthCTA>
                  <a
                    href={contactHref}
                    target={contactHref.startsWith('http') ? '_blank' : undefined}
                    rel={contactHref.startsWith('http') ? 'nofollow noopener noreferrer' : undefined}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-bold text-white shadow-brand-soft transition hover:bg-brand-copperDark hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <FileText className="h-4 w-4" /> Apply / Contact
                  </a>
                </AuthCTA>
              )}
              {firm.vendor_page_url && contactHref !== firm.vendor_page_url && (
                <AuthCTA>
                  <a href={firm.vendor_page_url} target="_blank" rel="nofollow noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/10">
                    <ExternalLink className="h-3.5 w-3.5" /> Vendor portal
                  </a>
                </AuthCTA>
              )}
              {firm.url && (
                <AuthCTA>
                  <a href={firm.url} target="_blank" rel="nofollow noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand">
                    <Globe className="h-3.5 w-3.5" />
                    {(() => { try { return new URL(firm.url).hostname.replace('www.', '') } catch { return firm.url } })()}
                  </a>
                </AuthCTA>
              )}
            </div>
          </div>

          {firm.description && (
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-secondary">{firm.description}</p>
          )}
        </div>

        {/* Quick stats */}
        {quickStats.length > 0 && (
          <FirmGatedContent>
            <div className="border-t border-border-subtle bg-surface-muted px-6 py-4 sm:px-8">
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {quickStats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-brand/60" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{stat.label}</p>
                      <p className="text-sm font-semibold text-text-primary">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FirmGatedContent>
        )}
      </section>

      {/* ═══ Content grid — gated for non-members ═══ */}
      <FirmGatedContent>
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Main — tabs */}
          <div className="min-w-0 flex flex-col gap-8">
            <FirmDetailTabs
              firm={firm}
              pay={pay}
              hasCompensation={hasCompensation}
              hasRequirements={hasRequirements}
              hasReputation={hasReputation}
              hasContact={hasContact}
              hasCoordinates={hasCoordinates}
              socialLinks={socialLinks}
            />

            <FirmReviews firmId={firm.id} />
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            {/* Map / Service Area */}
            <FirmServiceArea
              name={firm.name}
              latitude={firm.latitude}
              longitude={firm.longitude}
              coverage={firm.geographic_coverage}
              address={firm.address}
            />

            {/* Contact card */}
            {hasContact && (
              <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <Phone className="h-4 w-4 text-brand" /> Contact info
                </h3>
                <div className="space-y-2 text-sm">
                  {firm.phone && (
                    <a href={`tel:${firm.phone}`} className="flex items-center gap-2 text-slate-600 transition hover:text-brand">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {firm.phone}
                    </a>
                  )}
                  {firm.email && (
                    <a href={`mailto:${firm.email}`} className="flex items-center gap-2 text-slate-600 transition hover:text-brand">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {firm.email}
                    </a>
                  )}
                  {firm.url && (
                    <a href={firm.url} target="_blank" rel="nofollow noopener noreferrer" className="flex items-center gap-2 text-slate-600 transition hover:text-brand">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {(() => { try { return new URL(firm.url).hostname.replace('www.', '') } catch { return 'Website' } })()}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Pro tip */}
            <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/30 p-5 shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-700">Pro tip for inspectors</p>
              <p className="text-sm leading-relaxed text-amber-900/80">
                Save this firm, collect 3–5 you&apos;re excited about, then batch your applications Sunday night so you hit their queue before Monday&apos;s hiring rush.
              </p>
            </div>

            {/* Similar firms */}
            {similarFirms.length > 0 && (
              <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-text-primary">Similar firms hiring</h3>
                <div className="space-y-3">
                  {similarFirms.slice(0, 3).map((f) => (
                    <Link key={f.id} href={`/firms/${f.slug ?? f.id}`}
                      className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-slate-50">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">
                        {f.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary group-hover:text-brand">{f.name}</p>
                        <p className="truncate text-xs text-slate-400">{f.industry_focus || 'Field services'}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand" />
                    </Link>
                  ))}
                </div>
                <Link href="/hiring-firms" className="mt-3 block text-center text-xs font-semibold text-brand transition hover:text-brand-copperDark">
                  View all firms →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </FirmGatedContent>
    </main>
  )
}

/* ── Logo (server component, no client deps) ─────────── */

function LogoBlock({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join('').toUpperCase()
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  const isValid = isTrustedLogoUrl(logoUrl)

  if (isValid) {
    return (
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-sm sm:h-20 sm:w-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl!} alt={`${name} logo`} className="h-full w-full object-contain" />
      </div>
    )
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm sm:h-20 sm:w-20 sm:text-xl"
      style={{ backgroundColor: `hsl(${hue}, 45%, 52%)` }}>
      {initials}
    </div>
  )
}
