export type PricingHandoffStatus = 'requested' | 'widget_visible' | 'closed' | 'open_failed'
  | 'unobserved_timeout' | 'hosted_redirect_requested' | 'hosted_redirect_failed' | 'recovery_redirect_requested'

export type PricingHandoffEvent = {
  handoffContract: 'pricing-handoff-v1'
  handoffId: string
  handoffStatus: PricingHandoffStatus
  reason?: 'sdk_exception' | 'sdk_unavailable' | 'visibility_unobserved' | 'navigation_exception'
}

// The loader and the provider modules finish asynchronously. Give the existing
// script a bounded chance to become usable before taking the hosted fallback.
export function waitForPricingWidget(widget: 'auth' | 'profile', signal: AbortSignal, dependencies: {
  ready?: () => boolean
  schedule?: (callback: () => void, milliseconds: number) => () => void
} = {}): Promise<boolean> {
  const ready = dependencies.ready || (() => typeof window.Outseta?.[widget]?.open === 'function')
  const schedule = dependencies.schedule || ((callback, milliseconds) => {
    const timer = window.setTimeout(callback, milliseconds)
    return () => window.clearTimeout(timer)
  })
  if (signal.aborted) return Promise.resolve(false)
  if (ready()) return Promise.resolve(true)
  return new Promise(resolve => {
    let settled = false
    let stopPoll = () => {}
    let stopDeadline = () => {}
    const finish = (available: boolean) => {
      if (settled) return
      settled = true
      stopPoll()
      stopDeadline()
      signal.removeEventListener('abort', onAbort)
      resolve(available)
    }
    const onAbort = () => finish(false)
    const poll = () => {
      if (settled) return
      if (ready()) finish(true)
      else stopPoll = schedule(poll, 100)
    }
    signal.addEventListener('abort', onAbort, { once: true })
    stopDeadline = schedule(() => finish(false), 8_000)
    stopPoll = schedule(poll, 100)
  })
}

// These scoped classes are present in Outseta's public auth/profile SDKs.
// Initialization and a successful open() call alone do not prove visibility.
export function pricingWidgetVisible(widget: 'auth' | 'profile'): boolean {
  return Array.from(document.querySelectorAll<HTMLElement>(`.o--App--${widget}Widget.o--Widget--popup`))
    .some(element => {
      if (element.getClientRects().length === 0) return false
      for (let node: HTMLElement | null = element; node; node = node.parentElement) {
        const style = window.getComputedStyle(node)
        if (node.hidden || node.getAttribute('aria-hidden') === 'true'
          || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
      }
      return true
    })
}

export function beginPricingHandoff(options: {
  widget: 'auth' | 'profile'
  emit: (event: PricingHandoffEvent) => void
  unavailable: () => void
  observed?: () => void
  visible?: () => boolean
  observe?: (check: () => void) => () => void
  schedule?: (callback: () => void, milliseconds: number) => () => void
}) {
  const handoffId = `handoff:${typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
  const visible = options.visible || (() => pricingWidgetVisible(options.widget))
  const schedule = options.schedule || ((callback, milliseconds) => {
    const timer = window.setTimeout(callback, milliseconds)
    return () => window.clearTimeout(timer)
  })
  const observe = options.observe || (check => {
    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] })
    return () => observer.disconnect()
  })
  const emit = (handoffStatus: PricingHandoffStatus, reason?: PricingHandoffEvent['reason']) => {
    // Telemetry failure must never prevent opening or recovering the provider UI.
    try { options.emit({ handoffContract: 'pricing-handoff-v1', handoffId, handoffStatus, ...(reason ? { reason } : {}) }) } catch { /* best effort */ }
  }
  let active = true
  let opened = false
  let wasVisible = false
  let stopObserving = () => {}
  let stopTimer = () => {}
  const stop = () => { active = false; stopObserving(); stopTimer() }
  const unavailable = () => { stop(); options.unavailable() }
  const check = () => {
    if (!active) return
    const nowVisible = visible()
    if (nowVisible && !wasVisible && !opened) {
      opened = true
      stopTimer()
      emit('widget_visible')
      options.observed?.()
      // Bound observation even if a member leaves the widget open.
      stopTimer = schedule(stop, 120_000)
    } else if (opened && !nowVisible) {
      emit('closed')
      stop()
    }
    wasVisible = nowVisible
  }
  emit('requested')
  try {
    wasVisible = visible()
    stopObserving = observe(check)
    stopTimer = schedule(() => {
      if (!active || opened) return
      emit('unobserved_timeout', 'visibility_unobserved')
      unavailable()
    }, 15_000)
  } catch {
    // Observer support failure is unknown, never a checkout failure.
    emit('unobserved_timeout', 'visibility_unobserved')
    unavailable()
  }
  return {
    handoffId,
    check,
    stop,
    failed() { if (!active) return; emit('open_failed', 'sdk_exception'); unavailable() },
    redirect() { stop(); emit('hosted_redirect_requested', 'sdk_unavailable') },
    redirectFailed() { emit('hosted_redirect_failed', 'navigation_exception'); options.unavailable() },
    recovery() { emit('recovery_redirect_requested') },
  }
}
