import Link from 'next/link'
import { FreeSignupCta } from '@/components/FreeSignupCta'
// Icons
import { MapPin, TrendingUp, ShieldCheck, Activity } from 'lucide-react'

// Dummy data for the ticker - in real app, fetch this from Supabase
const TICKER_ITEMS = [
    "New job in Austin, TX: Occupancy Check ($45)",
    "Firm verified: Safeguard Properties (National)",
    "Rate update: BPO fees in FL up 12%",
    "New firm added: Amrock (Valuation)",
    "Inspector joining from Dallas, TX",
    "Live: 124 firms hiring now",
]

function MapPlaceholder() {
    return (
        <div className="absolute inset-0 opacity-40">
            <div className="absolute left-[12%] top-[22%] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.8)]" />
            <div className="absolute left-[38%] top-[44%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(103,232,249,0.7)]" />
            <div className="absolute right-[18%] top-[30%] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.8)]" />
            <div className="absolute bottom-[24%] left-[28%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(103,232,249,0.7)]" />
            <div className="absolute bottom-[18%] right-[30%] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.8)]" />
        </div>
    )
}

export function TechHero() {
    return (
        <section className="relative flex min-h-[450px] w-full flex-col overflow-hidden bg-slate-950 pt-4 sm:min-h-[90vh] sm:pt-20">

            {/* 1. Background Grid & Map Layer */}
            <div className="absolute inset-0 z-0">
                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 hidden opacity-[0.05] md:block"
                    style={{
                        backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Static signal layer. Avoids shipping the D3 map on the homepage first load. */}
                <div className="absolute inset-0 hidden translate-y-10 items-center justify-center p-0 md:flex md:translate-y-0">
                    <MapPlaceholder />
                </div>

                {/* Radial Gradient Vignette (Lighter) */}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(2,6,23,1))] md:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_70%,rgba(2,6,23,1)_100%)]" />
            </div>

            {/* 2. Foreground Content */}
            <div className="relative z-10 container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-6 text-center sm:px-6 sm:py-0 lg:px-8">

                {/* Badge */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[0.65rem] font-mono text-emerald-400 sm:mb-8 sm:text-xs">
                    <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    VERIFIED FIRMS: LIVE DIRECTORY
                </div>

                {/* Headline */}
                <h1 className="mx-auto mb-3 max-w-4xl text-3xl font-bold tracking-tight text-white sm:mb-6 sm:text-6xl md:text-7xl">
                    See Who Is <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Hiring Now</span> in <br className="hidden md:block" /> Your Area.
                </h1>

                {/* Subhead */}
                <p className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:mb-10 sm:text-xl">
                    Compare hiring firms, pay clues, route expectations, and starter tools before you spend hours applying to portals that may not fit your lane.
                </p>

                {/* CTA Buttons */}
                <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
                    <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
                        <FreeSignupCta
                            placement="home_hero"
                            className="w-full min-h-12 bg-emerald-500 px-8 py-3 text-base font-bold text-slate-950 transition-colors hover:bg-emerald-400 sm:w-auto sm:py-4 sm:text-lg sm:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        />
                        <p className="text-xs font-medium text-slate-300">Free account · No credit card required</p>
                    </div>

                    <Link
                        href="/hiring-firms"
                        className="flex w-full min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto sm:py-4 sm:text-lg"
                    >
                        <Activity className="w-5 h-5 text-emerald-400" />
                        Browse firms
                    </Link>
                </div>
                <Link href="/membership-pricing" className="mt-3 inline-flex min-h-11 items-center rounded-md px-3 text-sm text-slate-300 underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    Compare membership plans
                </Link>

            </div>

            {/* 3. Bottom Ticker Bar */}
            <div className="relative z-20 hidden h-12 w-full items-center overflow-hidden border-t border-slate-800 bg-slate-900/80 sm:flex">
                <div className="container mx-auto px-4 flex items-center gap-6 text-xs sm:text-sm font-mono text-emerald-500/80">
                    <span className="font-bold text-emerald-500 shrink-0 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> VERIFIED SIGNAL
                    </span>
                    <div className="h-4 w-px bg-slate-700 shrink-0" />

                    <div className="flex-1 relative overflow-hidden h-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="truncate">{TICKER_ITEMS[0]}</span>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-slate-500 shrink-0">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> US Coverage</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Rates: Updated</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

