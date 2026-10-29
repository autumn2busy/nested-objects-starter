import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MessageCircle, ClipboardList, UserCheck } from 'lucide-react'
export const metadata: Metadata = { title: 'How collaboration could work', description: 'A proposed human-led collaboration process for field-service firms.' }
const steps = [
  { icon: MessageCircle, title: 'Get to know each other', text: 'Start with your business, the work you support, and what caught your interest in Nested Objects.', outcome: 'A shared understanding of whether there is a fit.' },
  { icon: ClipboardList, title: 'Agree on one useful next step', text: 'Define the audience, territory, requirements, deliverables, timing, and any commercial terms together.', outcome: 'A written scope with clear expectations.' },
  { icon: UserCheck, title: 'Confirm before connecting', text: 'For any proposed inspector introduction, confirm interest, consent, and the facts your team needs. Your team controls qualification and onboarding.', outcome: 'An agreed process, with no assumed availability or placement guarantee.' },
]
export default function CollaborationPage() {
  return <main id="main-content" className="page-shell py-12 sm:py-16">
    <p className="eyebrow text-brand">The proposed process · Step 3</p><h1 className="section-title max-w-3xl">A practical next step, shaped together.</h1><p className="section-copy max-w-3xl">This is a concept for a firm collaboration, not an active job or assignment dashboard. There are no live orders, matches, payments, or performance results here.</p>
    <div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map((step,index)=><article className="b2b-card p-7" key={step.title}><div className="flex items-center justify-between text-brand"><step.icon size={26} aria-hidden /><span className="text-sm font-bold">0{index+1}</span></div><h2 className="mt-7 text-xl font-bold">{step.title}</h2><p className="mt-4 text-sm leading-7 text-slate-600">{step.text}</p><p className="mt-6 border-t border-slate-200 pt-5 text-sm font-semibold leading-6 text-brand">{step.outcome}</p></article>)}</div>
    <div className="mt-10 rounded-2xl bg-brand-light p-8"><h2 className="text-2xl font-bold">Keep your existing workflow.</h2><p className="mt-4 max-w-3xl leading-7 text-slate-600">We are exploring ways to complement your recruiting, training, and field operations. Your systems, contractor approvals, reporting standards, and assignments remain with your team.</p><Link href="/partnerships" className="button button-primary mt-6">Discuss the possibilities <ArrowRight size={17} aria-hidden /></Link></div>
  </main>
}
