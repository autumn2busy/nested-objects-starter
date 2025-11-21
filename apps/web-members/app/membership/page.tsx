'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'

import { useAuth } from '@/components/auth-provider'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

function MembershipContent() {
  const searchParams = useSearchParams()
  const checkoutStatus = searchParams.get('checkout')

  const { isAuthenticated, planUid, user } = useAuth()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const startProCheckout = async () => {
    if (!stripePromise || !publishableKey) {
      setCheckoutError('Stripe is not configured. Add your publishable key to continue.')
      return
    }

    setCheckoutError(null)
    setIsCheckingOut(true)

    try {
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to initialize.')
      }

      const response = await fetch('/api/checkout/pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:
            (user?.email as string | undefined) ??
            (user?.Email as string | undefined) ??
            undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data?.id) {
        throw new Error(data?.error || 'Unable to start checkout.')
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: data.id })
      if (error) {
        throw error
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to start checkout. Please try again.'
      setCheckoutError(message)
    } finally {
      setIsCheckingOut(false)
    }
  }

  const proCheckoutUrl =
    'https://nested-objects.outseta.com/auth?widgetMode=register&planUid=rQVqlLm6&planPaymentTerm=month&skipPlanOptions=true'

  const plans = [
    {
      name: 'Starter',
      planUid: 'L9nbKV9Z',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      highlight: false,
      features: [
        'Access to Firm Directory',
        'Basic search functionality',
        'Community support',
        'Monthly newsletter',
        'Resource library access'
      ]
    },
    {
      name: 'Pro',
      planUid: 'rQVqlLm6',
      price: '$37',
      period: 'month',
      description: 'For professionals who want more',
      highlight: true,
      features: [
        'Everything in Starter',
        'AI Chatbot Concierge',
        'Job Intel Reports',
        'Priority email support',
        'Advanced search filters',
        'Weekly market insights',
        'Export capabilities'
      ]
    },
    {
      name: 'Elite',
      planUid: 'NmdnNO90',
      price: '$97',
      period: 'month',
      description: 'For power users and agencies',
      highlight: false,
      features: [
        'Everything in Pro',
        'Priority Support (24hr response)',
        'Custom integrations',
        'Dedicated account manager',
        'Early access to features',
        'White-label options',
        'API access',
        'Custom reports'
      ]
    },
    {
      name: 'Agency',
      planUid: 'rmk5Xk9g',
      price: '$297',
      period: 'month',
      description: 'For teams and organizations',
      highlight: false,
      features: [
        'Everything in Elite',
        'Multi-user accounts (up to 10)',
        'White Label branding',
        'Custom domain',
        'SLA guarantees',
        'Onboarding & training',
        'Quarterly strategy calls',
        'Custom feature development'
      ]
    }
  ]

  return (
    <main style={{
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '3rem 2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          fontWeight: 'bold', 
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
          Unlock powerful tools and grow your business with Nested Objects
        </p>
        {isAuthenticated && (
          <p style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '8px', color: '#1e40af' }}>
            Current plan: <strong>{plans.find(p => p.planUid === planUid)?.name || 'Unknown'}</strong>
          </p>
        )}

        {checkoutStatus === 'success' && (
          <p style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#ecfdf3',
            borderRadius: '8px',
            color: '#065f46',
            fontWeight: 600
          }}>
            Checkout succeeded — your Pro subscription is being activated.
          </p>
        )}
        {checkoutStatus === 'cancelled' && (
          <p style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            color: '#92400e',
            fontWeight: 600
          }}>
            Checkout was cancelled. You can restart whenever you're ready.
          </p>
        )}
      </header>

      {/* Guided QA instructions for creating a Pro profile with Stripe test cards */}
      <section style={{
        marginBottom: '3rem',
        padding: '1.5rem',
        border: '1px solid #d1fae5',
        backgroundColor: '#ecfdf3',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(16, 185, 129, 0.08)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#065f46', marginBottom: '0.5rem' }}>
          QA: Create a Pro profile with Stripe test payment cards
        </h2>
        <ol style={{ paddingLeft: '1.25rem', color: '#064e3b', lineHeight: 1.8, marginBottom: '1rem' }}>
          <li>Click the green "Start Pro Checkout" button below and register with any test name/email.</li>
          <li>The Pro monthly plan will be preselected automatically in the Stripe Checkout flow.</li>
          <li>
            Open the <a href={proCheckoutUrl} style={{ color: '#047857', fontWeight: 600 }}>Pro checkout link</a> and register
            with any test name/email.
          </li>
          <li>Choose the Pro monthly plan when prompted (preselected via the link above).</li>
          <li>
            Use Stripe test card <code style={{ background: '#d1fae5', padding: '0.15rem 0.35rem', borderRadius: '6px' }}>4242 4242 4242 4242</code>,
            any future expiry, CVC, and ZIP to complete the payment.
          </li>
          <li>Finish onboarding and you will land on the dashboard with Pro entitlements.</li>
        </ol>
        <p style={{ margin: 0, color: '#047857' }}>
          This flow creates a Pro test profile without charging a real card and is safe to repeat during QA.
        </p>
      </section>

      {/* Pricing Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginBottom: '4rem'
      }}>
        {plans.map((plan) => {
          const isCurrentPlan = planUid === plan.planUid
          
          return (
            <div
              key={plan.planUid}
              style={{
                border: plan.highlight ? '3px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '2.5rem 2rem',
                position: 'relative',
                backgroundColor: 'white',
                boxShadow: plan.highlight ? '0 10px 40px rgba(59, 130, 246, 0.15)' : '0 4px 6px rgba(0, 0, 0, 0.05)',
                transform: plan.highlight ? 'scale(1.02)' : 'scale(1)',
                transition: 'transform 0.2s'
              }}
            >
              {/* Highlight Badge */}
              {plan.highlight && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.375rem 1.25rem',
                  borderRadius: '999px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                }}>
                  Most Popular
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  right: '1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '0.375rem 1rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  Current Plan
                </div>
              )}

              {/* Plan Header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {plan.name}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                  {plan.description}
                </p>
              </div>

              {/* Pricing */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#111827' }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: '1rem', color: '#6b7280' }}>
                    / {plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                marginBottom: '2rem',
                lineHeight: '2.2'
              }}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    fontSize: '0.95rem'
                  }}>
                    <span style={{ 
                      marginRight: '0.75rem', 
                      color: '#10b981',
                      fontSize: '1.25rem',
                      lineHeight: '1'
                    }}>
                      ✓
                    </span>
                    <span style={{ color: '#374151' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {plan.planUid === 'rQVqlLm6' ? (
                <button
                  onClick={startProCheckout}
                  disabled={isCurrentPlan || isCheckingOut}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: isCurrentPlan
                      ? '#9ca3af'
                      : plan.highlight
                        ? '#3b82f6'
                        : 'white',
                    color: isCurrentPlan ? 'white' : (plan.highlight ? 'white' : '#3b82f6'),
                    border: plan.highlight ? 'none' : '2px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    cursor: isCurrentPlan || isCheckingOut ? 'not-allowed' : 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    pointerEvents: isCurrentPlan || isCheckingOut ? 'none' : 'auto'
                  }}
                >
                  {isCurrentPlan
                    ? 'Current Plan'
                    : isCheckingOut
                      ? 'Starting checkout...'
                      : 'Get Started'}
                </button>
              ) : (
                <a
                  href={`https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${plan.planUid}&planPaymentTerm=month&skipPlanOptions=true`}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: isCurrentPlan ? '#9ca3af' : (plan.highlight ? '#3b82f6' : 'white'),
                    color: isCurrentPlan ? 'white' : (plan.highlight ? 'white' : '#3b82f6'),
                    border: plan.highlight ? 'none' : '2px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    cursor: isCurrentPlan ? 'not-allowed' : 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    pointerEvents: isCurrentPlan ? 'none' : 'auto'
                  }}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Get Started'}
                </a>
              )}

              {plan.name === 'Starter' && (
                <p style={{ 
                  marginTop: '1rem', 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  No credit card required
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* FAQ Section */}
      <section style={{
        marginTop: '5rem',
        padding: '3rem',
        backgroundColor: '#f9fafb',
        borderRadius: '12px'
      }}>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Frequently Asked Questions
        </h2>
        
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Can I change plans anytime?
            </h3>
            <p style={{ color: '#6b7280' }}>
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              What payment methods do you accept?
            </h3>
            <p style={{ color: '#6b7280' }}>
              We accept all major credit cards (Visa, Mastercard, Amex, Discover) processed securely through Stripe.
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Is there a free trial?
            </h3>
            <p style={{ color: '#6b7280' }}>
              Yes! Our Starter plan is completely free forever. No credit card required. Upgrade anytime to unlock premium features.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Can I cancel my subscription?
            </h3>
            <p style={{ color: '#6b7280' }}>
              Absolutely. You can cancel anytime from your profile. You'll retain access until the end of your billing period.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{
        marginTop: '4rem',
        padding: '3rem',
        backgroundColor: '#111827',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Ready to get started?
        </h2>
        <p style={{ fontSize: '1.125rem', marginBottom: '2rem', opacity: 0.9 }}>
          Join hundreds of field professionals already using Nested Objects
        </p>
        <button
          onClick={startProCheckout}
          disabled={isCheckingOut}
          style={{
            display: 'inline-block',
            padding: '1rem 2.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            fontSize: '1.125rem',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'transform 0.2s',
            cursor: isCheckingOut ? 'not-allowed' : 'pointer',
            opacity: isCheckingOut ? 0.85 : 1,
            border: 'none'
          }}
        >
          {isCheckingOut ? 'Starting checkout...' : 'Start with Pro Plan'}
        </button>
      </section>

      {checkoutError && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecdd3',
          fontWeight: 600
        }}>
          {checkoutError}
        </div>
      )}

      {/* Navigation */}
      <div style={{ 
        marginTop: '3rem', 
        textAlign: 'center',
        paddingTop: '2rem',
        borderTop: '1px solid #e5e7eb'
      }}>
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

export default function MembershipPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '3rem 2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <p style={{ fontSize: '1.125rem', color: '#4b5563' }}>
            Loading membership options...
          </p>
        </main>
      }
    >
      <MembershipContent />
    </Suspense>
  )
}
