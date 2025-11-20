'use client'

import Script from 'next/script'
import { useAuth } from '@/components/auth-provider'
import Link from 'next/link'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Nested Objects Member Hub',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  url: 'https://nested-objects-starter.vercel.app',
  description:
    'AI powered member hub for field inspectors, notaries, realtors, and gig pros, helping you find firms, get trained, and land more work.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  creator: {
    '@type': 'Organization',
    name: 'Nested Objects',
  },
}

export default function HomePage() {
  const { user, planUid, isLoading, isAuthenticated, logout } = useAuth()

  const getPlanName = (uid: string | null) => {
    switch (uid) {
      case 'L9nbKV9Z':
        return 'Starter'
      case 'rQVqlLm6':
        return 'Pro'
      case 'NmdnNO90':
        return 'Elite'
      case 'rmk5Xk9g':
        return 'Agency'
      default:
        return 'Unknown'
    }
  }

  const planName = getPlanName(planUid)

  const firstName =
    (user as any)?.first_name ??
    (user as any)?.FirstName ??
    (user?.name ? user.name.split(' ')[0] : undefined) ??
    (user?.email ? user.email.split('@')[0] : undefined) ??
    'Member'

  const initials = firstName.charAt(0).toUpperCase()

  return (
    <>
      {/* Structured data for SEO */}
      <Script
        id="nested-objects-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '2rem',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '3rem',
          }}
        >
          {/* Brand + nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Nested Objects</h1>

            <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.95rem' }}>
              <Link href="/" style={{ textDecoration: 'none', color: '#111827' }}>
                Home
              </Link>
              {isAuthenticated && (
                <Link href="/dashboard" style={{ textDecoration: 'none', color: '#111827' }}>
                  Dashboard
                </Link>
              )}
              <Link href="/directory" style={{ textDecoration: 'none', color: '#111827' }}>
                Directory
              </Link>
              <Link href="/membership" style={{ textDecoration: 'none', color: '#111827' }}>
                Membership
              </Link>
              <Link href="/tools" style={{ textDecoration: 'none', color: '#111827' }}>
                Tools
              </Link>
              <Link href="/resources" style={{ textDecoration: 'none', color: '#111827' }}>
                Resources
              </Link>
            </nav>
          </div>

          {/* Auth controls */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isLoading ? (
              <span>Loading...</span>
            ) : isAuthenticated && user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Simple avatar */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '999px',
                      backgroundColor: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#111827',
                    }}
                  >
                    {initials}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                    }}
                  >
                    <span
                      style={{
                        color: '#111827',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      }}
                    >
                      {firstName}
                    </span>
                    {planName !== 'Unknown' && (
                      <span
                        style={{
                          color: '#6b7280',
                          fontSize: '0.75rem',
                        }}
                      >
                        {planName} plan
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'white',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  Login
                </a>
                <a
                  href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  Sign Up
                </a>
              </>
            )}
          </div>
        </header>

        {/* Hero Section. Association style */}
        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '3rem',
            alignItems: 'center',
            marginBottom: '4rem',
          }}
        >
          {/* Hero text */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <p
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#2563eb',
                marginBottom: '0.75rem',
              }}
            >
              Uniting inspectors. Protecting neighborhoods. Elevating standards.
            </p>
            <h2
              style={{
                fontSize: '2.75rem',
                fontWeight: 'bold',
                lineHeight: 1.1,
                marginBottom: '1rem',
                color: '#111827',
              }}
            >
              Get hired faster as a field inspector, notary, or realtor.
            </h2>
            <p
              style={{
                fontSize: '1.1rem',
                color: '#4b5563',
                marginBottom: '1.75rem',
                maxWidth: '34rem',
              }}
            >
              Nested Objects is a verified hub for field pros who are tired of chasing mystery firms and
              guessing about pay. Find reputable companies, understand requirements, and use AI powered
              tools to move from applications to actual work.
            </p>

            {isAuthenticated ? (
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginBottom: '0.75rem',
                }}
              >
                <Link
                  href="/dashboard"
                  style={{
                    display: 'inline-block',
                    padding: '0.9rem 1.8rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Go to your dashboard
                </Link>
                <Link
                  href="/directory"
                  style={{
                    display: 'inline-block',
                    padding: '0.9rem 1.8rem',
                    backgroundColor: 'white',
                    color: '#3b82f6',
                    borderRadius: '8px',
                    border: '1px solid #3b82f6',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Browse hiring firms
                </Link>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.75rem',
                  }}
                >
                  <a
                    href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                    style={{
                      display: 'inline-block',
                      padding: '1rem 2rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1.05rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    Get directory access
                  </a>
                  <Link
                    href="/directory"
                    style={{
                      display: 'inline-block',
                      padding: '1rem 2rem',
                      backgroundColor: 'white',
                      color: '#3b82f6',
                      borderRadius: '8px',
                      border: '1px solid #3b82f6',
                      fontSize: '1rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Preview hiring firms
                  </Link>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  No spam. You control your membership and notifications at any time.
                </p>
              </>
            )}
          </div>

          {/* Hero side panel */}
          <div
            style={{
              flex: 1,
              minWidth: '260px',
              maxWidth: '360px',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '1.75rem',
              background:
                'linear-gradient(135deg, rgba(219,234,254,0.6), rgba(240,249,255,0.9))',
            }}
          >
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: '#1f2937',
              }}
            >
              Built for people who work in the field.
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                marginBottom: '1.25rem',
                color: '#4b5563',
                fontSize: '0.95rem',
              }}
            >
              <li style={{ marginBottom: '0.4rem' }}>• Mortgage and insurance field inspectors</li>
              <li style={{ marginBottom: '0.4rem' }}>• Mobile notaries and signing agents</li>
              <li style={{ marginBottom: '0.4rem' }}>• Realtors and investor friendly agents</li>
              <li>• Gig pros adding inspections as a new income stream</li>
            </ul>
            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'white',
                border: '1px solid #dbeafe',
              }}
            >
              <p
                style={{
                  fontSize: '0.88rem',
                  color: '#1f2937',
                  marginBottom: '0.4rem',
                  fontWeight: 600,
                }}
              >
                Inside the member hub.
              </p>
              <p style={{ fontSize: '0.86rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                • Verified firm directory with pay and requirements
              </p>
              <p style={{ fontSize: '0.86rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                • AI concierge to answer firm and industry questions
              </p>
              <p style={{ fontSize: '0.86rem', color: '#4b5563' }}>
                • Checklists, templates, and starter kits so you can land your first or next contract
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <h3
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#111827',
            }}
          >
            Why Nested Objects exists.
          </h3>
          <p
            style={{
              maxWidth: '44rem',
              margin: '0 auto',
              fontSize: '1.05rem',
              color: '#4b5563',
            }}
          >
            This hub was created for working parents, night shift hustlers, and full time entrepreneurs
            who deserve clear information, fair pay, and real support. We verify firms, unpack fine print,
            and give you practical tools so you can build a sustainable inspection business instead of
            piecing things together from random posts.
          </p>
        </section>

        {/* Ways to Plug In Grid */}
        <section style={{ marginBottom: '4rem' }}>
          <h3
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '2rem',
              textAlign: 'center',
              color: '#111827',
            }}
          >
            Three ways to plug into the ecosystem.
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Card 1: Directory Access */}
            <div
              style={{
                padding: '2rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: 'white',
              }}
            >
              <h4 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#111827' }}>
                📁 Verified firm directory
              </h4>
              <p style={{ color: '#6b7280', marginBottom: '1.25rem', fontSize: '0.98rem' }}>
                Browse firms by region, service type, and requirements. Skip the guesswork and focus on
                companies that are actually hiring and paying.
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <span
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  Included in all plans
                </span>
              </div>
              <Link
                href="/directory"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'underline',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              >
                View the directory →
              </Link>
            </div>

            {/* Card 2: Training & Starter Kits */}
            <div
              style={{
                padding: '2rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: 'white',
              }}
            >
              <h4 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#111827' }}>
                🎓 Training and starter kits
              </h4>
              <p style={{ color: '#6b7280', marginBottom: '1.25rem', fontSize: '0.98rem' }}>
                Learn how inspections really work before you touch your first order. Use checklists,
                photo examples, and scripts to move with confidence from day one.
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <span
                  style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  Best for Starter and Pro
                </span>
              </div>
              <Link
                href="/resources"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'underline',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              >
                Explore resources →
              </Link>
            </div>

            {/* Card 3: Community & Office Hours */}
            <div
              style={{
                padding: '2rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: 'white',
              }}
            >
              <h4 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#111827' }}>
                🤝 Community and office hours
              </h4>
              <p style={{ color: '#6b7280', marginBottom: '1.25rem', fontSize: '0.98rem' }}>
                Join live sessions and conversations about pay, workload, and what firms are really like.
                Learn from other working pros instead of guessing alone.
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <span
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#075985',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  Coming online as we grow
                </span>
              </div>
              <Link
                href="/membership"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'underline',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              >
                See membership options →
              </Link>
            </div>
          </div>
        </section>

        {/* Standards and Systems Section */}
        <section
          style={{
            marginBottom: '4rem',
            padding: '3rem',
            borderRadius: '16px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2.5rem',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ flex: 1, minWidth: '260px' }}>
              <h3
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 'bold',
                  marginBottom: '0.75rem',
                  color: '#111827',
                }}
              >
                Standards, systems, and shortcuts for field work.
              </h3>
              <p style={{ fontSize: '1rem', color: '#4b5563', marginBottom: '1.25rem' }}>
                We collect the small details that make or break your routes. From photo checklists to
                communication templates, Nested Objects helps you stay compliant, protect your score, and
                keep firms calling you back.
              </p>
            </div>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  color: '#374151',
                  fontSize: '0.96rem',
                }}
              >
                <li style={{ marginBottom: '0.75rem' }}>
                  <strong>Compliance and quality.</strong> Sample photos, checklists, and guidance so you
                  know exactly what firms expect on each order.
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                  <strong>Tech that works for you.</strong> Recommended apps, simple automations, and AI
                  helpers that cut your admin time.
                </li>
                <li>
                  <strong>Business minded support.</strong> Email templates, rate conversations, and
                  client communication tips, so you show up as a business owner instead of just a vendor.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section style={{ marginBottom: '4rem' }}>
          <h3
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1.75rem',
              textAlign: 'center',
              color: '#111827',
            }}
          >
            Member stories and early wins.
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.75rem',
            }}
          >
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                backgroundColor: 'white',
              }}
            >
              <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.9rem' }}>
                “Instead of scrolling random Facebook threads, I opened the directory, picked three firms,
                and actually got responses. I stop wasting time on companies that are not even onboarding.”
              </p>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Field inspector. Georgia</p>
            </div>
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                backgroundColor: 'white',
              }}
            >
              <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.9rem' }}>
                “The starter kit helped me understand what a clean photo set looks like and what firms
                actually care about. I walked into my first orders with way more confidence.”
              </p>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>New inspector. North Carolina</p>
            </div>
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                backgroundColor: 'white',
              }}
            >
              <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '0.9rem' }}>
                “Having intel on different firms in one place keeps me from saying yes to things that
                would burn me out. I can aim for work that fits my schedule and family.”
              </p>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Inspector and parent. Nationwide</p>
            </div>
          </div>
        </section>

        {/* Opportunity Section for Firms */}
        <section
          style={{
            marginBottom: '4rem',
            padding: '3rem',
            borderRadius: '16px',
            backgroundColor: '#eff6ff',
            border: '1px solid #dbeafe',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1, minWidth: '260px' }}>
              <h3
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  marginBottom: '0.75rem',
                  color: '#111827',
                }}
              >
                For hiring firms. Connect with trained field pros.
              </h3>
              <p style={{ fontSize: '1rem', color: '#4b5563' }}>
                If you hire inspectors, notaries, or real estate partners, Nested Objects gives you a way
                to show up in front of motivated professionals who understand the work. Share your
                requirements, regions, and expectations clearly, and match with people who want long term
                relationships, not just one off orders.
              </p>
            </div>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  fontSize: '0.95rem',
                  color: '#374151',
                  marginBottom: '1.5rem',
                }}
              >
                <li style={{ marginBottom: '0.6rem' }}>
                  • Highlight your pay structure and expectations up front.
                </li>
                <li style={{ marginBottom: '0.6rem' }}>
                  • Reach inspectors and notaries who treat this like a real business.
                </li>
                <li>• Reduce churn by setting clear standards and support from day one.</li>
              </ul>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <Link
                  href="/membership"
                  style={{
                    display: 'inline-block',
                    padding: '0.8rem 1.6rem',
                    backgroundColor: '#1d4ed8',
                    color: 'white',
                    borderRadius: '999px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Explore firm membership
                </Link>
                <Link
                  href="/directory"
                  style={{
                    display: 'inline-block',
                    padding: '0.8rem 1.6rem',
                    backgroundColor: 'white',
                    color: '#1d4ed8',
                    borderRadius: '999px',
                    border: '1px solid #93c5fd',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Preview the directory
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!isAuthenticated && (
          <section
            style={{
              padding: '3rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#111827',
              }}
            >
              Ready to treat inspections like a real business.
            </h3>
            <p
              style={{
                fontSize: '1.125rem',
                color: '#6b7280',
                marginBottom: '2rem',
                maxWidth: '40rem',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Join Nested Objects to see verified firms, practical training, and AI powered tools in one
              place, so you can build income that respects your time and your household.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                style={{
                  display: 'inline-block',
                  padding: '1rem 2rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                Start free
              </a>
              <Link
                href="/membership"
                style={{
                  display: 'inline-block',
                  padding: '1rem 2rem',
                  backgroundColor: 'white',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                }}
              >
                View membership plans
              </Link>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer
          style={{
            marginTop: '4rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '0.875rem',
          }}
        >
          <p>© 2025 Nested Objects LLC. All rights reserved.</p>
        </footer>
      </main>
    </>
  )
}
