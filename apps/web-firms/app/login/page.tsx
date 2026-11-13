import Link from 'next/link'
export const dynamic = 'force-dynamic'
export const metadata = { title:'Firm sign in', robots:{ index:false,follow:false } }
export default async function FirmLogin({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice: requestedNotice } = await searchParams
  const enabled = process.env.FIRM_PROFILE_ENABLED === 'true' && !!process.env.FIRMS_APP_ORIGIN
  const notice = requestedNotice === 'session-size' ? 'Your firm sign-in could not fit safely in this browser session. Please contact Nested Objects for help.' : 'We could not verify this firm workspace. Please try signing in again or contact Nested Objects.'
  return <main id="main-content" className="page-shell py-16"><section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8"><p className="eyebrow text-brand">Firm workspace</p><h1 className="mt-4 text-3xl font-bold">Your company, one shared starting point.</h1><p className="mt-4 leading-7 text-slate-600">Sign in with the account for your firm plan to manage your company details, coverage and pilot requirements.</p>{requestedNotice && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4">{notice}</p>}{enabled ? <a className="button button-primary mt-6" href="/auth/start">Sign in to your firm account</a> : <p className="mt-6">Firm workspace setup is in progress. <a className="underline" href="mailto:info@nestedobjects.com">Contact Nested Objects</a> for help.</p>}<p className="mt-6 text-sm"><Link className="underline" href="/inspectors">Explore the fictional sample experience</Link></p></section></main>
}
