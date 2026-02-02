'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { IndustryNews } from "@/components/IndustryNews";
import { useAuth } from "@/components/auth-provider";
import { useProfile } from "@/lib/use-profile";
import { CheckCircle, Briefcase, GraduationCap, Shield } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { StarRating } from "@/components/ui/StarRating";

export default function DashboardPage() {
    const { user, profileDisplayName, planUid } = useAuth();
    // Assuming useAuth provides `user` which has `email`
    const userEmail = user?.email || user?.Email || null;
    const { profile, isLoading: isProfileLoading } = useProfile(userEmail as string | null);

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

            {/* Actionable Status Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                {/* Profile Status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Active</div>
                        <p className="text-xs text-muted-foreground">
                            {planUid ? 'Membership valid' : 'Free plan'}
                        </p>
                    </CardContent>
                </Card>

                {/* Trust Score */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
                        <Shield className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-1">
                            {!isProfileLoading && profile ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</span>
                                        <div className="flex flex-col">
                                            <StarRating rating={profile.rating || 0} showCount={false} size="sm" />
                                            <span className="text-[10px] text-muted-foreground">{profile.rating_count || 0} reviews</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        {profile.verified_at && <VerifiedBadge date={profile.verified_at} />}
                                        <Link href={`/members/${profile.id}`} className="text-[10px] text-blue-600 hover:underline font-medium">
                                            View Public Profile →
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Training Progress */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Training</CardTitle>
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Level 1</div>
                        <Link href="/training" className="text-xs text-brand-copper hover:underline mt-1 block">
                            Continue modules →
                        </Link>
                    </CardContent>
                </Card>

                {/* Job Opportunities */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Find Work</CardTitle>
                        <Briefcase className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Job Board</div>
                        <Link href="/jobs" className="text-xs text-brand-copper hover:underline mt-1 block">
                            View active listings →
                        </Link>
                    </CardContent>
                </Card>
            </div>

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
                                <Link href="/resources/firm-intel" className="inline-block bg-brand-copper text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-brand-copper/90 transition">
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
                                href="/resources/industry-news"
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

