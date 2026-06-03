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
 * Uses `firm_intel` so Free members get directory preview but must upgrade
 * for pay data, requirements, reputation, and contact info.
 */
export function FirmGatedContent({ children }: FirmGatedContentProps) {
    return (
        <BlurGate
            feature="firm_intel"
            title="Upgrade to Pro for full firm intel"
            description="Pay rates, contact info, requirements, and reputation data are available on Pro and higher plans."
            ctaLabel="See Pro plans"
            ctaHref="/membership-pricing"
        >
            {children}
        </BlurGate>
    )
}
