import Link from 'next/link'
import { ArrowRight, Shield, Zap, Clock, CheckCircle, Users, MapPin, BarChart3, Building2 } from 'lucide-react'

export default function FirmsHomePage() {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="hero-gradient relative px-4 pb-20 pt-20 sm:px-6 lg:pb-28 lg:pt-28">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-200">
              <Building2 className="h-3.5 w-3.5" />
              For Hiring Firms &amp; AMCs
            </span>
          </div>
          <h1 className="mt-6 animate-slide-up text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Source Vetted Field Inspectors<br className="hidden sm:block" />
            <span className="text-brand-accent">Nationwide.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-slide-up text-base text-indigo-200/80 sm:text-lg">
            Access 2,400+ background-checked inspectors, notaries, and property preservation
            contractors across all 50 states. Post a job, get matched, and get work completed — fast.
          </p>
          <div className="mt-8 flex animate-slide-up flex-wrap justify-center gap-4">
            <Link
              href="/post-a-job"
              className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-brand-accent px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 hover:shadow-cyan-400/30"
            >
              Post Your First Job Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/inspectors"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 hover:border-indigo-300/50"
            >
              Browse Inspectors
            </Link>
          </div>
        </div>

        {/* ── Floating stat pills ── */}
        <div className="relative z-10 mx-auto mt-16 max-w-3xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: '2,400+', label: 'Vetted Inspectors' },
              { value: '50', label: 'States Covered' },
              { value: '24hr', label: 'Avg. Turnaround' },
              { value: '98%', label: 'Completion Rate' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card px-4 py-4 text-center">
                <p className="stat-glow text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-indigo-300/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Firms Choose Us ── */}
      <section className="border-b border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Why Firms Choose Us</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Your inspection workforce, on demand
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500">
              Stop scrambling for coverage. Nested Objects gives you instant access to a pre-vetted,
              nationwide network of field professionals — ready when you need them.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: 'Vetted Network',
                desc: 'Every inspector is background-checked, insurance-verified, and rated by firms like yours.',
                color: 'text-brand',
                bg: 'bg-brand-light',
              },
              {
                icon: Zap,
                title: 'Smart Matching',
                desc: 'Our AI matches your job requirements to the best available inspectors in the area — instantly.',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
              {
                icon: Clock,
                title: 'Fast Turnaround',
                desc: '24-hour average from job posting to completed inspection. Meet your SLAs every time.',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                icon: BarChart3,
                title: 'Compliance Ready',
                desc: 'Full audit trails, E&O verification, and compliance reporting built into every workflow.',
                color: 'text-rose-600',
                bg: 'bg-rose-50',
              },
            ].map((item) => (
              <div key={item.title} className="b2b-card px-6 py-7">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <h3 className="mt-5 text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-brand-sand py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">How It Works</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Three steps to full coverage
            </h2>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Post Your Job',
                desc: 'Specify inspection type, location, requirements, and pay. Takes under 2 minutes.',
                icon: Building2,
              },
              {
                step: '02',
                title: 'We Match Inspectors',
                desc: 'Our platform surfaces the best-rated, closest inspectors who meet your exact criteria.',
                icon: Users,
              },
              {
                step: '03',
                title: 'Work Gets Done',
                desc: 'Inspectors complete the job, submit reports, and you review — all in one dashboard.',
                icon: CheckCircle,
              },
            ].map((item) => (
              <div key={item.step} className="b2b-card relative px-7 py-8 text-center">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow-md shadow-brand/20">
                  {item.step}
                </span>
                <div className="mt-4 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light">
                    <item.icon className="h-6 w-6 text-brand" />
                  </div>
                </div>
                <h3 className="mt-5 text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coverage Map Stats ── */}
      <section className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Coverage</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Nationwide reach, local expertise
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
            {[
              { icon: MapPin, value: '50 States', label: 'Full US Coverage' },
              { icon: Users, value: '2,400+', label: 'Active Inspectors' },
              { icon: Building2, value: '460+', label: 'Partnered Firms' },
              { icon: BarChart3, value: '98%', label: 'On-Time Completion' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-6">
                <stat.icon className="mx-auto h-6 w-6 text-brand" />
                <p className="mt-3 text-3xl font-extrabold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="hero-gradient relative py-20">
        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to fill your inspector pipeline?
          </h2>
          <p className="mt-4 text-base text-indigo-200/80">
            Post your first job for free. No contracts, no minimums. See why 460+ firms trust
            Nested Objects for their field inspection workforce.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/post-a-job"
              className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-brand-accent px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
            >
              Post a Job Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/inspectors"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Browse Our Network
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
