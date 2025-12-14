import Link from 'next/link'

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-obsidian z-0" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="z-10 text-center max-w-2xl space-y-8 glass p-12 rounded-2xl border-white/5">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                    Nested Objects
                </h1>
                <p className="text-lg text-white/60 font-light">
                    The operating system for the next generation of field services.
                </p>

                <div className="flex gap-4 justify-center pt-4">
                    <Link href="/dashboard" className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors">
                        Enter Dashboard
                    </Link>
                    <button className="px-8 py-3 bg-transparent border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors">
                        Request Access
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 text-xs text-white/20 uppercase tracking-widest font-mono">
                System Status: Operational
            </div>
        </main>
    )
}
