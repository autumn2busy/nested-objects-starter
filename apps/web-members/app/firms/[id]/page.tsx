import Link from 'next/link'
import type { Metadata } from 'next'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type Firm = {
  id: string
  name: string
  url: string | null
  geographic_coverage: string | null
  categories: any
  pay_min: number | null
  pay_max: number | null
  pay_type: string | null
  company_size: string | null
  industry_focus: string | null
  phone: string | null
  email: string | null
}

async function fetchFirm(id: string): Promise<Firm | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/firms` +
      `?id=eq.${encodeURIComponent(id)}` +
      '&select=id,name,url,geographic_coverage,categories,' +
      'pay_min,pay_max,pay_type,company_size,industry_focus,phone,email' +
      '&limit=1',
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 3600 },
    }
  )

  if (!res.ok) return null
  const data = (await res.json()) as Firm[]
  return data[0] ?? null
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const firm = await fetchFirm(params.id)

  if (!firm) {
    return {
      title: 'Firm not found . Nested Objects',
      description: 'This firm profile is not available.',
    }
  }

  const payBits =
    firm.pay_min != null
      ? `Typical pay from $${firm.pay_min}${
          firm.pay_max != null ? ` to $${firm.pay_max}` : ''
        }${firm.pay_type ? ` ${firm.pay_type}` : ''}`
      : 'Snapshot of compensation, coverage, and services for field inspectors.'

  return {
    title: `${firm.name} . Field inspection vendor snapshot`,
    description: `${firm.name} vendor overview for field inspectors. ${payBits}`,
    alternates: {
      canonical: `https://nested-objects-starter.vercel.app/firms/${firm.id}`,
    },
  }
}

