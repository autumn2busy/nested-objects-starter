'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LogIn, Mail } from 'lucide-react'
import { InspectorStartGuide } from '@/components/onboarding/inspector-start-guide'
import { useAuth } from '@/components/auth-provider'
import { trackSignupCompleted } from '@/lib/ac-events'
import { PLAN_UIDS } from '@/lib/plan-config'

type WelcomeActivationProps = {
  isNewUser: boolean
}

type OutsetaUser = Record<string, any> | null
type EmailConsentStatus = 'idle' | 'submitting' | 'recorded' | 'error'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: any[]) => void
  }
}

function getOutsetaValue(user: OutsetaUser, keys: string[]) {
  if (!user) return ''

  for (const key of keys) {
    const value = key.split('.').reduce<any>((current, part) => current?.[part], user)
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

function getOutsetaName(user: OutsetaUser) {
  const fullName = getOutsetaValue(user, ['FullName', 'Name', 'name'])
  if (fullName) return fullName

  const firstName = getOutsetaValue(user, ['FirstName', 'firstName', 'first_name'])
  const lastName = getOutsetaValue(user, ['LastName', 'lastName', 'last_name'])
  const combinedName = [firstName, lastName].filter(Boolean).join(' ')

  return combinedName || ''
}

function getOutsetaEmail(user: OutsetaUser) {
  return getOutsetaValue(user, [
    'Email',
    'EmailAddress',
    'EmailAddess',
    'email',
    'Person.Email',
    'Person.EmailAddress',
  ])
}

async function readOutsetaUser(): Promise<OutsetaUser> {
  const getUser = window.Outseta?.getUser
  if (typeof getUser !== 'function') return null

  const user = getUser.call(window.Outseta)
  return typeof user?.then === 'function' ? user : Promise.resolve(user)
}

export function WelcomeActivation({ isNewUser }: WelcomeActivationProps) {
  const { isAuthenticated, isLoading, login, planUid } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isResolvingUser, setIsResolvingUser] = useState(true)
  const [emailConsentRequested, setEmailConsentRequested] = useState(false)
  const [emailConsentStatus, setEmailConsentStatus] = useState<EmailConsentStatus>('idle')
  const firedSignUpEvent = useRef(false)
  const firedSignupCompletedEvent = useRef(false)
  const firedMemberActivatedTag = useRef(false)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    const maxAttempts = 15

    if (isLoading) {
      return () => {
        cancelled = true
      }
    }

    if (!isAuthenticated) {
      setIsResolvingUser(false)
      return () => {
        cancelled = true
      }
    }

    setIsResolvingUser(true)

    const resolveUser = async () => {
      attempts += 1

      try {
        const user = await readOutsetaUser()
        if (cancelled) return

        const resolvedName = getOutsetaName(user)
        const resolvedEmail = getOutsetaEmail(user)

        if (resolvedName) setName(resolvedName)
        if (resolvedEmail) setEmail(resolvedEmail)

        if (resolvedEmail || attempts >= maxAttempts) {
          setIsResolvingUser(false)
          return
        }
      } catch (error) {
        console.warn('[Welcome] Unable to read Outseta user:', error)
      }

      if (!cancelled) {
        window.setTimeout(resolveUser, 400)
      }
    }

    void resolveUser()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isLoading])

  useEffect(() => {
    if (!isNewUser || isLoading || !isAuthenticated || firedSignUpEvent.current) return

    firedSignUpEvent.current = true

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'sign_up', { method: 'outseta', plan: 'free' })
      return
    }

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'sign_up',
      method: 'outseta',
      plan: 'free',
    })
  }, [isAuthenticated, isLoading, isNewUser])

  useEffect(() => {
    if (!isNewUser || isLoading || !isAuthenticated || isResolvingUser || firedSignupCompletedEvent.current) return

    firedSignupCompletedEvent.current = true
    trackSignupCompleted('free')
  }, [isAuthenticated, isLoading, isNewUser, isResolvingUser])

  useEffect(() => {
    if (!isNewUser || isLoading || !isAuthenticated || isResolvingUser || firedMemberActivatedTag.current) return

    firedMemberActivatedTag.current = true

    const applyMemberActivatedTag = async () => {
      try {
        const response = await fetch('/api/ac/tag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ tag: 'member-activated' }),
        })

        if (!response.ok) {
          console.warn(`[Welcome] Failed to apply member-activated tag: ${response.status}`)
        }
      } catch (error) {
        console.warn('[Welcome] Error applying member-activated tag:', error)
      }
    }

    void applyMemberActivatedTag()
  }, [isAuthenticated, isLoading, isNewUser, isResolvingUser])

  const recordEmailConsentRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!emailConsentRequested || emailConsentStatus === 'submitting' || emailConsentStatus === 'recorded') return

    setEmailConsentStatus('submitting')
    try {
      const response = await fetch('/api/conversion-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ event: 'lifecycle_email_consent_requested' }),
      })
      const receipt = await response.json().catch(() => null)

      if (response.status !== 200 || receipt?.recorded !== true) {
        throw new Error('Consent request was not recorded')
      }

      setEmailConsentRequested(false)
      setEmailConsentStatus('recorded')
    } catch (error) {
      console.warn('[Welcome] Unable to record email preference:', error)
      setEmailConsentStatus('error')
    }
  }

  const greeting = name ? `Welcome, ${name}` : isNewUser ? 'Welcome to Nested Objects' : 'Welcome back'
  const shouldShowPendingConfirmation = isNewUser && !isLoading && !isAuthenticated

  if (isLoading) {
    return (
      <section className="bg-slate-50 px-4 py-16 sm:px-6" aria-busy="true">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8">
          <p role="status" className="text-sm font-medium text-slate-600">Checking your sign-in...</p>
          <div className="mt-6 h-8 max-w-md rounded bg-slate-100 motion-safe:animate-pulse" aria-hidden="true" />
        </div>
      </section>
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="min-h-[calc(100vh-9rem)] bg-slate-50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-copper">
              {shouldShowPendingConfirmation ? 'Account confirmation' : 'Your inspector workspace'}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {shouldShowPendingConfirmation ? 'Check your email to finish setup' : 'Sign in to continue'}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {shouldShowPendingConfirmation
                ? 'If you just signed up, use the email from Nested Objects to confirm your account and set your password. Then sign in to get started.'
                : 'Open your member account to research hiring firms and manage your private profile.'}
            </p>
            <button
              type="button"
              onClick={login}
              className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-copper"
            >
              Open Login
              <LogIn className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <aside className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <Mail className="h-6 w-6 text-brand-copper" aria-hidden="true" />
            <h2 className="mt-5 text-xl font-semibold text-slate-900">
              {shouldShowPendingConfirmation ? 'Confirmation required' : 'New to Nested Objects?'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {shouldShowPendingConfirmation
                ? 'Check your spam or promotions folder if you do not see the email. Already confirmed? Use Open Login.'
                : 'Review the membership options and choose the access that fits your work.'}
            </p>
            <Link
              href={shouldShowPendingConfirmation ? '/contact-us' : '/membership-pricing'}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-brand-copper underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
            >
              {shouldShowPendingConfirmation ? 'Get help with your account' : 'Explore membership options'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[calc(100vh-9rem)] bg-[#f4f7f5]">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-copper">Your inspector workspace</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{greeting}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Save your experience and interests in your private profile, then complete one Income Scenarios calculation.
          </p>
          {email && <p className="mt-3 text-sm text-slate-500">Signed in as {email}</p>}
        </header>

        <InspectorStartGuide />

        {planUid === PLAN_UIDS.FREE ? (
          <section
            className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
            aria-labelledby="lifecycle-email-heading"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-copper">Optional email guidance</p>
            <h2 id="lifecycle-email-heading" className="mt-2 text-xl font-semibold text-slate-900">
              Request practical member tips by email
            </h2>
            <p id="lifecycle-email-description" className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Ask for onboarding tips and occasional membership guidance at the email tied to your account. This
              records your request only; email updates remain off unless you complete a separate email confirmation.
            </p>

            {emailConsentStatus === 'recorded' ? (
              <p
                className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
                role="status"
              >
                Request recorded. Email updates remain off until a separate confirmation is completed.
              </p>
            ) : (
              <form className="mt-4" onSubmit={recordEmailConsentRequest} aria-describedby="lifecycle-email-description">
                <label className="flex max-w-3xl cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-copper focus:ring-brand-copper"
                    checked={emailConsentRequested}
                    disabled={emailConsentStatus === 'submitting'}
                    onChange={event => {
                      setEmailConsentRequested(event.target.checked)
                      if (emailConsentStatus === 'error') setEmailConsentStatus('idle')
                    }}
                  />
                  <span>I want optional onboarding and membership emails from Nested Objects.</span>
                </label>
                <button
                  type="submit"
                  disabled={!emailConsentRequested || emailConsentStatus === 'submitting'}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-copper px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-copper disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {emailConsentStatus === 'submitting' ? 'Recording request...' : 'Record my request'}
                </button>
                {emailConsentStatus === 'error' ? (
                  <p className="mt-3 text-sm text-red-700" role="alert">
                    We could not record that request. Nothing was changed; please try again.
                  </p>
                ) : null}
              </form>
            )}
          </section>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Already know where you are headed?</p>
          <Link
            href="/inspector-dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
          >
            Open my dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
