import * as React from 'react'

import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const baseSelectClasses =
  'w-full rounded-lg border border-border-subtle bg-surface-base px-3 py-2 text-sm text-text-primary shadow-inner transition focus-visible:border-brand-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/60 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted'

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select ref={ref} className={cn(baseSelectClasses, className)} {...props}>
      {children}
    </select>
  )
})
Select.displayName = 'Select'
