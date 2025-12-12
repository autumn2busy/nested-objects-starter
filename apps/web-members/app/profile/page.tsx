'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
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

function buildFormState(
  profile: ProfileRecord | null,
  notes: StructuredNotes,
  fallbackName: string,
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
    // assumes useProfile exposes camelCase avatarUrl on the record
    avatarUrl: (profile as any)?.avatarUrl ?? null,
  }
}

function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export default function ProfilePage() {
  const router = useRouter()
  const auth = useAuth()
  const { isAuthenticated, isLoading: authLoading, logout } = auth

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
      auth.profileDisplayName ??
      outsetaFirstName ??
      emailLabel.split('@')[0]?.replace(/[._]/g, ' ') ??
      'Member',
    [auth.profileDisplayName, outsetaFirstName, emailLabel],
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
  })
  const [activeTab, setActiveTab] = useState('profile')

  const [billingSummary, setBillingSummary] = useState<{
    planName: string | null
    renewalTerm: string | null
    nextBillingDate: string | number | Date | null
    name: string | null
    phone: string | null
  } | null>(null)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setFormState(buildFormState(profile, structuredNotes, fallbackName))
    }
  }, [authLoading, isAuthenticated, profile, structuredNotes, fallbackName])

  const isPageLoading = authLoading || isLoading

  const handleChange = (key: keyof ProfileFormState, value: string | null) => {
    setError(null)
    setFormState((prev) => ({ ...prev, [key]: value as any }))
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
      // if your auth context tracks avatar, this is where you would update it too
      // auth.updateProfileAvatarUrl?.(formState.avatarUrl || null)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadBilling = async () => {
      try {
        setBillingLoading(true)
        setBillingError(null)

        if (typeof window === 'undefined') return

        const Outseta = (window as any).Outseta

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

  const openManageBilling = () => {
    if (typeof window === 'undefined') return
    const Outseta = (window as any).Outseta
    const hostedBaseUrl = 'https://nested-objects.outseta.com/auth'

    try {
      if (Outseta?.auth?.open) {
        Outseta.auth.open({ widgetMode: 'profile' })
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

  if (!isAuthenticated && !authLoading) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Account
          </p>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                Account settings
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                Keep your inspector profile, billing preferences, and security details current so
                matching, alerts, and payouts stay accurate.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
            >
              ← Back to dashboard
            </Link>
          </div>
        </header>

        {isPageLoading ? (
          <ProfilePageSkeleton />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
            <div className="space-y-4">
              <Card className="p-6">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 text-xl font-semibold text-white shadow-lg">
                      {initials || '?'}
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {formState.displayName || fallbackName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {formState.headline || 'Add a short headline so firms know your lane.'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formState.city && formState.state
                          ? `${formState.city}, ${formState.state}`
                          : 'Add your city and state.'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-200">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Email
                      </p>
                      <p className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-white">
                        {emailLabel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Role
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                        {role}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Last login
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                        {formatDate(lastLogin)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Availability
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                        {formState.availability || 'Add schedule + coverage.'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Match-ready checklist
                  </p>
                  <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      Share your current lanes, coverage regions, and tools.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      Add a bio plus availability so firms can route quickly.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      Keep contact links fresh for partner introductions.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="space-y-4 p-6">
                <CardHeader className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Quick links
                  </p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    Billing & security
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  <button
                    type="button"
                    onClick={() =>
                      window?.open(
                        'https://nested-objects.outseta.com/auth?widgetMode=resetPassword#o-anonymous',
                        '_blank',
                      )
                    }
                    className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                  >
                    Change password
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full rounded-full border border-transparent bg-slate-900 px-4 py-2 font-semibold text-white shadow transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    Logout
                  </button>
                </CardContent>
              </Card>
            </div>

            <Card className="p-6">
              <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Workspace
                    </p>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Manage your account
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Profile changes sync to your dashboard greeting and partner directory.
                    </p>
                  </div>
                  <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="profile" className="mt-4">
                  <form className="space-y-5" onSubmit={handleSubmit}>
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
                        <Input
                          id="displayName"
                          value={formState.displayName}
                          onChange={(e) => handleChange('displayName', e.target.value)}
                          placeholder="What should we call you?"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="headline"
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                          Headline
                        </label>
                        <Input
                          id="headline"
                          value={formState.headline}
                          onChange={(e) => handleChange('headline', e.target.value)}
                          placeholder="e.g. Ladder assist lead | Property claims pro"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="city"
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                          City
                        </label>
                        <Input
                          id="city"
                          value={formState.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="state"
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                          State
                        </label>
                        <Input
                          id="state"
                          value={formState.state}
                          onChange={(e) => handleChange('state', e.target.value)}
                          placeholder="State"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="primaryInterest"
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                          Primary field services lane
                        </label>
                        <Input
                          id="primaryInterest"
                          value={formState.primaryInterest}
                          onChange={(e) => handleChange('primaryInterest', e.target.value)}
                          placeholder="e.g. Property claims, ladder assist, drone ops"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="tools"
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                          Tools you use
                        </label>
                        <Input
                          id="tools"
                          value={formState.tools}
                          onChange={(e) => handleChange('tools', e.target.value)}
                          placeholder="e.g. Aspen iAgent, EZInspections, Spectora"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="serviceArea"
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                          Service area or regions
                        </label>
                        <Input
                          id="serviceArea"
                          value={formState.serviceArea}
                          onChange={(e) => handleChange('serviceArea', e.target.value)}
                          placeholder="e.g. GA, TN, AL . willing to travel 150 miles"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="availability"
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                          Availability
                        </label>
                        <Input
                          id="availability"
                          value={formState.availability}
                          onChange={(e) => handleChange('availability', e.target.value)}
                          placeholder="e.g. Mon–Sat, 7am–6pm | Rush + CAT ready"
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
                          value={formState.bio}
                          onChange={(e) => handleChange('bio', e.target.value)}
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
                        <Input
                          id="phone"
                          type="tel"
                          value={formState.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="e.g. +1 (555) 000-1234"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="linkedin"
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                          LinkedIn
                        </label>
                        <Input
                          id="linkedin"
                          type="url"
                          value={formState.linkedin}
                          onChange={(e) => handleChange('linkedin', e.target.value)}
                          placeholder="https://www.linkedin.com/in/your-handle"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="website"
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                          Portfolio or website
                        </label>
                        <Input
                          id="website"
                          type="url"
                          value={formState.website}
                          onChange={(e) => handleChange('website', e.target.value)}
                          placeholder="https://"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="notes"
                          className="text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                          Notes, goals, or certifications
                        </label>
                        <textarea
                          id="notes"
                          value={formState.notes}
                          onChange={(e) => handleChange('notes', e.target.value)}
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
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                          {isSaving ? 'Saving…' : 'Update profile'}
                        </button>
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-200"
                        >
                          View dashboard
                        </Link>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Autosaves ready. As we roll out more tools, this profile will help auto
                        match you to firms, training, and routes.
                      </p>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="billing" className="mt-4 space-y-4">
                  <div
                    data-o-profile="1"
                    data-mode="embed"
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  />

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Billing and subscriptions
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Managed securely by Outseta. Edit billing contact details in the portal.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openManageBilling}
                        className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        Manage billing
                      </button>
                    </div>

                    {billingLoading && (
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        Loading billing…
                      </p>
                    )}

                    {billingError && !billingLoading && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                        {billingError}
                      </div>
                    )}

                    {!billingLoading && !billingError && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                          <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Plan
                          </span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {billingSummary?.planName || 'Starter / free'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                          <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Renewal
                          </span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {billingSummary?.renewalTerm ? billingSummary.renewalTerm : 'Not set'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                          <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Next billing
                          </span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {billingSummary?.nextBillingDate
                              ? formatDate(billingSummary.nextBillingDate)
                              : 'Included in free access'}
                          </span>
                        </div>

                        {(billingSummary?.name || billingSummary?.phone) && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed dark:border-slate-700 dark:bg-slate-800/60">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Billing contact
                            </p>
                            {billingSummary?.name && (
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {billingSummary.name}
                              </p>
                            )}
                            {billingSummary?.phone && (
                              <p className="text-slate-700 dark:text-slate-200">
                                {billingSummary.phone}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              Update contact info directly in the Outseta overlay so it stays in sync
                              everywhere.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!hasPaidSubscription && (
                      <button
                        type="button"
                        onClick={openUpgrade}
                        className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                      >
                        Upgrade to Pro
                      </button>
                    )}

                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Billing, subscription renewals, and payment methods are handled in Outseta to
                      avoid duplicate data.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="account" className="mt-4 space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Security & session
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Last login: {formatDate(lastLogin)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          window?.open(
                            'https://nested-objects.outseta.com/auth?widgetMode=resetPassword#o-anonymous',
                            '_blank',
                          )
                        }
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={logout}
                        className="inline-flex items-center rounded-full border border-transparent bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      >
                        Sign out
                      </button>
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
    <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
      <div className="space-y-4">
        <Card className="space-y-4 p-6">
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
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </Card>
        <Card className="space-y-3 p-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-10 w-full rounded-full" />
        </Card>
      </div>
      <Card className="space-y-4 p-6">
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
  )
}
