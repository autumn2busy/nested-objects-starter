'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { PLAN_UIDS } from '@/lib/plan-config'
import Link from 'next/link'
import {
  CheckCircle, ArrowRight, Shield, BookOpen, Search, Bot,
  FileText, Briefcase, Star, HelpCircle, XCircle, Loader2,
} from 'lucide-react'

type TokenState =
  | { status: 'loading' }
  | { status: 'valid'; email: string; firstName: string; fullName: string }
  | { status: 'redeemed' }
  | { status: 'invalid' }
  | { status: 'no-token' }

const FEATURES = [
  { icon: Search, title: '200+ Verified Hiring Firms', desc: 'Searchable directory with real pay data, contacts, and coverage areas.' },
  { icon: BookOpen, title: 'Structured Training Tracks', desc: 'Role-based modules, quizzes, and certificates. Earn your Trust Score.' },
  { icon: Bot, title: 'Member Tools Preview', desc: 'Preview planned guidance for firms, routes, and requirements. Execution remains disabled.' },
  { icon: FileText, title: 'Resume Workflow Preview', desc: 'Preview the planned inspector resume workflow. Upload and generation remain disabled.' },
  { icon: Briefcase, title: 'Live Job Board', desc: 'Updated listings filtered by location, pay, and specialty.' },
  { icon: Shield, title: 'Trust Score & Badge', desc: 'Complete training, verify background, earn a visible score firms recognize.' },
]

const STEPS = [
  { n: 1, title: 'Click "Claim Your Account" below', detail: "You'll create your login on the new platform. Use the same email from your original signup." },
  { n: 2, title: 'Set your password', detail: "Choose a new password. Your old Wix login doesn't carry over — this is a fresh, faster system." },
  { n: 3, title: 'Enter your card for the Founders plan ($37/year)', detail: "Your early adopter price is honored. New billing runs through Stripe. Your old Wix subscription stays active until you cancel it." },
  { n: 4, title: 'Explore your new dashboard', detail: "Your directory, training, readiness resources, profile, and tools preview are waiting." },
]

function Badge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />Founding Member
    </span>
  )
}

