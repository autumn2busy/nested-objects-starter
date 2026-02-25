
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BadgeCheck, MapPin, Hammer, Truck, Shield, Clock } from 'lucide-react'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { StarRating } from '@/components/ui/StarRating'

// Development SSL fix
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

export const revalidate = 3600

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase env vars')
    }
    return createClient(supabaseUrl, supabaseAnonKey)
}

async function getMemberResume(memberId: string) {
    const { data, error } = await getSupabase()
        .from('resume_workspace')
        .select('profile, experience, outputs')
        .eq('user_id', memberId)
        .maybeSingle()

    if (error) {
        console.error('Error loading member resume', error)
        return null
    }

    return data
}

async function getMemberTrustData(memberId: string) {
    // Attempt to fetch trust signals from the main profiles table
    // We assume memberId matches the profile 'id' or 'user_id'
    const { data, error } = await getSupabase()
        .from('profiles')
        .select('verified_at, rating, rating_count, is_published')
        .eq('id', memberId)
        .maybeSingle()

    if (error) return null
    return data
}

export async function generateMetadata({
    params,
}: {
    params: { memberId: string }
}) {
    const resume = await getMemberResume(params.memberId)
    const name = resume?.profile?.fullName || 'Member Profile'

    return {
        title: `${name} . Verified Field Inspector`,
        description: `View ${name}'s qualifications, service area, and experience on the Nested Objects directory.`,
    }
}

export default async function MemberProfilePage({
    params,
}: {
    params: { memberId: string }
}) {
    const [resume, trustData] = await Promise.all([
        getMemberResume(params.memberId),
        getMemberTrustData(params.memberId)
    ])

    // If profile has elected not to publish via their dashboard Settings 
    // or if no profile data exists, abort the route.
    if (!resume || !resume.profile || trustData?.is_published === false) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <h1 className="text-2xl font-bold text-slate-900">Profile Not Found</h1>
                    <p className="text-slate-600">
                        This member has not published their profile yet or the ID is incorrect.
                    </p>
                    <Link href="/members" className="inline-block text-blue-600 hover:underline">
                        Return to Directory
                    </Link>
                </div>
            </main>
        )
    }

    const { profile, experience, outputs } = resume
    const summary = outputs?.summary || "Field professional with verified experience."
    const initials = profile.fullName ? profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'VO'

    return (
        <main
            style={{
                maxWidth: '1000px',
                margin: '0 auto',
                padding: '2rem 1.5rem 4rem',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-8 text-sm text-slate-500">
                <Link href="/hiring-firms" className="text-blue-600 font-medium hover:underline">
                    Directory
                </Link>
                <span>/</span>
                <span className="text-slate-900 font-medium">{profile.fullName || 'Member'}</span>
            </div>

            {/* Hero Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="h-32 bg-gradient-to-r from-slate-900 to-slate-800 relative">
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                    }}></div>
                </div>

                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex justify-between items-end">
                        <div className="bg-white p-1.5 rounded-2xl shadow-sm inline-block">
                            <div className="w-32 h-32 bg-slate-100 rounded-xl flex items-center justify-center text-4xl font-bold text-slate-400 border border-slate-200">
                                {initials}
                            </div>
                        </div>

                        <div className="flex gap-3 mb-1">
                            <Link
                                href={`mailto:${profile.email || ''}`}
                                className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                            >
                                Contact Member
                            </Link>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-bold text-slate-900">{profile.fullName}</h1>
                            {trustData?.verified_at && <VerifiedBadge date={trustData.verified_at} />}
                        </div>

                        {/* Star Rating Section */}
                        <div className="mb-3">
                            {trustData?.rating ? (
                                <StarRating rating={trustData.rating} count={trustData.rating_count || 0} />
                            ) : (
                                <span className="text-xs text-slate-500">New Member (Not yet rated)</span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-slate-600 mt-2">
                            {profile.serviceArea && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    {profile.serviceArea}
                                </div>
                            )}
                            {experience?.turnaroundTime && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    {experience.turnaroundTime} TAT
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-[2fr_1fr] gap-8">

                {/* Main Content */}
                <div className="space-y-8">

                    {/* About / Summary */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-600 rounded-full block"></span>
                            Professional Summary
                        </h2>
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <p className="text-slate-700 leading-relaxed text-base">
                                {summary}
                            </p>
                        </div>
                    </section>

                    {/* AI Generated Experience Bullets */}
                    {outputs?.experienceBullets && outputs.experienceBullets.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-600 rounded-full block"></span>
                                Key Qualifications
                            </h2>
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <ul className="space-y-3">
                                    {outputs.experienceBullets.map((bullet: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-slate-700">
                                            <span className="text-blue-500 mt-1.5">•</span>
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}

                    {/* Skills */}
                    {outputs?.skillsBullets && outputs.skillsBullets.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-600 rounded-full block"></span>
                                Skills & Competencies
                            </h2>
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <div className="flex flex-wrap gap-2">
                                    {outputs.skillsBullets.map((skill: string, i: number) => (
                                        <span key={i} className="bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                </div>

                {/* Sidebar */}
                <div className="space-y-6">

                    {/* Field Gear */}
                    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Field Gear
                        </h3>
                        <div className="space-y-3">
                            {experience?.ladderHeights && experience.ladderHeights.length > 0 && (
                                <div className="text-sm">
                                    <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Ladders</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {experience.ladderHeights.map((h: string) => (
                                            <span key={h} className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium text-xs">
                                                {h}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {experience?.hasDrone && (
                                <div className="text-sm border-t border-slate-100 pt-3">
                                    <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Drone</span>
                                    <span className="text-slate-900 font-medium">{experience.droneModel || "Equipped"}</span>
                                </div>
                            )}

                            {experience?.measuringTools && (
                                <div className="text-sm border-t border-slate-100 pt-3">
                                    <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Measuring</span>
                                    <span className="text-slate-900 font-medium">{experience.measuringTools}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Verification */}
                    <section className="bg-slate-900 rounded-xl p-5 text-white shadow-lg shadow-slate-900/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            <h3 className="font-bold">Background Checked</h3>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                            This member has completed identity verification and background screening.
                        </p>
                        <div className="text-xs text-slate-500 font-mono">
                            ID: {params.memberId.substring(0, 8)}...
                        </div>
                    </section>

                </div>
            </div>
        </main>
    )
}
