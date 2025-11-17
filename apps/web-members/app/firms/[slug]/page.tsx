import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'

export const revalidate = 3600

type FirmRow = {
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
  pay_range: string | null
  pay_min: number | null
  pay_max: number | null
  pay_type: string | null
  phone: string | null
  email: string | null
  address_street: string | null
  address_city: string | null
  address_state: string | null
  address_postal_code: string | null
  rating: number | null
  logo_url: string | null
  compensation_structure: string | null
  payment_frequency: string | null
  job_volume: string | null
  qualifications: string | null
  required_technology: string | null
  equipment_requirements: string | null
  equipment_provision: string | null
  training_provided: string | null
  onboarding_process: string | null
  bbb_status: string | null
  industry_recognition: string | null
  client_reviews: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MAPS_EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getFirmBySlug(slug: string): Promise<FirmRow | null> {
  const { data, error } = await supabase
    .from('firms')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) {
    console.error('Error loading firm by slug', error)
    return null
  }

  return data as FirmRow | null
}

function formatPay(firm: FirmRow): string | null {
  if (firm.pay_min && firm.pay_max) {
    const min = Math.round(firm.pay_min)
    const max = Math.round(firm.pay_max)
    const unit = firm.pay_type || '/inspection'
    return `$${min.toLocaleString()} - $${max.toLocaleString()} ${unit}`
  }
  if (firm.pay_range) return firm.pay_range
  return null
}

function formatLocation(firm: FirmRow): string | null {
  const parts = [
    firm.address_street,
    firm.address_city,
    firm.address_state,
    firm.address_postal_code,
  ].filter(Boolean)
  if (!parts.length) return null
  return parts.join(', ')
}

function buildFirmMapSrc(firm: FirmRow): string | null {
  if (!MAPS_EMBED_KEY) return null
  const parts = [
    firm.address_street,
    firm.address_city,
    firm.address_state,
    firm.address_postal_code,
  ].filter(Boolean)
  if (!parts.length) return null
  const q = encodeURIComponent(parts.join(', '))
  return `https://www.google.com/maps/embed/v1/place?key=${MAPS_EMBED_KEY}&q=${q}`
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const firm = await getFirmBySlug(params.slug)

  if (!firm) {
    return {
      title: 'Firm not found . Nested Objects',
      description: 'The firm you are looking for could not be found.',
    }
  }

  const pay = formatPay(firm)
  const location = formatLocation(firm)

  return {
    title: `${firm.name} . Hiring firm snapshot`,
    description:
      firm.description ||
      `Snapshot of ${firm.name}. coverage ${firm.geographic_coverage || 'field inspections'}. roles, pay and vendor signup info for inspectors in ${location || 'their service area'}.`,
    openGraph: {
      title: `${firm.name} . Hiring firm snapshot`,
      description:
        firm.description ||
        `Learn about ${firm.name}. coverage, services and pay for field service vendors.`,
      url: `https://nested-objects-starter.vercel.app/firms/${firm.slug}`,
    },
  }
}

