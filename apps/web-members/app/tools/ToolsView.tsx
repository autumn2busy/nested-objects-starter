'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ToolsView() {
    const { isAuthenticated } = useAuth()

    const tools = [
        {
            title: '💼 Clients & vendors',
            description: 'Manage point of contacts, pay dates, and portal links for every firm you work with.',
            href: '/tools/clients',
            cta: 'Manage clients →',
        },
        {
            title: '🏢 Company tracker',
            description: 'Build your target list of firms and track your application status.',
            href: '/tools/companies',
            cta: 'Track companies →',
        },
        {
            title: '💰 Income calculator',
            description: 'Visualize your potential earnings based on inspection volume and days worked.',
            href: '/tools/income-calculator',
            cta: 'Calculate income →',
        },
        {
            title: '🤖 AI concierge',
            description:
                'Ask questions about firms, requirements, and inspection workflows in plain language.',
            href: '/tools/ai-concierge',
            cta: 'Open AI concierge →',
        },
        {
            title: '📝 AI resume builder',
            description:
                'Turn your experience, routes, and gear into a clean resume for field service firms.',
            href: '/tools/ai-resume',
            cta: 'Build my resume →',
        },
        {
            title: '📍 Job tracker',
            description:
                'Track applications, interviews, and offers in a simple pipeline.',
            href: '/tools/job-tracker',
            cta: 'Open job tracker →',
        },
        {
            title: '🌤 Weather',
            description:
                'Plan around storms and daylight so your routes are safer and more profitable.',
            href: '/tools/weather',
            cta: 'Open weather tool →',
        },
        {
            title: '🗺 Route planning',
            description:
                'Stack inspections into efficient routes so you burn less gas and make more per mile.',
            href: '/tools/routing',
            cta: 'Plan my routes →',
        },
    ]

    return (
        <main className="min-h-screen bg-brand-sand text-brand-dark">
            <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
                <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">
                        Tools
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Inspector tools
                    </h1>
                    <p className="max-w-3xl text-base text-slate-700">
                        AI-powered tools to help you plan routes, watch the weather, and present
                        yourself like the pro you are.
                    </p>
                </div>
            </section>

            <section className="bg-white">
                <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8 lg:py-16">
                    {tools.map((tool) => (
                        <Card
                            key={tool.title}
                            className={`relative flex h-full flex-col gap-3 border border-brand-copper/20 p-6 shadow-sm transition ${!isAuthenticated ? 'overflow-hidden' : ''
                                }`}
                        >
                            {!isAuthenticated && (
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-brand-mist/60"
                                />
                            )}
                            <div className="relative z-10">
                                <h2 className="text-xl font-semibold text-text-primary">
                                    {tool.title}
                                </h2>
                                <p className="mt-2 text-sm text-text-secondary">
                                    {tool.description}
                                </p>
                            </div>
                            <div className="relative z-10 mt-auto">
                                {!isAuthenticated ? (
                                    <span className="text-sm font-semibold text-brand-copper opacity-90">
                                        Log in to access
                                    </span>
                                ) : (
                                    <Link
                                        href={tool.href}
                                        className={buttonVariants({
                                            variant: 'link',
                                            size: 'sm',
                                            className: 'text-sm font-semibold px-0',
                                        })}
                                    >
                                        {tool.cta}
                                    </Link>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                {!isAuthenticated && (
                    <div className="mx-auto mb-12 flex max-w-md justify-center">
                        <Link
                            href="/membership-pricing"
                            className={buttonVariants({
                                variant: 'primary',
                                size: 'md',
                                className: 'w-full shadow-lg border border-brand-copper/50'
                            })}
                        >
                            Join to unlock all tools
                        </Link>
                    </div>
                )}
            </section>
        </main>
    )
}
