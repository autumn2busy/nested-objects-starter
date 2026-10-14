import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react'
import { demoInspectors } from '../../../lib/demo-inspectors'
import { DemoNotice } from '../../../components/DemoNotice'

export const dynamicParams = false
export function generateStaticParams() { return demoInspectors.map(({ id }) => ({ id })) }
export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const person = demoInspectors.find(item => item.id === params.id)
  return { title: person ? person.name + ' — Fictional sample' : 'Sample not found', robots: { index: false, follow: true } }
}
export default function SampleProfilePage({ params }: { params: { id: string } }) {
  const person = demoInspectors.find(item => item.id === params.id)
  if (!person) notFound()
  return <main id="main-content" className="page-shell py-12">
    <Link href="/inspectors" className="inline-flex items-center gap-2 text-sm font-semibold text-brand"><ArrowLeft size={16} aria-hidden />Back to sample profiles</Link>
    <div className="my-7"><DemoNotice /></div>
    <div className="grid gap-7 lg:grid-cols-[1.5fr_1fr]">
      <article className="b2b-card p-7 sm:p-10"><p className="eyebrow text-brand">Sample profile · Step 2</p><h1 className="section-title">{person.name}</h1><p className="mt-3 flex items-center gap-2 text-slate-600"><MapPin size={18} aria-hidden />{person.location} · Fictional sample</p>
        <h2 className="mt-10 text-xl font-bold">Experience & inspection interests</h2><p className="mt-4 text-slate-600">{person.yearsExp} years of experience, shown for illustration only.</p><ul className="mt-5 flex flex-wrap gap-2">{person.specialties.map(item=><li className="rounded-lg bg-brand-light px-3 py-2 text-sm font-medium text-brand" key={item}>{item}</li>)}</ul>
        <div className="mt-9 border-t border-slate-200 pt-7"><h2 className="text-xl font-bold">Questions a real introduction would need to answer</h2><ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-600"><li>Which counties or ZIP codes can the inspector actually serve?</li><li>Does their experience fit this firm’s inspection requirements?</li><li>Are they interested and available for a conversation?</li><li>Have they agreed to share their information with the firm?</li></ul></div>
      </article>
      <aside className="space-y-6">
        <div className="b2b-card p-7"><h2 className="text-lg font-bold">Qualification stays with your team.</h2><p className="mt-4 text-sm leading-7 text-slate-600">This profile does not establish credentials, background checks, insurance, availability, or suitability. A real collaboration would define how those facts are confirmed.</p><dl className="mt-5 divide-y divide-slate-200 text-sm">{['Availability', 'Credentials & insurance', 'Consent to introduction'].map(label=><div key={label} className="flex flex-wrap justify-between gap-2 py-3"><dt>{label}</dt><dd className="font-semibold text-slate-500">Not assessed</dd></div>)}</dl></div>
        <div className="rounded-2xl bg-brand-light p-7"><h2 className="text-lg font-bold">Explore what a connection could look like.</h2><p className="mt-3 text-sm leading-7 text-slate-600">No request can be sent to this fictional person. Learn how we could develop a useful process with your team.</p><Link href="/dashboard" className="button button-primary mt-5">See the proposed process <ArrowRight size={16} aria-hidden /></Link></div>
      </aside>
    </div>
  </main>
}
