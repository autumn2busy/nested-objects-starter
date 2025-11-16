'use client'

import { useAuth } from '@/components/auth-provider'
import Link from 'next/link'

export default function HomePage() {
  const { user, planUid, isLoading, isAuthenticated, logout } = useAuth()

  const getPlanName = (uid: string | null) => {
    switch (uid) {
      case 'L9nbKV9Z': return 'Starter'
      case 'rQVqlLm6': return 'Pro'
      case 'NmdnNO90': return 'Elite'
      case 'rmk5Xk9g': return 'Agency'
      default: return 'Unknown'
    }
  }

  return (
    <main style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: '2rem',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '3rem'
      }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
          Nested Objects
        </h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isLoading ? (
            <span>Loading...</span>
          ) : isAuthenticated && user ? (
            <>
              <span style={{ color: '#6b7280' }}>
                {user.name} ({getPlanName(planUid)})
              </span>
              <button
                onClick={() => logout()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              
                href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                Login
              </a>
              
                href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                Sign Up
              </a>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          AI-Powered Member Hub
        </h2>
        <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem' }}>
          For inspectors, notaries, and field service professionals
        </p>
        {!isAuthenticated && (
          
            href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >
            Get Started Free
          </a>
        )}
      </section>

      {/* Features Grid */}
      <section style={{ marginBottom: '4rem' }}>
        <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
          Member Features
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {/* Feature 1: Directory */}
          <div style={{
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: 'white'
          }}>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              📁 Firm Directory
            </h4>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Access our curated directory of top firms hiring field professionals.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ 
                backgroundColor: '#dbeafe', 
                color: '#1e40af',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                All Plans
              </span>
            </div>
            <Link 
              href="/directory"
              style={{
                color: '#3b82f6',
                textDecoration: 'underline',
                fontSize: '0.875rem'
              }}
            >
              View Directory →
            </Link>
          </div>

          {/* Feature 2: AI Chatbot */}
          <div style={{
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: 'white'
          }}>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              🤖 AI Concierge
            </h4>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Get instant answers about firms, requirements, and industry trends.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ 
                backgroundColor: '#fef3c7', 
                color: '#92400e',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Pro+
              </span>
            </div>
            <Link 
              href="/ai_chatbot"
              style={{
                color: '#3b82f6',
                textDecoration: 'underline',
                fontSize: '0.875rem'
              }}
            >
              Try AI Chatbot →
            </Link>
          </div>

          {/* Feature 3: Job Intel */}
          <div style={{
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: 'white'
          }}>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              📊 Job Intel
            </h4>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Get detailed insights on pay rates, requirements, and hiring trends.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ 
                backgroundColor: '#fef3c7', 
                color: '#92400e',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Pro+
              </span>
            </div>
            <Link 
              href="/job_intel"
              style={{
                color: '#3b82f6',
                textDecoration: 'underline',
                fontSize: '0.875rem'
              }}
            >
              View Intel →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section style={{
          padding: '3rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Ready to grow your business?
          </h3>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
            Join thousands of field professionals already using Nested Objects.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            
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
                textDecoration: 'none'
              }}
            >
              Start Free Trial
            </a>
            <Link
              href="/upgrade"
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                backgroundColor: 'white',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              View Pricing
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: '4rem',
        paddingTop: '2rem',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        <p>© 2025 Nested Objects LLC. All rights reserved.</p>
      </footer>
    </main>
  )
}
