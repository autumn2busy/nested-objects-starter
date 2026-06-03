'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { trackFirmView, trackPaywallHit } from '@/lib/ac-events'

interface FirmViewTrackerProps {
  firmId: string
  firmSlug: string | null
  firmName: string
}

export function FirmViewTracker({ firmId, firmSlug, firmName }: FirmViewTrackerProps) {
  const { isAuthenticated, isLoading, planUid, hasAccess } = useAuth()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (isLoading || hasTracked.current) return

    hasTracked.current = true

    const hasFirmIntel = isAuthenticated && hasAccess('firm_intel')

    trackFirmView({
      sourcePage: 'firm_detail',
      firmId,
      firmSlug,
      firmName,
      planUid: planUid ?? null,
      isAuthenticated,
      hasFirmIntel,
    })

    if (!hasFirmIntel) {
      trackPaywallHit({
        sourcePage: 'firm_detail',
        feature: 'firm_intel',
        firmId,
        firmSlug,
        planUid: planUid ?? null,
        isAuthenticated,
      })
    }
  }, [firmId, firmName, firmSlug, hasAccess, isAuthenticated, isLoading, planUid])

  return null
}
