import * as React from 'react'

import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'sm' | 'md'
type ButtonShape = 'pill' | 'rounded'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  fullWidth?: boolean
  active?: boolean
}

export function buttonVariants({
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  fullWidth,
  active,
  className,
}: Partial<ButtonProps> = {}) {
  const base =
    'inline-flex items-center justify-center font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper disabled:cursor-not-allowed disabled:opacity-60'

  const sizeClass = size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'
  const shapeClass = shape === 'rounded' ? 'rounded-lg' : 'rounded-full'

  const variantClass = {
    primary: 'border border-brand-copper bg-brand-copper text-white shadow-brand-soft hover:bg-brand-copperDark',
    secondary:
      'border border-border-strong bg-surface-base text-text-primary shadow-sm hover:border-brand-copper hover:text-brand-copper',
    ghost:
      'border border-transparent bg-transparent text-text-secondary hover:border-border-strong hover:bg-surface-muted hover:text-text-primary',
    link: 'border-none bg-transparent px-0 text-brand-copper underline underline-offset-4 decoration-brand-copper/70 hover:text-brand-copperDark hover:decoration-brand-copper',
  }[variant]

  const activeClass = active ? 'border-brand-copper bg-brand-copper text-white shadow-sm hover:text-white' : ''
  const widthClass = fullWidth ? 'w-full' : ''

  return cn(base, sizeClass, shapeClass, variantClass, activeClass, widthClass, className)
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', shape = 'pill', fullWidth, active, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, shape, fullWidth, active, className })}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
