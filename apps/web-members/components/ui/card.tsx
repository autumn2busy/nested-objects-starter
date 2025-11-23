import * as React from 'react'

type BaseProps = React.HTMLAttributes<HTMLDivElement>

function mergeClasses(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export const Card = React.forwardRef<HTMLDivElement, BaseProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={mergeClasses(
        'rounded-2xl border border-brand-steel/40 bg-white text-brand-dark shadow-brand-card backdrop-blur',
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, BaseProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={mergeClasses('space-y-1.5', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardContent = React.forwardRef<HTMLDivElement, BaseProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={mergeClasses('space-y-4', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, BaseProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={mergeClasses('flex items-center', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'
