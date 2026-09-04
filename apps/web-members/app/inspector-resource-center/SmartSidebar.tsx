'use client'

import Link from 'next/link'
import {
    Sparkles,
    FileText,
    Search,
    BookOpen,
    Briefcase,
    Phone,
    CloudSun,
    ArrowRight,
    Lock,
    Rocket,
    Star,
    TrendingUp,
    Users,
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

// ── Plan UIDs from auth-provider ─────────────────────────────────────
// Starter = L9nbKV9Z, Directory = zWZD0rQp, Pro = rQVqlLm6
// Elite = NmdnNO90, Agency = rmk5Xk9g

type Recommendation = {
    icon: React.ReactNode
    eyebrow: string
    title: string
    description: string
    href: string
    /** If set, show a lock icon and "Upgrade" instead of arrow */
    locked?: boolean
    /** Badge text like "FREE", "NEW", "PRO" */
    badge?: string
    badgeColor?: string
}

function getTierLabel(planUid: string | null): string {
    const map: Record<string, string> = {
        L9nbKV9Z: 'Starter',
        zWZD0rQp: 'Directory',
        rQVqlLm6: 'Pro',
        NmdnNO90: 'Elite',
        rmk5Xk9g: 'Agency',
    }
    return map[planUid || ''] || 'Free'
}

function getRecommendations(
    planUid: string | null,
    isAuthenticated: boolean
): Recommendation[] {
    const tier = getTierLabel(planUid)

    // ── Not logged in ────────────────────────────────────────────────
    if (!isAuthenticated) {
        return [
            {
                icon: <Rocket className="w-5 h-5" />,
                eyebrow: 'Get started',
                title: 'Create your vendor account',
                description:
                    'Join 200+ field service professionals. Free to start, upgrade when you are ready.',
                href: '/membership-pricing',
                badge: 'FREE',
                badgeColor: 'bg-emerald-100 text-emerald-700',
            },
            {
                icon: <BookOpen className="w-5 h-5" />,
                eyebrow: 'Training',
                title: 'Preview Module 1',
                description:
                    'Learn the basics of field inspections, property preservation, and getting your first route.',
                href: '/challenges',
                badge: 'FREE',
                badgeColor: 'bg-emerald-100 text-emerald-700',
            },
            {
                icon: <Search className="w-5 h-5" />,
                eyebrow: 'Directory',
                title: 'Browse hiring firms',
                description:
                    'See which companies are hiring inspectors, notaries, and field agents in your area.',
                href: '/hiring-firms',
            },
        ]
    }

    // ── Free / Starter ───────────────────────────────────────────────
    if (tier === 'Free' || tier === 'Starter') {
        return [
            {
                icon: <BookOpen className="w-5 h-5" />,
                eyebrow: 'Next step',
                title: 'Start Module 1: The Basics',
                description:
                    'Your first training module is free. Learn about inspections, property preservation, and how the industry works.',
                href: '/challenges',
                badge: 'FREE',
                badgeColor: 'bg-emerald-100 text-emerald-700',
            },
            {
                icon: <Search className="w-5 h-5" />,
                eyebrow: 'Explore',
                title: 'Find firms hiring near you',
                description:
                    'Browse 200+ firms in the directory. Filter by role, location, and pay.',
                href: '/hiring-firms',
            },
            {
                icon: <FileText className="w-5 h-5" />,
                eyebrow: 'Free tool',
                title: 'Open the income calculator',
                description:
                    'Compare income and route-cost assumptions without relying on an earnings promise.',
                href: '/tools/income-calculator',
                badge: 'FREE',
                badgeColor: 'bg-brand-copper/10 text-brand-copper',
            },
            {
                icon: <TrendingUp className="w-5 h-5" />,
                eyebrow: 'Upgrade',
                title: 'Unlock all training modules',
                description:
                    'Pro members get full training, firm intel, readiness resources, and priority support.',
                href: '/membership-pricing',
                badge: 'UPGRADE',
                badgeColor: 'bg-amber-100 text-amber-700',
            },
        ]
    }

    // ── Directory pass ───────────────────────────────────────────────
    if (tier === 'Directory') {
        return [
            {
                icon: <BookOpen className="w-5 h-5" />,
                eyebrow: 'Training',
                title: 'Continue your training',
                description:
                    'You have access to the training center. Pick up where you left off or start a new module.',
                href: '/challenges',
            },
            {
                icon: <FileText className="w-5 h-5" />,
                eyebrow: 'Paid tools',
                title: 'Open member tools',
                description:
                    'Use the tools included with your legacy paid membership.',
                href: '/tools',
            },
            {
                icon: <Search className="w-5 h-5" />,
                eyebrow: 'Directory',
                title: 'Explore the firm directory',
                description:
                    'Filter by location, role, and pay, then build a practical application shortlist.',
                href: '/hiring-firms',
            },
            {
                icon: <Sparkles className="w-5 h-5" />,
                eyebrow: 'Next level',
                title: 'Upgrade to Pro for full firm intel',
                description:
                    'Get the full directory, training, readiness resources, and priority support.',
                href: '/membership-pricing',
                badge: 'UPGRADE',
                badgeColor: 'bg-amber-100 text-amber-700',
            },
        ]
    }

    // ── Pro ──────────────────────────────────────────────────────────
    if (tier === 'Pro') {
        return [
            {
                icon: <Sparkles className="w-5 h-5" />,
                eyebrow: 'AI tool',
                title: 'Open AI Concierge',
                description:
                    'Ask structured questions about firms, requirements, and inspection workflows.',
                href: '/tools/ai-concierge',
                badge: 'PRO',
                badgeColor: 'bg-blue-100 text-blue-700',
            },
            {
                icon: <FileText className="w-5 h-5" />,
                eyebrow: 'AI tool',
                title: 'Build a field-services resume',
                description:
                    'Turn your experience, routes, and equipment into a focused resume.',
                href: '/tools/ai-resume',
            },
            {
                icon: <Briefcase className="w-5 h-5" />,
                eyebrow: 'Pipeline',
                title: 'Track your job applications',
                description:
                    'Manage your pipeline from interested → applied → interview → offer.',
                href: '/jobs',
            },
            {
                icon: <BookOpen className="w-5 h-5" />,
                eyebrow: 'Training',
                title: 'Continue your training',
                description:
                    'All modules are unlocked. Keep building your certifications.',
                href: '/challenges',
            },
        ]
    }

    // ── Elite / Agency ──────────────────────────────────────────────
    return [
        {
            icon: <Phone className="w-5 h-5" />,
            eyebrow: 'Concierge',
            title: 'Schedule a concierge call',
            description:
                'Book a 15-minute call to review your routes, crew setup, or onboarding plan.',
            href: '/contact-us',
            badge: tier.toUpperCase(),
            badgeColor: 'bg-brand-copper/10 text-brand-copper',
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            eyebrow: 'AI tool',
            title: 'Open AI Concierge',
            description:
                'Ask structured questions about firms, requirements, and inspection workflows.',
            href: '/tools/ai-concierge',
        },
        {
            icon: <Users className="w-5 h-5" />,
            eyebrow: 'Intel',
            title: 'Firm intel briefings',
            description:
                'Deep-dive briefs on who is hiring, what they pay, and how to stand out.',
            href: '/inspector-resource-center/firm-intel',
        },
        {
            icon: <Briefcase className="w-5 h-5" />,
            eyebrow: 'Pipeline',
            title: 'Job Command Center',
            description:
                'Full pipeline tracking with save, status, and notes for every application.',
            href: '/jobs',
        },
    ]
}

export default function SmartSidebar() {
    const { planUid, isAuthenticated, isLoading, profileDisplayName } =
        useAuth()

    if (isLoading) {
        return (
            <div className="space-y-4 rounded-3xl border border-brand-copper/20 bg-brand-dark p-6 shadow-lg shadow-brand-copper/10">
                <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                <div className="h-6 w-48 rounded bg-white/10 animate-pulse" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-24 rounded-2xl bg-white/5 animate-pulse"
                        />
                    ))}
                </div>
            </div>
        )
    }

    const tier = getTierLabel(planUid)
    const recommendations = getRecommendations(planUid, isAuthenticated)
    const greeting = profileDisplayName
        ? `${profileDisplayName}'s next steps`
        : 'Your next steps'

    return (
        <div className="space-y-4 rounded-3xl border border-brand-copper/20 bg-brand-dark p-6 text-slate-100 shadow-lg shadow-brand-copper/10">
            {/* Header */}
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-copper">
                    {isAuthenticated ? `${tier} plan` : 'Get started'}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                    {isAuthenticated ? greeting : 'Your path starts here'}
                </h2>
                {isAuthenticated && (
                    <p className="mt-1 text-sm text-slate-300">
                        Recommendations based on your plan and progress.
                    </p>
                )}
            </div>

            {/* Recommendation cards */}
            <div className="space-y-3">
                {recommendations.map((rec) => (
                    <Link
                        key={rec.title}
                        href={rec.href}
                        className="group block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-brand-copper/40 hover:bg-white/10"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-copper/10 text-brand-copper transition group-hover:bg-brand-copper/20">
                                {rec.locked ? (
                                    <Lock className="w-4 h-4 text-slate-400" />
                                ) : (
                                    rec.icon
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-copper">
                                        {rec.eyebrow}
                                    </span>
                                    {rec.badge && (
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${rec.badgeColor || 'bg-white/10 text-white'
                                                }`}
                                        >
                                            {rec.badge}
                                        </span>
                                    )}
                                </div>
                                <h3 className="mt-1 text-sm font-semibold text-white leading-tight group-hover:text-brand-mist">
                                    {rec.title}
                                </h3>
                                <p className="mt-1 text-xs text-slate-300 leading-relaxed line-clamp-2">
                                    {rec.description}
                                </p>
                            </div>
                            <ArrowRight className="mt-1 w-4 h-4 shrink-0 text-slate-500 transition group-hover:text-brand-copper group-hover:translate-x-0.5" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Bottom CTA */}
            {isAuthenticated && tier !== 'Elite' && tier !== 'Agency' && (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white">
                    <p className="font-semibold flex items-center gap-2">
                        <Star className="w-4 h-4 text-brand-copper" />
                        Want more?
                    </p>
                    <p className="mt-1 text-slate-200">
                        {tier === 'Pro'
                            ? 'Elite members get partner referrals, 1-to-1 gaming sessions, and concierge calls.'
                            : 'Pro members unlock the full directory, full training, and readiness resources.'}
                    </p>
                    <Link
                        href="/membership-pricing"
                        className="mt-3 inline-flex text-xs font-semibold text-brand-mist underline-offset-4 transition hover:text-white"
                    >
                        Compare plans →
                    </Link>
                </div>
            )}

            {/* Elite/Agency: custom brief CTA */}
            {isAuthenticated && (tier === 'Elite' || tier === 'Agency') && (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white">
                    <p className="font-semibold">Need something specific?</p>
                    <p className="mt-1 text-slate-200">
                        Request custom guides or briefings matched to your routes and
                        markets. We will queue it up.
                    </p>
                    <Link
                        href="/contact-us"
                        className="mt-3 inline-flex text-xs font-semibold text-brand-mist underline-offset-4 transition hover:text-white"
                    >
                        Request a custom brief →
                    </Link>
                </div>
            )}
        </div>
    )
}
