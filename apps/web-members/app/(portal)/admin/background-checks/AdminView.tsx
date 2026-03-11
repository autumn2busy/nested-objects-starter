'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, XCircle, Shield, AlertCircle, Loader2 } from 'lucide-react'

type PendingProfile = {
    id: string
    fullName: string
    email: string
    shieldId: string
    submittedAt: string
    trustScore: number
}

export default function AdminView({ initialProfiles }: { initialProfiles: PendingProfile[] }) {
    const [profiles, setProfiles] = useState<PendingProfile[]>(initialProfiles)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleVerification = async (profileId: string, action: 'verify' | 'reject') => {
        try {
            setProcessingId(profileId)
            setError(null)

            // Rejects often need notes, for V1 we provide a generic reason
            const notes = action === 'reject'
                ? 'Your ABC# could not be verified in our external records. Please double-check your ID.'
                : 'Verified by Admin.'

            const response = await fetch('/api/background-check', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile_id: profileId,
                    action,
                    notes
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update backend')
            }

            // Remove the profile from the UI instantly because it is no longer pending
            setProfiles(prev => prev.filter(p => p.id !== profileId))

        } catch (err: any) {
            console.error('Verification error:', err)
            setError(err.message || 'An error occurred during verification')
        } finally {
            setProcessingId(null)
        }
    }

    if (profiles.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-slate-50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Shield className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">All clear!</h3>
                    <p className="text-slate-500 mt-1 max-w-sm">
                        There are no pending background check applications at this time.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-900 p-4 rounded-xl text-sm border border-red-200 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    {error}
                </div>
            )}

            <div className="grid gap-6">
                {profiles.map(profile => (
                    <Card key={profile.id} className="overflow-hidden">
                        <div className="md:flex items-center justify-between p-6">

                            <div className="mb-6 md:mb-0 space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-slate-900">{profile.fullName}</h3>
                                    <span className="text-sm px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                        Trust Score: {profile.trustScore}
                                    </span>
                                </div>
                                <p className="text-slate-500">{profile.email}</p>
                                <div className="mt-3 flex items-center gap-3 text-sm">
                                    <div className="font-mono bg-blue-50 text-blue-700 font-medium px-3 py-1 rounded-md border border-blue-100">
                                        ABC#: {profile.shieldId || 'No ID Provided'}
                                    </div>
                                    <span className="text-slate-400">
                                        Submitted {new Date(profile.submittedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 md:ml-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                <button
                                    onClick={() => handleVerification(profile.id, 'reject')}
                                    disabled={processingId === profile.id}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 disabled:opacity-50"
                                >
                                    {processingId === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Reject
                                </button>

                                <button
                                    onClick={() => handleVerification(profile.id, 'verify')}
                                    disabled={processingId === profile.id}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all border border-emerald-500 disabled:opacity-50"
                                >
                                    {processingId === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Approve +25 Trust
                                </button>
                            </div>

                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
