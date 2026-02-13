import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import { FirmMap } from '@/components/FirmMap'
import { generatePageMetadata, getLocalBusinessSchema } from '@/lib/seo'


// Development SSL fix
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

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
  address: string | null
  rating: number | null
  logo_url?: string | null
  compensation_structure?: string | null
  payment_frequency?: string | null
  job_volume?: string | null
  qualifications?: string | null
  required_technology?: string | null
  equipment_requirements?: string | null
  equipment_provision?: string | null
  training_provided?: string | null
  onboarding_process?: string | null
  bbb_status?: string | null
  industry_recognition?: string | null
  client_reviews?: string | null
  latitude?: number | null
  longitude?: number | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const GOOGLE_MAPS_EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

async function getFirmBySlug(slug: string): Promise<FirmRow | null> {
  const { data, error } = await getSupabase()
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

function buildAddress(firm: FirmRow): string | null {
  return firm.address || null
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const firm = await getFirmBySlug(params.slug)
  if (!firm) return {}

  return generatePageMetadata({
    title: `${firm.name} | Hiring Firm Profile`,
    description: firm.description || `Snapshot of ${firm.name}. Coverage: ${firm.geographic_coverage || 'National'}. Roles, pay, and vendor signup details.`,
    path: `/firms/${firm.slug}`,
    type: 'profile',
    image: firm.logo_url || undefined
  })
}

export default async function FirmDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const firm = await getFirmBySlug(params.slug)
  if (!firm) notFound()

  const pay = formatPay(firm)
  const fullAddress = buildAddress(firm)

  const latitude = firm.latitude ?? undefined
  const longitude = firm.longitude ?? undefined

  // Generate LocalBusiness Schema
  const jsonLd = getLocalBusinessSchema({
    name: firm.name,
    description: firm.description || '',
    url: firm.url || '',
    logo: firm.logo_url || '',
    telephone: firm.phone || '',
    email: firm.email || '',
    address: {
      streetAddress: firm.address || '',
      addressLocality: '', // Parse if available, else empty
      addressRegion: '',
      postalCode: '',
      addressCountry: 'US'
    },
    geo: (latitude && longitude) ? { latitude, longitude } : undefined,
    areaServed: firm.geographic_coverage || undefined,
    priceRange: formatPay(firm) || undefined
  })

  // ... rest of formatting logic
  const contactHref =
    firm.vendor_page_url ||
    (firm.email ? `mailto:${firm.email}?subject=${encodeURIComponent(`Vendor inquiry for ${firm.name}`)}` : null) ||
    (firm.phone ? `tel:${firm.phone}` : null)

  const hasCoordinates = !!(latitude && longitude)
  const coordinateQuery = hasCoordinates ? `${latitude},${longitude}` : null

  const googleMapsCoordinateUrl = coordinateQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinateQuery)}`
    : null
  const googleMapsAddressUrl =
    !coordinateQuery && fullAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
      : null

  return (
    <main
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.75rem 1.25rem 3.5rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Script
        id="firm-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />


      {/* crumb and links */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Link href="/hiring-firms" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
            Field services directory
          </Link>
          <span style={{ color: '#9ca3af' }}>→</span>
          <span style={{ color: '#6b7280' }}>{firm.name}</span>
        </div>

        <Link
          href="/membership-pricing"
          style={{ color: '#6b7280', textDecoration: 'none' }}
        >
          Membership and pricing
        </Link>
      </div>

      {/* Hero */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.3fr)',
          gap: '1.1rem',
          marginBottom: '1.6rem',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(16,185,129,0.06))',
            borderRadius: '16px',
            padding: '1.35rem 1.35rem 1.2rem',
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              flexWrap: 'wrap',
            }}
          >
            {firm.logo_url ? (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6',
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
                  width: 52,
                  height: 52,
                  borderRadius: '999px',
                  backgroundColor: '#1d4ed8',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                }}
              >
                {firm.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <h1
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {firm.name}
                </h1>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '0.05rem',
                  }}
                >
                  {firm.geographic_coverage && (
                    <span
                      style={{
                        padding: '0.28rem 0.7rem',
                        borderRadius: '999px',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                      }}
                    >
                      Coverage. {firm.geographic_coverage}
                    </span>
                  )}

                  {firm.company_size && (
                    <span
                      style={{
                        padding: '0.28rem 0.7rem',
                        borderRadius: '999px',
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                      }}
                    >
                      Size. {firm.company_size}
                    </span>
                  )}

                  {pay && (
                    <span
                      style={{
                        padding: '0.28rem 0.7rem',
                        borderRadius: '999px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                      }}
                    >
                      Typical pay. {pay}
                    </span>
                  )}

                  {firm.pay_type && (
                    <span
                      style={{
                        padding: '0.28rem 0.7rem',
                        borderRadius: '999px',
                        backgroundColor: '#eef2ff',
                        color: '#4338ca',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      Pay model. {firm.pay_type}
                    </span>
                  )}
                </div>
              </div>

              <p
                style={{
                  margin: 0,
                  color: '#6b7280',
                  fontSize: '0.94rem',
                }}
              >
                {firm.industry_focus || 'Field services and inspections'}
              </p>
            </div>
          </div>

          {firm.description && (
            <p
              style={{
                marginTop: '0.8rem',
                marginBottom: 0,
                fontSize: '0.95rem',
                color: '#4b5563',
                maxWidth: '46rem',
              }}
            >
              {firm.description}
            </p>
          )}
        </div>

        {/* actions + map */}
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
              {contactHref && (
                <a
                  href={contactHref}
                  target={contactHref.startsWith('http') ? '_blank' : undefined}
                  rel={contactHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.85rem 1rem',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 10px 25px rgba(37, 99, 235, 0.18)',
                  }}
                >
                  Contact / Apply
                </a>
              )}

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
              {fullAddress && <p style={{ margin: 0 }}>{fullAddress}</p>}
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
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              minHeight: 200,
            }}
          >
            <h3
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                margin: 0,
                marginBottom: '0.5rem',
              }}
            >
              Service area map
            </h3>

            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                height: 240,
              }}
            >
              {hasCoordinates && latitude !== null && longitude !== null ? (
                <FirmMap
                  firms={[firm as any]}
                  center={{ lat: latitude, lng: longitude }}
                  zoom={12}
                  className="h-full w-full"
                />
              ) : googleMapsCoordinateUrl ? (
                <a
                  href={googleMapsCoordinateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    color: '#374151',
                    textDecoration: 'none',
                    padding: '1rem',
                    textAlign: 'center',
                    backgroundColor: '#e5e7eb',
                  }}
                >
                  Open this firm&apos;s location in Google Maps
                </a>
              ) : googleMapsAddressUrl ? (
                <a
                  href={googleMapsAddressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    color: '#374151',
                    textDecoration: 'none',
                    padding: '1rem',
                    textAlign: 'center',
                    backgroundColor: '#e5e7eb',
                  }}
                >
                  Open this firm&apos;s address in Google Maps
                </a>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    padding: '1rem',
                    textAlign: 'center',
                    backgroundColor: '#e5e7eb',
                  }}
                >
                  Map preview not available yet. Add coordinates or address details.
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>

      {/* lower sections */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)',
          gap: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* snapshot */}
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

              {firm.geographic_coverage && (
                <div>
                  <dt
                    style={{
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#9ca3af',
                    }}
                  >
                    Coverage / territory
                  </dt>
                  <dd style={{ margin: 0, fontSize: '0.9rem' }}>
                    {firm.geographic_coverage}
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

          {/* compensation */}
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

              {firm.pay_type && <li>Pay model. {firm.pay_type}</li>}

              {firm.job_volume && <li>Job volume. {firm.job_volume}</li>}
            </ul>
          </section>

          {/* requirements */}
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

        {/* reputation */}
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
              Save this firm, collect three to five you are excited about, then batch
              your applications on Sunday night so you hit their queue before Monday
              hiring rush.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}