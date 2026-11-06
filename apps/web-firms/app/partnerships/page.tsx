import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowRight } from 'lucide-react'
export const metadata: Metadata = { title: 'Let’s get acquainted', description: 'Talk with Nested Objects about a possible firm collaboration, scope, and commercial terms.' }
export default function PartnershipsPage() {
  return <main id="main-content" className="page-shell py-12 sm:py-20">
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <div><p className="eyebrow text-brand">A conversation comes first</p><h1 className="section-title">Tell us about your team.</h1><p className="section-copy">We would love to understand your business, what brought you to Nested Objects, and where our work might connect.</p>
        <div className="mt-8 b2b-card p-7"><h2 className="text-xl font-bold">Start with an introduction.</h2><p className="mt-4 leading-7 text-slate-600">Share your company, the type of field work you support, and what you would like to explore. Please leave out borrower details, property access instructions, and private inspector records.</p><a className="button button-primary mt-6" href="mailto:info@nestedobjects.com?subject=Firm%20partnership%20introduction"><Mail size={17} aria-hidden />Email Nested Objects</a><p className="mt-4 text-sm text-slate-600">info@nestedobjects.com</p><p className="mt-3 text-xs leading-6 text-slate-500">Opens your email app. Nothing is sent by this website, and no job posting or inspector request is created.</p></div>
      </div>
      <aside className="rounded-2xl bg-brand-light p-7 sm:p-9"><p className="eyebrow text-brand">Scope & pricing</p><h2 className="mt-4 text-2xl font-bold">Define the value before the price.</h2><p className="mt-5 text-sm leading-7 text-slate-600">Firm collaborations are being developed. There is no published firm subscription, per-inspector fee, or checkout offer on this site.</p><p className="mt-5 text-sm leading-7 text-slate-600">If there is a fit, we can discuss a scoped project or ongoing collaboration. Deliverables, responsibilities, timing, and pricing would be agreed in writing before any paid work begins.</p><div className="mt-7 border-t border-brand/20 pt-6"><h3 className="font-bold">Useful topics for a first conversation</h3><ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-600"><li>What caught your attention about Nested Objects?</li><li>What would you like inspectors to understand about your firm?</li><li>Is there a useful next step worth exploring together?</li></ul></div></aside>
    </div>
    <Link className="mt-10 inline-flex items-center gap-2 font-semibold text-brand" href="/inspectors">Return to the sample experience <ArrowRight size={17} aria-hidden /></Link>
  </main>
}
