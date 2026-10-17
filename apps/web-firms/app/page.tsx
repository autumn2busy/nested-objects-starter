import Link from 'next/link'
import { ArrowRight, BookOpen, Compass, Users, Building2, MapPin } from 'lucide-react'

const possibilities = [
  { icon: Users, title: 'More informed introductions', text: 'Explore a thoughtful way to connect with interested inspectors around their experience, service area, and your requirements.' },
  { icon: BookOpen, title: 'Clearer inspector preparation', text: 'Help people understand your work, expectations, and onboarding process before they apply.' },
  { icon: Compass, title: 'Useful industry visibility', text: 'Explore educational content and firm information that help inspectors learn about your business.' },
]

export default function FirmsHomePage() {
  return (
    <main id="main-content">
      <section className="hero-gradient">
        <div className="page-shell grid items-center gap-12 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div>
            <p className="eyebrow text-emerald-300">Nested Objects for firms</p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">Better connections.<br /><span className="text-emerald-400">Better prepared<br className="hidden lg:block" /> field professionals.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">An inspector-first resource business, opening a conversation with the firms that depend on field professionals.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/inspectors" className="button button-bright">Explore the sample experience <ArrowRight size={17} aria-hidden /></Link>
              <a href="#possibilities" className="button button-dark">Ways to collaborate</a>
            </div>
            <p className="mt-4 text-sm text-slate-400">A developing firm offering. The interactive demo uses fictional profiles.</p>
          </div>
          <div className="relative rounded-3xl border border-slate-700 bg-slate-900/80 p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between gap-3 border-b border-slate-700 pb-5"><span className="text-sm font-semibold text-white">A more useful introduction</span><span className="demo-tag">Concept preview</span></div>
            <div className="mt-6 flex items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-xl font-bold text-emerald-300" aria-hidden>MD</span><div><p className="font-bold text-white">Marcus Davis <span className="ml-1 text-xs font-normal text-slate-400">· Fictional sample</span></p><p className="mt-1 flex items-center gap-1 text-sm text-slate-300"><MapPin size={14} aria-hidden />Atlanta, GA</p></div></div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="rounded-xl bg-white/5 p-4"><p className="text-slate-400">Experience & interests</p><p className="mt-1 text-white">Property condition · Occupancy verification · REO</p></div>
              <div className="rounded-xl bg-white/5 p-4"><p className="text-slate-400">Before an introduction</p><p className="mt-1 text-white">Confirm interest, coverage, credentials, and consent.</p></div>
              <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4"><Building2 size={20} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden /><p className="text-slate-200">Your team retains qualification, onboarding, and assignment decisions.</p></div>
            </div>
            <Link href="/inspectors/insp-001" className="mt-6 flex items-center justify-between text-sm font-semibold text-emerald-300">Open this sample profile <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </div>
      </section>
      <section className="border-b border-slate-200 bg-white">
        <div className="page-shell grid gap-6 py-8 sm:grid-cols-3">{[['Inspector first', 'Resources for people entering and working in the field.'], ['Firm informed', 'A developing offering shaped by real conversations.'], ['Human led', 'Scope, consent, and expectations agreed together.']].map(([title, text])=><div key={title}><h2 className="font-bold text-brand-dark">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p></div>)}</div>
      </section>
      <section className="page-shell py-16 sm:py-20" id="possibilities">
        <p className="eyebrow text-brand">Ways we could work together</p>
        <h2 className="section-title max-w-2xl">Start with what would be useful to your team.</h2>
        <p className="section-copy max-w-2xl">These are proposed collaboration areas, shaped around a firm’s needs. Scope, availability, deliverables, and commercial terms would be agreed before work begins.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">{possibilities.map(item=><article className="b2b-card p-7" key={item.title}><item.icon className="text-brand" size={27} aria-hidden /><span className="mt-6 block text-xs font-semibold uppercase tracking-widest text-brand">Proposed collaboration</span><h3 className="mt-3 text-xl font-bold">{item.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p></article>)}</div>
      </section>
      <section className="border-y border-slate-200 bg-white">
        <div className="page-shell grid gap-12 py-16 md:grid-cols-2">
          <div><p className="eyebrow text-brand">The business today</p><h2 className="section-title">Built around the inspector’s next step.</h2><p className="section-copy">Nested Objects helps people research firms, understand field inspection work, and use practical resources and tools to make more informed business decisions.</p><a href="https://members.nestedobjects.com" className="mt-6 inline-flex items-center gap-2 font-semibold text-brand">Visit the member platform <ArrowRight size={17} aria-hidden /></a></div>
          <div className="rounded-2xl bg-brand-light p-7 sm:p-9"><p className="eyebrow text-brand">A short platform walkthrough</p><ol className="mt-6 space-y-5">{[['01', 'Explore the sample directory', 'Search fictional profiles by location and specialty.'], ['02', 'Open a sample profile', 'See the information that could support a useful conversation.'], ['03', 'Discuss a possible collaboration', 'Agree on a practical next step, if there is a fit.']].map(([n,title,text])=><li className="flex gap-4" key={n}><span className="text-sm font-bold text-brand">{n}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p></div></li>)}</ol><Link href="/inspectors" className="button button-primary mt-7">Start the walkthrough <ArrowRight size={17} aria-hidden /></Link></div>
        </div>
      </section>
      <section className="page-shell py-16"><div className="rounded-3xl bg-brand-dark p-8 text-white sm:p-12"><p className="eyebrow text-emerald-300">Let’s get acquainted</p><h2 className="mt-4 text-3xl font-bold">What would a useful partnership look like?</h2><p className="mt-4 max-w-2xl leading-relaxed text-slate-300">Tell us about your business and what brought you here. We can explore the possibilities together, including scope and pricing when there is a clear fit.</p><Link href="/partnerships" className="button button-bright mt-7">Start a conversation <ArrowRight size={17} aria-hidden /></Link></div></section>
    </main>
  )
}
