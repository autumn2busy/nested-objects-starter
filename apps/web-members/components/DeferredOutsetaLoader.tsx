'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const OUTSETA_SCRIPT_ID = 'outseta-deferred-loader'
const OUTSETA_SRC = 'https://cdn.outseta.com/outseta.min.js'
const OUTSETA_DOMAIN = 'nested-objects.outseta.com'
const PUBLIC_IDLE_DELAY_MS = 10000

const IMMEDIATE_PATH_PREFIXES = [
  '/auth/callback',
  '/directory-preview',
  '/profile',
  '/security',
  '/upgrade',
  '/welcome',
  '/welcome-back',
]

declare global {
  interface Window {
    o_options?: {
      domain: string
      load: string
      tokenStorage: string
    }
  }
}

function shouldLoadImmediately(pathname: string | null) {
  if (!pathname) return false
  return IMMEDIATE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function DeferredOutsetaLoader() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_OUTSETA !== 'true') return

    window.o_options = {
      domain: OUTSETA_DOMAIN,
      load: 'auth',
      tokenStorage: 'local',
    }

    let loaded = Boolean(document.getElementById(OUTSETA_SCRIPT_ID) || window.Outseta)
    let timeoutId: number | null = null

    const notifyReady = () => {
      window.dispatchEvent(new Event('outseta-ready'))
    }

    const loadOutseta = () => {
      if (loaded || document.getElementById(OUTSETA_SCRIPT_ID)) return
      loaded = true

      const script = document.createElement('script')
      script.id = OUTSETA_SCRIPT_ID
      script.async = true
      script.src = OUTSETA_SRC
      script.dataset.options = 'o_options'
      script.addEventListener('load', notifyReady, { once: true })
      document.head.appendChild(script)
    }

    if (loaded) {
      notifyReady()
      return
    }

    if (shouldLoadImmediately(pathname)) {
      loadOutseta()
      return
    }

    const interactionEvents = ['pointerdown', 'keydown', 'touchstart']
    const onInteraction = () => loadOutseta()

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, onInteraction, { passive: true, once: true })
    })

    timeoutId = window.setTimeout(loadOutseta, PUBLIC_IDLE_DELAY_MS)

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, onInteraction)
      })
    }
  }, [pathname])

  return null
}
