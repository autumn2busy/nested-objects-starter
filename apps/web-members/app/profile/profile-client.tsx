'use client'

import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileRecord, StructuredNotes, useProfile } from '@/lib/use-profile'

type ProfileFormState = {
  displayName: string
  headline: string
  city: string
  state: string
  primaryInterest: string
  tools: string
  bio: string
  phone: string
  linkedin: string
  notes: string
  availability: string
  serviceArea: string
  website: string
  avatarUrl: string | null
}

const DEFAULT_FORM_STATE: ProfileFormState = {
  displayName: '',
  headline: '',
  city: '',
  state: '',
  primaryInterest: '',
  tools: '',
  bio: '',
  phone: '',
  linkedin: '',
  notes: '',
  availability: '',
  serviceArea: '',
  website: '',
  avatarUrl: null,
}

function formatDate(value: string | number | Date | undefined | null): string {
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

function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function buildFormState(
  profile: ProfileRecord | null,
  notes: StructuredNotes,
  fallbackName: string,
  cachedAvatarUrl: string | null,
): ProfileFormState {
  return {
    displayName: profile?.display_name ?? fallbackName ?? '',
    headline: profile?.headline ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    primaryInterest: profile?.primary_interest ?? '',
    tools: profile?.tools ?? '',
    bio: notes.bio,
    phone: notes.phone,
    linkedin: notes.linkedin,
    notes: notes.notes,
    availability: notes.availability,
    serviceArea: notes.service_area,
    website: notes.website,
    avatarUrl: profile?.avatar_url ?? cachedAvatarUrl ?? null,
  }
}

export default function ProfileClient() {
  const router = useRouter()
  const auth = useAuth()
  const {
    isAuthenticated,
    isLoading: authLoading,
    logout,
    profileAvatarUrl,
    updateProfileAvatarUrl,
    profileDisplayName,
  } = auth

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

  const emailLabel = userEmail ?? 'Your profile'

  const fallbackName = useMemo(
    () =>
      profileDisplayName ??
      outsetaFirstName ??
      emailLabel.split('@')[0]?.replace(/[._]/g, ' ') ??
      'Member',
    [profileDisplayName, outsetaFirstName, emailLabel],
  )

  const initials = initialsFromName(fallbackName || 'Member')

  const {
    profile,
    structuredNotes,
    isLoading,
    isSaving,
    error,
    success,
    saveProfile,
    setError,
  } = useProfile(userEmail)

  const [formState, setFormState] = useState<ProfileFormState>({
    ...DEFAULT_FORM_STATE,
    displayName: fallbackName,
    avatarUrl: profileAvatarUrl ?? null,
  })
  const [activeTab, setActiveTab] = useState('profile')
  const [isPending, startTransition] = useTransition()

  const [billingSummary, setBillingSummary] = useState<{
    planName: string | null
    renewalTerm: string | null
    nextBillingDate: string | number | Date | null
    name: string | null
    phone: string | null
  } | null>(null)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingPortalReady, setBillingPortalReady] = useState(false)
  const [billingPortalTimedOut, setBillingPortalTimedOut] = useState(false)

  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [directoryVisible, setDirectoryVisible] = useState(true)
  const [b2bVisible, setB2bVisible] = useState(true)

  const billingPortalLoading = !billingPortalReady && !billingPortalTimedOut

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setFormState(
        buildFormState(profile, structuredNotes, fallbackName, profileAvatarUrl ?? null),
      )
    }
  }, [authLoading, isAuthenticated, profile, structuredNotes, fallbackName, profileAvatarUrl])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const { Outseta } = window as typeof window & {
      Outseta?: { nocode?: { load?: () => void } }
    }

    Outseta?.nocode?.load?.()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const { Outseta } = window as typeof window & {
      Outseta?: { nocode?: { load?: () => void }; auth?: { open?: () => void } }
    }

    Outseta?.nocode?.load?.()

    if (activeTab === 'billing' && Outseta?.auth?.open) {
      setBillingPortalReady(true)
      setBillingPortalTimedOut(false)
    }
  }, [activeTab])

  const isPageLoading = authLoading || isLoading

  const handleChange = (key: keyof ProfileFormState, value: string | null) => {
    setError(null)
    setFormState((prev) => ({ ...prev, [key]: value as any }))
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    handleChange('avatarUrl', objectUrl)
    updateProfileAvatarUrl?.(objectUrl)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!formState.displayName.trim()) {
      setError('Display name is required to personalize your profile.')
      return
    }

    if (formState.phone && !/^\+?[0-9().\-\s]{7,}$/.test(formState.phone)) {
      setError('Use a valid phone number with at least 7 digits.')
      return
    }

    if (formState.linkedin && !/^https?:\/\/(www\.)?linkedin.com\//i.test(formState.linkedin)) {
      setError('LinkedIn must start with https://www.linkedin.com/.')
      return
    }

    const saved = await saveProfile({
      displayName: formState.displayName,
      headline: formState.headline,
      city: formState.city,
      state: formState.state,
      primaryInterest: formState.primaryInterest,
      tools: formState.tools,
      avatarUrl: formState.avatarUrl || null,
      structuredNotes: {
        bio: formState.bio,
        phone: formState.phone,
        linkedin: formState.linkedin,
        notes: formState.notes,
        availability: formState.availability,
        service_area: formState.serviceArea,
        website: formState.website,
      },
    })

    if (saved) {
      auth.updateProfileDisplayName?.(formState.displayName || null)
      updateProfileAvatarUrl?.(formState.avatarUrl || null)
    }
  }

  useEffect(() => {
    let cancelled = false

    const waitForOutsetaEmbed = () => {
      if (typeof window === 'undefined') return

      let attempts = 0
      const maxAttempts = 20
      const intervalMs = 250

      const checkReady = () => {
        if (cancelled) return

        const Outseta = (window as any).Outseta

        if (Outseta?.auth?.open) {
          setBillingPortalReady(true)
          setBillingPortalTimedOut(false)
          clearInterval(intervalId)
          return
        }

        attempts += 1

        if (attempts >= maxAttempts) {
          setBillingPortalTimedOut(true)
          clearInterval(intervalId)
        }
      }

      const intervalId = window.setInterval(checkReady, intervalMs)
      checkReady()

      return () => {
        clearInterval(intervalId)
      }
    }

    const loadBilling = async () => {
      try {
        setBillingLoading(true)
        setBillingError(null)

        if (typeof window === 'undefined') return

        const Outseta = (window as any).Outseta

        if (!Outseta) return

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

    const cleanupWait = billingPortalLoading ? waitForOutsetaEmbed() : undefined

    if (!isLoading && isAuthenticated && !billingPortalLoading) {
      if (!billingPortalReady && billingPortalTimedOut) {
        setBillingError('Billing tools are unavailable. Use the hosted portal in the meantime.')
      } else {
        void loadBilling()
      }
    }

    return () => {
      cancelled = true
      cleanupWait?.()
    }
  }, [billingPortalLoading, billingPortalReady, billingPortalTimedOut, isAuthenticated, isLoading])

  const openManageBilling = () => {
    if (typeof window === 'undefined') return
    const Outseta = (window as any).Outseta
    const hostedBaseUrl = 'https://nested-objects.outseta.com/auth'

    try {
      if (billingPortalReady && Outseta?.auth?.open) {
        Outseta.auth.open({ widgetMode: 'profile' })
        return
      }

      if (billingPortalLoading) {
        setBillingError('Billing tools are still loading. Please try again in a moment.')
        return
      }

      window.open(`${hostedBaseUrl}?widgetMode=profile#o-anonymous`, '_blank')
    } catch (err) {
      console.error('Error opening billing portal', err)
      setBillingError('Unable to open the billing portal. Try again shortly.')
    }
  }

  const openUpgrade = () => {
    if (typeof window === 'undefined') return
    const Outseta = (window as any).Outseta
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
      setBillingError('Unable to open the upgrade flow. Try again shortly.')
    }
  }

  const hasPaidSubscription =
    !!auth?.planUid && auth.planUid !== 'L9nbKV9Z' && auth.planUid !== 'zWZD0rQp'

  const avatarPreview = formState.avatarUrl || profileAvatarUrl || null
  const locationLabel =
    formState.city && formState.state
      ? `${formState.city}, ${formState.state}`
      : 'Add your city and state.'

  const completenessScore = useMemo(() => {
    const fields = [
      formState.headline,
      formState.bio,
      formState.city,
      formState.state,
      formState.primaryInterest,
      formState.linkedin,
    ]
    const filled = fields.filter(Boolean).length
    return Math.min(100, Math.round((filled / fields.length) * 100))
  }, [formState])

  const personSchema = useMemo(
    () =>
      JSON.stringify(
        {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: formState.displayName || fallbackName,
          jobTitle: formState.headline || undefined,
          email: userEmail || undefined,
          image: avatarPreview || undefined,
          url: formState.website || undefined,
          description: formState.bio || undefined,
          address: {
            '@type': 'PostalAddress',
            addressLocality: formState.city || undefined,
            addressRegion: formState.state || undefined,
          },
          sameAs: formState.linkedin ? [formState.linkedin] : undefined,
        },
        null,
        2,
      ),
    [avatarPreview, fallbackName, formState, userEmail],
  )

  if (!isAuthenticated && !authLoading) {
    return null
  }

  const activityItems = [
    {
      title: 'Security',
      description: 'Password updated',
      date: formatDate(lastLogin || new Date()),
    },
    {
      title: 'Billing',
      description: billingSummary?.planName
        ? `Plan synced: ${billingSummary?.planName}`
        : 'Billing profile ready',
      date: billingSummary?.nextBillingDate
        ? formatDate(billingSummary.nextBillingDate)
        : 'Awaiting invoice',
    },
    {
      title: 'Directory',
      description: directoryVisible ? 'Directory profile visible' : 'Directory hidden',
      date: 'Live now',
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white sm:px-6 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personSchema }} />
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative isolate overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-800 px-6 py-8 sm:px-8 sm:py-10">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_35%)]"
            />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Profile</p>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                    Welcome back, {formState.displayName || fallbackName}
                  </h1>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold shadow-sm ring-1 ring-white/30">
                    {role} {hasPaidSubscription ? '• Pro plan' : '• Free member'}
                  </span>
                </div>
                <p className="max-w-3xl text-sm text-white/80">
                  Control center for your membership. Edit your profile, billing, security, and directory presence with live Outseta sync.
                </p>
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-white/90 backdrop-blur">
                    <span className={`h-2 w-2 rounded-full ${mfaEnabled ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                    MFA {mfaEnabled ? 'on' : 'off'}
                  </span>
                  <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-white/80 backdrop-blur">
                    Last login: {formatDate(lastLogin)}
                  </span>
                  <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-white/80 backdrop-blur">
                    {emailLabel}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  ← Back to dashboard
                </Link>
                <Link
                  href="/directory"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Open directory
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-300/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Billing & plan
                </button>
              </div>
            </div>
          </div>
        </section>

        {isPageLoading ? (
          <ProfilePageSkeleton />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
            <div className="space-y-4">
              <Card className="overflow-hidden border border-slate-200 shadow-xl dark:border-slate-800">
                <CardHeader className="space-y-4 bg-slate-900 px-6 py-6 text-white">
                  <div className="flex items-center gap-4">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview}
                        alt={formState.displayName || fallbackName}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-white/40 shadow-lg"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-teal-500 text-xl font-semibold text-white shadow-lg">
                        {initials || '?'}
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">{formState.displayName || fallbackName}</p>
                      <p className="text-sm text-white/80">
                        {formState.headline || 'Add a short headline so firms know your lane.'}
                      </p>
                      <p className="text-xs text-white/70">{locationLabel}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/60">Plan</p>
                      <p className="font-semibold text-white">{billingSummary?.planName || role}</p>
                      <p className="text-xs text-white/70">{billingSummary?.renewalTerm || 'Flexible term'}</p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/60">Next bill</p>
                      <p className="font-semibold text-white">
                        {billingSummary?.nextBillingDate ? formatDate(billingSummary.nextBillingDate) : 'TBD'}
                      </p>
                      <p className="text-xs text-white/70">Proration honored on upgrades.</p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/60">Security</p>
                      <p className="font-semibold text-white">{mfaEnabled ? 'MFA enabled' : 'MFA pending'}</p>
                      <p className="text-xs text-white/70">Keep sessions tight and sign out remotely.</p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/60">Directory</p>
                      <p className="font-semibold text-white">{directoryVisible ? 'Visible' : 'Hidden'}</p>
                      <p className="text-xs text-white/70">{completenessScore}% completeness</p>
                    </div>
                  </div>
                </CardHeader>
                <div className="space-y-4 bg-white px-6 py-5 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Profile photo</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Upload a clear headshot for trust and routing.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      Upload
                      <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} aria-label="Upload avatar" />
                    </label>
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                    <p className="font-semibold">Completion checklist</p>
                    <ul className="mt-2 space-y-2 text-xs">
                      {[
                        { label: 'Complete your bio', done: Boolean(formState.bio) },
                        { label: 'Add service regions', done: Boolean(formState.serviceArea) },
                        { label: 'Connect LinkedIn', done: Boolean(formState.linkedin) },
                        { label: 'Confirm billing profile', done: Boolean(billingSummary?.name) },
                      ].map((item) => (
                        <li key={item.label} className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${item.done ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-hidden />
                          <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-800 px-4 py-5 text-white shadow-sm dark:border-slate-800">
                    <p className="text-xs uppercase tracking-[0.14em] text-white/70">Support</p>
                    <h3 className="text-base font-semibold">Need a hand?</h3>
                    <p className="mt-1 text-sm text-white/80">Jump to training, documentation, or message our team directly.</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <Link className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20 transition hover:bg-white/20" href="/training">
                        Training hub
                      </Link>
                      <Link className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20 transition hover:bg-white/20" href="/resources">
                        Docs & FAQs
                      </Link>
                      <Link className="rounded-full bg-white px-3 py-1 text-slate-900 ring-1 ring-white/50 transition hover:-translate-y-0.5" href="mailto:help@nestedobjects.com">
                        Contact support
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <Card className="border border-slate-200 shadow-xl dark:border-slate-800">
              <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
                <div className="sticky top-4 z-10 border-b border-slate-100/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
                  <TabsList className="flex w-full gap-2 overflow-auto rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                    {[
                      { value: 'profile', label: 'Profile' },
                      { value: 'billing', label: 'Billing' },
                      { value: 'security', label: 'Security' },
                      { value: 'directory', label: 'Directory preview' },
                      { value: 'activity', label: 'Activity' },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex-1 whitespace-nowrap rounded-lg px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value="profile" className="space-y-4 px-6 pb-6 pt-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Profile</p>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Identity & story</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Update your details and we sync them to Outseta, the dashboard greeting, and the member directory.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800">
                        {completenessScore}% complete
                      </span>
                      {success && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-800">
                          Saved
                        </span>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-200">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-600/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                      Profile updated and synced to Outseta.
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <Card className="border border-slate-200 shadow-sm dark:border-slate-800">
                      <CardHeader className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Identity</p>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Personal details</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Edit your display name and headline for the workspace.</p>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="displayName" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Display name
                          </label>
                          <Input
                            id="displayName"
                            data-testid="display-name"
                            value={formState.displayName}
                            onChange={(e) => handleChange('displayName', e.target.value)}
                            placeholder="What should we call you?"
                            aria-label="Display name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="headline" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Headline
                          </label>
                          <Input
                            id="headline"
                            data-testid="headline"
                            value={formState.headline}
                            onChange={(e) => handleChange('headline', e.target.value)}
                            placeholder="e.g. Ladder assist lead | Property claims pro"
                            aria-label="Headline"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200 shadow-sm dark:border-slate-800">
                      <CardHeader className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Regions & lanes</p>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Where you work best</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Share regions, availability, and tools so routing can stay accurate.
                        </p>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="city" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            City
                          </label>
                          <Input
                            id="city"
                            data-testid="city"
                            value={formState.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            placeholder="City"
                            aria-label="City"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="state" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            State
                          </label>
                          <Input
                            id="state"
                            data-testid="state"
                            value={formState.state}
                            onChange={(e) => handleChange('state', e.target.value)}
                            placeholder="State"
                            aria-label="State"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="primaryInterest" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Primary interest
                          </label>
                          <Input
                            id="primaryInterest"
                            data-testid="primary-interest"
                            value={formState.primaryInterest}
                            onChange={(e) => handleChange('primaryInterest', e.target.value)}
                            placeholder="e.g. Claims adjusting, Insurance loss control"
                            aria-label="Primary interest"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="serviceArea" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Service area or regions
                          </label>
                          <Input
                            id="serviceArea"
                            data-testid="service-area"
                            value={formState.serviceArea}
                            onChange={(e) => handleChange('serviceArea', e.target.value)}
                            placeholder="e.g. GA, TN, AL · willing to travel 150 miles"
                            aria-label="Service area"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="availability" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Availability
                          </label>
                          <Input
                            id="availability"
                            data-testid="availability"
                            value={formState.availability}
                            onChange={(e) => handleChange('availability', e.target.value)}
                            placeholder="e.g. Mon–Sat, 7am–6pm | Rush + CAT ready"
                            aria-label="Availability"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="tools" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Tools & platforms
                          </label>
                          <Input
                            id="tools"
                            data-testid="tools"
                            value={formState.tools}
                            onChange={(e) => handleChange('tools', e.target.value)}
                            placeholder="e.g. Aspen iAgent, EZInspections, Spectora"
                            aria-label="Tools"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200 shadow-sm dark:border-slate-800">
                      <CardHeader className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Contact</p>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ways to reach you</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Keep links current so introductions and payouts land where you expect.
                        </p>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="phone" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Phone
                          </label>
                          <Input
                            id="phone"
                            data-testid="phone"
                            value={formState.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="e.g. +1 (555) 000-1234"
                            aria-label="Phone"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="linkedin" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            LinkedIn
                          </label>
                          <Input
                            id="linkedin"
                            data-testid="linkedin"
                            type="url"
                            value={formState.linkedin}
                            onChange={(e) => handleChange('linkedin', e.target.value)}
                            placeholder="https://www.linkedin.com/in/your-handle"
                            aria-label="LinkedIn"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="website" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Portfolio or website
                          </label>
                          <Input
                            id="website"
                            data-testid="website"
                            type="url"
                            value={formState.website}
                            onChange={(e) => handleChange('website', e.target.value)}
                            placeholder="https://"
                            aria-label="Website"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="notes" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Notes, goals, or certifications
                          </label>
                          <textarea
                            id="notes"
                            data-testid="notes"
                            value={formState.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            rows={3}
                            placeholder="e.g. Aiming for 3 steady firms this year."
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                            aria-label="Notes"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200 shadow-sm dark:border-slate-800">
                      <CardHeader className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Story</p>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Bio & availability</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Share a snapshot of your background plus any certifications or goals.</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <label htmlFor="bio" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Bio
                          </label>
                          <textarea
                            id="bio"
                            data-testid="bio"
                            value={formState.bio}
                            onChange={(e) => handleChange('bio', e.target.value)}
                            rows={4}
                            placeholder="Short summary of your experience and the type of work you want next."
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                            aria-label="Bio"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="availabilityNotes" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Availability notes
                          </label>
                          <textarea
                            id="availabilityNotes"
                            data-testid="availability-notes"
                            value={formState.availability}
                            onChange={(e) => handleChange('availability', e.target.value)}
                            rows={3}
                            placeholder="Highlight response times, travel range, or preferred jobs."
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                            aria-label="Availability notes"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={isSaving || isPending}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                          {isSaving || isPending ? 'Saving…' : 'Update profile'}
                        </button>
                        <button
                          type="button"
                          onClick={() => startTransition(() => router.refresh())}
                          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-200"
                        >
                          Refresh data
                        </button>
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-200"
                        >
                          View dashboard
                        </Link>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Optimistic saves on, Outseta-connected. We&apos;ll toast you when it sticks.
                      </p>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4 px-6 pb-6 pt-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Billing</p>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Plan & invoices</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Live Outseta embed with hosted portal fallback if widgets are offline.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={openManageBilling}
                        className="rounded-full bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900"
                      >
                        Open billing portal
                      </button>
                      <button
                        type="button"
                        onClick={openUpgrade}
                        className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-100"
                      >
                        Compare plans
                      </button>
                    </div>
                  </div>

                  <div
                    data-o-profile="1"
                    data-mode="embed"
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    aria-live="polite"
                  />

                  <Card className="border border-slate-200 bg-slate-50/70 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardHeader className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Subscription</p>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">Subscriptions & renewals</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Managed securely by Outseta. Edit billing contact details in the portal.</p>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Active plan</p>
                          <p className="text-base font-semibold text-slate-900 dark:text-white">
                            {billingSummary?.planName || 'Loading…'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Renewal term: {billingSummary?.renewalTerm || 'Flexible'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Next billing</p>
                          <p className="text-base font-semibold text-slate-900 dark:text-white">
                            {billingSummary?.nextBillingDate ? formatDate(billingSummary.nextBillingDate) : 'Pending sync'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Proration applies on mid-cycle changes.</p>
                        </div>
                      </div>

                      {billingError && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-200">
                          {billingError} Hosted portal will open in a new tab.
                        </div>
                      )}

                      {billingLoading && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" role="status">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Syncing billing…
                        </div>
                      )}

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Billing, subscription renewals, and payment methods are handled in Outseta to avoid duplicate data.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 px-6 pb-6 pt-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Security</p>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Credentials & devices</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Guard your sessions. MFA and password resets run through Outseta.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setMfaEnabled((prev) => !prev)}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100"
                      >
                        {mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          window?.open(
                            'https://nested-objects.outseta.com/auth?widgetMode=resetPassword#o-anonymous',
                            '_blank',
                          )
                        }
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-800 shadow-sm transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        Reset password
                      </button>
                    </div>
                  </div>

                  <Card className="border border-slate-200 shadow-sm dark:border-slate-800">
                    <CardHeader className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Sessions</p>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent activity</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Last login {formatDate(lastLogin)}. Revoke devices you do not recognize.</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {['MacBook Pro • Atlanta, GA', 'Chrome • Mobile', 'Safari • iPad'].map((device) => (
                        <div
                          key={device}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                          <div>
                            <p className="font-semibold">{device}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Active within 30 days</p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-100"
                          >
                            Sign out
                          </button>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                        <span>Need a data export or to sign out everywhere?</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-800 shadow-sm transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            Download data
                          </button>
                          <button
                            type="button"
                            onClick={logout}
                            className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900"
                          >
                            Logout everywhere
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="directory" className="space-y-4 px-6 pb-6 pt-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Directory</p>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Public preview</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Control what shows in the member directory and B2B briefs.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setDirectoryVisible((prev) => !prev)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-800 shadow-sm transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        {directoryVisible ? 'Hide directory profile' : 'Show directory profile'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setB2bVisible((prev) => !prev)}
                        className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-700 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100"
                      >
                        {b2bVisible ? 'Hide B2B view' : 'Show B2B view'}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {[{ label: 'Member directory', visible: directoryVisible }, { label: 'B2B clients', visible: b2bVisible }].map(
                      ({ label, visible }) => (
                        <Card key={label} className="border border-slate-200 shadow-sm dark:border-slate-800">
                          <CardHeader className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
                              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{formState.displayName || fallbackName}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300">{formState.headline || 'Headline pending'}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${visible ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:ring-emerald-800' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'}`}>
                              {visible ? 'Visible' : 'Hidden'}
                            </span>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                              {avatarPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={avatarPreview}
                                  alt={`${formState.displayName || fallbackName} avatar`}
                                  className="h-12 w-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                                  {initials || '?'}
                                </div>
                              )}
                              <div className="text-sm text-slate-700 dark:text-slate-200">
                                <p>{locationLabel}</p>
                                <p>{formState.serviceArea || 'Service area pending'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Tools: {formState.tools || 'Add tools'}</p>
                              </div>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-200">
                              {formState.bio || 'Share your story to help routing and intros.'}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                              {formState.linkedin && (
                                <a
                                  href={formState.linkedin}
                                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:text-slate-200"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  LinkedIn
                                </a>
                              )}
                              {formState.website && (
                                <a
                                  href={formState.website}
                                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:text-slate-200"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Website
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ),
                    )}
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                    <span>Completeness meter: {completenessScore}%</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${completenessScore}%` }} aria-label={`Profile completeness ${completenessScore}%`} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4 px-6 pb-6 pt-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Activity</p>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent moves</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Logins, plan changes, and support interactions at a glance.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                      Real-time sync
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activityItems.map((item) => (
                      <div
                        key={item.title + item.date}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.date}</span>
                      </div>
                    ))}
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                      Empty state? We&apos;ll surface plan changes, support tickets, and login alerts here as they happen.
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}

function ProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-44 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="h-full w-full rounded-2xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden border border-slate-200 shadow-lg dark:border-slate-800">
            <div className="space-y-4 bg-slate-900 px-6 py-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            </div>
            <div className="space-y-3 bg-white px-6 py-5 dark:bg-slate-900">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </Card>

          <Card className="space-y-3 border border-slate-200 p-6 shadow-lg dark:border-slate-800">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </Card>
        </div>

        <Card className="space-y-4 border border-slate-200 p-6 shadow-lg dark:border-slate-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16 rounded-full" />
              <Skeleton className="h-9 w-16 rounded-full" />
              <Skeleton className="h-9 w-16 rounded-full" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 rounded-lg" />
            ))}
            <Skeleton className="h-24 rounded-lg md:col-span-2" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <Skeleton className="h-12 rounded-lg" />
        </Card>
      </div>
    </div>
  )
}