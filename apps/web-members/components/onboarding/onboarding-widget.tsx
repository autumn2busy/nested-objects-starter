'use client'

import { useState } from 'react'
import { InspectorStartGuide } from './inspector-start-guide'

export function OnboardingWidget() {
  const [isVisible, setIsVisible] = useState(true)

  // Hiding guidance is not completing onboarding. No profile write or marketing
  // tag belongs here; the member can reopen the guide during this visit.
  return (
    <section aria-label="Getting started as an inspector">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-600">Your next step</p>
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-expanded={isVisible}
          className="min-h-11 rounded-md px-3 text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
        >
          {isVisible ? 'Hide for now' : 'Show getting-started guide'}
        </button>
      </div>
      {isVisible && <InspectorStartGuide />}
    </section>
  )
}
