'use client'

import { useAuth } from '@/components/auth-provider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, planUid, isLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  const getPlanName = (uid: string | null) => {
    switch (uid) {
      case 'L9nbKV9Z': return 'Starter'
      case 'rQVqlLm6': return 'Pro'
      case 'NmdnNO90': return 'Elite'
      case 'rmk5Xk9g': return 'Agency'
      default: return 'Unknown'
    }
  }

  const getPlanColor = (uid: string | null) => {
    switch (uid) {
      case 'L9nbKV9Z': return '#3b82f6'
      case 'rQVqlLm6': return '#8b5cf6'
      case 'NmdnNO90': return '#f59e0b'
      case 'rmk5Xk9g': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const hasAccess = (feature: string) => {
    const PLAN_UIDS = {
      STARTER: 'L9nbKV9Z',
      PRO: 'rQVqlLm6',
      ELITE: 'NmdnNO90',
      AGENCY: 'rmk5Xk9g'
    }

    const FEATURE_ACCESS: Record<string, string[]> = {
      directory_access: [PLAN_UIDS.STARTER, PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
      ai_chatbot: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
      job_intel: [PLAN_UIDS.PRO, PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
      priority_support: [PLAN_UIDS.ELITE, PLAN_UIDS.AGENCY],
      white_label: [PLAN_UIDS.AGENCY]
    }

    if (!planUid) return false
    const allowedPlans = FEATURE_ACCESS[feature]
    return allowedPlans ? allowedPlans.includes(planUid) : false
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return (
    <main style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem',
        paddingBottom: '2rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Welcome back, {user?.given_name || user?.name?.split(' ')[0] || 'Member'}! 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            Here's what's happening with your account
          </p>
        </div>
        <button
          onClick={() => logout()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>

      {/* Account Overview */}
      <section style={{
        padding: '2rem',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        marginBottom: '3rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          Account Overview
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Plan Card */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: `2px solid ${getPlanColor(planUid)}`
          }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Current Plan
            </p>
            <p style={{ 
              fontSize: '1.75rem', 
              fontWeight: 'bold',
              color: getPlanColor(planUid),
              marginBottom: '0.5rem'
            }}>
              {getPlanName(planUid)}
            </p>
            <Link
              href="/membership"
              style={{
                color: '#3b82f6',
                textDecoration: 'underline',
                fontSize: '0.875rem'
              }}
            >
              Upgrade plan →
            </Link>
          </div>

          {/* Email Card */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Email
            </p>
            <p style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>
              {user?.email}
            </p>
          </div>

          {/* Account ID Card */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Member Since
            </p>
            <p style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          Quick Actions
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Directory Access */}
          <Link
            href="/directory"
            style={{
              display: 'block',
              padding: '2rem',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📁</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
              Browse Directory
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Access our curated directory of firms
            </p>
            <span style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              All Plans
            </span>
          </Link>

          {/* AI Chatbot */}
          <div
            style={{
              padding: '2rem',
              backgroundColor: hasAccess('ai_chatbot') ? 'white' : '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              opacity: hasAccess('ai_chatbot') ? 1 : 0.6
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤖</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
              AI Concierge
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Get instant answers to your questions
            </p>
            {hasAccess('ai_chatbot') ? (
              <Link
                href="/ai_chatbot"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'underline',
                  fontSize: '0.875rem'
                }}
              >
                Open Chatbot →
              </Link>
            ) : (
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem'
                }}>
                  Pro+
                </span>
                <br />
                <Link
                  href="/membership"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'underline',
                    fontSize: '0.875rem'
                  }}
                >
                  Upgrade to unlock →
                </Link>
              </div>
            )}
          </div>

          {/* Job Intel */}
          <div
            style={{
              padding: '2rem',
              backgroundColor: hasAccess('job_intel') ? 'white' : '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              opacity: hasAccess('job_intel') ? 1 : 0.6
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
              Job Intelligence
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Market insights and trends
            </p>
            {hasAccess('job_intel') ? (
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
            ) : (
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem'
                }}>
                  Pro+
                </span>
                <br />
                <Link
                  href="/membership"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'underline',
                    fontSize: '0.875rem'
                  }}
                >
                  Upgrade to unlock →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recent Activity (Placeholder) */}
      <section style={{
        padding: '2rem',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          Recent Activity
        </h2>
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
          No recent activity to display. Start exploring the directory!
        </p>
      </section>

      {/* Navigation */}
      <div style={{ 
        marginTop: '3rem', 
        textAlign: 'center',
        paddingTop: '2rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <Link 
          href="/"
          style={{
            color: '#3b82f6',
            textDecoration: 'underline',
            fontSize: '1rem',
            marginRight: '2rem'
          }}
        >
          ← Home
        </Link>
        <Link 
          href="/directory"
          style={{
            color: '#3b82f6',
            textDecoration: 'underline',
            fontSize: '1rem'
          }}
        >
          View Directory
        </Link>
      </div>
    </main>
  )
}