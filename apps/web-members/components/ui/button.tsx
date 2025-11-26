import * as React from 'react'
import { ComponentPropsWithoutRef, ElementType } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'

type ButtonProps<T extends ElementType> = {
  as?: T
  variant?: Variant
  className?: string
} & ComponentPropsWithoutRef<T>

const baseClasses =
  'inline-flex items-center justify-center rounded-full border text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

const variantClasses: Record<Variant, string> = {
  primary:
    'border-brand-primary bg-brand-primary px-4 py-2.5 text-white shadow-brand-soft hover:bg-brand-primaryDark focus-visible:outline-brand-primary',
  secondary:
    'border-brand-border bg-brand-surface px-4 py-2.5 text-brand-heading shadow-sm hover:bg-brand-soft hover:text-brand-primary focus-visible:outline-brand-primary',
  ghost:
    'border-transparent bg-transparent px-3 py-2 text-brand-muted hover:text-brand-heading hover:bg-brand-soft focus-visible:outline-brand-primary',
}

export function Button<T extends ElementType = 'button'>({
  as,
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps<T>) {
  const Component = (as || 'button') as ElementType

  return (
    <Component className={cn(baseClasses, variantClasses[variant], className)} {...props}>
      {children}
    </Component>
  )
}
