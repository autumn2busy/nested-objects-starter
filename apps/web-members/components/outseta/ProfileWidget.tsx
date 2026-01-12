'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth-provider'

export function OutsetaProfileWidget({
  tab,
  planUid,
}: {
  tab?: string
  planUid?: string
}) {
  const { isAuthenticated } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    const el = containerRef.current
    if (!el) return

    // Reset on tab/plan change
    setIsLoading(true)

    // Consider the widget ready once Outseta has loaded and injected content.
    const isReady = () => {
      const hasChildren = (el.childNodes?.length ?? 0) > 0
      const hasOutseta = typeof window !== 'undefined' && !!window.Outseta
      return hasChildren && hasOutseta
    }

    // If already mounted (ex. back navigation), stop loading
    if (isReady()) {
      setIsLoading(false)
      return
    }

    const observer = new MutationObserver(() => {
      if (isReady()) {
        setIsLoading(false)
        observer.disconnect()
      }
    })

    observer.observe(el, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
    }
  }, [isAuthenticated, tab, planUid])

  if (!isAuthenticated) return null

  return (
    <div className="w-full min-h-[600px] bg-white relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-300 border-r-slate-900"></div>
            <p className="mt-4 text-sm text-slate-600">Loading profile...</p>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        data-o-component="profile"
        data-o-props={JSON.stringify({
          tab: tab || 'profile',
          mode: 'embed',
          ...(planUid ? { planUid } : {}),
        })}
        className="w-full min-h-[600px]"
      />
    </div>
  )
}