export default async function FirmDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const firm = await getFirmBySlug(params.slug)

  if (!firm) {
    notFound()
  }

  const pay = formatPay(firm)
  const location = formatLocation(firm)
  const mapSrc = buildFirmMapSrc(firm)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: firm.name,
    url: firm.url,
    description: firm.description,
    areaServed: firm.geographic_coverage,
    address: location
      ? {
          '@type': 'PostalAddress',
          streetAddress: firm.address_street || undefined,
          addressLocality: firm.address_city || undefined,
          addressRegion: firm.address_state || undefined,
          postalCode: firm.address_postal_code || undefined,
        }
      : undefined,
    contactPoint:
      firm.phone || firm.email
        ? [
            {
              '@type': 'ContactPoint',
              telephone: firm.phone || undefined,
              email: firm.email || undefined,
              contactType: 'vendor inquiries',
            },
          ]
        : undefined,
  }

  return (
    <main
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1.5rem 4rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Script
        id="firm-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top crumb and back link */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: '#6b7280',
        }}
      >
        <div>
          <Link href="/directory" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            ← Back to directory
          </Link>
          <span style={{ marginLeft: '0.5rem' }}>/ Firm snapshot</span>
        </div>

        <Link
          href="/membership"
          style={{ color: '#6b7280', textDecoration: 'none' }}
        >
          Membership and pricing
        </Link>
      </div>

      {/* Hero layout inspired by Zillow listing header */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2.1fr) minmax(0, 1.2fr)',
          gap: '1.5rem',
          marginBottom: '2rem',
          alignItems: 'stretch',
        }}
      >
        {/* Left. big hero card */}
        <div
          style={{
            borderRadius: '18px',
            padding: '1.75rem 1.75rem 1.5rem',
            border: '1px solid #e5e7eb',
            background:
              'radial-gradient(circle at top left, rgba(37,99,235,0.18), transparent 55%), radial-gradient(circle at bottom right, rgba(16,185,129,0.18), transparent 55%), #f9fafb',
            boxShadow:
              '0 18px 40px rgba(15,23,42,0.08), 0 3px 8px rgba(15,23,42,0.06)',
          }}
        >
          {/* Logo and name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {firm.logo_url ? (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  border: '1px solid rgba(148,163,184,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={firm.logo_url}
                  alt={`${firm.name} logo`}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '999px',
                  background:
                    'linear-gradient(135deg, #1d4ed8, #2563eb 35%, #22c55e)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                }}
              >
                {firm.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 750,
                  margin: 0,
                  marginBottom: '0.2rem',
                }}
              >
                {firm.name}
              </h1>
              <p
                style={{
                  margin: 0,
                  color: '#6b7280',
                  fontSize: '0.95rem',
                }}
              >
                {firm.industry_focus || 'Field services and inspections'}
              </p>

              {location && (
                <p
                  style={{
                    margin: '0.15rem 0 0',
                    color: '#9ca3af',
                    fontSize: '0.8rem',
                  }}
                >
                  {location}
                </p>
              )}
            </div>
          </div>

          {/* Pills. coverage, size, pay, rating */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.6rem',
              marginTop: '1.3rem',
            }}
          >
            {firm.geographic_coverage && (
              <span
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                Coverage. {firm.geographic_coverage}
              </span>
            )}

            {firm.company_size && (
              <span
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                Size. {firm.company_size}
              </span>
            )}

            {pay && (
              <span
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                Typical pay. {pay}
              </span>
            )}

            {typeof firm.rating === 'number' && (
              <span
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  backgroundColor: '#f5f3ff',
                  color: '#6d28d9',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                Inspector rating. {firm.rating.toFixed(1)} / 5
              </span>
            )}
          </div>

          {firm.description && (
            <p
              style={{
                marginTop: '1.2rem',
                marginBottom: 0,
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: '#374151',
                maxWidth: '46rem',
              }}
            >
              {firm.description}
            </p>
          )}
        </div>

        {/* Right sidebar. actions, contact, mini map */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div
            style={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '1.5rem 1.5rem 1.25rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                margin: 0,
                marginBottom: '0.75rem',
              }}
            >
              Get hired by this firm
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              {firm.vendor_page_url && (
                <a
                  href={firm.vendor_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.7rem 1rem',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Vendor signup portal
                </a>
              )}

              {firm.url && (
                <a
                  href={firm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem 1rem',
                    borderRadius: '999px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#111827',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Visit company website
                </a>
              )}
            </div>
          </div>

          <div
            style={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '1.25rem 1.5rem',
              fontSize: '0.85rem',
              color: '#4b5563',
            }}
          >
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                marginTop: 0,
                marginBottom: '0.6rem',
              }}
            >
              Contact
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {location && <p style={{ margin: 0 }}>{location}</p>}
              {firm.phone && <p style={{ margin: 0 }}>Phone. {firm.phone}</p>}
              {firm.email && (
                <p style={{ margin: 0 }}>
                  Email.{' '}
                  <a href={`mailto:${firm.email}`} style={{ color: '#3b82f6' }}>
                    {firm.email}
                  </a>
                </p>
              )}
            </div>

            {firm.assignment_process && (
              <p style={{ marginTop: '0.8rem', marginBottom: 0 }}>
                <strong>Assignment process.</strong>{' '}
                {firm.assignment_process}
              </p>
            )}
          </div>

          <div
            style={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              backgroundColor: '#f9fafb',
              height: 180,
            }}
          >
            {mapSrc ? (
              <iframe
                src={mapSrc}
                style={{ width: '100%', height: '100%', border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map for ${firm.name}`}
              />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  fontSize: '0.8rem',
                  color: '#9ca3af',
                  textAlign: 'center',
                }}
              >
                Add NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY in your env settings to
                show a live map for each firm.
              </div>
            )}
          </div>
        </aside>
      </section>

      {/* Main detail sections */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)',
          gap: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Snapshot */}
          <section
            style={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '1.5rem 1.5rem 1.25rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                margin: 0,
                marginBottom: '0.75rem',
              }}
            >
              Firm snapshot
            </h2>

            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem 1.5rem',
                margin: 0,
              }}
            >
              {firm.industry_focus && (
                <div>
                  <dt
                    style={{
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#9ca3af',
                    }}
                  >
                    Industry focus
                  </dt>
                  <dd style={{ margin: 0, fontSize: '0.9rem' }}>
                    {firm.industry_focus}
                  </dd>
                </div>
              )}

              {firm.company_type && (
                <div>
                  <dt
                    style={{
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#9ca3af',
                    }}
                  >
                    Company type
                  </dt>
                  <dd style={{ margin: 0, fontSize: '0.9rem' }}>
                    {firm.company_type}
                  </dd>
                </div>
              )}

              {firm.services && (
                <div>
                  <dt
                    style={{
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#9ca3af',
                    }}
                  >
                    Services
                  </dt>
                  <dd style={{ margin: 0, fontSize: '0.9rem' }}>
                    {firm.services}
                  </dd>
                </div>
              )}

              {firm.specializations && (
                <div>
                  <dt
                    style={{
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#9ca3af',
                    }}
                  >
                    Specializations
                  </dt>
                  <dd style={{ margin: 0, fontSize: '0.9rem' }}>
                    {firm.specializations}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Compensation */}
          <section
            style={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '1.5rem 1.5rem 1.25rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                margin: 0,
                marginBottom: '0.75rem',
              }}
            >
              Pay and volume
            </h2>

            <ul
              style={{
                listStyle: 'disc',
                paddingLeft: '1.25rem',
                margin: 0,
                fontSize: '0.9rem',
                color: '#4b5563',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              {pay && (
                <li>
                  Typical pay range. <strong>{pay}</strong>
                </li>
              )}

              {firm.compensation_structure && (
                <li>{firm.compensation_structure}</li>
              )}

              {firm.payment_frequency && (
                <li>Payment frequency. {firm.payment_frequency}</li>
              )}

              {firm.job_volume && <li>Job volume. {firm.job_volume}</li>}
            </ul>
          </section>

          {/* Requirements and tech */}
          <section
            style={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '1.5rem 1.5rem 1.25rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                margin: 0,
                marginBottom: '0.75rem',
              }}
            >
              Requirements and tools
            </h2>

            <ul
              style={{
                listStyle: 'disc',
                paddingLeft: '1.25rem',
                margin: 0,
                fontSize: '0.9rem',
                color: '#4b5563',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              {firm.qualifications && <li>{firm.qualifications}</li>}
              {firm.required_technology && (
                <li>Required technology. {firm.required_technology}</li>
              )}
              {firm.equipment_requirements && (
                <li>Equipment. {firm.equipment_requirements}</li>
              )}
              {firm.equipment_provision && (
                <li>Equipment provided. {firm.equipment_provision}</li>
              )}
              {firm.training_provided && (
                <li>Training. {firm.training_provided}</li>
              )}
              {firm.onboarding_process && (
                <li>Onboarding. {firm.onboarding_process}</li>
              )}
            </ul>
          </section>
        </div>

        {/* Right column. reputation and pro tip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section
            style={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '1.25rem 1.5rem',
              fontSize: '0.9rem',
              color: '#4b5563',
            }}
          >
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                marginTop: 0,
                marginBottom: '0.75rem',
              }}
            >
              Reputation
            </h2>

            <ul
              style={{
                listStyle: 'disc',
                paddingLeft: '1.2rem',
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              {typeof firm.rating === 'number' && (
                <li>Inspector rating. {firm.rating.toFixed(1)} out of 5</li>
              )}
              {firm.bbb_status && <li>BBB status. {firm.bbb_status}</li>}
              {firm.industry_recognition && (
                <li>{firm.industry_recognition}</li>
              )}
              {firm.client_reviews && <li>{firm.client_reviews}</li>}
            </ul>
          </section>

          <section
            style={{
              borderRadius: '16px',
              border: '1px dashed #e5e7eb',
              padding: '1.25rem 1.5rem',
              fontSize: '0.85rem',
              color: '#6b7280',
            }}
          >
            <p style={{ marginTop: 0, marginBottom: '0.4rem' }}>
              Pro tip for inspectors.
            </p>
            <p style={{ margin: 0 }}>
              Save this firm, collect three to five you are excited about, then
              batch your applications on Sunday night so you hit their queue
              before Monday hiring rush.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
