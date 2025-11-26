import * as React from 'react'

import { cn } from '@/lib/utils'

type InputTone = 'default' | 'warning'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tone?: InputTone
}

const baseFieldClasses =
  'w-full rounded-lg border bg-surface-base px-3 py-2 text-sm text-text-primary shadow-inner transition focus-visible:border-brand-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/60 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted'

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, tone = 'default', ...props }, ref) => {
  const toneClasses = tone === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-900 placeholder:text-amber-800' : 'border-border-subtle'

  return <input ref={ref} className={cn(baseFieldClasses, toneClasses, className)} {...props} />
})
Input.displayName = 'Input'

export const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary',
      className,
    )}
    {...props}
  />
))
FieldLabel.displayName = 'FieldLabel'

export const FieldHelperText = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-xs text-text-muted', className)} {...props} />
)
