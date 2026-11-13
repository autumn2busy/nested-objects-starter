'use client'
import { useState, type FormEvent } from 'react'
import type { FirmProfile, FirmProfileInput } from '@/lib/firm-profile/contracts'
const empty: FirmProfileInput = { legalName:'',displayName:'',website:'',address:'',primaryContactName:'',primaryContactEmail:'',serviceZips:[],inspectionTypes:[],requirements:'' }
export default function FirmProfileForm({ initial, canEdit }: { initial:FirmProfile|null; canEdit:boolean }) {
  const [profile,setProfile] = useState(initial)
  const [draft,setDraft] = useState<FirmProfileInput>(initial ? Object.fromEntries(Object.keys(empty).map(key => [key,initial[key as keyof FirmProfileInput]])) as FirmProfileInput : empty)
  const [zips,setZips] = useState(initial?.serviceZips.join(', ') || '')
  const [types,setTypes] = useState(initial?.inspectionTypes.join(', ') || '')
  const [saving,setSaving] = useState(false)
  const [notice,setNotice] = useState('')
  const [failed,setFailed] = useState(false)
  const set = (field:keyof FirmProfileInput,value:string) => setDraft(previous=>({...previous,[field]:value}))
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !canEdit) return
    setSaving(true); setNotice(''); setFailed(false)
    try {
      const response = await fetch('/api/firm-profile',{ method:'PUT', headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:profile?.revision || 0,profile:{...draft,serviceZips:zips.split(/[\s,;]+/).filter(Boolean),inspectionTypes:types.split(',').map(value=>value.trim()).filter(Boolean)}}) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Your profile could not be saved.')
      setProfile(result.profile)
      setNotice('Company profile saved. Your details will be here when you return.')
    } catch(error) { setFailed(true); setNotice(error instanceof Error ? error.message : 'Your profile could not be saved. Please try again.') }
    finally { setSaving(false) }
  }
  const inputClass = 'mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 disabled:bg-slate-50'
  return <><form onSubmit={submit} className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8">
    {!canEdit && <p className="mb-6 rounded-xl bg-slate-50 p-4">Your company owner manages these details. You can review the saved profile.</p>}
    <fieldset disabled={!canEdit || saving} className="grid min-w-0 gap-6 sm:grid-cols-2"><legend className="sr-only">Company and pilot details</legend>
      <label className="font-semibold">Legal company name<input className={inputClass} name="legalName" autoComplete="organization" required maxLength={200} value={draft.legalName} onChange={e=>set('legalName',e.target.value)} /></label>
      <label className="font-semibold">Company display name<input className={inputClass} name="displayName" required maxLength={200} value={draft.displayName} onChange={e=>set('displayName',e.target.value)} /></label>
      <label className="font-semibold sm:col-span-2">Company website<input className={inputClass} type="url" name="website" placeholder="https://" maxLength={500} value={draft.website} onChange={e=>set('website',e.target.value)} /></label>
      <label className="font-semibold sm:col-span-2">Company address<textarea className={inputClass} name="address" autoComplete="street-address" rows={2} maxLength={1000} value={draft.address} onChange={e=>set('address',e.target.value)} /></label>
      <label className="font-semibold">Primary contact name<input className={inputClass} name="primaryContactName" autoComplete="name" required maxLength={200} value={draft.primaryContactName} onChange={e=>set('primaryContactName',e.target.value)} /></label>
      <label className="font-semibold">Primary contact email<input className={inputClass} type="email" name="primaryContactEmail" autoComplete="email" required maxLength={254} value={draft.primaryContactEmail} onChange={e=>set('primaryContactEmail',e.target.value)} /><span className="mt-2 block text-sm font-normal text-slate-500">For pilot coordination. This does not change account ownership or send email.</span></label>
      <label className="font-semibold sm:col-span-2">Service ZIP codes<textarea className={inputClass} name="serviceZips" rows={3} maxLength={4000} placeholder="Five-digit ZIP codes, separated by commas" value={zips} onChange={e=>setZips(e.target.value)} /></label>
      <label className="font-semibold sm:col-span-2">Inspection types<input className={inputClass} name="inspectionTypes" maxLength={2400} placeholder="Occupancy, exterior, property condition" value={types} onChange={e=>setTypes(e.target.value)} /><span className="mt-2 block text-sm font-normal text-slate-500">Separate each type with a comma.</span></label>
      <label className="font-semibold sm:col-span-2">Requirements and pilot priorities<textarea className={inputClass} name="requirements" rows={5} maxLength={5000} value={draft.requirements} onChange={e=>set('requirements',e.target.value)} /><span className="mt-2 block text-sm font-normal text-slate-500">Include turnaround needs, credentials and coverage priorities. Do not include passwords or applicant records.</span></label>
    </fieldset>
    <p aria-live="polite" role={failed ? 'alert' : 'status'} className={failed ? 'mt-6 text-red-700' : 'mt-6 text-brand'}>{notice}</p>
    {canEdit && <button type="submit" disabled={saving} className="button button-primary mt-5 w-full sm:w-auto">{saving ? 'Saving…' : 'Save company profile'}</button>}
    {profile && <p className="mt-5 text-sm text-slate-500">Saved profile · revision {profile.revision}</p>}
  </form><form action="/auth/logout" method="post" className="mt-6"><button className="min-h-11 px-3 font-semibold text-slate-600 underline" type="submit">Sign out of firm workspace</button></form></>
}
