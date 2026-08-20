import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Globe, ExternalLink, Users,
  DollarSign, Clock, FileText, ChevronRight, Star,
  ShieldCheck, TrendingUp, CalendarDays, ClipboardCheck,
  CheckCircle2, ArrowRight
} from 'lucide-react'
import { FirmServiceArea } from '@/components/FirmServiceArea'
import { generatePageMetadata, getHiringFirmSchema, getBreadcrumbSchema, getFAQPageSchema, SITE_URL } from '@/lib/seo'
import { FirmDetailTabs } from './FirmDetailTabs'
import { FirmReviews } from '@/components/directory/FirmReviews'
import { FirmGatedContent } from './FirmGatedContent'
import { AuthCTA } from './AuthCTA'
import { FirmViewTracker } from './FirmViewTracker'
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

function normalizeExternalHref(rawUrl: string | null): string | null {
  if (!rawUrl) return null
  const trimmedUrl = rawUrl.trim()
  if (!trimmedUrl) return null

  if (/^(https?:|mailto:|tel:)/i.test(trimmedUrl)) return trimmedUrl
  if (/^(www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/.*)?$/i.test(trimmedUrl)) {
    return `https://${trimmedUrl}`
  }

  return null
}

function getFirmSeoTitle(name: string): string {
  const compactName = name
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+(?:-|\u2013|\u2014)\s+.+$/g, '')
    .replace(/\s*\/\s*.+$/g, '')
    .replace(/\b(?:incorporated|corporation|company|inc|llc|ltd|corp|co)\.?$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (compactName.length <= 35) return `${compactName} Profile`

  const truncated = compactName.slice(0, 32).replace(/\s+\S*$/g, '').trim()
  return `${truncated || compactName.slice(0, 32).trim()}... Profile`
}

function getFirmProfileFaqs(firm: FirmRow, categories: string[], pay: string | null) {
  const categoryText = categories.length > 0
    ? categories.slice(0, 3).join(', ')
    : firm.industry_focus || 'field services'
  const coverageText = firm.geographic_coverage || 'the United States'
  const serviceText = firm.services || firm.specializations || categoryText
  const payText = pay
    ? `Nested Objects has pay context for ${firm.name}, but actual compensation can vary by route, order type, region, and contractor experience.`
    : `Public pay details for ${firm.name} may vary by market, so applicants should confirm current rates, payment timing, and order expectations before accepting work.`

  return [
    {
      question: `What type of work is ${firm.name} associated with?`,
      answer: `${firm.name} is listed as a ${categoryText} firm. Use the profile to review its services, coverage notes, requirements, and available contractor intel before applying.`,
    },
    {
      question: `Where does ${firm.name} operate?`,
      answer: `${firm.name} is associated with coverage in ${coverageText}. Contractors should verify active service areas directly with the firm because route availability can change by county, state, and client demand.`,
    },
    {
      question: `How should contractors evaluate ${firm.name}?`,
      answer: `Compare ${firm.name} against other hiring firms by coverage, onboarding steps, equipment requirements, pay model, payment frequency, contractor feedback, and how well the assignments fit your route schedule.`,
    },
    {
      question: `Does ${firm.name} list pay information?`,
      answer: payText,
    },
    {
      question: `Who is ${firm.name} best suited for?`,
      answer: `${firm.name} may fit contractors who want ${serviceText} work in ${coverageText}. Before applying, contractors should compare the firm's coverage, onboarding requirements, equipment expectations, and order volume against their schedule and travel radius.`,
    },
    {
      question: `What should contractors verify before applying to ${firm.name}?`,
      answer: `Contractors should verify active service areas, assignment volume, pay model, payment timing, revision policies, background-check requirements, insurance expectations, and any required apps or equipment before submitting personal information.`,
    },
  ]
}

function getFirmFitSummary(firm: FirmRow, categories: string[]) {
  const workType = firm.services || firm.specializations || categories.slice(0, 2).join(', ') || firm.industry_focus || 'field service assignments'
  const coverage = firm.geographic_coverage || 'multiple markets'

  return [
    {
      label: 'Best fit',
      value: `Contractors comparing ${workType} opportunities in ${coverage}.`,
    },
    {
      label: 'Decision point',
      value: 'Use this profile to confirm coverage, requirements, assignment volume, and pay terms before applying.',
    },
    {
      label: 'Next comparison',
      value: 'Shortlist several firms so one slow response or low-volume route does not stall your pipeline.',
    },
  ]
}

function getFirmVerificationItems(firm: FirmRow) {
  const coverage = firm.geographic_coverage
    ? `Active counties or metros within ${firm.geographic_coverage}`
    : 'Active counties, metros, or states currently accepting contractors'

  return [
    coverage,
    'Required apps, portals, phone specs, and upload workflow',
    'Camera, measuring tools, transportation, safety gear, and any firm-specific equipment',
    'Pay model, trip fees, payment frequency, revision policy, and invoice timing',
    'Background check, insurance, training, onboarding steps, and application response time',
  ]
}

