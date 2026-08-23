'use client'

import { useEffect } from 'react'

const GTM_ID = 'GTM-5HPX4VTQ'
const IDLE_DELAY_MS = 7000

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

export function DeferredGoogleTagManager() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (document.getElementById('gtm-deferred-script')) return

    window.dataLayer = window.dataLayer || []

    let loaded = false
    let timeoutId: number | null = null
    let idleId: number | null = null

    const loadGtm = () => {
      if (loaded || document.getElementById('gtm-deferred-script')) return
      loaded = true

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js',
      })

      const script = document.createElement('script')
      script.id = 'gtm-deferred-script'
      script.async = true
      script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
      document.head.appendChild(script)
    }

    const interactionEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll']
    const onInteraction = () => loadGtm()

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, onInteraction, { passive: true, once: true })
    })

    timeoutId = window.setTimeout(loadGtm, IDLE_DELAY_MS)

    if (window.requestIdleCallback) {
      idleId = window.requestIdleCallback(loadGtm, { timeout: IDLE_DELAY_MS })
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId)
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, onInteraction)
      })
    }
  }, [])

  return null
}
