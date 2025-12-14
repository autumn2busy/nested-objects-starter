import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Briefcase, ChevronRight, Zap, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                        Command Center
                    </h1>
                    <p className="text-muted-foreground">
                        Welcome back, Marcus. Your Elite status is active.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm font-medium text-white border border-white/10 rounded-lg transition-colors">
                        Edit Widget Layout
                    </button>
                    <button className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black text-sm font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                        Deploy Profile
                    </button>
                </div>
            </div>

            {/* KPI Architecture */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up animate-delay-100">
                <StatCard
                    title="Profile Views"
                    value="1,248"
                    trend="+12%"
                    icon={Search}
                />
                <StatCard
                    title="Active Opportunities"
                    value="3"
                    trend="New"
                    icon={Briefcase}
                    active
                />
                <StatCard
                    title="Trust Score"
                    value="98/100"
                    trend="Elite"
                    icon={ShieldCheck}
                />
                <StatCard
                    title="Est. Pipeline"
                    value="$4,200"
                    trend="+8%"
                    icon={Zap}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-8 animate-fade-in-up animate-delay-200">
                {/* Main Feed - Intelligence Stream */}
                <Card variant="glass" className="col-span-4 lg:col-span-5 h-[500px] flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-lg">
                            <span>Live Intelligence</span>
                            <span className="text-xs font-normal text-gold-500 flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                                </span>
                                Live Updates
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                        {/* Mock Feed Items */}
                        <FeedItem
                            category="Market Alert"
                            title="Demand Surge in Florida Panhandle"
                            time="2m ago"
                            description="Insurance carriers are reporting a 40% increase in inspection requests for coastal properties. Update your availability radius."
                        />
                        <FeedItem
                            category="Platform Update"
                            title="New Certification: Commercial Roofs"
                            time="1h ago"
                            description="Elite members now have early access to the Commercial Roofing v2 module. Complete it to unlock Tier 4 jobs."
                        />
                        <FeedItem
                            category="Job Lead"
                            title="Seeker Inspections is hiring in your area"
                            time="3h ago"
                            description="A high-volume firm viewed your profile 3 times this week. Send a priority introduction?"
                            action="Connect"
                        />
                        <FeedItem
                            category="System"
                            title="Weekly Analytics Report Ready"
                            time="5h ago"
                            description="Your profile performance improved by 15% this week after adding the Drone Pilot certification."
                        />
                    </CardContent>
                </Card>

                {/* Side Panel - Quick Actions & Concierge Teaser */}
                <div className="col-span-3 lg:col-span-3 space-y-4">
                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <QuickAction icon={Zap} label="Boost Profile" />
                        <QuickAction icon={Briefcase} label="Find Work" />
                        <QuickAction icon={ShieldCheck} label="Verify credential" />
                        <QuickAction icon={ArrowUpRight} label="Share Link" />
                    </div>

                    {/* Concierge Teaser */}
                    <Card variant="glass" className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20">
                        <CardHeader>
                            <CardTitle className="text-indigo-300 text-sm uppercase tracking-wider">AI Concierge</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-indigo-100/80">
                                "I analyzed your saved firms. Three of them have just opened new vendor slots for 2026. Should I draft an outreach email?"
                            </p>
                            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors">
                                Open Concierge
                            </button>
                        </CardContent>
                    </Card>

                    <Card variant="default" className="bg-black/20 border-white/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Completion Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between text-sm mb-2 text-white">
                                <span>Profile Completeness</span>
                                <span>85%</span>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gold-500 w-[85%]" />
                            </div>
                            <Link href="/profile" className="text-xs text-gold-500 mt-3 inline-flex items-center hover:underline">
                                Complete 2 missing items <ChevronRight className="w-3 h-3 ml-1" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Subcomponents for cleanliness
function StatCard({ title, value, trend, icon: Icon, active = false }: any) {
    return (
        <Card variant="glass" className={cn("relative overflow-hidden group hover:border-white/20", active && "border-gold-500/50 bg-gold-900/5")}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <Icon className={cn("h-4 w-4 text-muted-foreground transition-colors group-hover:text-white", active && "text-gold-500")} />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <p className={cn("text-xs font-medium",
                        trend.includes("+") ? "text-green-500" : "text-gold-500"
                    )}>
                        {trend}
                    </p>
                </div>
            </CardContent>
            {active && <div className="absolute top-0 right-0 w-16 h-16 bg-gold-500/10 blur-xl rounded-full" />}
        </Card>
    )
}

function FeedItem({ category, title, time, description, action }: any) {
    return (
        <div className="group border-b border-white/5 pb-6 last:border-0 last:pb-0 hover:bg-white/[0.02] -mx-6 px-6 py-4 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-gold-600/80 bg-gold-900/20 px-2 py-0.5 rounded border border-gold-900/30 uppercase tracking-tight">
                    {category}
                </span>
                <span className="text-xs text-muted-foreground">{time}</span>
            </div>
            <h4 className="text-white font-medium mb-1 group-hover:text-gold-400 transition-colors cursor-pointer">{title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
            </p>
            {action && (
                <button className="mt-3 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                    {action} <ArrowUpRight className="w-3 h-3" />
                </button>
            )}
        </div>
    )
}

function QuickAction({ icon: Icon, label }: any) {
    return (
        <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group">
            <Icon className="w-6 h-6 text-white/60 group-hover:text-gold-500 transition-colors" />
            <span className="text-xs font-medium text-white/80">{label}</span>
        </button>
    )
}
