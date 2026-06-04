'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ClipboardList, LogIn, Mail, Search } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { trackSignupCompleted } from '@/lib/ac-events'

type WelcomeActivationProps = {
  isNewUser: boolean
}

type OutsetaUser = Record<string, any> | null

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: any[]) => void
  }
}

const activationSteps = [
  {
    title: 'Account created',
    description: 'Your free member account is ready.',
    status: 'complete',
    icon: CheckCircle2,
  },
  {
    title: 'Tell us your role',
    description: 'Add your inspector, notary, or contractor details so the hub can fit your work.',
    status: 'current',
    icon: ClipboardList,
  },
  {
    title: 'Search for jobs in your zip code',
    description: 'Use the job board to find nearby field opportunities.',
    status: 'upcoming',
    icon: Search,
  },
] as const

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
  const { isAuthenticated, isLoading, login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isResolvingUser, setIsResolvingUser] = useState(true)
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

  const greeting = name ? `Welcome, ${name}` : isNewUser ? 'Welcome to Nested Objects' : 'Welcome back'
  const shouldShowPendingConfirmation = isNewUser && !isLoading && !isAuthenticated

  if (shouldShowPendingConfirmation) {
    return (
      <section className="min-h-[calc(100vh-9rem)] bg-white">
        <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-copper">
              Account confirmation
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
              Check your email to finish setup
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-text-muted">
              We sent a confirmation email for your Nested Objects account. Confirm your account and set your password, then log in to open your member hub.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={login}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark focus:outline-none focus:ring-2 focus:ring-brand-copper focus:ring-offset-2"
              >
                Open Login
                <LogIn className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border-subtle bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-copper/10 text-brand-copper">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-text-primary">Confirmation required</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Your account is reserved, but it is not active in the member hub until the confirmation and password step is complete.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[calc(100vh-9rem)] bg-white">
      <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:px-8 lg:py-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-copper">
            Account activation
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            {greeting}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-text-muted">
            Your member hub is ready. Start by finding work near you, then complete the details that help tailor your directory, jobs, and tools.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/hiring-firms"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-copper px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark focus:outline-none focus:ring-2 focus:ring-brand-copper focus:ring-offset-2"
            >
              Find Work Near You
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-4 text-sm text-text-muted">
            {isResolvingUser ? 'Syncing your account details...' : email ? `Signed in as ${email}` : 'Account details will sync when Outseta finishes loading.'}
          </p>
        </div>

        <ol className="space-y-4">
          {activationSteps.map((step, index) => {
            const Icon = step.icon
            const isComplete = step.status === 'complete'
            const isCurrent = step.status === 'current'

            return (
              <li
                key={step.title}
                className="flex gap-4 rounded-lg border border-border-subtle bg-white p-5 shadow-sm"
              >
                <div
                  className={
                    isComplete
                      ? 'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'
                      : isCurrent
                        ? 'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-copper/10 text-brand-copper'
                        : 'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500'
                  }
                >
                  {isComplete ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <Icon className="h-5 w-5" aria-hidden="true" />}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Step {index + 1}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-text-primary">{step.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{step.description}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
