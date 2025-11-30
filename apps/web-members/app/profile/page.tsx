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

  const handleChange = (key: keyof ProfileFormState, value: string) => {
    setError(null)
    setFormState((prev) => ({ ...prev, [key]: value }))
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
    }
  }

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
          <div className="flex flex-col gap-3 justify-between md:flex-row md:items-center">
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

              <Card className="p-6 space-y-4">
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
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Billing overview
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Your current access level is{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {role}
                      </span>
                      . Billing updates and receipts are managed through Outseta. Use the links
                      below if you need to update payment details or receipts.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <a
                        href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                      >
                        Manage plan
                      </a>
                      <a
                        href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                      >
                        Update payment method
                      </a>
                    </div>
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
        <Card className="p-6 space-y-4">
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
        <Card className="p-6 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-10 w-full rounded-full" />
        </Card>
      </div>
      <Card className="p-6 space-y-4">
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
