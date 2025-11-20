'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'

function getPlanName(uid: string | null): string {
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

export default function DashboardPage() {
  const { user, planUid, profileDisplayName, isLoading, isAuthenticated, logout } =
    useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  const planName = getPlanName(planUid ?? null)

  const firstName =
    profileDisplayName ??
    (user as any)?.first_name ??
    (user as any)?.FirstName ??
    (user?.name ? user.name.split(' ')[0] : undefined) ??
    (user?.email ? user.email.split('@')[0] : undefined) ??
    'Member'

  const initials = firstName.charAt(0).toUpperCase()

  if (isLoading || !isAuthenticated || !user) {
    return (
      <main
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '4rem 2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <p>Loading your dashboard…</p>
      </main>
    )
  }

  return (
    <main
      style={{
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top nav */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1.75rem',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Nested Objects</h1>
          <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.95rem' }}>
            <Link href="/" style={{ textDecoration: 'none', color: '#111827' }}>
              Home
            </Link>
            <Link
              href="/dashboard"
              style={{ textDecoration: 'none', color: '#111827' }}
            >
              Dashboard
            </Link>
            <Link
              href="/directory"
              style={{ textDecoration: 'none', color: '#111827' }}
            >
              Directory
            </Link>
            <Link
              href="/membership"
              style={{ textDecoration: 'none', color: '#111827' }}
            >
              Membership
            </Link>
            <Link href="/tools" style={{ textDecoration: 'none', color: '#111827' }}>
              Tools
            </Link>
            <Link
              href="/resources"
              style={{ textDecoration: 'none', color: '#111827' }}
            >
              Resources
            </Link>
            <Link
              href="/profile"
              style={{ textDecoration: 'none', color: '#111827' }}
            >
              Profile
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link
            href="/profile"
            style={{ textDecoration: 'none', color: '#111827' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                  cursor: 'pointer',
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
                  <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    {planName} plan
                  </span>
                )}
              </div>
            </div>
          </Link>

          <button
            onClick={() => logout()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* Dashboard content */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          Welcome back, {firstName}! 👋
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          This is your Nested Objects home base.
        </p>

        {/* Profile completeness bar */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            marginBottom: '2rem',
            backgroundColor: 'white',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            <span style={{ fontWeight: 600 }}>Profile completeness</span>
            <span style={{ color: '#6b7280' }}>100%</span>
          </div>
          <div
            style={{
              height: '6px',
              borderRadius: '999px',
              backgroundColor: '#e5e7eb',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#6366f1',
              }}
            />
          </div>
          <p
            style={{
              marginTop: '0.75rem',
              fontSize: '0.9rem',
              color: '#6b7280',
            }}
          >
            Next step. add your service area and skills so hiring firms can match you
            faster.
          </p>
        </div>
      </section>

      {/* Two column main grid */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Account overview */}
        <div
          style={{
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid #bbf7d0',
            backgroundColor: '#ecfdf5',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Account overview
          </h3>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#166534',
              marginBottom: '0.5rem',
            }}
          >
            Current plan. <strong>{planName}</strong>
          </p>
          <p
            style={{
              fontSize: '0.85rem',
              color: '#166534',
              marginBottom: '1rem',
            }}
          >
            Upgrade when you are ready for more tools. not before.
          </p>
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
                padding: '0.5rem 0.9rem',
                borderRadius: '999px',
                border: '1px solid #16a34a',
                color: '#166534',
                fontSize: '0.85rem',
                textDecoration: 'none',
                backgroundColor: 'white',
              }}
            >
              View plans
            </Link>
            <Link
              href="/directory"
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '999px',
                border: '1px solid #16a34a',
                color: '#166534',
                fontSize: '0.85rem',
                textDecoration: 'none',
                backgroundColor: 'white',
              }}
            >
              Open firm directory
            </Link>
          </div>
        </div>

        {/* First steps */}
        <div
          style={{
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            First steps checklist
          </h3>
          <ol
            style={{
              paddingLeft: '1.25rem',
              fontSize: '0.9rem',
              color: '#4b5563',
            }}
          >
            <li>Finish your profile basics. name, email, service area.</li>
            <li>Bookmark three hiring firms you would love to work with.</li>
            <li>
              Skim the Field Inspection Starter Kit so you understand how the work and
              payouts actually flow.
            </li>
            <li>Block off time this week to complete your first three inspections.</li>
          </ol>
        </div>
      </section>

      {/* Bottom grid. Recent activity + shortcuts */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
      >
        <div
          style={{
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            Recent activity
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            No recent activity yet.{' '}
            <Link href="/directory" style={{ color: '#2563eb' }}>
              Open the firm directory
            </Link>{' '}
            and start building your list.
          </p>
        </div>

        <div
          style={{
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            Shortcuts
          </h3>
          <ul
            style={{
              paddingLeft: '1.25rem',
              fontSize: '0.9rem',
              color: '#4b5563',
            }}
          >
            <li>
              <Link href="/directory" style={{ color: '#2563eb' }}>
                Browse hiring firms
              </Link>
            </li>
            <li>
              <Link href="/resources/firm-intel" style={{ color: '#2563eb' }}>
                View firm intel and templates
              </Link>
            </li>
            <li>
              <Link href="/tools/ai-chatbot" style={{ color: '#2563eb' }}>
                Ask a question or get help
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  )
}
