'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HeroMap } from './HeroMap'
// Icons
import { MapPin, TrendingUp, ShieldCheck, ArrowRight, Activity } from 'lucide-react'

// Dummy data for the ticker - in real app, fetch this from Supabase
const TICKER_ITEMS = [
    "New job in Austin, TX: Occupancy Check ($45)",
    "Firm verified: Safeguard Properties (National)",
    "Rate update: BPO fees in FL up 12%",
    "New firm added: Amrock (Valuation)",
    "Inspector joining from Dallas, TX",
    "Live: 124 firms hiring now",
]

/**
 * Hook to detect 'prefers-reduced-motion'
 */
function useReducedMotion() {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setMatches(mediaQuery.matches)

        const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches)
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    return matches
}

export function TechHero() {
    const [tickerIndex, setTickerIndex] = useState(0)
    const prefersReducedMotion = useReducedMotion()

    // Cycle ticker text only if motion is NOT reduced
    useEffect(() => {
        if (prefersReducedMotion) return

        const interval = setInterval(() => {
            setTickerIndex(prev => (prev + 1) % TICKER_ITEMS.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [prefersReducedMotion])

    return (
        <section className="relative w-full min-h-[90vh] bg-slate-950 overflow-hidden flex flex-col pt-20">

            {/* 1. Background Grid & Map Layer */}
            <div className="absolute inset-0 z-0">
                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* The D3 Map */}
                <div className="absolute inset-0 flex items-center justify-center p-0 md:p-0 translate-y-10 md:translate-y-0 motion-reduce:transform-none">
                    <HeroMap />
                </div>

                {/* Radial Gradient Vignette (Lighter) */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/40 to-slate-950/80" />
            </div>

            {/* 2. Foreground Content */}
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center items-center text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-8 backdrop-blur-md animate-fade-in-up motion-reduce:animate-none">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    SYSTEM OPERATIONAL: LIVE DATA FEED
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-white mb-6 max-w-4xl mx-auto drop-shadow-2xl">
                    See Who Is <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Hiring Now</span> in <br className="hidden md:block" /> Your Area.
                </h1>

                {/* Subhead */}
                <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                    The interactive map below isn&apos;t just data—it&apos;s opportunity.
                    Filter by <strong>pay rate</strong>, <strong>volume</strong>, and <strong>requirements</strong> to find the field service firms actively recruiting in your zip code.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                    <Link
                        href="/membership-pricing"
                        className="w-full sm:w-auto px-8 py-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
                    >
                        Start Searching Free <ArrowRight className="w-5 h-5" />
                    </Link>

                    <Link
                        href="/hiring-firms"
                        className="w-full sm:w-auto px-8 py-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white font-medium text-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2"
                    >
                        <Activity className="w-5 h-5 text-emerald-400" />
                        View Live Directory
                    </Link>
                </div>

            </div>

            {/* 3. Bottom Ticker Bar */}
            <div className="relative z-20 w-full bg-slate-900/80 border-t border-slate-800 backdrop-blur-md h-12 flex items-center overflow-hidden">
                <div className="container mx-auto px-4 flex items-center gap-6 text-xs sm:text-sm font-mono text-emerald-500/80">
                    <span className="font-bold text-emerald-500 shrink-0 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> VERIFIED FEED
                    </span>
                    <div className="h-4 w-px bg-slate-700 shrink-0" />

                    <div className="flex-1 relative overflow-hidden h-6">
                        {/* Simple crossfade ticker */}
                        <div key={tickerIndex} className="absolute inset-0 flex items-center animate-slide-up motion-reduce:animate-none">
                            <span className="truncate">{TICKER_ITEMS[tickerIndex]}</span>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-slate-500 shrink-0">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> US Coverage</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Rates: Updated</span>
                    </div>
                </div>
            </div>

            {/* CSS for custom gradient blend if needed */}
            <style jsx>{`
        .bg-radial-gradient {
          background-image: radial-gradient(circle at center, transparent 0%, rgba(2,6,23,0.8) 70%, rgba(2,6,23,1) 100%);
        }
        @keyframes slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
            animation: slide-up 0.5s ease-out forwards;
        }
      `}</style>
        </section>
    )
}