function formatCategories(raw: any): string {
  if (!raw) return ''
  if (Array.isArray(raw)) return raw.join(', ')
  if (typeof raw === 'string') {
    return raw.replace(/[\[\]"]/g, '')
  }
  return String(raw)
}

export default async function FirmProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const firm = await fetchFirm(params.id)

  if (!firm) {
    return (
      <main
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <Link
          href="/directory"
          style={{ fontSize: '0.9rem', color: '#3b82f6', textDecoration: 'none' }}
        >
          ← Back to directory
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem' }}>
          Firm not found
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          This firm profile is not available. It may have been unpublished or removed.
        </p>
      </main>
    )
  }

  const categories = formatCategories(firm.categories)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: firm.name,
    url: firm.url || 'https://nested-objects-starter.vercel.app',
    description:
      'Vendor snapshot from Nested Objects for field inspectors, notaries, and field service professionals.',
    areaServed: firm.geographic_coverage || undefined,
    telephone: firm.phone || undefined,
    email: firm.email || undefined,
    sameAs: firm.url || undefined,
  }

  const paySummary =
    firm.pay_min != null
      ? `$${firm.pay_min}${
          firm.pay_max != null ? ` - $${firm.pay_max}` : ''
        }${firm.pay_type ? ` ${firm.pay_type}` : ''}`
      : 'Not yet published'

  return (
    <main
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2.5rem 2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Structured data for this firm */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top breadcrumb and actions */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
        }}
      >
        <div>
          <Link
            href="/directory"
            style={{
              fontSize: '0.85rem',
              color: '#3b82f6',
              textDecoration: 'none',
            }}
          >
            ← Back to directory
          </Link>
          <p
            style={{
              marginTop: '0.25rem',
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9ca3af',
            }}
          >
            Vendor snapshot
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            fontSize: '0.85rem',
          }}
        >
          <Link
            href="/resources/firm-intel"
            style={{ color: '#6b7280', textDecoration: 'none' }}
          >
            View firm intel library
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section
        style={{
          borderRadius: '20px',
          padding: '2rem',
          background:
            'linear-gradient(135deg, rgba(37, 99, 235, 0.07), rgba(16, 185, 129, 0.04))',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.3fr)',
          gap: '2rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            {firm.name}
          </h1>

          <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '1.25rem' }}>
            Snapshot of this firm for field inspectors and related vendors. Coverage.
            {` ${firm.geographic_coverage || 'Not yet published'}.`}{' '}
            {categories && `Primary focus. ${categories}.`}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <span
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              {firm.industry_focus || 'Field services'}
            </span>
            <span
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                backgroundColor: '#ecfdf3',
                color: '#166534',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              Coverage. {firm.geographic_coverage || 'TBA'}
            </span>
            <span
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              Size. {firm.company_size || 'Not listed'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            {firm.url && (
              <a
                href={firm.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.75rem 1.6rem',
                  borderRadius: '999px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  boxShadow: '0 12px 25px rgba(37, 99, 235, 0.35)',
                }}
              >
                Vendor signup or website
              </a>
            )}

            {firm.email && (
              <a
                href={`mailto:${firm.email}`}
                style={{
                  padding: '0.7rem 1.4rem',
                  borderRadius: '999px',
                  border: '1px solid #d1d5db',
                  color: '#111827',
                  textDecoration: 'none',
                  fontSize: '0.86rem',
                  backgroundColor: 'white',
                }}
              >
                Email vendor team
              </a>
            )}
          </div>
        </div>

        {/* Snapshot card */}
        <div
          style={{
            borderRadius: '16px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            boxShadow:
              '0 14px 30px rgba(15, 23, 42, 0.04), 0 3px 6px rgba(15, 23, 42, 0.05)',
            fontSize: '0.9rem',
          }}
        >
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            Quick snapshot
          </h2>

          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              rowGap: '0.6rem',
              columnGap: '1rem',
            }}
          >
            <div>
              <dt
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#9ca3af',
                }}
              >
                Typical pay
              </dt>
              <dd style={{ fontSize: '0.9rem', color: '#16a34a' }}>{paySummary}</dd>
            </div>

            <div>
              <dt
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#9ca3af',
                }}
              >
                Focus
              </dt>
              <dd style={{ fontSize: '0.9rem', color: '#374151' }}>
                {categories || firm.industry_focus || 'Not yet published'}
              </dd>
            </div>

            <div>
              <dt
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#9ca3af',
                }}
              >
                Coverage
              </dt>
              <dd style={{ fontSize: '0.9rem', color: '#374151' }}>
                {firm.geographic_coverage || 'Not listed'}
              </dd>
            </div>

            <div>
              <dt
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#9ca3af',
                }}
              >
                Contact
              </dt>
              <dd style={{ fontSize: '0.9rem', color: '#374151' }}>
                {firm.phone || 'Phone not listed'}
              </dd>
            </div>
          </dl>

          <p
            style={{
              marginTop: '1rem',
              fontSize: '0.8rem',
              color: '#6b7280',
            }}
          >
            Use this snapshot to decide if the firm fits your routes, pay expectations,
            and risk tolerance before you spend time on a long vendor packet.
          </p>
        </div>
      </section>

      {/* Content sections */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
          gap: '1.75rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Left. Overview and process */}
        <div
          style={{
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '1.75rem',
            backgroundColor: 'white',
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            What this firm is looking for
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1rem' }}>
            This section is where you can later surface requirements from your intel
            research. examples. license type, background check vendor, photo standards,
            portal training, and any notes about inspector support.
          </p>
          <ul
            style={{
              fontSize: '0.9rem',
              color: '#4b5563',
              listStyle: 'disc',
              paddingLeft: '1.25rem',
            }}
          >
            <li>Highlight ideal experience level and preferred service areas.</li>
            <li>Call out any must have gear. ladder, lockbox tools, mobile app.</li>
            <li>Note timelines for onboarding, first assignment, and payout cycle.</li>
          </ul>
        </div>

        {/* Right. Compensation block */}
        <div
          style={{
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '1.75rem',
            backgroundColor: 'white',
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            Compensation snapshot
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.75rem' }}>
            Use this as a directional guide only. actual rates can vary by state,
            product type, and experience. Your intel content can expand this with
            examples and pay bands.
          </p>
          <p
            style={{
              fontSize: '0.95rem',
              color: '#16a34a',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Typical range. {paySummary}
          </p>
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            As you build out more data. you can call out higher paying regions, bonuses
            for rush routes, or penalties that make a firm less attractive.
          </p>
        </div>
      </section>

      {/* Bottom. Cross links */}
      <section
        style={{
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.25rem',
            }}
          >
            Next steps in your inspection journey
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
            Compare this firm with others, then move into training and job tracking so
            you are not leaving money on the table.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            fontSize: '0.85rem',
          }}
        >
          <Link
            href="/directory"
            style={{
              padding: '0.7rem 1.3rem',
              borderRadius: '999px',
              border: '1px solid #d1d5db',
              textDecoration: 'none',
              color: '#111827',
              backgroundColor: 'white',
            }}
          >
            Back to full directory
          </Link>
          <Link
            href="/resources/job-board"
            style={{
              padding: '0.7rem 1.3rem',
              borderRadius: '999px',
              border: '1px solid #2563eb',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: '#2563eb',
            }}
          >
            View current job leads
          </Link>
        </div>
      </section>
    </main>
  )
}
