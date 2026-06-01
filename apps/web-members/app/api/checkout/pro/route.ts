import { NextResponse } from 'next/server'
import { PLAN_UIDS } from '@/lib/plan-config'

const outsetaProCheckoutUrl =
  `https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${PLAN_UIDS.PRO}&planPaymentTerm=month&skipPlanOptions=true#o-anonymous`

export async function POST() {
  return NextResponse.json(
    {
      error: 'Nested Objects billing is managed by Outseta.',
      checkoutUrl: outsetaProCheckoutUrl,
    },
    { status: 410 },
  )
}
