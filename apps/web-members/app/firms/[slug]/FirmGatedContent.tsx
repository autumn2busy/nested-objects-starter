'use client'

import { BlurGate } from '@/components/BlurGate'

interface FirmGatedContentProps {
    children: React.ReactNode
}

/**
 * Wraps firm detail intel sections (tabs, contact, pay stats) in a BlurGate.
 * Glassdoor-style: public visitors see firm name/description/categories,
 * but must sign up to access pay data, requirements, reputation, and contact info.
 *
 * Uses `directory_access` feature which maps to Starter+ plans.
 */
export function FirmGatedContent({ children }: FirmGatedContentProps) {
    return (
        <BlurGate
            feature="directory_access"
            title="Sign up to see full firm intel"
            description="Pay rates, contact info, requirements, and reputation data are available to Nested Objects members."
            ctaLabel="See membership plans"
            ctaHref="/membership-pricing"
        >
            {children}
        </BlurGate>
    )
}