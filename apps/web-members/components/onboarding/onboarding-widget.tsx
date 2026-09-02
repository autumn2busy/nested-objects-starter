'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import { completeOnboardingAction } from '@/actions/onboarding'

export function OnboardingWidget() {
    const [isVisible, setIsVisible] = useState(true)
    const [isCompleting, setIsCompleting] = useState(false)

    if (!isVisible) return null

    const steps = [
        { label: 'Complete your profile', href: '/profile', icon: Circle },
        { label: 'Find firms to work with', href: '/hiring-firms', icon: Circle },
        { label: 'Preview planned resume support', href: '/tools', icon: Circle },
    ]

    const handleDismiss = async () => {
        setIsCompleting(true)
        await completeOnboardingAction()
        setIsVisible(false)
    }

    return (
        <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50/50 p-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-900">
                        <PartyPopper className="h-5 w-5 text-blue-600" />
                        Welcome to the Hub!
                    </h2>
                    <p className="mt-1 text-sm text-blue-700">
                        Get started with these quick steps to get the most out of your membership.
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    disabled={isCompleting}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
                >
                    {isCompleting ? 'Saving...' : 'Dismiss'}
                </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {steps.map((step) => (
                    <Link
                        key={step.label}
                        href={step.href}
                        className="group flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-blue-200"
                    >
                        <div className="rounded-full bg-blue-100 p-2 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <step.icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-slate-700">{step.label}</span>
                    </Link>
                ))}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleDismiss}
                    className="text-xs text-blue-400 hover:text-blue-600"
                >
                    Mark all as done
                </button>
            </div>
        </div>
    )
}
