'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const HeroMap = dynamic(() => import('./HeroMap').then((mod) => mod.HeroMap), {
    ssr: false,
    loading: () => null,
})

export function HeroDesktopMap() {
    const [shouldRenderMap, setShouldRenderMap] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)')

        const sync = () => setShouldRenderMap(mediaQuery.matches)
        sync()

        mediaQuery.addEventListener('change', sync)
        return () => mediaQuery.removeEventListener('change', sync)
    }, [])

    if (!shouldRenderMap) return null

    return (
        <div className="absolute inset-0 hidden md:block">
            <HeroMap />
        </div>
    )
}
