'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'

import { useAuth } from '@/components/auth-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { DashboardPageFrame } from './dashboard-page-frame'

const quickLinks = [
  { label: 'Edit profile', href: '/profile' },
  { label: 'Billing & invoices', href: '/dashboard#billing' },
  { label: 'Directory', href: '/directory' },
  { label: 'Training', href: '/training' },
]

const activityFeed = [
  { title: 'Login from Dallas, TX', time: '2h ago', type: 'security' },
  { title: 'Saved search: Pro · Insurance · TX', time: '1d ago', type: 'directory' },
  { title: 'Training unlocked: Hybrid inspection playbook', time: '3d ago', type: 'training' },
]

const resources = [
  { title: 'Partner offer: Route optimization bundle', tag: 'Partner', href: '/partners' },
  { title: 'AI concierge prompts for insurance lanes', tag: 'Tools', href: '/tools' },
  { title: 'Billing FAQ + hosted portal link', tag: 'Billing', href: '/membership' },
]

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className="rounded-full border border-amber-200/40 bg-amber-200/10 px-3 py-1 text-xs font-semibold text-amber-50">
      {plan}
    </span>
  )
}

export default function DashboardClientPage() {
  const { user, planUid, profileDisplayName } = useAuth()
  const [mfaEnabled, setMfaEnabled] = useState(true)
  const [profileCompleteness, setProfileCompleteness] = useState(78)
  const [isPending, startTransition] = useTransition()

  const planName = useMemo(() => {
    switch (planUid) {
      case 'L9nbKV9Z':
        return 'Starter'
      case 'rQVqlLm6':
        return 'Pro'
      case 'NmdnNO90':
        return 'Elite'
      case 'rmk5Xk9g':
        return 'Agency'
      default:
        return 'Member'
    }
  }, [planUid])

  const name = useMemo(
    () => profileDisplayName || user?.first_name || user?.FirstName || user?.email?.split('@')[0] || 'Member',
    [profileDisplayName, user],
  )

  const optimisticProfile = () => {
    startTransition(() => {
      setProfileCompleteness((current) => Math.min(100, current + 4))
    })
  }

  return (
    <DashboardPageFrame>
      <main className="space-y-6 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <Card className="border-border-subtle bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-slate-50 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-amber-100">Dashboard</p>
              <h1 className="text-2xl font-semibold text-white">Welcome back, {name}</h1>
              <p className="text-sm text-slate-200">
                Unified access to billing, directory, partners, tools, and training. Outseta authenticated with hosted-portal fallback.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-100">
                <PlanBadge plan={planName} />
                <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1">Last login: 2h ago</span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Security: MFA {mfaEnabled ? 'on' : 'off'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Optimistic saves enabled
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-300" /> Hosted portal failsafe ready
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-300" /> Accessible keyboard navigation
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Dashboard quick links">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'border-white/30 text-white hover:border-white/50' })}
              >
                {link.label}
              </Link>
            ))}
            <Button
              variant="primary"
              size="sm"
              className="bg-white text-slate-900 hover:bg-amber-100"
              onClick={() => setMfaEnabled((prev) => !prev)}
              aria-live="polite"
            >
              Toggle MFA
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border-subtle bg-white">
            <div className="border-b border-border-subtle px-5 py-4">
              <h2 className="text-sm font-semibold text-text-primary">Account overview</h2>
              <p className="text-xs text-text-secondary">Plan badge, renewal, and payment summary.</p>
            </div>
            <div className="grid gap-3 p-5 text-sm text-text-secondary">
              <div className="rounded-xl bg-surface-muted px-4 py-3">
                <p className="text-xs font-semibold text-text-primary">Plan</p>
                <p className="font-semibold text-text-primary">{planName} · Renews April 22</p>
                <p>Card ending in ···· 4242 · Annual</p>
              </div>
              <div className="rounded-xl bg-surface-muted px-4 py-3">
                <p className="text-xs font-semibold text-text-primary">Billing controls</p>
                <p>Manage payment methods, download invoices, or open hosted portal if embed fails.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="primary" size="sm">Open billing widget</Button>
                  <Button variant="ghost" size="sm" className="text-brand-copper">Hosted portal</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-border-subtle bg-white">
            <div className="border-b border-border-subtle px-5 py-4">
              <h2 className="text-sm font-semibold text-text-primary">Usage + readiness</h2>
              <p className="text-xs text-text-secondary">Profile completeness, MFA, and saved searches.</p>
            </div>
            <div className="space-y-3 p-5 text-sm text-text-secondary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-primary">Profile completeness</p>
                  <p>{profileCompleteness}%</p>
                </div>
                <Button variant="secondary" size="sm" onClick={optimisticProfile} disabled={isPending}>
                  Improve
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-primary">Saved searches</p>
                  <p>Directory + partners</p>
                </div>
                <Link className={buttonVariants({ variant: 'link', size: 'sm' })} href="/directory">
                  View
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-primary">Security</p>
                  <p>MFA {mfaEnabled ? 'enabled' : 'pending'} · Verified badge</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setMfaEnabled(true)}>
                  Enable MFA
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-border-subtle bg-white">
            <div className="border-b border-border-subtle px-5 py-4">
              <h2 className="text-sm font-semibold text-text-primary">Quick actions</h2>
              <p className="text-xs text-text-secondary">Inline validation + optimistic saves.</p>
            </div>
            <div className="space-y-3 p-5 text-sm text-text-secondary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-primary">Connect LinkedIn</p>
                  <p>Boost trust in directory results.</p>
                </div>
                <Button variant="primary" size="sm">Connect</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-primary">Add preferred tools</p>
                  <p>Surface plan-aware partner offers.</p>
                </div>
                <Button variant="secondary" size="sm">Add tools</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-primary">Route concierge</p>
                  <p>AI prompts + saved answers.</p>
                </div>
                <Button variant="ghost" size="sm" className="text-brand-copper">
                  Launch
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card id="billing" className="border-border-subtle bg-white">
          <div className="border-b border-border-subtle px-5 py-4">
            <h2 className="text-sm font-semibold text-text-primary">Billing + subscription</h2>
            <p className="text-xs text-text-secondary">Embedded Outseta widget with fallback links.</p>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border-subtle bg-surface-muted p-4 text-sm text-text-secondary">
                <p className="text-xs font-semibold text-text-primary">Outseta billing</p>
                <p>Widget placeholder with retry and skeleton states. If it fails, open the hosted portal.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
            <div className="space-y-3 text-sm text-text-secondary">
              <p className="text-xs font-semibold text-text-primary">Failsafe</p>
              <p>
                Hosted portal link ensures access if Outseta is unavailable. Analytics hooks can track clicks for plan change or logout.
              </p>
              <Button variant="primary" fullWidth className="bg-brand-copper text-white">
                Open hosted portal
              </Button>
            </div>
          </div>
        </Card>

        <Card className="border-border-subtle bg-white">
          <div className="border-b border-border-subtle px-5 py-4">
            <h2 className="text-sm font-semibold text-text-primary">Activity & resources</h2>
            <p className="text-xs text-text-secondary">Tabs for security, saved items, training, and partner offers.</p>
          </div>
          <Tabs defaultValue="activity" className="p-5">
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="offers">Offers</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="space-y-3">
              {activityFeed.map((item) => (
                <div key={item.title} className="rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-text-primary">{item.title}</p>
                    <span className="text-xs text-text-secondary">{item.time}</span>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-brand-copper">{item.type}</p>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="resources" className="grid gap-3 md:grid-cols-2">
              {resources.map((resource) => (
                <div key={resource.title} className="rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-brand-copper">{resource.tag}</p>
                  <p className="font-semibold text-text-primary">{resource.title}</p>
                  <Link href={resource.href} className="text-xs font-semibold text-brand-copper">
                    View →
                  </Link>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="offers" className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-brand-copper">Plan aware</p>
                  <p className="font-semibold text-text-primary">Upgrade to unlock more offers.</p>
                  <p className="text-xs text-text-secondary">Starter sees basics. Elite+ sees everything.</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </DashboardPageFrame>
  )
}
