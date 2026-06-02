'use client'

import Link from 'next/link'
import { LayoutDashboard, Search, Sparkles, Wrench } from 'lucide-react'

import { useAuth } from '@/components/auth-provider'

export function MobileActionBar() {
  const { isAuthenticated } = useAuth()

  const actions = isAuthenticated
    ? [
        { href: '/inspector-dashboard', label: 'Hub', icon: LayoutDashboard },
        { href: '/hiring-firms', label: 'Firms', icon: Search },
        { href: '/tools', label: 'Tools', icon: Wrench },
      ]
    : [
        { href: '/membership-pricing', label: 'Trial', icon: Sparkles },
        { href: '/hiring-firms', label: 'Firms', icon: Search },
        { href: '/tools', label: 'Tools', icon: Wrench },
      ]

  return (
    <nav
      aria-label="Mobile quick actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon
          const isPrimary = index === 0

          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                isPrimary
                  ? 'border-brand-copper bg-brand-copper text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-copper/50 hover:bg-white'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{action.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
