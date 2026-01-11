'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LiveFeed, Activity } from "@/components/dashboard/LiveFeed";
import { useAuth } from "@/components/auth-provider";

// --- Deterministic Mock Generator ---
function getMockStats(seed: string) {
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const views = 120 + (hash % 500); // 120-620 views
    const opportunities = 2 + (hash % 8); // 2-9 leads
    const trust = 90 + (hash % 10); // 90-99 score
    const pipeline = 2000 + (hash % 50) * 100; // 2000-7000 pipeline

    return { views, opportunities, trust, pipeline };
}

function getMockActivities(seed: string): Activity[] {
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const types: Activity['type'][] = ['job', 'view', 'system', 'resource'];

    // Generate a few realistic looking events
    return [
        {
            id: 'a1',
            text: `New job posted: Residential Inspector in ${hash % 2 === 0 ? 'Dallas, TX' : 'Atlanta, GA'}`,
            time: "2 hours ago",
            type: 'job',
        },
        {
            id: 'a2',
            text: "Field Services Corp viewed your profile",
            time: "4 hours ago",
            type: 'view',
        },
        {
            id: 'a3',
            text: `System: Your trust score is strong (${90 + (hash % 10)}/100)`,
            time: "1 day ago",
            type: 'system',
        },
    ];
}

export default function DashboardPage() {
    const { user, profileDisplayName } = useAuth();

    const displayName = profileDisplayName || user?.name || user?.email?.split('@')[0] || "Member";
    const seed = user?.email || "default";

    const stats = useMemo(() => getMockStats(seed), [seed]);
    const activities = useMemo(() => getMockActivities(seed), [seed]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Hello, {displayName}
                </h1>
                <p className="text-slate-600 mt-2">
                    Here is what’s happening in your network today.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Profile Views</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats.views}</div>
                        <p className="text-xs text-emerald-600 font-medium">+12% from last month</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">New Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats.opportunities}</div>
                        <p className="text-xs text-emerald-600 font-medium">+2 this week</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Trust Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats.trust}/100</div>
                        <p className="text-xs text-slate-500">Excellent rating</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Est. Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            ${stats.pipeline.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500">Based on active applications</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <div className="md:col-span-4 space-y-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Shortcuts</p>
                    <QuickActions />
                </div>
                <div className="md:col-span-3 space-y-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Activity</p>
                    <LiveFeed activities={activities} />
                </div>
            </div>
        </div>
    );
}
