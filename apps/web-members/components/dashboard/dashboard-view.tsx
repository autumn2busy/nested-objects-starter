'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { IndustryNews } from "@/components/IndustryNews";
import { useAuth } from "@/components/auth-provider";
import { CheckCircle, Briefcase, GraduationCap, Shield, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { OnboardingWidget } from "@/components/onboarding/onboarding-widget";

interface DashboardViewProps {
    showOnboarding: boolean;
}

interface DashboardStats {
    trustScore: number;
    trustTier: string;
    trustScoreBreakdown: Record<string, number> | null;
    rating: number;
    ratingCount: number;
    isVerified: boolean;
    verifiedAt: string | null;
    backgroundCheckStatus: string;
    trainingLevel: number;
    trainingModulesCompleted: number;
    trainingModulesTotal: number;
    trainingProgress: number;
    inspectionsCompleted: number;
    pipeline: {
        active: number;
        offers: number;
        applied: number;
        interviewing: number;
        addedThisWeek: number;
        total: number;
    };
    platform: {
        totalJobListings: number;
        totalFirms: number;
    };
    accountAgeDays: number;
}

const TIER_COLORS: Record<string, string> = {
    platinum: 'from-slate-400 to-slate-600',
    gold: 'from-yellow-400 to-amber-500',
    silver: 'from-gray-300 to-gray-400',
    bronze: 'from-orange-300 to-orange-400',
};

const TIER_TEXT_COLORS: Record<string, string> = {
    platinum: 'text-slate-700',
    gold: 'text-amber-700',
    silver: 'text-gray-600',
    bronze: 'text-orange-700',
};

export function DashboardView({ showOnboarding }: DashboardViewProps) {
    const { user, profileDisplayName, planUid } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch dashboard stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                const res = await fetch('/api/dashboard/stats');
                
                if (!res.ok) {
                    throw new Error('Failed to load dashboard stats');
                }
                
                const data = await res.json();
                setStats(data);
                setError(null);
            } catch (err) {
                console.error('Dashboard stats error:', err);
                setError('Unable to load your stats right now.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const planLabel = (() => {
        switch (planUid) {
            case 'L9nbKV9Z': return 'Free';
            case 'zWZD0rQp': return 'Directory';
            case 'rQVqlLm6': return 'Pro';
            case 'NmdnNO90': return 'Elite';
            case 'rmk5Xk9g': return 'Agency';
            default: return 'Free';
        }
    })();

    const tierColor = stats?.trustTier ? TIER_COLORS[stats.trustTier] || TIER_COLORS.bronze : TIER_COLORS.bronze;
    const tierTextColor = stats?.trustTier ? TIER_TEXT_COLORS[stats.trustTier] || TIER_TEXT_COLORS.bronze : TIER_TEXT_COLORS.bronze;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Dashboard
                </h1>
                <p className="text-muted-foreground">
                    Welcome back, <span className="text-slate-900 font-medium">{profileDisplayName || 'Member'}</span>. Here is your daily briefing.
                </p>
            </div>

            {/* Onboarding Checklist */}
            {showOnboarding && <OnboardingWidget />}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-copper" />
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Stats Cards */}
            {!isLoading && stats && (
                <>
                    {/* Actionable Status Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Trust Score */}
                        <Card className="relative overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-br ${tierColor} opacity-10`} />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                                <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
                                <Shield className={`h-4 w-4 ${tierTextColor}`} />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-bold ${tierTextColor}`}>{stats.trustScore}</span>
                                    <span className={`text-xs font-semibold uppercase tracking-wide ${tierTextColor}`}>
                                        {stats.trustTier}
                                    </span>
                                </div>
                                <Link href="/profile" className="text-xs text-brand-copper hover:underline mt-1 block">
                                    View breakdown →
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Training Progress */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Training</CardTitle>
                                <GraduationCap className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold">Level {stats.trainingLevel}</span>
                                </div>
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                        <span>{stats.trainingModulesCompleted} of {stats.trainingModulesTotal} modules</span>
                                        <span>{stats.trainingProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                                            style={{ width: `${stats.trainingProgress}%` }}
                                        />
                                    </div>
                                </div>
                                <Link href="/training" className="text-xs text-brand-copper hover:underline mt-2 block">
                                    Continue training →
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Job Pipeline */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">My Pipeline</CardTitle>
                                <Briefcase className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.pipeline.active}</div>
                                <p className="text-xs text-muted-foreground">
                                    Active applications
                                </p>
                                <div className="flex gap-3 mt-2 text-xs">
                                    {stats.pipeline.offers > 0 && (
                                        <span className="text-green-600 font-medium">{stats.pipeline.offers} offers</span>
                                    )}
                                    {stats.pipeline.interviewing > 0 && (
                                        <span className="text-purple-600 font-medium">{stats.pipeline.interviewing} interviews</span>
                                    )}
                                </div>
                                <Link href="/jobs" className="text-xs text-brand-copper hover:underline mt-1 block">
                                    View pipeline →
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Find Work */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Find Work</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.platform.totalJobListings.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    Active job listings
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.platform.totalFirms.toLocaleString()} hiring firms
                                </p>
                                <Link href="/jobs" className="text-xs text-brand-copper hover:underline mt-1 block">
                                    Browse jobs →
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Secondary Stats Row */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Account Status */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-emerald-600">Active</span>
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                        {planLabel}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Member for {stats.accountAgeDays} days
                                </p>
                            </CardContent>
                        </Card>

                        {/* Background Check */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Background Check</CardTitle>
                                <Shield className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    {stats.backgroundCheckStatus === 'verified' ? (
                                        <>
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="text-lg font-bold text-green-600">Verified</span>
                                        </>
                                    ) : stats.backgroundCheckStatus === 'pending' ? (
                                        <>
                                            <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                                            <span className="text-lg font-bold text-yellow-600">Pending</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-5 w-5 text-slate-400" />
                                            <span className="text-lg font-bold text-slate-500">Not Started</span>
                                        </>
                                    )}
                                </div>
                                {stats.backgroundCheckStatus !== 'verified' && (
                                    <Link href="/profile" className="text-xs text-brand-copper hover:underline mt-1 block">
                                        Start background check →
                                    </Link>
                                )}
                            </CardContent>
                        </Card>

                        {/* Work History */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Work Completed</CardTitle>
                                <Briefcase className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.inspectionsCompleted}</div>
                                <p className="text-xs text-muted-foreground">
                                    Inspections logged
                                </p>
                                <Link href="/job-tracker" className="text-xs text-brand-copper hover:underline mt-1 block">
                                    View work history →
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            <QuickActions />

            {/* Industry News Sidebar Widget */}
            <div className="grid gap-4 md:grid-cols-7">
                <div className="md:col-span-4 max-md:order-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Featured Resource: Firm Intel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-900 text-slate-50 p-6 rounded-lg">
                                <h3 className="font-bold text-xl mb-2">Who is paying Net-30?</h3>
                                <p className="text-slate-300 text-sm mb-4">
                                    Stop guessing. See which national firms are paying on time and which ones are dragging their feet.
                                </p>
                                <Link href="/inspector-resource-center/firm-intel" className="inline-block bg-brand-copper text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-brand-copper/90 transition">
                                    Read the Report
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-3 max-md:order-1">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Industry News</CardTitle>
                            <Link
                                href="/inspector-resource-center/industry-news"
                                className="text-xs text-brand-copper hover:underline"
                            >
                                View all →
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <IndustryNews limit={5} variant="compact" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}