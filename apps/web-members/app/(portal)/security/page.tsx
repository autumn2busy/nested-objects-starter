'use client';

import { Gate } from '@/components/Gate';
import { OutsetaProfileWidget } from '@/components/outseta/ProfileWidget';

export default function SecurityPage() {
    return (
        <Gate>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security</h1>
                    <p className="text-muted-foreground">Manage your password and security settings.</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    {/* Security tab in Outseta is usually 'changePassword' ?? or just 'profile' with tab? */}
                    {/* The user said "The correct Outseta view... deep-linking the Outseta profile widget to the right tab" */}
                    {/* I'll guess 'password' or 'security'. Commonly 'changepassword'. Let's try 'profile' first, Outseta widget usually handles tabs internally if specified? No, widget takes ?tab= param */}
                    {/* Docs: tab="changePassword" */}
                    <OutsetaProfileWidget tab="changePassword" />
                </div>
            </div>
        </Gate>
    );
}
