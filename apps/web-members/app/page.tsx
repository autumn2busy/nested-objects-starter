'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const auth = useAuth() as any
  const { isAuthenticated, isLoading } = auth
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', color: '#65676b' }}>
          <div
            style={{
              fontSize: '2rem',
              marginBottom: '1rem',
            }}
          >
            ⏳
          </div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Redirecting to dashboard
  }

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#050505',
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.25rem',
              }}
            >
              NO
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Nested Objects
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div
            style={{
              display: 'none',
              gap: '2rem',
              alignItems: 'center',
            }}
            className="desktop-nav"
          >
            <a
              href="#benefits"
              style={{
                color: '#050505',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
              }}
            >
              Benefits
            </a>
            <a
              href="#testimonials"
              style={{
                color: '#050505',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
              }}
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              style={{
                color: '#050505',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
              }}
            >
              Pricing
            </a>
            <a
              href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              Log in
            </a>
            <a
              href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '6px',
                backgroundColor: '#667eea',
                color: 'white',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              Get Started Free
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              display: 'block',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
            className="mobile-menu-btn"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div
            style={{
              backgroundColor: 'white',
              borderTop: '1px solid #e5e7eb',
              padding: '1rem 1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <a
                href="#benefits"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  color: '#050505',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                Benefits
              </a>
              <a
                href="#testimonials"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  color: '#050505',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                Testimonials
              </a>
              <a
                href="#pricing"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  color: '#050505',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                Pricing
              </a>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                Log in
              </a>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '6px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                Get Started Free
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '5rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              fontWeight: 700,
              margin: '0 0 1.5rem 0',
              lineHeight: 1.1,
            }}
          >
            Your AI-Powered Hub for Field Service Professionals
          </h1>
          <p
            style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
              margin: '0 0 2.5rem 0',
              opacity: 0.95,
              lineHeight: 1.6,
            }}
          >
            Connect with top firms, access exclusive training, and grow your career
            as an inspector, notary, or field service contractor — all in one place.
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
                padding: '1rem 2.5rem',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Start Free Today
            </a>
            <a
              href="#benefits"
              style={{
                padding: '1rem 2.5rem',
                borderRadius: '8px',
                border: '2px solid white',
                backgroundColor: 'transparent',
                color: 'white',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Learn More
            </a>
          </div>

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

      {/* Benefits Section */}
      <section
        id="benefits"
        style={{
          padding: '5rem 1.5rem',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                fontWeight: 700,
                margin: '0 0 1rem 0',
              }}
            >
              Everything You Need to Succeed
            </h2>
            <p
              style={{
                fontSize: '1.1rem',
                color: '#65676b',
                maxWidth: '700px',
                margin: '0 auto',
              }}
            >
              From finding work to building skills, Nested Objects provides the tools
              and connections field service professionals need to thrive.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Benefit Card 1 */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                }}
              >
                🏢
              </div>
              <h3
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: '0 0 0.75rem 0',
                }}
              >
                Exclusive Firm Directory
              </h3>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#65676b',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Access hundreds of vetted field service companies actively hiring
                inspectors, notaries, and contractors. Filter by location, pay range,
                and specialty.
              </p>
            </div>

            {/* Benefit Card 2 */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                }}
              >
                🎓
              </div>
              <h3
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: '0 0 0.75rem 0',
                }}
              >
                Professional Training
              </h3>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#65676b',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Level up with courses on inspection protocols, compliance standards,
                photography best practices, and business development specifically for
                field service pros.
              </p>
            </div>

            {/* Benefit Card 3 */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                }}
              >
                🤖
              </div>
              <h3
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: '0 0 0.75rem 0',
                }}
              >
                AI Career Assistant
              </h3>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#65676b',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Get instant answers about firms, application tips, route optimization,
                and industry trends from our AI-powered concierge trained on field
                service expertise.
              </p>
            </div>

            {/* Benefit Card 4 */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                }}
              >
                💼
              </div>
              <h3
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: '0 0 0.75rem 0',
                }}
              >
                Job Board & Alerts
              </h3>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#65676b',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Browse thousands of field service opportunities and get matched to jobs
                based on your skills, location, and preferences. Never miss your next
                gig.
              </p>
            </div>

            {/* Benefit Card 5 */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                }}
              >
                🔧
              </div>
              <h3
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: '0 0 0.75rem 0',
                }}
              >
                Tools & Resources
              </h3>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#65676b',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Templates, checklists, contract samples, and productivity tools built
                specifically for inspectors and field service contractors.
              </p>
            </div>

            {/* Benefit Card 6 */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                }}
              >
                👥
              </div>
              <h3
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: '0 0 0.75rem 0',
                }}
              >
                Community Network
              </h3>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#65676b',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Connect with thousands of field service professionals, share tips, ask
                questions, and build relationships that lead to referrals and
                partnerships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        style={{
          padding: '5rem 1.5rem',
          backgroundColor: 'white',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                fontWeight: 700,
                margin: '0 0 1rem 0',
              }}
            >
              Trusted by Field Service Professionals
            </h2>
            <p
              style={{
                fontSize: '1.1rem',
                color: '#65676b',
                maxWidth: '700px',
                margin: '0 auto',
              }}
            >
              See how Nested Objects is helping inspectors and contractors grow their
              careers
            </p>
          </div>

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
                backgroundColor: '#f9fafb',
                padding: '2rem',
                borderRadius: '12px',
                borderLeft: '4px solid #667eea',
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
                Nested Objects connected me with three quality firms in my first week.
                The directory alone is worth the membership. Game changer for my
                inspection business!
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
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    Marcus Johnson
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#65676b' }}>
                    Property Inspector, Atlanta GA
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div
              style={{
                backgroundColor: '#f9fafb',
                padding: '2rem',
                borderRadius: '12px',
                borderLeft: '4px solid #667eea',
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
                The training resources helped me land higher-paying contracts. I went
                from $25 per inspection to $45 in just two months. Best investment
                I've made.
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
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    Sarah Chen
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#65676b' }}>
                    Occupancy Inspector, Phoenix AZ
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div
              style={{
                backgroundColor: '#f9fafb',
                padding: '2rem',
                borderRadius: '12px',
                borderLeft: '4px solid #667eea',
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
                As a new notary, I had no idea how to find consistent work. The AI
                assistant answered all my questions and the job board is updated daily.
                Highly recommend!
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
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    David Martinez
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#65676b' }}>
                    Mobile Notary, Dallas TX
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        style={{
          padding: '5rem 1.5rem',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                fontWeight: 700,
                margin: '0 0 1rem 0',
              }}
            >
              Simple, Transparent Pricing
            </h2>
            <p
              style={{
                fontSize: '1.1rem',
                color: '#65676b',
                maxWidth: '700px',
                margin: '0 auto',
              }}
            >
              Start free, upgrade when you're ready. No hidden fees, cancel anytime.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              maxWidth: '1000px',
              margin: '0 auto',
            }}
          >
            {/* Free Plan */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '2.5rem 2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                textAlign: 'center',
              }}
            >
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '0 0 0.5rem 0',
                }}
              >
                Starter
              </h3>
              <div style={{ fontSize: '3rem', fontWeight: 700, margin: '1rem 0' }}>
                $0
              </div>
              <p style={{ fontSize: '0.9rem', color: '#65676b', margin: '0 0 2rem 0' }}>
                Forever free
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 2rem 0',
                  textAlign: 'left',
                }}
              >
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Browse firm directory</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Basic job board access</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Community forum</span>
                </li>
              </ul>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                style={{
                  display: 'block',
                  padding: '0.85rem 2rem',
                  borderRadius: '8px',
                  border: '2px solid #667eea',
                  backgroundColor: 'white',
                  color: '#667eea',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Get Started Free
              </a>
            </div>

            {/* Pro Plan - Featured */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '2.5rem 2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(102,126,234,0.25)',
                textAlign: 'center',
                border: '2px solid #667eea',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#667eea',
                  color: 'white',
                  padding: '0.25rem 1rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                MOST POPULAR
              </div>
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '0 0 0.5rem 0',
                }}
              >
                Pro
              </h3>
              <div style={{ fontSize: '3rem', fontWeight: 700, margin: '1rem 0' }}>
                $37
                <span style={{ fontSize: '1rem', fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#65676b', margin: '0 0 2rem 0' }}>
                Billed monthly
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 2rem 0',
                  textAlign: 'left',
                }}
              >
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Everything in Starter</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Full firm details & contacts</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>AI career assistant</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Training library access</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Job alerts & matching</span>
                </li>
              </ul>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                style={{
                  display: 'block',
                  padding: '0.85rem 2rem',
                  borderRadius: '8px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Start Pro Trial
              </a>
            </div>

            {/* Elite Plan */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '2.5rem 2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                textAlign: 'center',
              }}
            >
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '0 0 0.5rem 0',
                }}
              >
                Elite
              </h3>
              <div style={{ fontSize: '3rem', fontWeight: 700, margin: '1rem 0' }}>
                $97
                <span style={{ fontSize: '1rem', fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#65676b', margin: '0 0 2rem 0' }}>
                For serious pros
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 2rem 0',
                  textAlign: 'left',
                }}
              >
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Everything in Pro</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Priority firm introductions</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Advanced AI job intel</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>1-on-1 career coaching</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>Exclusive partner perks</span>
                </li>
              </ul>
              <a
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                style={{
                  display: 'block',
                  padding: '0.85rem 2rem',
                  borderRadius: '8px',
                  border: '2px solid #667eea',
                  backgroundColor: 'white',
                  color: '#667eea',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Go Elite
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        style={{
          padding: '5rem 1.5rem',
          backgroundColor: 'white',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 700,
              margin: '0 0 1.5rem 0',
            }}
          >
            Ready to Level Up Your Field Service Career?
          </h2>
          <p
            style={{
              fontSize: '1.15rem',
              color: '#65676b',
              margin: '0 0 2.5rem 0',
              lineHeight: 1.6,
            }}
          >
            Join thousands of inspectors, notaries, and contractors who are finding
            better opportunities, building skills, and growing their businesses with
            Nested Objects.
          </p>
          <a
            href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
            style={{
              display: 'inline-block',
              padding: '1.15rem 3rem',
              borderRadius: '8px',
              backgroundColor: '#667eea',
              color: 'white',
              textDecoration: 'none',
              fontSize: '1.15rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(102,126,234,0.35)',
            }}
          >
            Get Started Free — No Credit Card Required
          </a>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#65676b',
              marginTop: '1.5rem',
            }}
          >
            💳 No credit card required · 🔒 Cancel anytime · ⚡ Set up in 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#050505',
          color: 'white',
          padding: '3rem 1.5rem 1.5rem',
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
                <a
                  href="#benefits"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  Pricing
                </a>
                <a
                  href="#testimonials"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  Testimonials
                </a>
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
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  Contact
                </Link>
                <Link
                  href="/careers"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  Careers
                </Link>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Resources</h4>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <Link
                  href="/blog"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  Blog
                </Link>
                <Link
                  href="/help"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  Help Center
                </Link>
                <Link
                  href="/guides"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  Industry Guides
                </Link>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Legal</h4>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <Link
                  href="/privacy"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #333',
              paddingTop: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#9ca3af' }}>
              © 2025 Nested Objects. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a
                href="https://twitter.com/nestedobjects"
                style={{ color: '#9ca3af', fontSize: '1.25rem' }}
              >
                𝕏
              </a>
              <a
                href="https://linkedin.com/company/nested-objects"
                style={{ color: '#9ca3af', fontSize: '1.25rem' }}
              >
                in
              </a>
              <a
                href="https://facebook.com/nestedobjects"
                style={{ color: '#9ca3af', fontSize: '1.25rem' }}
              >
                f
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for responsive nav */}
      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
