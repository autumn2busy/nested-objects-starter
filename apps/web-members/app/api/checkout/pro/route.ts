import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set; Pro checkout will be disabled.')
}

if (!publishableKey) {
  console.warn(
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set; the client cannot launch Stripe Checkout.',
  )
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })
  : null

// Prefer explicit site/app URL env vars, fall back to localhost for dev only
const resolveSiteUrl = () => {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL

  if (envUrl) return envUrl.replace(/\/$/, '')

  // Last resort. assume local dev
  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  if (!stripe || !publishableKey) {
    return new Response(
      JSON.stringify({
        error: 'Stripe keys are missing. Please configure environment variables.',
      }),
      { status: 500 },
    )
  }

  const siteUrl = resolveSiteUrl()

  try {
    const { email } = (await request.json()) as { email?: string }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${siteUrl}/membership?checkout=success`,
      cancel_url: `${siteUrl}/membership?checkout=cancelled`,
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 3700,
            recurring: { interval: 'month' },
            product_data: {
              name: 'Nested Objects Pro',
              description: 'Pro subscription billed monthly',
            },
          },
          quantity: 1,
        },
      ],
    })

    return new Response(JSON.stringify({ id: session.id }), { status: 200 })
  } catch (error) {
    console.error('Error creating Stripe Checkout session', error)
    return new Response(
      JSON.stringify({ error: 'Unable to start checkout.' }),
      { status: 500 },
    )
  }
}
