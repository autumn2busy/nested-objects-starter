import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, FileText, MapPin, ShieldCheck } from 'lucide-react'
import { demoInspectors } from '../../../lib/demo-inspectors'
import { getDemoProfileDetails } from '../../../lib/demo-profile-details'
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
  const details = getDemoProfileDetails(person)
  return <main id="main-content" className="page-shell py-12">
    <Link href="/inspectors" className="inline-flex items-center gap-2 text-sm font-semibold text-brand"><ArrowLeft size={16} aria-hidden />Back to sample profiles</Link>
    <div className="my-7"><DemoNotice /></div>
    <div className="grid items-start gap-7 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-7">
        <article className="b2b-card p-7 sm:p-10">
          <p className="eyebrow text-brand">Sample profile · Step 2</p>
          <h1 className="section-title">{person.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-slate-600"><MapPin size={18} aria-hidden />{person.location} · Fictional sample</p>
          <p className="mt-6 leading-7 text-slate-600">{details.summary}</p>
          <h2 className="mt-8 text-xl font-bold">Experience & inspection interests</h2>
          <p className="mt-3 text-slate-600">{person.yearsExp} years of experience, shown for illustration only.</p>
          <ul className="mt-5 flex flex-wrap gap-2">{person.specialties.map(item => <li className="rounded-lg bg-brand-light px-3 py-2 text-sm font-medium text-brand" key={item}>{item}</li>)}</ul>
        </article>
        <section className="b2b-card p-7 sm:p-10" aria-labelledby="firm-history-title">
          <p className="eyebrow text-brand">Illustrative work history</p>
          <h2 id="firm-history-title" className="mt-3 text-2xl font-bold">Firms worked for</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Fictional firms and contract history for this demonstration. Real work history would be member-provided and subject to confirmation.</p>
          <ul className="mt-6 divide-y divide-slate-200">{details.workHistory.map(work => <li key={work.company} className="py-5 first:pt-0 last:pb-0">
            <h3 className="font-bold">{work.company}</h3>
            <p className="mt-1 text-sm font-medium text-brand">{work.role} · {work.period}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{work.description}</p>
            <span className="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-slate-500">Fictional company · Sample history</span>
          </li>)}</ul>
        </section>
        <section className="b2b-card p-7 sm:p-10">
          <h2 className="flex items-center gap-3 text-2xl font-bold"><FileText className="text-brand" aria-hidden />Inspector résumé</h2>
          <p className="mt-4 leading-7 text-slate-600">Review a sample professional summary, contract history, services, and skills together in one résumé.</p>
          <Link href={`/inspectors/${person.id}/resume`} className="button button-primary mt-5">View sample résumé <ArrowRight size={16} aria-hidden /></Link>
          <p className="mt-3 text-xs leading-5 text-slate-500">Fictional résumé. No private member document or contact information is shared.</p>
        </section>
      </div>
      <aside className="space-y-6">
        <section className="b2b-card overflow-hidden" aria-labelledby="member-rating-title">
          <div className="bg-brand-dark p-7 text-white">
            <p className="eyebrow text-emerald-300">Illustrative member signals</p>
            <h2 id="member-rating-title" className="mt-3 text-xl font-bold">Member rating · Trust Score</h2>
            <div className="mt-5 flex flex-wrap items-end gap-3"><span className="text-5xl font-bold">{details.score.total}<span className="text-xl font-medium text-slate-300">/100</span></span><span className="mb-1 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold capitalize">{details.score.tier} · sample</span></div>
            <p className="mt-4 text-sm leading-6 text-slate-200">Uses the member-side Trust Score rules with fictional inputs. This is not a customer-review rating.</p>
          </div>
          <div className="p-7">
            <dl className="space-y-5 text-sm">
              <div><dt className="text-slate-600">Profile completion</dt><dd className="mt-1 font-bold">{details.profileCompletion}% · sample profile</dd></div>
              <div><dt className="text-slate-600">Training completion</dt><dd className="mt-1 font-bold">{details.signals.training_modules_completed} of {details.signals.training_modules_total} modules · sample</dd><dd className="mt-1 text-slate-500">{details.score.breakdown.training}/50 Trust Score points</dd></div>
              <div><dt className="flex items-center gap-2 text-slate-600"><ShieldCheck size={16} aria-hidden />Background check</dt><dd className="mt-1 font-bold">{details.backgroundLabel}</dd><dd className="mt-1 text-slate-500">{details.score.breakdown.background}/50 Trust Score points</dd></div>
              <div><dt className="text-slate-600">ShieldID</dt><dd className="mt-1 break-words font-semibold">{details.signals.shieldId || 'Not provided in this sample'}</dd>{details.signals.shieldId && <dd className="mt-1 text-xs text-slate-500">Demo identifier only — not a valid ShieldID.</dd>}</div>
            </dl>
            <p className="mt-6 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500">Current Trust Score combines training and background-check status. Profile completion is shown separately. All statuses here are sample values; no check has been performed for this fictional person.</p>
          </div>
        </section>
        <div className="b2b-card p-7"><h2 className="text-lg font-bold">Qualification stays with your team.</h2><p className="mt-4 text-sm leading-7 text-slate-600">A real introduction would require current credentials, work-history confirmation, availability, and the inspector’s permission to share their profile and résumé.</p><dl className="mt-5 divide-y divide-slate-200 text-sm">{['Availability', 'Credentials & insurance', 'Consent to introduction'].map(label => <div key={label} className="flex flex-wrap justify-between gap-2 py-3"><dt>{label}</dt><dd className="font-semibold text-slate-500">Not assessed</dd></div>)}</dl></div>
        <div className="rounded-2xl bg-brand-light p-7"><h2 className="text-lg font-bold">Explore what a connection could look like.</h2><p className="mt-3 text-sm leading-7 text-slate-600">No request can be sent to this fictional person. Learn how we could develop a useful process with your team.</p><Link href="/dashboard" className="button button-primary mt-5">See the proposed process <ArrowRight size={16} aria-hidden /></Link></div>
      </aside>
    </div>
  </main>
}
