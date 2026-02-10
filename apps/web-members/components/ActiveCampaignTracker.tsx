'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { identifyVisitor } from '@/lib/ac-events'
import { captureAttribution } from '@/lib/attribution'

/**
 * ActiveCampaignTracker
 *
 * Invisible component that:
 * 1. Captures UTM attribution on every page load
 * 2. Identifies the logged-in user to AC site tracking via vgo('setEmail')
 * 3. Runs inside AuthProvider so it has access to user state
 */
export function ActiveCampaignTracker() {
    const { user, isAuthenticated } = useAuth()
    const identifiedRef = useRef(false)

    // Capture UTM parameters on every page load
    useEffect(() => {
        captureAttribution()
    }, [])

    // Identify user to AC when they log in
    useEffect(() => {
        if (isAuthenticated && user?.email && !identifiedRef.current) {
            identifyVisitor(user.email)
            identifiedRef.current = true
        }

        // Reset when user logs out
        if (!isAuthenticated) {
            identifiedRef.current = false
        }
    }, [isAuthenticated, user?.email])

    // This component renders nothing
    return null
}
