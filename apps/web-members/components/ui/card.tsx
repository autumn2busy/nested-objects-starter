import * as React from 'react'

import { cn } from '@/lib/utils'

type BaseProps = React.HTMLAttributes<HTMLDivElement>

export const Card = React.forwardRef<HTMLDivElement, BaseProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border border-border-subtle bg-surface-base text-text-primary shadow-brand-card backdrop-blur',
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, BaseProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-1.5', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

export const CardContent = React.forwardRef<HTMLDivElement, BaseProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-4', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, BaseProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center', className)} {...props} />
))
CardFooter.displayName = 'CardFooter'
