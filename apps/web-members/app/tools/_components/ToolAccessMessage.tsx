import Link from 'next/link'
import { ReactNode } from 'react'

interface ToolAccessMessageProps {
  title: string
  description: string
  actions?: ReactNode
  tone?: 'info' | 'warning'
  loading?: boolean
}

export function ToolAccessMessage({ title, description, actions, tone = 'info', loading }: ToolAccessMessageProps) {
  const toneStyles =
    tone === 'warning'
      ? 'border-amber-300/80 bg-amber-50 text-amber-900'
      : 'border-brand-copper/25 bg-white text-brand-dark'

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${toneStyles}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Access</p>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-slate-700">{loading ? 'Checking your account...' : description}</p>
        </div>
        {actions && <div className="mt-3 flex shrink-0 gap-3 sm:mt-0">{actions}</div>}
      </div>
    </div>
  )
}

export function UpgradeActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center rounded-full border border-brand-copper/40 px-4 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand-copper"
      >
        Log in
      </Link>
      <Link
        href="/upgrade"
        className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
      >
        View plans
      </Link>
    </div>
  )
}
