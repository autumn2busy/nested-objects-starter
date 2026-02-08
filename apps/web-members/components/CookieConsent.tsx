'use client'

import { useState, useEffect } from 'react'
import { Analytics } from './analytics'
import { cn } from '@/lib/utils'

export function CookieConsent() {
    const [consent, setConsent] = useState<'granted' | 'denied' | 'unknown'>('unknown')
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('cookie_consent')
        if (stored === 'granted' || stored === 'denied') {
            setConsent(stored)
        } else {
            // Delay slightly to avoid flash
            const timer = setTimeout(() => setIsVisible(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAccept = () => {
        setConsent('granted')
        setIsVisible(false)
        localStorage.setItem('cookie_consent', 'granted')
        // Trigger GTM/Pixels event if needed? Usually just mounting <Analytics> is enough.
    }

    const handleDecline = () => {
        setConsent('denied')
        setIsVisible(false)
        localStorage.setItem('cookie_consent', 'denied')
    }

    // If granted, we render the Analytics component which contains the scripts
    // If denied or unknown, we don't render it (blocking them)
    // Note: Some "essential" analytics might be allowed, but for Pixels (Ads), we usually wait.

    return (
        <>
            {consent === 'granted' && <Analytics />}

            {isVisible && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 p-4 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
                    <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-300">
                            <p>
                                We use cookies to analyze traffic and show you relevant job listings.
                                <br className="hidden sm:inline" />
                                We don't sell your data to spammers.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDecline}
                                className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAccept}
                                className="text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2 rounded-full transition-colors"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
