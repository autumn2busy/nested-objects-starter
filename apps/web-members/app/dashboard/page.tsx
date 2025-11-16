'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'

// Map Outseta plan UIDs to human labels
const PLAN_LABELS: { [key: string]: string } = {
  L9nbKV9Z: 'Starter',
  rQVqlLm6: 'Pro',
  NmdnNO90: 'Elite',
  rmk5Xk9g: 'Agency',
}

const PLAN_COLORS: { [key: string]: string } = {
  L9nbKV9Z: '#10b981', // Starter . emerald
  rQVqlLm6: '#3b82f6', // Pro . blue
  NmdnNO90: '#a855f7', // Elite . purple
  rmk5Xk9g: '#f59e0b', // Agency . amber
}

function getPlanLabel(planUid?: string | null) {
  if (!planUid) return 'No active plan'
  return PLAN_LABELS[planUid] || 'Unknown plan'
}

function getPlanColor(planUid?: string | null) {
  if (!planUid) return '#e5e7eb'
  return PLAN_COLORS[planUid] || '#e5e7eb'
}

function getProfileCompletion(user: any, planUid?: string | null) {
  let score = 0

  if (user?.given_name || user?.name) score += 30
  if (user?.email) score += 30
  if (planUid) score += 40

  // Clamp just in case
  return Math.max(0, Math.min(100, score))
}

export default function DashboardPage() {
  const { user, planUid, isLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  // Protect the route . kick unauthenticated users back home
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  const completion = getProfileCompletion(user, planUid)
  const planLabel = getPlanLabel(planUid)
  const planColor = getPlanColor(planUid)

  const displayName =
    user?.given_name ||
    (user?.name && String(user.name).split(' ')[0]) ||
    'Member'

  if (isLoading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>Checking your session...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    // Brief state while redirecting unauthenticated users
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Redirecting you to the home page...
        </p>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        {/* Header / profile identity */}
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '2.25rem',
                lineHeight: 1.1,
                fontWeight: 700,
                marginBottom: '0.5rem',
              }}
            >
              Welcome back, {displayName}! 👋
            </h1>
            <p
              style={{
                color: '#6b7280',
                fontSize: '1.05rem',
                marginBottom: '0.35rem',
              }}
            >
              This is your Nested Objects home base
            </p>
            <p
              style={{
                color: '#4b5563',
                fontSize: '0.95rem',
              }}
            >
              Signed in as <strong>{user?.email}</strong>
            </p>
          </div>

          <button
            onClick={logout}
            style={{
              borderRadius: '999px',
              padding: '0.45rem 1.1rem',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              color: '#111827',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
            }}
          >
            Log out
          </button>
        </header>

        {/* Profile overview card with completion bar */}
        <section
          style={{
            marginBottom: '2rem',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '1.5rem 1.75rem',
            boxShadow: '0 10px 15px rgba(15,23,42,0.03)',
            border: '1px solid #e5e7eb',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.85rem',
            }}
          >
            Profile overview
          </h2>

          <p
            style={{
              fontSize: '0.95rem',
              color: '#4b5563',
              marginBottom: '0.5rem',
            }}
          >
            Profile completeness. <strong>{completion}%</strong>
          </p>

          <div
            style={{
              width: '100%',
              height: '0.6rem',
              backgroundColor: '#e5e7eb',
              borderRadius: '999px',
              overflow: 'hidden',
              marginBottom: '0.75rem',
            }}
          >
            <div
              style={{
                width: `${completion}%`,
                height: '100%',
                background:
                  'linear-gradient(to right, #3b82f6, #8b5cf6)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <p
            style={{
              fontSize: '0.9rem',
              color: '#6b7280',
            }}
          >
            Next step. add your service area and skills so hiring firms can match you faster.
          </p>
        </section>

        {/* Account overview + first steps checklist */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr)',
            gap: '1.75rem',
            marginBottom: '2.5rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Account card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 10px 15px rgba(15,23,42,0.03)',
              border: `1px solid ${planColor}`,
            }}
          >
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}
            >
              Account overview
            </h2>

            <p
              style={{
                fontSize: '0.95rem',
                color: '#4b5563',
                marginBottom: '0.5rem',
              }}
            >
              Current plan.{' '}
              <span
                style={{
                  fontWeight: 600,
                  color: planColor,
                }}
              >
                {planLabel}
              </span>
            </p>

            <p
              style={{
                fontSize: '0.9rem',
                color: '#6b7280',
                marginBottom: '1rem',
              }}
            >
              Upgrade when you are ready for more tools, not before.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <Link
                href="/membership"
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '999px',
                  border: `1px solid ${planColor}`,
                  fontSize: '0.9rem',
                  color: planColor,
                  textDecoration: 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                View plans
              </Link>
              <Link
                href="/directory"
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '999px',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.9rem',
                  color: '#111827',
                  textDecoration: 'none',
                  backgroundColor: '#f9fafb',
                }}
              >
                Open firm directory
              </Link>
            </div>
          </div>

          {/* First steps checklist */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 10px 15px rgba(15,23,42,0.03)',
              border: '1px solid #e5e7eb',
            }}
          >
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}
            >
              First steps checklist
            </h2>

            <ol
              style={{
                listStyle: 'decimal',
                paddingLeft: '1.25rem',
                display: 'grid',
                rowGap: '0.55rem',
                fontSize: '0.95rem',
                color: '#4b5563',
              }}
            >
              <li>Finish your profile basics. name, email, service area.</li>
              <li>
                <Link
                  href="/directory"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'underline',
                  }}
                >
                  Bookmark three hiring firms
                </Link>{' '}
                you would love to work with.
              </li>
              <li>
                Skim the Field Inspection Starter Kit so you understand how the
                work and payouts actually flow.
              </li>
              <li>Block off time this week to complete your first three inspections.</li>
            </ol>
          </div>
        </section>

        {/* Activity + shortcuts */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr)',
            gap: '1.75rem',
            marginBottom: '2rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Recent activity */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 10px 15px rgba(15,23,42,0.03)',
              border: '1px solid #e5e7eb',
            }}
          >
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}
            >
              Recent activity
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#6b7280',
              }}
            >
              No recent activity yet.{' '}
              <Link
                href="/directory"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'underline',
                }}
              >
                Open the firm directory
              </Link>{' '}
              and start building your list.
            </p>
          </div>

          {/* Shortcuts */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 10px 15px rgba(15,23,42,0.03)',
              border: '1px solid #e5e7eb',
            }}
          >
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}
            >
              Shortcuts
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                rowGap: '0.55rem',
                fontSize: '0.95rem',
              }}
            >
              <li>
                <Link
                  href="/directory"
                  style={{
                    color: '#111827',
                    textDecoration: 'none',
                  }}
                >
                  → Browse hiring firms
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  style={{
                    color: '#111827',
                    textDecoration: 'none',
                  }}
                >
                  → View training and templates
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  style={{
                    color: '#111827',
                    textDecoration: 'none',
                  }}
                >
                  → Ask a question or get help
                </Link>
              </li>
            </ul>
          </div>
        </section>

        <footer
          style={{
            fontSize: '0.8rem',
            color: '#9ca3af',
            textAlign: 'center',
            marginTop: '1rem',
          }}
        >
          Built for field inspectors . not just software people.
        </footer>
      </div>
    </main>
  )
}
