'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  acquisitionGa4Data, captureJourneyAttribution, decorateJourneyClick,
  decorateJourneyLinks, isIntentPage, journeyAttribution,
} from '../../../packages/acquisition-attribution'

/** Route-aware attribution capture and intent-page measurement, independent of authentication loading. */
export function AcquisitionJourneyTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams?.toString() || ''
  const lastView = useRef('')

  useEffect(() => {
    captureJourneyAttribution()
    decorateJourneyLinks()
    // Auth and streamed content can render anchors after this effect runs.
    const observer = new MutationObserver(decorateJourneyLinks)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] })
    const viewKey = `${pathname}?${query}`
    if (pathname && isIntentPage(pathname) && lastView.current !== viewKey) {
      lastView.current = viewKey
      const analytics = window as Window & { dataLayer?: Array<Record<string, unknown>> }
      analytics.dataLayer = analytics.dataLayer || []
      analytics.dataLayer.push({ event: 'intent_page_view', acquisition: acquisitionGa4Data({
        ...journeyAttribution(), sourcePage: pathname,
      }) })
    }
    for (const type of ['pointerdown', 'click', 'auxclick']) document.addEventListener(type, decorateJourneyClick, true)
    return () => {
      observer.disconnect()
      for (const type of ['pointerdown', 'click', 'auxclick']) document.removeEventListener(type, decorateJourneyClick, true)
    }
  }, [pathname, query])

  return null
}
