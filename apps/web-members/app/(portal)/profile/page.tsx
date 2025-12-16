'use client';

import { Suspense } from 'react';
import { Gate } from "@/components/Gate";
import { OutsetaProfileWidget } from "@/components/outseta/ProfileWidget";

import { useSearchParams } from 'next/navigation';

function ProfileContent() {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'profile';
    // Outseta sometimes passes planUid in stateProps JSON
    let planUidParam = searchParams.get('planUid');

    // Safely parse stateProps if present (Outseta redirect format)
    const stateProps = searchParams.get('stateProps');
    if (stateProps && !planUidParam) {
        try {
            const props = JSON.parse(stateProps);
            if (props.planUid) planUidParam = props.planUid;
        } catch (e) {
            // ignore
        }
    }

    return (
        <Gate>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Member Profile</h1>
                    <p className="text-muted-foreground">Control center for your membership.</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-hidden">
                    <OutsetaProfileWidget tab={tab} planUid={planUidParam || undefined} />
                </div>
            </div>
        </Gate>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="p-6">Loading profile...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
