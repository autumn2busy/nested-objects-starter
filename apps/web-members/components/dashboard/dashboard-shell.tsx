'use client'

import { ReactNode } from 'react'

import { DashboardLayoutProvider, useDashboardLayout } from './dashboard-layout-context'

interface DashboardShellProps {
  sidebar: ReactNode
  topBar: ReactNode
  children: ReactNode
}

export function DashboardShell({ sidebar, topBar, children }: DashboardShellProps) {
  return (
    <DashboardLayoutProvider>
      <DashboardShellInner sidebar={sidebar} topBar={topBar}>
        {children}
      </DashboardShellInner>
    </DashboardLayoutProvider>
  )
}

function DashboardShellInner({ sidebar, topBar, children }: DashboardShellProps) {
  const { theme, isSidebarCollapsed } = useDashboardLayout()

  const backgroundClass = theme === 'dark' ? 'bg-brand-slate text-white' : 'bg-brand-sand text-brand-slate'
  const panelClass = theme === 'dark' ? 'bg-brand-slate/70 border-brand-steel' : 'bg-white border-brand-mist'

  return (
    <div className={`${backgroundClass} min-h-screen`}> 
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 lg:px-8 lg:py-10">
        <aside
          className={`${panelClass} hidden h-[calc(100vh-3rem)] ${isSidebarCollapsed ? 'w-20' : 'w-64'} overflow-hidden rounded-2xl border shadow-sm transition-[width] lg:block`}
          data-theme={theme}
        >
          {sidebar}
        </aside>
        <div className="flex-1"> 
          <div className={`${panelClass} sticky top-4 z-20 mb-4 rounded-2xl border shadow-sm backdrop-blur`} data-theme={theme}>
            {topBar}
          </div>
          <main className={`${panelClass} rounded-2xl border shadow-sm`} data-theme={theme}>
            <div className="space-y-6 p-6 sm:p-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
