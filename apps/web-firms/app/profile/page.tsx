import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FirmProfileError } from '@/lib/firm-profile/contracts'
import { firmSession, readFirmProfile } from '@/lib/firm-profile/server'
import FirmProfileForm from './FirmProfileForm'
export const dynamic = 'force-dynamic'
export const metadata = { title:'Company profile', robots:{ index:false,follow:false } }
export default async function FirmProfilePage() {
  let result
  try { result = await readFirmProfile(await firmSession()) }
  catch(error) {
    if (error instanceof FirmProfileError && error.status === 401) redirect('/login')
    return <main id="main-content" className="page-shell py-16"><h1 className="text-3xl font-bold">Company profile unavailable</h1><p className="mt-4">{error instanceof FirmProfileError ? error.message : 'Please try again shortly.'}</p><Link href="/login" className="button button-primary mt-6">Sign in again</Link></main>
  }
  return <main id="main-content" className="page-shell py-12"><div className="mx-auto max-w-3xl"><p className="eyebrow text-brand">Your firm workspace</p><h1 className="mt-3 text-3xl font-bold">Company profile</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">Tell us where you work and what your team needs. Save your details here and return to update them as your pilot develops.</p><FirmProfileForm initial={result.profile} canEdit={result.canEdit} /><Link className="mt-6 inline-block font-semibold text-brand underline" href="/workspace">Continue to pilot workspace</Link></div></main>
}
