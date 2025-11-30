'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

type Profile = {
  id?: string
  user_email: string
  display_name: string | null
  headline: string | null
  city: string | null
  state: string | null
  primary_interest: string | null
  tools: string | null
  notes: string | null
}

type StructuredNotes = {
  bio: string
  phone: string
  linkedin: string
  notes: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function parseStructuredNotes(rawNotes: string | null): StructuredNotes {
  if (!rawNotes) {
    return { bio: '', phone: '', linkedin: '', notes: '' }
  }

  try {
    const parsed = JSON.parse(rawNotes)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'bio' in parsed &&
      'phone' in parsed &&
      'linkedin' in parsed
    ) {
      return {
        bio: (parsed as any).bio ?? '',
        phone: (parsed as any).phone ?? '',
        linkedin: (parsed as any).linkedin ?? '',
        notes: (parsed as any).notes ?? '',
      }
    }
  } catch (error) {
    console.warn('Could not parse structured notes, falling back to plain text', error)
  }

  return { bio: rawNotes || '', phone: '', linkedin: '', notes: '' }
}

function formatDate(value: string | number | Date | undefined): string {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ProfilePage() {
  // Treat auth as any so we can safely grab user.email etc even if the hook type is strict
  const auth = useAuth() as any
  const { isAuthenticated, isLoading, logout } = auth
  const userEmail: string | null =
    (auth?.user?.email as string | undefined) ??
    (auth?.user?.Email as string | undefined) ??
    null

  const outsetaFirstName: string | null =
    (auth?.user?.FirstName as string | undefined) ??
    (auth?.user?.first_name as string | undefined) ??
    null

  const lastLogin: string | undefined =
    (auth?.user?.LastLoginDate as string | undefined) ??
    (auth?.user?.last_login as string | undefined)

  const role: string =
    (auth?.user?.role as string | undefined) ??
    (auth?.user?.plan as string | undefined) ??
    'Member'

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [headline, setHeadline] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [primaryInterest, setPrimaryInterest] = useState('')
  const [tools, setTools] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [notes, setNotes] = useState('')

  const [billingSummary, setBillingSummary] = useState<{
    planName: string | null
    renewalTerm: string | null
    nextBillingDate: string | number | Date | null
    name: string | null
    phone: string | null
  } | null>(null)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)

  // Derive a label and initials for the avatar
  const emailLabel = userEmail ?? 'Your profile'
  const fallbackName = useMemo(
    () =>
      profile?.display_name ||
      outsetaFirstName ||
      emailLabel.split('@')[0]?.replace(/[._]/g, ' ') ||
      'Member',
    [profile?.display_name, outsetaFirstName, emailLabel],
  )

  const initials = fallbackName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  // Load profile from Supabase
  useEffect(() => {
    async function loadProfile() {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setError('Profile service is temporarily unavailable.')
        setLoadingProfile(false)
        return
      }

      if (!userEmail) {
        setError('No user email found for this session.')
        setLoadingProfile(false)
        return
      }

      try {
        setLoadingProfile(true)
        setError(null)
        setSuccess(null)

        const encodedEmail = encodeURIComponent(userEmail)
        const url =
          `${SUPABASE_URL}/rest/v1/profiles` +
          `?user_email=eq.${encodedEmail}` +
          `&select=*`

        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        })

        if (!res.ok) {
          throw new Error(`Supabase returned ${res.status} ${res.statusText}`)
        }

        const rows = (await res.json()) as Profile[]
        const row = rows[0] ?? null

        if (row) {
          setProfile(row)
          setDisplayName(row.display_name || '')
          setHeadline(row.headline || '')
          setCity(row.city || '')
          setState(row.state || '')
          setPrimaryInterest(row.primary_interest || '')
          setTools(row.tools || '')

          const structured = parseStructuredNotes(row.notes)
          setBio(structured.bio)
          setPhone(structured.phone)
          setLinkedin(structured.linkedin)
          setNotes(structured.notes)

          auth.updateProfileDisplayName?.(row.display_name || null)
        } else {
          // No profile yet. seed the form from Outseta name or email
          setProfile(null)
          setDisplayName(fallbackName)
          setHeadline('')
          setCity('')
          setState('')
          setPrimaryInterest('')
          setTools('')
          setBio('')
          setPhone('')
          setLinkedin('')
          setNotes('')

          auth.updateProfileDisplayName?.(fallbackName || null)
        }
      } catch (err) {
        console.error('Error loading profile', err)
        setError(
          err instanceof Error ? err.message : 'Unknown error while loading profile',
        )
      } finally {
        setLoadingProfile(false)
      }
    }

    if (!isLoading && isAuthenticated) {
      loadProfile()
    }
  }, [isLoading, isAuthenticated, userEmail, fallbackName, auth])

  useEffect(() => {
    let cancelled = false

    const loadBilling = async () => {
      try {
        setBillingLoading(true)
        setBillingError(null)

        if (typeof window === 'undefined') return

        const Outseta = window.Outseta

        if (!Outseta) {
          setBillingError('Billing tools are still warming up. Try again in a moment.')
          return
        }

        const userDetails = await (Outseta.getCurrentUser?.() ?? Outseta.getUser?.())

        if (cancelled) return

        if (!userDetails) {
          setBillingError('We could not load your billing profile yet.')
          return
        }

        const subscriptions =
          userDetails?.Subscriptions ??
          userDetails?.Account?.Subscriptions ??
          userDetails?.Account?.subscriptions ??
          []

        const activeSubscription =
          subscriptions?.find((sub: any) => sub?.Status === 'Active') ?? subscriptions?.[0]

        const planName =
          activeSubscription?.Plan?.Name ??
          activeSubscription?.PlanName ??
          userDetails?.PlanName ??
          null

        const renewalTerm =
          activeSubscription?.BillingRenewalTerm ??
          activeSubscription?.PlanPaymentTerm ??
          activeSubscription?.Plan?.BillingRenewalTerm ??
          null

        const nextBillingDate =
          activeSubscription?.NextBillingDate ??
          activeSubscription?.CurrentBillingTermEndDate ??
          activeSubscription?.BillingRenewalDate ??
          null

        const billingProfile =
          userDetails?.BillingProfile ?? userDetails?.BillingAddress ?? userDetails?.Account ?? {}

        const nameFromOutseta =
          billingProfile?.FirstName && billingProfile?.LastName
            ? `${billingProfile.FirstName} ${billingProfile.LastName}`
            : billingProfile?.Name || userDetails?.Name || null

        const phoneFromOutseta =
          billingProfile?.Phone || billingProfile?.PhoneNumber || userDetails?.Phone || null

        setBillingSummary({
          planName,
          renewalTerm,
          nextBillingDate,
          name: nameFromOutseta,
          phone: phoneFromOutseta,
        })
      } catch (err) {
        console.error('Error loading billing profile', err)
        setBillingError('Unable to reach billing right now. Please try again shortly.')
      } finally {
        setBillingLoading(false)
      }
    }

    if (!isLoading && isAuthenticated) {
      void loadBilling()
    }

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isLoading])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setError('Profile service is temporarily unavailable.')
      return
    }
    if (!userEmail) {
      setError('No user email found for this session.')
      return
    }

    if (!displayName.trim()) {
      setError('Display name is required to personalize your profile.')
      return
    }

    if (phone && !/^\+?[0-9().\-\s]{7,}$/.test(phone)) {
      setError('Use a valid phone number with at least 7 digits.')
      return
    }

    if (linkedin && !/^https?:\/\/(www\.)?linkedin.com\//i.test(linkedin)) {
      setError('LinkedIn must start with https://www.linkedin.com/.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const structuredNotes: StructuredNotes = {
        bio: bio.trim(),
        phone: phone.trim(),
        linkedin: linkedin.trim(),
        notes: notes.trim(),
      }

      const payload = {
        user_email: userEmail,
        display_name: displayName.trim() || null,
        headline: headline.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        primary_interest: primaryInterest.trim() || null,
        tools: tools.trim() || null,
        notes: JSON.stringify(structuredNotes),
      }

      const encodedEmail = encodeURIComponent(userEmail)
      const hasExisting = !!profile

      const url = hasExisting
        ? `${SUPABASE_URL}/rest/v1/profiles?user_email=eq.${encodedEmail}`
        : `${SUPABASE_URL}/rest/v1/profiles`

      const method = hasExisting ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`Supabase returned ${res.status} ${res.statusText}`)
      }

      const rows = (await res.json()) as Profile[]
      const row = rows[0] ?? null
      if (row) {
        setProfile(row)
        if (row.display_name) {
          setDisplayName(row.display_name)
        }
        auth.updateProfileDisplayName?.(row.display_name || null)
      }

      setSuccess('Profile updated. Your dashboard greeting will reflect this change.')
    } catch (err) {
      console.error('Error saving profile', err)
      setError(
        err instanceof Error ? err.message : 'Unknown error while saving profile',
      )
    } finally {
      setSaving(false)
    }
  }

  const openManageBilling = () => {
    if (typeof window === 'undefined') return
    const Outseta = window.Outseta
    const hostedBaseUrl = 'https://nested-objects.outseta.com/auth'

    try {
      if (Outseta?.auth?.open) {
        Outseta.auth.open({ widgetMode: 'updateSubscription' })
        return
      }

      window.open(`${hostedBaseUrl}?widgetMode=updateSubscription`, '_blank')
    } catch (err) {
      console.error('Error opening billing portal', err)
    }
  }

  const openUpgrade = () => {
    if (typeof window === 'undefined') return
    const Outseta = window.Outseta
    const hostedBaseUrl = 'https://nested-objects.outseta.com/auth'
    const proPlanUid = 'rQVqlLm6'

    try {
      if (Outseta?.auth?.open) {
        Outseta.auth.open({
          widgetMode: isAuthenticated ? 'updateSubscription' : 'register',
          planUid: proPlanUid,
          planPaymentTerm: 'month',
          skipPlanOptions: true,
        })
        return
      }

      const params = new URLSearchParams({
        widgetMode: isAuthenticated ? 'updateSubscription' : 'register',
        planUid: proPlanUid,
        planPaymentTerm: 'month',
        skipPlanOptions: 'true',
      })

      window.open(`${hostedBaseUrl}?${params.toString()}`, '_blank')
    } catch (err) {
      console.error('Error opening upgrade flow', err)
    }
  }

  const hasPaidSubscription =
    !!auth?.planUid && auth.planUid !== 'L9nbKV9Z' && auth.planUid !== 'zWZD0rQp'

  // Not logged in
  if (!isLoading && !isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 py-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white/80 p-10 text-center shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Your profile
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            Log in to view and personalize your Nested Objects profile.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
              className="inline-flex items-center rounded-full border border-blue-500 px-5 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-blue-400 dark:text-blue-200 dark:hover:bg-blue-500/10"
            >
              Login
            </a>
            <a
              href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
              className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Get free access
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-2xl bg-white/80 p-6 shadow-md ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/60 dark:ring-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Account
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Your inspector profile
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This is what Nested Objects will use to match you to firms, gigs, and tools.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Profiles name/display name syncs with your dashboard greeting automatically.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 text-sm text-slate-600 dark:text-slate-300 lg:items-end">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 transition hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <span aria-hidden>←</span> Back to dashboard
            </Link>
            <div className="flex items-center gap-3 rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 text-lg font-semibold text-white shadow-lg">
                {initials || '?'}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {displayName || fallbackName}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{emailLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Metadata + actions */}
        <section className="grid gap-4 rounded-2xl bg-white/80 p-6 shadow-md ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/60 dark:ring-slate-800 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-200">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Name
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                {displayName || fallbackName}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Email
              </p>
              <p className="mt-1 text-base font-medium break-all text-slate-900 dark:text-white">
                {emailLabel}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Role
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{role}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Last login
              </p>
              <p className="mt-1 text-base font-medium text-slate-900 dark:text-white">
                {formatDate(lastLogin)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-3 md:justify-end">
            <button
              type="button"
              onClick={() =>
                window?.open(
                  'https://nested-objects.outseta.com/auth?widgetMode=resetPassword#o-anonymous',
                  '_blank',
                )
              }
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-200"
            >
              Change password
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center rounded-full border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </section>


        {/* Top layout. avatar summary + form */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.95fr)]">
          {/* Left. avatar + summary */}
          <aside className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-6 shadow-md dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/70">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 text-xl font-semibold text-white shadow-lg">
                {initials || '?'}
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {displayName || fallbackName}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {headline || 'Add a short headline so firms know your lane.'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {city && state ? `${city}, ${state}` : 'Add your city and state.'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <p className="font-semibold text-slate-900 dark:text-white">
                Make your profile match-ready
              </p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Highlight your main field services lanes and regions.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  List tools you already use so firms know you are plug and play.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Use the bio + notes area to track goals, certifications, or next steps.
                </li>
              </ul>
            </div>
          </aside>

          {/* Right. billing + editable form */}
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white/90 shadow-lg ring-1 ring-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:ring-slate-800">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Billing and subscriptions</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Managed securely by Outseta. Edit billing contact details in the portal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openManageBilling}
                  className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  Manage billing
                </button>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
                {billingLoading && <p className="text-slate-600 dark:text-slate-300">Loading billing…</p>}

                {billingError && !billingLoading && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                    {billingError}
                  </div>
                )}

                {!billingLoading && !billingError && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Plan</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {billingSummary?.planName || 'Starter / free'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Renewal</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {billingSummary?.renewalTerm ? billingSummary.renewalTerm : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Next billing</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {billingSummary?.nextBillingDate
                          ? formatDate(billingSummary.nextBillingDate)
                          : 'Included in free access'}
                      </span>
                    </div>

                    {(billingSummary?.name || billingSummary?.phone) && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed dark:border-slate-700 dark:bg-slate-800/60">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Billing contact</p>
                        {billingSummary?.name && <p className="font-semibold text-slate-900 dark:text-white">{billingSummary.name}</p>}
                        {billingSummary?.phone && (
                          <p className="text-slate-700 dark:text-slate-200">{billingSummary.phone}</p>
                        )}
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Update contact info directly in the Outseta overlay so it stays in sync everywhere.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                {!hasPaidSubscription && (
                  <button
                    type="button"
                    onClick={openUpgrade}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                  >
                    Upgrade to Pro
                  </button>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Billing, subscription renewals, and payment methods are handled in Outseta to avoid duplicate data.
                </p>
              </CardFooter>
            </Card>

            <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg ring-1 ring-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:ring-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Profile details
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Firms never see your email unless you share it directly.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {saving ? 'Saving…' : 'Autosave-ready'}
                </span>
              </div>

              {loadingProfile && (
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  Loading your profile…
                </p>
              )}

              {!loadingProfile && (
                <form className="mt-6 space-y-5" onSubmit={handleSave}>
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
                      {success}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="displayName"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        Display name
                      </label>
                      <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="What firms and the dashboard will call you"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="headline"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        Headline
                      </label>
                      <input
                        id="headline"
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g. Mortgage field inspector | Rural Midwest"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="city"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Columbus"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="state"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. OH"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="primaryInterest"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        Primary interest
                      </label>
                      <input
                        id="primaryInterest"
                        type="text"
                        value={primaryInterest}
                        onChange={(e) => setPrimaryInterest(e.target.value)}
                        placeholder="e.g. Mortgage field services, occupancy checks"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="tools"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        Tools already use
                      </label>
                      <input
                        id="tools"
                        type="text"
                        value={tools}
                        onChange={(e) => setTools(e.target.value)}
                        placeholder="e.g. Aspen iAgent, EZInspections, Spectora, FieldCom"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label
                        htmlFor="bio"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        Bio & availability
                      </label>
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        placeholder="Short summary of your experience and the type of work you want next."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="phone"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        Phone
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 000-1234"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="linkedin"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        LinkedIn
                      </label>
                      <input
                        id="linkedin"
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://www.linkedin.com/in/your-handle"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label
                        htmlFor="notes"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        Notes, goals, or certifications
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="e.g. Aiming for 3 steady firms this year. Licensed adjuster in GA, TX. Comfortable with rural routes."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {saving ? 'Saving…' : 'Update profile'}
                      </button>
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-200"
                      >
                        View dashboard
                      </Link>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      As we roll out more tools, this profile will help auto match you to firms, training, and routes.
                    </p>
                  </div>
                </form>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
