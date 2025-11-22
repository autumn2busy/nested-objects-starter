'use client'

import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

type ThemeMode = 'light' | 'dark'

interface DashboardLayoutContextValue {
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  theme: ThemeMode
  toggleTheme: () => void
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | undefined>(undefined)

export function DashboardLayoutProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('light')

  const value = useMemo(
    () => ({
      isSidebarCollapsed,
      toggleSidebar: () => setIsSidebarCollapsed((prev) => !prev),
      theme,
      toggleTheme: () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [isSidebarCollapsed, theme],
  )

  return <DashboardLayoutContext.Provider value={value}>{children}</DashboardLayoutContext.Provider>
}

export function useDashboardLayout() {
  const context = useContext(DashboardLayoutContext)

  if (!context) {
    throw new Error('useDashboardLayout must be used within a DashboardLayoutProvider')
  }

  return context
}
