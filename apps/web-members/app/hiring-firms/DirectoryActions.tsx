'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Bookmark, BookmarkCheck } from 'lucide-react'

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

export function TrackFirmButton({
  firm,
}: {
  firm: {
    name: string
    url: string | null
    vendor_page_url: string | null
    description: string | null
  }
}) {
  const [isTracked, setIsTracked] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleTrackFirm() {
    if (isTracked || isSaving) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/company-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: firm.name,
          website: firm.url || firm.vendor_page_url || null,
          notes: firm.description ? firm.description.slice(0, 200) : null,
        }),
      })

      if (res.ok) setIsTracked(true)
    } catch (error) {
      console.error('Error tracking firm:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleTrackFirm}
      disabled={isTracked || isSaving}
      className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] border transition-colors ${
        isTracked
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 cursor-default'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-brand-copper hover:text-white hover:border-brand-copper'
      }`}
      title={isTracked ? 'Already in your Company Tracker' : 'Save to Company Tracker'}
    >
      {isTracked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      {isTracked ? 'TRACKED' : isSaving ? 'SAVING' : 'TRACK'}
    </button>
  )
}
