import * as React from 'react'

import { cn } from '@/lib/utils'

type TabsContextValue = {
  value: string
  onChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) {
    throw new Error('Tabs components must be used within a <Tabs> parent')
  }
  return ctx
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const currentValue = controlledValue ?? internalValue

  const handleChange = React.useCallback(
    (nextValue: string) => {
      setInternalValue(nextValue)
      onValueChange?.(nextValue)
    },
    [onValueChange],
  )

  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
      <div className={cn(className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1 rounded-full bg-slate-100 p-1 text-sm font-medium text-slate-600 dark:bg-slate-900/70 dark:text-slate-300',
        className,
      )}
      {...props}
    />
  ),
)
TabsList.displayName = 'TabsList'

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: activeValue, onChange } = useTabsContext()
    const isActive = activeValue === value

    return (
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        ref={ref}
        onClick={() => onChange(value)}
        className={cn(
          'inline-flex items-center justify-center rounded-full px-3 py-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
          'data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white',
          isActive
            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
          className,
        )}
        data-state={isActive ? 'active' : 'inactive'}
        {...props}
      >
        {children}
      </button>
    )
  },
)
TabsTrigger.displayName = 'TabsTrigger'

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: activeValue } = useTabsContext()
    const isActive = activeValue === value

    return (
      <div
        ref={ref}
        role="tabpanel"
        hidden={!isActive}
        className={cn(isActive ? 'animate-in fade-in-50' : '', className)}
        {...props}
      >
        {isActive ? children : null}
      </div>
    )
  },
)
TabsContent.displayName = 'TabsContent'
