/** Read-only runtime verification. Never returns provider payloads or credentials. */
export type ReadinessInput = { expectedStripeAccountId: string; outsetaAccountUid: string }
export async function verifyStripeReadiness(input: ReadinessInput, env: Record<string, string | undefined>, fetcher: typeof fetch = fetch) {
  const result = { authenticated: false, liveKey: false, accountMatched: false, outsetaCustomerMatched: false,
    chargesReadable: false, paymentIntentsReadable: false, refundsReadable: false }
  const key = env.STRIPE_SECRET_KEY?.trim()
  if (!key) return { ...result, code: 'live_key_missing' }
  if (/^pk_/.test(key)) return { ...result, code: 'publishable_key_supplied' }
  if (/^(?:sk|rk)_test_/.test(key)) return { ...result, code: 'test_key_supplied' }
  if (!/^(?:sk|rk)_live_[A-Za-z0-9]+$/.test(key)) return { ...result, code: 'live_key_format_invalid' }
  result.liveKey = true
  const outsetaKey = env.OUTSETA_API_KEY || env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY
  if (!outsetaKey || !env.OUTSETA_API_SECRET) return { ...result, code: 'outseta_configuration_required' }
  const get = async (origin: string, path: string, headers: Record<string, string>) => {
    const response = await fetcher(origin + path, { method: 'GET', redirect: 'error', cache: 'no-store',
      headers, signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw Error('provider_read_failed')
    return response.json()
  }
  const stripe = (path: string) => get('https://api.stripe.com/v1/', path,
    { Authorization: `Bearer ${key}`, 'Stripe-Version': '2025-06-30.basil' })
  try {
    const account = await stripe('account')
    if (!/^acct_[A-Za-z0-9]+$/.test(account.id || '')) throw Error('invalid_account')
    result.authenticated = true
    result.accountMatched = account.id === input.expectedStripeAccountId
    if (!result.accountMatched) return { ...result, code: 'stripe_account_mismatch' }
    const member = await get('https://nested-objects.outseta.com/api/v1/',
      `crm/accounts/${input.outsetaAccountUid}?donotlog=1&fields=Uid,StripeId,IsDemo`,
      { Authorization: `Outseta ${outsetaKey}:${env.OUTSETA_API_SECRET}` })
    if (member.Uid !== input.outsetaAccountUid || member.IsDemo !== false || !/^cus_[A-Za-z0-9]+$/.test(member.StripeId || '')) {
      return { ...result, code: 'outseta_customer_unverified' }
    }
    const customer = await stripe(`customers/${member.StripeId}`)
    result.outsetaCustomerMatched = customer.id === member.StripeId && customer.livemode === true && customer.deleted !== true
    if (!result.outsetaCustomerMatched) return { ...result, code: 'outseta_customer_mismatch' }
    for (const [path, field] of [['charges', 'chargesReadable'], ['payment_intents', 'paymentIntentsReadable'], ['refunds', 'refundsReadable']] as const) {
      const page = await stripe(`${path}?limit=1`)
      if (!Array.isArray(page.data) || page.data.length > 1 || typeof page.has_more !== 'boolean') throw Error('invalid_collection')
      if (path !== 'refunds' && page.data.some((row: { livemode?: boolean }) => row.livemode !== true)) throw Error('nonlive_collection')
      result[field] = true
    }
    return { ...result, code: 'stripe_readiness_verified' }
  } catch {
    return { ...result, code: 'provider_read_unverified' }
  }
}
