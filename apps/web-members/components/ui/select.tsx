import * as React from 'react'
import { cn } from '@/lib/utils'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-heading shadow-brand-inner focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50',
        className,
      )}
      {...props}
    />
  )
})

Select.displayName = 'Select'
