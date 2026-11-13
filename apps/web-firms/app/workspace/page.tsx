import Link from 'next/link'
import { redirect } from 'next/navigation'
import { firmSession, readFirmProfile } from '@/lib/firm-profile/server'
import { FirmProfileError } from '@/lib/firm-profile/contracts'
export const dynamic = 'force-dynamic'
export const metadata = { title:'Pilot workspace', robots:{ index:false,follow:false } }
const stages:Record<string,string> = { profile_pending:'Company profile',scope_review:'Scope review',pilot_ready:'Ready for kickoff',pilot_active:'Pilot in progress',pilot_closed:'Pilot closed' }
export default async function FirmWorkspace() {
  let result
  let identity
  try { identity = await firmSession(); result = await readFirmProfile(identity) }
  catch(error) {
    if (error instanceof FirmProfileError && error.status === 401) redirect('/login')
    return <main id="main-content" className="page-shell py-16"><h1 className="text-3xl font-bold">Pilot workspace unavailable</h1><p className="mt-4">{error instanceof FirmProfileError ? error.message : 'Please try again shortly.'}</p><Link href="/login" className="button button-primary mt-6">Sign in again</Link></main>
  }
  if (!result.profile) redirect('/profile')
  const profile = result.profile
  const planLabel = identity.planUid === 'A93NbYQ0' ? 'Inspector Recruitment & Management' : 'Firm pilot setup plan'
  return <main id="main-content" className="page-shell py-12"><div className="mx-auto max-w-4xl"><p className="eyebrow text-brand">Your pilot workspace</p><h1 className="mt-3 break-words text-3xl font-bold">{profile.displayName}</h1><p className="mt-4 leading-7 text-slate-600">Your saved company details and agreed pilot scope start here.</p><div className="mt-8 grid gap-6 md:grid-cols-2"><section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Company details</h2><p className="mt-4 break-words">{profile.legalName}</p><p className="mt-2">{profile.serviceZips.length} service ZIP codes saved</p><p className="mt-2 break-words">{profile.inspectionTypes.join(', ') || 'Inspection types not added yet.'}</p><Link href="/profile" className="mt-6 inline-block font-semibold text-brand underline">{result.canEdit ? 'Update company profile' : 'Review company profile'}</Link></section><section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Pilot status</h2><p className="mt-4">{stages[profile.pilotStage] || 'Awaiting review'}</p><p className="mt-3 leading-7 text-slate-600">Nested Objects confirms scope, kickoff and next steps with your team. Saving this profile does not initiate a charge, approve inspector access or start an assignment.</p></section></div><section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Account reference</h2><p className="mt-4">{planLabel}</p><p className="mt-2 break-all text-sm text-slate-600">Subscription reference: {identity.subscriptionUid}</p><p className="mt-3 text-sm leading-7 text-slate-600">This is your current account reference, not a payment receipt. Billing remains managed by Nested Objects through Outseta and Stripe.</p></section><p className="mt-8 text-sm leading-7 text-slate-600">Need help with your pilot? <a href="mailto:info@nestedobjects.com" className="underline">Contact Nested Objects</a>. The <Link href="/inspectors" className="underline">sample inspector experience</Link> uses fictional profiles.</p></div></main>
}
