import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillBadge } from "@/components/profile/SkillBadge";
import { MapPin, Globe, Mail, Phone, Calendar, CheckCircle2, Award, Download } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Identity Card */}
            <div className="lg:col-span-4 space-y-6">
                <Card variant="glass" className="overflow-hidden border-gold-500/30 shadow-[0_0_50px_-12px_rgba(234,179,8,0.2)]">
                    <div className="h-32 bg-gradient-to-r from-slate-900 to-slate-800 relative">
                        <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur rounded text-xs text-gold-500 font-mono border border-gold-500/20">
                            ELITE MEMBER
                        </div>
                    </div>
                    <div className="px-6 pb-6 -mt-12 relative">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-gold-500 to-yellow-200 border-4 border-black shadow-xl mb-4" />

                        <h1 className="text-2xl font-bold text-white">Marcus Vance</h1>
                        <p className="text-muted-foreground text-sm mb-4">Senior Field Inspector • 12 Yrs Exp</p>

                        <div className="flex gap-2 mb-6">
                            <button className="flex-1 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                                Edit Profile
                            </button>
                            <button className="px-3 py-2 border border-white/20 rounded-lg hover:bg-white/5 text-white transition-colors">
                                <Globe className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm text-white/70">
                            <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-white/40" />
                                <span>Jacksonville, FL (150mi radius)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-white/40" />
                                <span>m.vance@example.com</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-white/40" />
                                <span>+1 (555) 012-3456</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Availability Widget */}
                <Card variant="default" className="border-green-500/20 bg-green-900/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-400">Open for Work</p>
                            <p className="text-xs text-green-400/60">Responding in &lt; 2hrs</p>
                        </div>
                        <div className="w-10 h-6 bg-green-500/20 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-green-500 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Details & Capabilities */}
            <div className="lg:col-span-8 space-y-6">

                {/* About */}
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-white">Executive Summary</h2>
                    <p className="text-white/60 text-sm leading-relaxed max-w-2xl">
                        Certified Master Inspector (CMI) specializing in high-value residential and jagged-edge commercial assessments.
                        Equipped with thermal imaging, drone fleet (Part 107), and mold remediation protocols.
                        Trusted by 40+ carriers for complex claims in the Southeast region.
                    </p>
                </div>

                <div className="h-px bg-white/10" />

                {/* Credentials Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Credentials & Licenses</h2>
                        <button className="text-xs text-gold-500 hover:underline flex items-center gap-1">
                            <Download className="w-3 h-3" /> Download Resume
                        </button>
                    </div>

                    <div className="grid gap-3">
                        <CredentialItem
                            title="Certified Master Inspector (CMI)"
                            issuer="InterNACHI"
                            date="Exp. Dec 2026"
                            verified
                        />
                        <CredentialItem
                            title="FAA Part 107 Drone Pilot"
                            issuer="Federal Aviation Administration"
                            date="Exp. Jun 2025"
                            verified
                        />
                        <CredentialItem
                            title="Florida Home Inspector License"
                            issuer="DBPR - HI13456"
                            date="Active"
                            verified
                        />
                    </div>
                </div>

                {/* Skills */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">Technical Arsenal</h2>
                    <div className="flex flex-wrap gap-2">
                        <SkillBadge label="Xactimate X1" level="Expert" />
                        <SkillBadge label="Symbility" level="Advanced" />
                        <SkillBadge label="Thermal Imaging" level="Expert" />
                        <SkillBadge label="Hover App" level="Basic" />
                        <SkillBadge label="Mold Testing" />
                        <SkillBadge label="Wind Mitigation" />
                        <SkillBadge label="4-Point Inspection" />
                    </div>
                </div>

            </div>
        </div>
    );
}

function CredentialItem({ title, issuer, date, verified }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg text-white/40">
                    <Award className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-white">{title}</h4>
                    <p className="text-xs text-white/50">{issuer}</p>
                </div>
            </div>
            <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-green-400 font-medium justify-end">
                    {verified && <CheckCircle2 className="w-3 h-3" />}
                    {verified ? "Verified" : "Pending"}
                </div>
                <p className="text-xs text-white/30 mt-0.5">{date}</p>
            </div>
        </div>
    )
}
