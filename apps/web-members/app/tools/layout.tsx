'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, CheckCircle2, Eye, LockKeyhole } from 'lucide-react'

import { useAuth } from '@/components/auth-provider'
import { findToolForPath, type ToolDefinition } from '@/lib/tool-catalog'

function ToolPreview({
  tool,
  isAuthenticated,
  isLoading,
  login,
}: {
  tool: ToolDefinition | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
}) {
  const title = tool?.title ?? 'Member tool'
  const description = tool?.description ?? 'This tool is available inside the protected member workspace.'
  const minimumPlan = tool?.minimumPlan ?? 'Pro'
  const previewItems = tool?.previewItems ?? [
    'Protected member data',
    'Plan-specific workspace access',
    'No visitor-side execution',
  ]
  const isFreeTool = minimumPlan === 'Free'

  return (
    <main
      className="min-h-screen bg-brand-sand text-brand-dark"
      data-tool-preview-only="true"
    >
      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link
            href="/tools"
            className="text-sm font-semibold text-brand-copper transition hover:text-brand-copperDark"
          >
            Back to tools
          </Link>
          <div className="mt-6 flex max-w-3xl flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-copper/30 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-copper">
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Preview only
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="text-base leading-7 text-slate-700">{description}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:px-8 lg:py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-copper">
                Static product preview
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">What this workspace helps you do</h2>
            </div>
            <LockKeyhole className="h-6 w-6 text-slate-400" aria-hidden />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {previewItems.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-slate-900">{item}</p>
                <div className="mt-4 space-y-2" aria-hidden="true">
                  <div className="h-2.5 w-full rounded-full bg-slate-200" />
                  <div className="h-2.5 w-4/5 rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            This is a visual preview. The actual tool, forms, data requests, and mutations are not mounted for visitors or members without access.
          </p>
        </div>

        <aside className="h-fit rounded-2xl border border-brand-copper/25 bg-slate-950 p-6 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {isLoading ? 'Checking access' : `${minimumPlan} access`}
          </p>
          <h2 className="mt-3 text-xl font-semibold">
            {isLoading
              ? 'Confirming your membership'
              : isFreeTool
                ? 'Available with a Free account'
                : 'Unlocks with Pro'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {isLoading
              ? 'The protected tool stays unmounted while your account is checked.'
              : isFreeTool
                ? 'Create or sign in to a Free account to use this tool. No card is required for Free.'
                : 'Free members can preview this tool. Pro, Elite, and Agency members can use the working version. Existing Starter and Founders members keep their original access.'}
          </p>

          {!isLoading && (
            <div className="mt-6 flex flex-col gap-3">
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={login}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Log in
                </button>
              )}
              <Link
                href="/membership-pricing"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-copperDark"
              >
                {isFreeTool && !isAuthenticated ? 'Create a Free account' : 'Compare plans'}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { hasAccess, isAuthenticated, isLoading, login } = useAuth()

  if (pathname === '/tools' || pathname === '/tools/') {
    return <>{children}</>
  }

  const tool = findToolForPath(pathname)
  const mayUseTool = Boolean(tool && !isLoading && isAuthenticated && hasAccess(tool.feature))

  if (mayUseTool) {
    return <>{children}</>
  }

  return (
    <ToolPreview
      tool={tool}
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      login={login}
    />
  )
}
