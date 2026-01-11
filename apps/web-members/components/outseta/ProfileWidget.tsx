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

    // Helper. consider the widget "loaded" once Outseta injects any child nodes
    const isMounted = () => (el.childNodes?.length ?? 0) > 0

    // If already mounted (ex. back navigation), stop loading
    if (isMounted()) {
      setIsLoading(false)
      return
    }

    let observer: MutationObserver | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    observer = new MutationObserver(() => {
      if (isMounted()) {
        setIsLoading(false)
        observer?.disconnect()
      }
    })

    observer.observe(el, { childList: true, subtree: true })

    // Safety timeout so we never spin forever
    timeoutId = setTimeout(() => {
      setIsLoading(false)
      observer?.disconnect()
    }, 6000)

    return () => {
      observer?.disconnect()
      if (timeoutId) clearTimeout(timeoutId)
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
        data-o-profile="1"
        data-tab={tab || 'profile'}
        data-plan-uid={planUid}
        data-mode="embed"
        className="w-full min-h-[600px]"
      />
    </div>
  )
}
