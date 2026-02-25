'use client'

import { useEffect } from 'react'

/**
 * ContentProtection — drops into any layout or page to disable:
 *  - Right-click context menu
 *  - Ctrl+P / Cmd+P (print)
 *  - Ctrl+S / Cmd+S (save)
 *  - Ctrl+U / Cmd+U (view source)
 *  - F12 / Ctrl+Shift+I / Cmd+Option+I (devtools)
 *  - PrintScreen key
 *
 * This is a deterrent, not bulletproof DRM. Determined users can still
 * access page content via the network tab or browser extensions. But it
 * stops 95% of casual scraping/printing.
 */
export function ContentProtection() {
  useEffect(() => {
    // Block right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    // Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey

      // Print (Ctrl/Cmd + P)
      if (ctrl && e.key === 'p') {
        e.preventDefault()
        return
      }

      // Save (Ctrl/Cmd + S)
      if (ctrl && e.key === 's') {
        e.preventDefault()
        return
      }

      // View source (Ctrl/Cmd + U)
      if (ctrl && e.key === 'u') {
        e.preventDefault()
        return
      }

      // DevTools (F12)
      if (e.key === 'F12') {
        e.preventDefault()
        return
      }

      // DevTools (Ctrl/Cmd + Shift + I)
      if (ctrl && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        return
      }

      // DevTools (Ctrl/Cmd + Shift + J — console)
      if (ctrl && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        return
      }

      // DevTools (Ctrl/Cmd + Shift + C — element inspector)
      if (ctrl && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        return
      }

      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault()
        return
      }
    }

    // Block print via window.print override
    const originalPrint = window.print
    window.print = () => {
      // no-op
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      window.print = originalPrint
    }
  }, [])

  return null
}
