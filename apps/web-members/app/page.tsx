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
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <header
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {/* Brand + nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              Nested Objects
            </h1>

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

        {/* Hero Section - Enhanced */}
        <section
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                fontWeight: 'bold',
                marginBottom: '1rem',
                lineHeight: 1.1,
              }}
            >
              AI-Powered Hub for Field Service Professionals
            </h2>
            <p
              style={{
                fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                marginBottom: '2.5rem',
                opacity: 0.95,
                lineHeight: 1.6,
              }}
            >
              Connect with top firms, access exclusive training, and grow your career as an
              inspector, notary, or field service contractor
            </p>

            {isAuthenticated ? (
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Link
                  href="/dashboard"
                  style={{
                    display: 'inline-block',
                    padding: '1rem 2rem',
                    backgroundColor: 'white',
                    color: '#667eea',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  }}
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/directory"
                  style={{
                    display: 'inline-block',
                    padding: '1rem 2rem',
                    backgroundColor: 'transparent',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Browse Firms
                </Link>
              </div>
            ) : (
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                style={{
                  display: 'inline-block',
                  padding: '1rem 2.5rem',
                  backgroundColor: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                }}
              >
                Get Started Free
              </a>
            )}

            {/* Trust Indicators */}
            <div
              style={{
                marginTop: '3rem',
                display: 'flex',
                gap: '2rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                opacity: 0.9,
              }}
            >
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>1,000+</div>
                <div style={{ fontSize: '0.9rem' }}>Active Members</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>500+</div>
                <div style={{ fontSize: '0.9rem' }}>Partner Firms</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>50k+</div>
                <div style={{ fontSize: '0.9rem' }}>Jobs Posted</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid - Enhanced with more details */}
        <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <h3
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              textAlign: 'center',
            }}
          >
            Everything You Need to Succeed
          </h3>
          <p
            style={{
              fontSize: '1.1rem',
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '3rem',
              maxWidth: '700px',
              margin: '0 auto 3rem',
            }}
          >
            From finding work to building skills, Nested Objects provides the tools and
            connections field service professionals need to thrive.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Feature 1: Directory */}
            <div
              style={{
                padding: '2rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
              <h4 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                Exclusive Firm Directory
              </h4>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Access hundreds of vetted field service companies actively hiring inspectors,
                notaries, and contractors. Filter by location, pay range, and specialty.
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
                  All Plans
                </span>
              </div>
              <Link
                href="/directory"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                View Directory →
              </Link>
            </div>

            {/* Feature 2: AI Chatbot */}
            <div
              style={{
                padding: '2rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
              <h4 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                AI Career Assistant
              </h4>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Get instant answers about firms, application tips, route optimization, and
                industry trends from our AI-powered concierge trained on field service
                expertise.
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
                  Pro+
                </span>
              </div>
              <Link
                href="/tools/ai-chatbot"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                Try AI Chatbot →
              </Link>
            </div>

            {/* Feature 3: Firm Intel */}
            <div
              style={{
                padding: '2rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h4 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                Job Board & Alerts
              </h4>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Browse thousands of field service opportunities and get matched to jobs based
                on your skills, location, and preferences. Never miss your next gig.
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
                  Pro+
                </span>
              </div>
              <Link
                href="/resources/firm-intel"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                View Intel →
              </Link>
            </div>
          </div>
        </section>

        {/* NEW: Testimonials Section */}
        <section
          style={{
            padding: '4rem 2rem',
            backgroundColor: '#f9fafb',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h3
              style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                textAlign: 'center',
              }}
            >
              Trusted by Field Service Professionals
            </h3>
            <p
              style={{
                fontSize: '1.1rem',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '3rem',
                maxWidth: '700px',
                margin: '0 auto 3rem',
              }}
            >
              See how Nested Objects is helping inspectors and contractors grow their careers
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
              }}
            >
              {/* Testimonial 1 */}
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  borderLeft: '4px solid #667eea',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  style={{
                    fontSize: '3rem',
                    color: '#667eea',
                    marginBottom: '1rem',
                    lineHeight: 1,
                  }}
                >
                  "
                </div>
                <p
                  style={{
                    fontSize: '1.05rem',
                    lineHeight: 1.6,
                    margin: '0 0 1.5rem 0',
                    color: '#050505',
                  }}
                >
                  Nested Objects connected me with three quality firms in my first week. The
                  directory alone is worth the membership. Game changer for my inspection
                  business!
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    MJ
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Marcus Johnson</div>
                    <div style={{ fontSize: '0.85rem', color: '#65676b' }}>
                      Property Inspector, Atlanta GA
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  borderLeft: '4px solid #667eea',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  style={{
                    fontSize: '3rem',
                    color: '#667eea',
                    marginBottom: '1rem',
                    lineHeight: 1,
                  }}
                >
                  "
                </div>
                <p
                  style={{
                    fontSize: '1.05rem',
                    lineHeight: 1.6,
                    margin: '0 0 1.5rem 0',
                    color: '#050505',
                  }}
                >
                  The training resources helped me land higher-paying contracts. I went from
                  $25 per inspection to $45 in just two months. Best investment I've made.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    SC
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Sarah Chen</div>
                    <div style={{ fontSize: '0.85rem', color: '#65676b' }}>
                      Occupancy Inspector, Phoenix AZ
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  borderLeft: '4px solid #667eea',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  style={{
                    fontSize: '3rem',
                    color: '#667eea',
                    marginBottom: '1rem',
                    lineHeight: 1,
                  }}
                >
                  "
                </div>
                <p
                  style={{
                    fontSize: '1.05rem',
                    lineHeight: 1.6,
                    margin: '0 0 1.5rem 0',
                    color: '#050505',
                  }}
                >
                  As a new notary, I had no idea how to find consistent work. The AI assistant
                  answered all my questions and the job board is updated daily. Highly
                  recommend!
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    DM
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>David Martinez</div>
                    <div style={{ fontSize: '0.85rem', color: '#65676b' }}>
                      Mobile Notary, Dallas TX
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Enhanced */}
        {!isAuthenticated && (
          <section
            style={{
              padding: '4rem 2rem',
              maxWidth: '1200px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                padding: '3rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <h3
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                }}
              >
                Ready to Level Up Your Field Service Career?
              </h3>
              <p
                style={{
                  fontSize: '1.15rem',
                  color: '#6b7280',
                  marginBottom: '2rem',
                  maxWidth: '700px',
                  margin: '0 auto 2rem',
                  lineHeight: 1.6,
                }}
              >
                Join thousands of inspectors, notaries, and contractors who are finding better
                opportunities, building skills, and growing their businesses.
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
                    padding: '1rem 2.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
                  }}
                >
                  Start Free Today
                </a>
                <Link
                  href="/membership"
                  style={{
                    display: 'inline-block',
                    padding: '1rem 2.5rem',
                    backgroundColor: 'white',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                  }}
                >
                  View Pricing
                </Link>
              </div>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  marginTop: '1.5rem',
                }}
              >
                💳 No credit card required · 🔒 Cancel anytime · ⚡ Set up in 2 minutes
              </p>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer
          style={{
            padding: '3rem 2rem 1.5rem',
            backgroundColor: '#050505',
            color: 'white',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '2rem',
                marginBottom: '3rem',
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Product</h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <Link
                    href="/directory"
                    style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }}
                  >
                    Directory
                  </Link>
                  <Link
                    href="/tools"
                    style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }}
                  >
                    Tools
                  </Link>
                  <Link
                    href="/resources"
                    style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }}
                  >
                    Resources
                  </Link>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Company</h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <Link
                    href="/about"
                    style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }}
                  >
                    About Us
                  </Link>
                  <Link
                    href="/membership"
                    style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }}
                  >
                    Pricing
                  </Link>
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid #333',
                paddingTop: '2rem',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '0.875rem',
              }}
            >
              <p style={{ margin: 0 }}>© 2025 Nested Objects LLC. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
