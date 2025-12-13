'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldHelperText } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const quickLinks = [
  { label: 'Edit profile', href: '/profile' },
  { label: 'Manage billing', href: '/dashboard#billing' },
  { label: 'View directory', href: '/directory' },
  { label: 'Training', href: '/training' },
]

const resourceTabs = [
  {
    id: 'activity',
    label: 'Activity',
    entries: ['Login from Austin, TX • MFA enabled', 'Saved 3 firms to watch list', 'Viewed partner offer: camera kit'],
  },
  {
    id: 'resources',
    label: 'Resources',
    entries: ['Training: AI scripting lab', 'Partner: Safety gear bundle', 'Tooling: Billing updater walkthrough'],
  },
  {
    id: 'support',
    label: 'Support',
    entries: ['Open ticket: Update billing address', 'Message sent to Outseta portal', 'Next reply SLA: 2h'],
  },
]

export default function DashboardClientPage() {
  const { isAuthenticated, profileDisplayName, user, planUid } = useAuth()
  const [profileProgress, setProfileProgress] = useState(78)
  const [isUpdating, startTransition] = useTransition()

  const planLabel = useMemo(() => planUid || 'Starter', [planUid])

  const handleOptimisticSave = () => {
    startTransition(() => {
      setProfileProgress((prev) => Math.min(100, prev + 5))
    })
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
            <h1 className="text-2xl font-semibold">Welcome back, {profileDisplayName || user?.email || 'member'}</h1>
            <p className="text-sm text-slate-300">Plan: {planLabel} • Last login: {user?.last_login || 'Just now'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" asChild>
              <Link href="/profile">Profile</Link>
            </Button>
            <Button asChild>
              <Link href="/directory">Directory</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <Card className="border-white/10 bg-gradient-to-br from-brand-copper/10 via-slate-900 to-slate-950 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
              {isAuthenticated ? 'Authenticated via Outseta' : 'Guest preview'}
            </span>
            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-100">
              MFA {user?.mfa_enabled ? 'on' : 'pending'}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">Tenure: {user?.tenure || 'New'}</span>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-slate-200">Billing overview</p>
              <p className="text-lg font-semibold text-white">Next renewal: {user?.renewal_date || 'Auto-calculated'}</p>
              <FieldHelperText className="text-slate-200">
                Manage payment method or downgrade via the hosted portal if the embed is unavailable.
              </FieldHelperText>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-200">Plan badge</p>
              <p className="text-lg font-semibold text-white">{planLabel}</p>
              <FieldHelperText className="text-slate-200">Upgrade or compare plans in one click.</FieldHelperText>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-200">Security</p>
              <p className="text-lg font-semibold text-white">{user?.mfa_enabled ? 'MFA locked in' : 'Enable MFA now'}</p>
              <FieldHelperText className="text-slate-200">Change password or enable MFA via security settings.</FieldHelperText>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {quickLinks.map((link) => (
              <Button key={link.href} variant="ghost" size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Profile completeness</p>
                <h2 className="text-xl font-semibold text-white">Keep your directory card sharp</h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-emerald-100">{profileProgress}%</span>
            </div>
            <p className="mt-2 text-sm text-slate-200">
              Add your city/state, primary interest, and tools to help members book you faster.
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-emerald-400 transition-all"
                style={{ width: `${profileProgress}%` }}
                aria-label="Profile completeness meter"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={handleOptimisticSave} disabled={isUpdating}>
                {isUpdating ? 'Saving…' : 'Mark training as done'}
              </Button>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/profile">Update profile</Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/directory">Preview directory card</Link>
              </Button>
            </div>
          </Card>

          <Card className="border-white/10 bg-white/5 p-6" id="billing">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Billing + subscription</p>
                <h2 className="text-lg font-semibold text-white">Manage via Outseta</h2>
              </div>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-100">Fallback ready</span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <p>Billing widgets load progressively. If they fail, use the hosted portal link below.</p>
              <Skeleton className="h-10 rounded-lg bg-white/10" />
              <Skeleton className="h-10 rounded-lg bg-white/10" />
            </div>
            <Button variant="ghost" className="mt-3" asChild>
              <Link href="https://app.outseta.com/" target="_blank" rel="noreferrer">
                Open hosted portal
              </Link>
            </Button>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/5 p-6">
          <Tabs defaultValue="activity">
            <TabsList>
              {resourceTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {resourceTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-3">
                {tab.entries.map((entry) => (
                  <div
                    key={entry}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    {entry}
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <h2 className="text-xl font-semibold text-white">Account controls</h2>
          <p className="text-sm text-slate-200">Secure your membership and keep billing smooth.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="secondary" asChild>
              <Link href="/auth/change-password">Change password</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/auth/mfa">Manage MFA</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/dashboard#billing">Update card</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/privacy">Download data</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/auth/logout">Secure logout</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/membership">Compare plans</Link>
            </Button>
          </div>
        </Card>
      </div>
    </main>
  )
}
