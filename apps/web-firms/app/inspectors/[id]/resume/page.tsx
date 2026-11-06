import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import { demoInspectors } from '../../../../lib/demo-inspectors'
import { getDemoProfileDetails, getSampleResumeState } from '../../../../lib/demo-profile-details'
import { DemoNotice } from '../../../../components/DemoNotice'

export const dynamicParams = false
export function generateStaticParams() { return demoInspectors.filter(person => getSampleResumeState(person.id) === 'shared').map(({ id }) => ({ id })) }
export const metadata: Metadata = { title: 'Fictional inspector résumé', robots: { index: false, follow: false } }

export default function SampleResumePage({ params }: { params: { id: string } }) {
  const person = demoInspectors.find(item => item.id === params.id)
  if (!person || getSampleResumeState(person.id) !== 'shared') notFound()
  const details = getDemoProfileDetails(person)
  return <main id="main-content" className="page-shell py-12">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Link href={`/inspectors/${person.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand"><ArrowLeft size={16} aria-hidden />Back to sample profile</Link>
      <a href={`/inspectors/${person.id}/resume/download`} download className="button button-secondary"><Download size={16} aria-hidden />Download sample résumé (.txt)</a>
    </div>
    <div className="my-7"><DemoNotice /></div>
    <article className="b2b-card mx-auto max-w-4xl p-7 sm:p-12">
      <header className="border-b border-slate-200 pb-7">
        <p className="eyebrow text-brand">Inspector résumé · Fictional sample</p>
        <h1 className="section-title">{person.name}</h1>
        <p className="mt-3 font-semibold text-brand">Independent field inspector · {person.location}</p>
        <p className="mt-4 text-sm leading-6 text-slate-500">Illustrative experience and fictional companies. This is not a real member résumé or an application for work.</p>
      </header>
      <section className="mt-8"><h2 className="text-xl font-bold">Professional summary</h2><p className="mt-4 leading-8 text-slate-600">{details.summary}</p></section>
      <section className="mt-9"><h2 className="text-xl font-bold">Firm & contract experience</h2><div className="mt-5 space-y-7">{details.workHistory.map(work => <section key={work.company}>
        <h3 className="font-bold">{work.company} <span className="font-normal text-slate-500">(fictional)</span></h3>
        <p className="mt-1 text-sm font-semibold text-brand">{work.role} · {work.period}</p>
        <p className="mt-3 leading-7 text-slate-600">{work.description}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">{work.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>
      </section>)}</div></section>
      <section className="mt-9"><h2 className="text-xl font-bold">Services & skills</h2><ul className="mt-4 flex flex-wrap gap-2">{details.skills.map(skill => <li key={skill} className="rounded-lg bg-brand-light px-3 py-2 text-sm text-brand">{skill}</li>)}</ul></section>
      <section className="mt-9"><h2 className="text-xl font-bold">Training & profile signals</h2><p className="mt-4 leading-8 text-slate-600">Sample training progress: {details.signals.training_modules_completed} of {details.signals.training_modules_total} modules. Illustrative Trust Score: {details.score.total}/100. Background check: {details.backgroundLabel.toLowerCase()}.</p><p className="mt-2 text-sm leading-7 text-slate-500">These are demonstration values, not certificates or evidence of screening. Refer to the sample profile for the score breakdown.</p></section>
    </article>
  </main>
}
