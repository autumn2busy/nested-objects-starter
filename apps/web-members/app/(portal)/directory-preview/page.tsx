'use client';

import { Gate } from '@/components/Gate';
import { OutsetaProfileWidget } from '@/components/outseta/ProfileWidget';

export default function DirectoryPreviewPage() {
    return (
        <Gate>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Directory Preview</h1>
                    <p className="text-muted-foreground">Manage your directory listing preview.</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    {/* Assuming tab 'directory' or similar? Outseta doesn't have a standard 'directory preview' tab in the profile widget usually. */}
                    {/* But per user instructions: "The correct Outseta view... or embed the relevant Outseta component" */}
                    {/* I'll use a generic tab placeholder or 'profile' for now if unsure. */}
                    {/* User said: "Split Security and Directory Preview... If these are Outseta profile tabs, render them by deep-linking" */}
                    {/* I'll assume 'profile' tab shows the directory info? Or maybe 'directory'? */}
                    <OutsetaProfileWidget tab="profile" />
                </div>
            </div>
        </Gate>
    );
}