function getFirmComparisonRows(firm: FirmRow, categories: string[], pay: string | null) {
  const categoryText = categories.length > 0 ? categories.slice(0, 2).join(', ') : firm.industry_focus || 'field-service'
  const coverage = firm.geographic_coverage || 'your target market'

  return [
    {
      label: 'Best for',
      value: `${categoryText} contractors who can serve ${coverage} and want a firm profile to compare before applying.`,
    },
    {
      label: 'Compare against',
      value: 'At least three similar firms by service area, pay model, assignment type, onboarding speed, and revision policy.',
    },
    {
      label: 'Pay question',
      value: pay
        ? `Confirm whether ${pay} reflects your exact order type, distance, route density, and contractor status.`
        : 'Ask for current pay, trip-fee, rush-fee, and payment-frequency details before accepting assignments.',
    },
    {
      label: 'Trust question',
      value: 'Verify active coverage, required credentials, portal access, support response, and whether contractor feedback matches the published terms.',
    },
  ]
}

function getFirmTrustSignals(firm: FirmRow, websiteHref: string | null, vendorPageHref: string | null) {
  const hasRequirementDetails = !!(
    firm.qualifications ||
    firm.required_technology ||
    firm.equipment_requirements ||
    firm.equipment_provision ||
    firm.training_provided ||
    firm.onboarding_process
  )
  const hasReputationDetails = !!(firm.contractor_rating || firm.bbb_status || firm.industry_recognition || firm.client_reviews)
  const contactPath = vendorPageHref
    ? 'Vendor or application page found'
    : firm.email || firm.phone
      ? 'Direct contact path listed'
      : websiteHref
        ? 'Website listed for follow-up'
        : 'Contact path needs verification'

  return [
    {
      label: 'Profile status',
      value: firm.vendor_verified
        ? 'Vendor-verified profile'
        : 'Directory profile; confirm current details before applying',
    },
    {
      label: 'Application path',
      value: contactPath,
    },
    {
      label: 'Requirement clarity',
      value: hasRequirementDetails
        ? 'Requirements, tools, training, or onboarding notes are available'
        : 'Requirements should be confirmed directly with the firm',
    },
    {
      label: 'Reputation context',
      value: hasReputationDetails
        ? 'Profile includes contractor, review, BBB, or recognition signals'
        : 'Public reputation signals are limited; compare with similar firms',
    },
  ]
}

