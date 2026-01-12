'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { User, Settings, CreditCard, Shield, X } from 'lucide-react'
import { OutsetaProfileWidget } from '@/components/outseta/ProfileWidget'

export default function ProfilePage() {
    const { isAuthenticated, user, refreshUser } = useAuth()
    const [lastUpdate, setLastUpdate] = useState(Date.now())
    const [activeTab, setActiveTab] = useState<string | null>(null)

    // Listen for Outseta profile updates to refresh local state
    useEffect(() => {
        const handleProfileUpdate = () => {
            console.log('Profile updated, refreshing user...')
            refreshUser()
            setLastUpdate(Date.now())
        }

        // Outseta specific event listener if available in their SDK
        // or we can attach to the window event we know they emit
        if (typeof window !== 'undefined' && window.Outseta) {
            // Some versions use 'profile.update', others might just rely on the user refreshing
            // We'll try to hook into the event API if it exists
            if (window.Outseta.on) {
                window.Outseta.on('profile.update', handleProfileUpdate)
            }
        }

        return () => {
            if (typeof window !== 'undefined' && window.Outseta && window.Outseta.off) {
                window.Outseta.off('profile.update', handleProfileUpdate)
            }
        }
    }, [refreshUser])

    const openProfileModal = (tab: string = 'profile') => {
        setActiveTab(tab)
    }

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold text-brand-dark">Sign in to view your profile</h1>
                <p className="mt-2 text-slate-600">You need to be logged in to manage your account details.</p>
                <button
                    onClick={() => window.Outseta?.auth?.open({ widgetMode: 'login' })}
                    className="mt-4 rounded-lg bg-brand-copper px-6 py-2 text-white hover:bg-brand-copperDark"
                >
                    Open Login
                </button>
            </div>
        )
    }

    // Safely access nested optional properties
    const firstName = user?.FirstName || 'Member'
    const lastName = user?.LastName || ''
    const email = user?.Email || ''
    const planName = user?.Account?.CurrentSubscription?.Plan?.Name || 'No Active Plan'
    const subStatus = user?.Account?.CurrentSubscription?.SubscriptionStage ?
        (user.Account.CurrentSubscription.SubscriptionStage === 3 ? 'Active' : 'Inactive') : 'Unknown'

    return (
        <div className="mx-auto max-w-4xl space-y-8 py-8 px-4">
            <div>
                <h1 className="text-3xl font-bold text-brand-dark">Member Profile</h1>
                <p className="mt-2 text-slate-600">Manage your personal information and subscription settings.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Identity Card */}
                <div className="rounded-2xl border border-brand-steel/30 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-sand text-brand-copper">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-brand-dark">{firstName} {lastName}</h2>
                            <p className="text-sm text-slate-500">{email}</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={() => openProfileModal('profile')}
                            className="w-full rounded-lg border border-brand-steel/40 bg-white px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-brand-sand"
                        >
                            Edit Profile Details
                        </button>
                    </div>
                </div>

                {/* Subscription Card */}
                <div className="rounded-2xl border border-brand-steel/30 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mist text-brand-blue">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-brand-dark">{planName}</h2>
                            <div className="flex items-center gap-2">
                                <span className={`inline-block h-2 w-2 rounded-full ${subStatus === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                                <p className="text-sm text-slate-500">{subStatus} Subscription</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={() => openProfileModal('billing')}
                            className="flex-1 rounded-lg border border-brand-steel/40 bg-white px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-brand-sand"
                        >
                            Manage Billing
                        </button>
                        <button
                            onClick={() => openProfileModal('profile')} // Outseta tab logic usually groups password with profile or generic
                            className="flex-1 rounded-lg border border-brand-steel/40 bg-white px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-brand-sand"
                        >
                            Change Password
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-xl bg-brand-mist/30 p-4 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Need to update your payment method or view invoices? Use the <strong>Manage Billing</strong> button above.</span>
                </p>
            </div>

            {/* Custom Modal Overlay */}
            {activeTab && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50">
                            <h3 className="font-semibold text-lg text-slate-800">
                                {activeTab === 'billing' ? 'Billing & Invoices' : 'Edit Profile'}
                            </h3>
                            <button
                                onClick={() => setActiveTab(null)}
                                className="rounded-full p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white p-0">
                            {/* Re-mount widget when tab changes to ensure clean state */}
                            <OutsetaProfileWidget key={activeTab} tab={activeTab} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
