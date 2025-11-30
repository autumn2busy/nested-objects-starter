import * as React from 'react'

import { cn } from '@/lib/utils'

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-text-tertiary/10', className)} {...props} />
}
