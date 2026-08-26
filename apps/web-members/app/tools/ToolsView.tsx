'use client'

import Link from 'next/link'
import { ArrowRight, Eye, LockKeyhole } from 'lucide-react'

import { useAuth } from '@/components/auth-provider'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TOOL_CATALOG } from '@/lib/tool-catalog'

export function ToolsView() {
  const { hasAccess, isAuthenticated, isLoading } = useAuth()

  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Tools</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Field inspector tools</h1>
          <p className="max-w-3xl text-base leading-7 text-slate-700">
            Preview every workspace before you upgrade. Visitors see static previews only. Free members can use the income calculator, while Pro unlocks the working tool suite.
          </p>
          <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:flex-wrap">
            <Link
              href={isAuthenticated ? '/inspector-dashboard' : '/membership-pricing'}
              className={buttonVariants({
                variant: 'primary',
                size: 'lg',
                shape: 'rounded',
                className: 'w-full sm:w-auto',
              })}
            >
              {isAuthenticated ? 'Open member hub' : 'Create a Free account'}
            </Link>
            <Link
              href="/membership-pricing"
              className={buttonVariants({
                variant: 'secondary',
                size: 'lg',
                shape: 'rounded',
                className: 'w-full sm:w-auto',
              })}
            >
              Compare Free and Pro
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Free</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">Income calculator</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">One useful activation tool, plus directory and resource previews.</p>
          </div>
          <div className="rounded-xl border border-brand-copper/25 bg-brand-mist/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-copper">Pro</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">Working tool suite</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">AI, tracking, weather, route, client, and company workspaces.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Legacy access</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">Starter and Founders preserved</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Existing members keep the tool access included with their original plans.</p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8 lg:py-16">
          {TOOL_CATALOG.map((tool) => {
            const canOpen = !isLoading && isAuthenticated && hasAccess(tool.feature)
            const accessLabel = tool.minimumPlan === 'Free' ? 'Free member tool' : 'Pro tool'

            return (
              <Card
                key={tool.title}
                className="relative flex h-full flex-col gap-4 border border-brand-copper/20 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${tool.minimumPlan === 'Free'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-brand-mist text-brand-copperDark'
                    }`}>
                    {canOpen ? <ArrowRight className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                    {canOpen ? 'Unlocked' : accessLabel}
                  </span>
                  {!canOpen && <LockKeyhole className="h-5 w-5 text-slate-400" aria-hidden />}
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-text-primary">{tool.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{tool.description}</p>
                </div>

                <ul className="space-y-1.5 text-xs leading-5 text-slate-600">
                  {tool.previewItems.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Link
                    href={tool.href}
                    className={buttonVariants({
                      variant: canOpen ? 'primary' : 'secondary',
                      size: 'sm',
                      shape: 'rounded',
                      className: 'w-full',
                    })}
                  >
                    {canOpen ? tool.cta : `Preview ${tool.title.toLowerCase()}`}
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </main>
  )
}