export function WelcomeBackView() {
  const { isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const [state, setState] = useState<TokenState>({ status: 'loading' })
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) { setState({ status: 'no-token' }); return }
    fetch(`/api/founders-token?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json()
        if (r.status === 410) setState({ status: 'redeemed' })
        else if (r.ok && d.valid) setState({ status: 'valid', email: d.email, firstName: d.firstName, fullName: d.fullName })
        else setState({ status: 'invalid' })
      })
      .catch(() => setState({ status: 'invalid' }))
  }, [token])

  const claimAccount = async () => {
    if (token) { fetch('/api/founders-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).catch(() => {}) }
    if (typeof window !== 'undefined' && window.Outseta?.auth?.open) {
      window.Outseta.auth.open({ widgetMode: 'register', planUid: PLAN_UIDS.FOUNDERS, planPaymentTerm: 'year', skipPlanOptions: true })
    } else {
      window.location.href = `https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${PLAN_UIDS.FOUNDERS}#o-anonymous`
    }
  }

  // Gate states
  if (state.status === 'loading') return <main className="mx-auto max-w-2xl px-4 py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-copper" /><p className="mt-4 text-sm text-slate-500">Verifying your invite…</p></main>

  if (state.status === 'no-token') return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <XCircle className="mx-auto h-12 w-12 text-slate-300" />
      <h1 className="mt-6 text-2xl font-bold text-slate-900">This page is for invited members only</h1>
      <p className="mt-3 text-slate-600">The Founding Member offer is exclusively for our original early adopters. Check out our current plans instead.</p>
      <Link href="/membership-pricing" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white hover:bg-brand-copperDark">View Membership Plans <ArrowRight className="h-4 w-4" /></Link>
    </main>
  )

  if (state.status === 'invalid') return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <XCircle className="mx-auto h-12 w-12 text-red-400" />
      <h1 className="mt-6 text-2xl font-bold text-slate-900">This invite link isn&apos;t valid</h1>
      <p className="mt-3 text-slate-600">It may have expired or been entered incorrectly. Contact us if you believe this is an error.</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link href="/contact-us" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Contact Support</Link>
        <Link href="/membership-pricing" className="rounded-lg bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-copperDark">View Plans</Link>
      </div>
    </main>
  )

  if (state.status === 'redeemed') return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
      <h1 className="mt-6 text-2xl font-bold text-slate-900">This invite has already been claimed</h1>
      <p className="mt-3 text-slate-600">If you already set up your account, log in below. Need help? Contact us.</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" onClick={() => window.Outseta?.auth?.open?.({ widgetMode: 'login' })} className="rounded-lg bg-brand-copper px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-copperDark">Log In</button>
        <Link href="/contact-us" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Need Help?</Link>
      </div>
    </main>
  )

  // Valid token — full page
  const display = state.firstName || state.fullName || 'there'

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <header className="text-center">
        <Badge />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          Hey {display} — your membership just got a <span className="text-brand-copper">massive upgrade.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
          We rebuilt Nested Objects from the ground up. Your Founding Member price is honored at <strong>$37/year.</strong>
        </p>
      </header>

      {isAuthenticated && (
        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-emerald-600" />
          <h2 className="mt-3 text-lg font-semibold text-emerald-900">You&apos;re already signed in!</h2>
          <Link href="/inspector-dashboard" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">Go to your dashboard <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-center text-xl font-semibold text-slate-900 sm:text-2xl">Everything that&apos;s new</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => { const I = f.icon; return (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-copper/10"><I className="h-5 w-5 text-brand-copper" /></div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
            </div>
          )})}
        </div>
      </section>

      {!isAuthenticated && (
        <section className="mt-14">
          <h2 className="text-center text-xl font-semibold text-slate-900 sm:text-2xl">How to claim your Founders account</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
            Takes about 2 minutes. Use <strong className="text-slate-700">{state.email}</strong> so we can verify your status.
          </p>
          <div className="mx-auto mt-8 max-w-2xl space-y-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-copper text-sm font-bold text-white">{s.n}</div>
                <div><h3 className="text-sm font-semibold text-slate-900">{s.title}</h3><p className="mt-1 text-sm text-slate-600">{s.detail}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isAuthenticated && (
        <section className="mt-12 rounded-2xl bg-slate-900 px-6 py-10 text-center text-slate-50">
          <Badge />
          <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Ready to claim your upgraded account?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">Same $37/year. A completely rebuilt platform. Your old Wix subscription stays active until you cancel it.</p>
          <button type="button" onClick={claimAccount} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-copper px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-brand-copperDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper">
            Claim Your Founders Account <ArrowRight className="h-5 w-5" />
          </button>
          <p className="mt-3 text-xs text-slate-400">Secure checkout powered by Stripe. Cancel or change plans anytime.</p>
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-center text-xl font-semibold text-slate-900">Common questions</h2>
        <div className="mx-auto mt-6 max-w-2xl space-y-5 text-sm text-slate-700">
          {[
            { q: 'Why do I need a new account?', a: "We moved from Wix to a custom platform for faster directory, training, and account access. Your old login can't transfer, but setup takes 2 minutes." },
            { q: 'Am I paying twice?', a: "No. When you sign up here, a new $37/year cycle starts on Stripe. Cancel your old Wix subscription once you're set up — you won't be double-charged." },
            { q: 'How long is the $37/year pricing good for?', a: "Your Founders plan renews at $37/year as long as you keep your subscription active. If you cancel and rejoin later, you'll need to choose from current plans." },
            { q: 'What if I need help?', a: 'Reply to the email you received or use the Contact page. Founding Members get priority support.' },
          ].map((faq) => (
            <div key={faq.q}>
              <h3 className="flex items-center gap-2 font-semibold text-slate-900"><HelpCircle className="h-4 w-4 text-brand-copper" />{faq.q}</h3>
              <p className="mt-1.5 pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 border-t border-slate-200 pt-6 text-center">
        <Link href="/" className="text-sm font-medium text-brand-copper underline underline-offset-4 hover:text-brand-copperDark">← Back to home</Link>
      </div>
    </main>
  )
}
