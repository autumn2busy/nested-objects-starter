'use client'

import { useAuth } from '@/components/auth-provider'

export default function UpgradePage() {
  const { user, planUid } = useAuth()

  const plans = [
    {
      name: 'Starter',
      uid: 'L9nbKV9Z',
      price: '$0',
      features: [
        'Access to Firm Directory',
        'Basic search functionality',
        'Community support'
      ]
    },
    {
      name: 'Pro',
      uid: 'rQVqlLm6',
      price: '$37/mo',
      features: [
        'Everything in Starter',
        'AI Chatbot Concierge',
        'Job Intel Reports',
        'Priority email support',
        'Advanced search filters'
      ],
      recommended: true
    },
    {
      name: 'Elite',
      uid: 'NmdnNO90',
      price: 'Contact us',
      features: [
        'Everything in Pro',
        'Priority Support',
        'Custom integrations',
        'Dedicated account manager',
        'Early access to new features'
      ]
    },
    {
      name: 'Agency',
      uid: 'rmk5Xk9g',
      price: 'Contact us',
      features: [
        'Everything in Elite',
        'White Label Options',
        'Multi-user accounts',
        'Custom branding',
        'API access',
        'SLA guarantees'
      ]
    }
  ]

  const handleUpgrade = (planUid: string) => {
    if (window.Outseta) {
      window.Outseta.profile.open({
        tab: 'subscriptions'
      })
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
          Unlock more features and grow your business
        </p>
        {user && (
          <p style={{ marginTop: '1rem', color: '#3b82f6' }}>
            Current plan: <strong>{plans.find(p => p.uid === planUid)?.name || 'None'}</strong>
          </p>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem'
      }}>
        {plans.map((plan) => (
          <div
            key={plan.uid}
            style={{
              border: plan.recommended ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '2rem',
              position: 'relative',
              backgroundColor: 'white'
            }}
          >
            {plan.recommended && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.25rem 1rem',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Recommended
              </div>
            )}

            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {plan.name}
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {plan.price}
            </p>

            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              marginBottom: '2rem',
              lineHeight: '2'
            }}>
              {plan.features.map((feature, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ marginRight: '0.5rem', color: '#10b981' }}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.uid)}
              disabled={planUid === plan.uid}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: planUid === plan.uid ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: planUid === plan.uid ? 'not-allowed' : 'pointer'
              }}
            >
              {planUid === plan.uid ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <a 
          href="/"
          style={{
            color: '#3b82f6',
            textDecoration: 'underline',
            fontSize: '1rem'
          }}
        >
          ← Back to home
        </a>
      </div>
    </main>
  )
}
//
// declare global {
  // interface Window {
    // Outseta: any
  //}
//}
