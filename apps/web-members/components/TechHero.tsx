import Link from 'next/link'
import { FreeSignupCta } from '@/components/FreeSignupCta'
// Icons
import { ShieldCheck } from 'lucide-react'

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
                    FIELD INSPECTOR FIRM DIRECTORY
                </div>

                {/* Headline */}
                <h1 className="mx-auto mb-3 max-w-4xl text-3xl font-bold tracking-tight text-white sm:mb-6 sm:text-6xl md:text-7xl">
                    Research firms. <br className="hidden md:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Choose where to apply.</span>
                </h1>

                {/* Subhead */}
                <p className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:mb-10 sm:text-xl">
                    Pro and higher unlock directory search, filters, and detailed firm intel.
                    Research companies before you spend time applying, and confirm current opportunities directly with each firm.
                </p>

                {/* CTA Buttons */}
                <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:items-start sm:gap-4">
                    <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
                        <Link
                            href="/membership-pricing"
                            className="flex w-full min-h-12 items-center justify-center rounded-lg bg-emerald-500 px-8 py-3 text-base font-bold text-slate-950 transition-colors hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto sm:py-4 sm:text-lg"
                        >
                            Compare membership plans
                        </Link>
                        <p className="text-xs font-medium text-slate-300">Full directory access requires a paid membership</p>
                    </div>
                    <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
                        <FreeSignupCta
                            placement="home_hero"
                            className="w-full min-h-12 border border-slate-600 bg-slate-900/70 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto sm:py-4 sm:text-lg"
                        />
                        <p className="max-w-xs text-xs leading-5 text-slate-300">Up to 3 sample listings. No search or filters. No credit card required.</p>
                    </div>
                </div>
                <Link href="#directory-access" className="mt-3 inline-flex min-h-11 items-center rounded-md px-3 text-sm text-slate-300 underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    See exactly what each option includes
                </Link>

            </div>

            {/* Static access summary, not an activity or hiring feed. */}
            <div className="relative z-20 hidden min-h-12 w-full items-center border-t border-slate-800 bg-slate-900/80 sm:flex">
                <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3 text-xs text-slate-300">
                    <span className="flex items-center gap-2 font-semibold text-emerald-400"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Clear access before you join</span>
                    <span>Free: up to 3 sample listings</span>
                    <span>Directory search and filters: paid membership</span>
                </div>
            </div>
        </section>
    )
}