function getFirmApplicationPlan(firm: FirmRow, categories: string[], pay: string | null) {
  const categoryText = categories.length > 0 ? categories.slice(0, 2).join(' or ') : firm.industry_focus || 'field-service'
  const coverage = firm.geographic_coverage || 'your target counties'

  return [
    {
      title: 'Confirm route fit',
      body: `Check whether ${firm.name} has active ${categoryText} work in ${coverage}, not just broad national coverage.`,
    },
    {
      title: 'Compare requirements',
      body: 'Review background checks, insurance, apps, photos, equipment, training, and onboarding steps before submitting personal details.',
    },
    {
      title: 'Verify pay terms',
      body: pay
        ? `Treat ${pay} as a starting clue. Confirm actual order type, trip fees, payout timing, and revision rules.`
        : 'Ask for current pay, trip fees, payment frequency, invoice timing, and whether revisions or return visits are paid.',
    },
    {
      title: 'Track the application',
      body: 'Save the date applied, portal link, contact person, requested documents, counties offered, and follow-up date.',
    },
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const firm = await getFirmBySlugCached(slug)
  if (!firm) return {}
  const pay = formatPay(firm)
  const desc = firm.description
    ? firm.description.slice(0, 155).replace(/\n/g, ' ')
    : `${firm.name} hiring profile — coverage: ${firm.geographic_coverage || 'National'}${pay ? `, pay: ${pay}` : ''}. Requirements, onboarding, and apply info.`

  return generatePageMetadata({
    title: getFirmSeoTitle(firm.name),
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
  const websiteHref = normalizeExternalHref(firm.url)
  const vendorPageHref = normalizeExternalHref(firm.vendor_page_url)
  const firmFaqs = getFirmProfileFaqs(firm, categories, pay)
  const firmFitSummary = getFirmFitSummary(firm, categories)
  const verificationItems = getFirmVerificationItems(firm)
  const firmComparisonRows = getFirmComparisonRows(firm, categories, pay)
  const firmTrustSignals = getFirmTrustSignals(firm, websiteHref, vendorPageHref)
  const applicationPlan = getFirmApplicationPlan(firm, categories, pay)

  const contactHref =
    vendorPageHref ||
    (firm.email ? `mailto:${firm.email}?subject=${encodeURIComponent(`Vendor inquiry — ${firm.name}`)}` : null) ||
    (firm.phone ? `tel:${firm.phone}` : null)

  /* JSON-LD */
  const jsonLd = getHiringFirmSchema({
    name: firm.name,
    description: firm.description || `${firm.name} — field services hiring firm`,
    url: websiteHref || `${SITE_URL}/firms/${firm.slug}`,
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
  const faqLd = getFAQPageSchema(firmFaqs)

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
      <Script id="firm-faq-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <FirmViewTracker firmId={firm.id} firmSlug={firm.slug} firmName={firm.name} />

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
            <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row lg:flex-col lg:items-end">
              {contactHref && (
                <AuthCTA>
                  <a
                    href={contactHref}
                    target={contactHref.startsWith('http') ? '_blank' : undefined}
                    rel={contactHref.startsWith('http') ? 'nofollow noopener noreferrer' : undefined}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-bold text-white shadow-brand-soft transition hover:bg-brand-copperDark hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-auto"
                  >
                    <FileText className="h-4 w-4" /> Apply / Contact
                  </a>
                </AuthCTA>
              )}
              {vendorPageHref && contactHref !== vendorPageHref && (
                <AuthCTA>
                  <a href={vendorPageHref} target="_blank" rel="nofollow noopener noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/10 sm:w-auto">
                    <ExternalLink className="h-3.5 w-3.5" /> Vendor portal
                  </a>
                </AuthCTA>
              )}
              {websiteHref && (
                <AuthCTA>
                  <a href={websiteHref} target="_blank" rel="nofollow noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand">
                    <Globe className="h-3.5 w-3.5" />
                    {(() => { try { return new URL(websiteHref).hostname.replace('www.', '') } catch { return 'Website' } })()}
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

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">Profile confidence</p>
          <h2 className="mt-2 text-xl font-bold text-text-primary sm:text-2xl">
            How much contractor decision context is visible for {firm.name}?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use these signals to decide whether this profile has enough information for a shortlist, or whether you should verify details directly before applying.
          </p>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {firmTrustSignals.map((signal) => (
            <div key={signal.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{signal.label}</dt>
              <dd className="mt-2 text-sm leading-6 text-slate-700">{signal.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="rounded-lg border border-border-subtle bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">Quick answers</p>
          <h2 className="mt-2 text-xl font-bold text-text-primary sm:text-2xl">
            What contractors should know about {firm.name}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {firmFaqs.map((item) => (
              <div key={item.question} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold leading-5 text-slate-950">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-brand-copper/25 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-copper/10 text-brand-copper">
              <ClipboardCheck className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">Before you apply</p>
              <h2 className="mt-1 text-lg font-bold text-text-primary">Evaluation checklist</h2>
            </div>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            <li>Confirm current coverage in your county or metro before planning a route.</li>
            <li>Compare payment timing, revision expectations, and required equipment with similar firms.</li>
            <li>Review contractor feedback and onboarding notes before submitting personal details.</li>
            <li>Keep a shortlist of several firms so one slow pipeline does not stall your field work.</li>
          </ul>
        </aside>
      </section>

      <section
        className="mb-8 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:p-6"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '520px' }}
      >
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">Application plan</p>
          <h2 className="mt-2 text-xl font-bold sm:text-2xl">
            A safer way to evaluate {firm.name} before you apply
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Do not treat any single firm profile as a final answer. Use this sequence to protect time, privacy, and route economics.
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {applicationPlan.map((step, index) => (
            <article key={step.title} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-copper text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-white">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,1.05fr)]"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '560px' }}
      >
        <div className="rounded-lg border border-border-subtle bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">Firm fit</p>
          <h2 className="mt-2 text-xl font-bold text-text-primary sm:text-2xl">
            Is {firm.name} a good fit for your route?
          </h2>
          <div className="mt-5 space-y-4">
            {firmFitSummary.map((item) => (
              <div key={item.label} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/hiring-firms"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-copperDark"
            >
              Compare firms
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/tools/income-calculator"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand"
            >
              Estimate income
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Trust checks</p>
              <h2 className="mt-1 text-lg font-bold text-text-primary">What to verify before sharing details</h2>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {verificationItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-lg bg-white/80 p-3 text-sm leading-6 text-slate-700">
            Nested Objects profiles are starting points for comparison. Contractors should confirm final terms directly with each firm before accepting assignments.
          </p>
        </div>
      </section>

      <section
        className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '520px' }}
      >
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-copper">Firm comparison</p>
          <h2 className="mt-2 text-xl font-bold text-text-primary sm:text-2xl">
            How to compare {firm.name} against similar firms
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use this profile as a starting point, then confirm current terms directly with the firm before sharing sensitive details or accepting work.
          </p>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {firmComparisonRows.map((row) => (
            <div key={row.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{row.label}</dt>
              <dd className="mt-2 text-sm leading-6 text-slate-700">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Content grid - gated for non-members */}
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
                  {websiteHref && (
                    <a href={websiteHref} target="_blank" rel="nofollow noopener noreferrer" className="flex items-center gap-2 text-slate-600 transition hover:text-brand">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {(() => { try { return new URL(websiteHref).hostname.replace('www.', '') } catch { return 'Website' } })()}
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
                  View all firms
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
