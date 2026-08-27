'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'

import {
  trackDirectoryViewed,
  trackOutsetaModalOpen,
  trackPaywallHit,
  trackUpgradeClicked,
} from '@/lib/ac-events'

type AccessLevel = 'guest' | 'free' | 'pro_or_higher'

type DirectoryAnalyticsProps = {
  accessLevel: AccessLevel
  planUid: string | null
  totalCount: number
  visibleCount: number
  teaserCount: number
}

export function DirectoryAnalytics({
  accessLevel,
  planUid,
  totalCount,
  visibleCount,
  teaserCount,
}: DirectoryAnalyticsProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    trackDirectoryViewed({
      sourcePage: 'hiring_firms',
      accessLevel,
      planUid,
      totalCount,
      visibleCount,
      teaserCount,
    })

    if (accessLevel !== 'pro_or_higher') {
      trackPaywallHit({
        sourcePage: 'hiring_firms',
        feature: accessLevel === 'guest' ? 'directory_login_required' : 'directory_preview_limit',
        accessLevel,
        planUid,
        totalCount,
        visibleCount,
        teaserCount,
      })
    }
  }, [accessLevel, planUid, teaserCount, totalCount, visibleCount])

  return null
}

export function DirectoryLoginLink({ className, children }: { className: string; children: ReactNode }) {
  return (
    <a
      href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
      onClick={() =>
        trackOutsetaModalOpen({
          sourcePage: 'hiring_firms',
          mode: 'login_redirect',
          feature: 'directory_login_required',
        })
      }
      className={className}
    >
      {children}
    </a>
  )
}

export function DirectoryUpgradeLink({
  href = '/membership-pricing',
  source,
  planUid,
  className,
  children,
  eventData,
}: {
  href?: string
  source: string
  planUid: string | null
  className: string
  children: ReactNode
  eventData?: Record<string, unknown>
}) {
  return (
    <Link
      href={href}
      onClick={() =>
        trackUpgradeClicked('hiring_firms_' + source, 'Pro', {
          planUid,
          ...eventData,
        })
      }
      className={className}
    >
      {children}
    </Link>
  )
}

export function TrackFirmPreviewButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="flex cursor-not-allowed items-center gap-1.5 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-slate-500"
      title="Company tracking is preview-only and cannot save data yet"
    >
      <Bookmark className="h-3.5 w-3.5" aria-hidden />
      TRACK PREVIEW
    </button>
  )
}
