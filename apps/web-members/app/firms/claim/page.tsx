'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Building2, CheckCircle2, ShieldCheck, ArrowRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ClaimProfilePage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [step, setStep] = useState<'search' | 'verify' | 'success'>('search')
    const [selectedFirm, setSelectedFirm] = useState<string | null>(null)

    // Dummy search handler
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // In real app, query Supabase or the JSON file
        console.log('Searching for:', searchQuery)
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30">

            {/* Header / Nav Placeholder */}
            <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur fixed top-0 w-full z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold text-xl tracking-tight text-white">
                        Nested<span className="text-emerald-500">.</span>
                    </Link>
                    <Link href="/directory" className="text-sm font-medium hover:text-white transition-colors">
                        Back to Directory
                    </Link>
                </div>
            </header>

            <section className="pt-32 pb-20 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none opacity-20" />

                <div className="container mx-auto px-4 relative z-10 max-w-4xl">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-6">
                            <ShieldCheck className="w-3 h-3" /> OFFICIAL FIRM VERIFICATION
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
                            Claim your firm&apos;s profile.
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Manage your brand, access verifyied candidate data, and post direct-contract jobs to the world&apos;s largest network of field professionals.
                        </p>
                    </div>

                    {/* Main Inteface Card */}
                    <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />

                        <div className="p-8 md:p-12">
                            {step === 'search' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="max-w-md mx-auto">
                                        <Label className="text-slate-300 mb-2 block">Find your firm</Label>
                                        <div className="relative flex items-center mb-6">
                                            <Search className="absolute left-3 w-5 h-5 text-slate-500" />
                                            <Input
                                                className="pl-10 h-12 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:ring-emerald-500/50 focus:border-emerald-500"
                                                placeholder="Search by firm name (e.g. 'Safeguard')"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            {searchQuery.length > 2 && (
                                                <div className="text-center p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                                                    <div className="flex items-center gap-3 text-left">
                                                        <div className="h-10 w-10 rounded bg-slate-800 flex items-center justify-center shrink-0">
                                                            <Building2 className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-white">{searchQuery} Properties Inc.</div>
                                                            <div className="text-xs text-slate-500">Valley View, OH • 12 Active Jobs</div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
                                                            onClick={() => {
                                                                setSelectedFirm(searchQuery)
                                                                setStep('verify')
                                                            }}
                                                        >
                                                            Claim
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {searchQuery.length === 0 && (
                                                <div className="text-center py-8 text-slate-600 text-sm">
                                                    Start typing to find your company in our database of 460+ firms.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 'verify' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-md mx-auto text-left">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStep('search')}
                                        className="mb-6 -ml-2 text-slate-400 hover:text-white"
                                    >
                                        ← Back to search
                                    </Button>

                                    <h2 className="text-2xl font-bold text-white mb-2">Verify Ownership</h2>
                                    <p className="text-slate-400 mb-8">
                                        To claim <span className="text-emerald-400 font-semibold">{selectedFirm}</span>, please verify your corporate email address.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-slate-300">Corporate Email</Label>
                                            <Input className="mt-1.5 bg-slate-950 border-slate-700 h-11" placeholder="name@company.com" />
                                        </div>
                                        <div>
                                            <Label className="text-slate-300">Full Name</Label>
                                            <Input className="mt-1.5 bg-slate-950 border-slate-700 h-11" placeholder="Jane Doe" />
                                        </div>
                                        <div className="pt-4">
                                            <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold" onClick={() => setStep('success')}>
                                                Send Verification Link
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 'success' && (
                                <div className="animate-in zoom-in duration-500 text-center py-10">
                                    <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4">Check your inbox</h3>
                                    <p className="text-slate-400 max-w-sm mx-auto mb-8">
                                        We&apos;ve sent a secure verification link to your email. Click it to complete your profile setup and access the dashboard.
                                    </p>
                                    <Link href="/" className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800">
                                        Return Home
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Footer of Card */}
                        <div className="bg-slate-950/50 p-4 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                            <Lock className="w-3 h-3" /> Secure SSL Encryption • Human Verified
                        </div>
                    </Card>

                    {/* Value Props */}
                    <div className="grid md:grid-cols-3 gap-8 mt-20">
                        {[
                            {
                                title: "Verified Badge",
                                desc: "Stand out to high-quality candidates with a Verified Firm badge on your directory listing."
                            },
                            {
                                title: "Direct Hiring",
                                desc: "Post priority jobs directly to local inspectors' push notifications. No middlemen."
                            },
                            {
                                title: "Route Analytics",
                                desc: "See heatmaps of where available inspectors are located vs your coverage gaps."
                            }
                        ].map((item, i) => (
                            <div key={i} className="text-left p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors bg-slate-950/30">
                                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main >
    )
}
