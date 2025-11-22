import { ReactNode } from 'react'

interface DashboardShellProps {
  sidebar: ReactNode
  header: ReactNode
  children: ReactNode
}

export function DashboardShell({ sidebar, header, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-brand-sand text-brand-slate">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row lg:gap-8 lg:px-8 lg:py-12">
        <aside className="lg:w-64">{sidebar}</aside>
        <div className="flex-1 overflow-hidden rounded-2xl border border-brand-mist bg-white shadow-sm">
          {header}
          <div className="space-y-8 p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
