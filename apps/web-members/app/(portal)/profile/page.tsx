'use client';

import { Gate } from "@/components/Gate";
import { OutsetaProfileWidget } from "@/components/outseta/ProfileWidget";

export default function ProfilePage() {
    return (
        <Gate>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Member Profile</h1>
                    <p className="text-muted-foreground">Control center for your membership.</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-hidden">
                    {/* The main profile widget. Tabs are removed effectively by not passing any specific tab, 
                        so it defaults to 'profile' or the widget's internal nav if capable, 
                        but sidebar items now handle Security etc. 
                        User acceptance: "Remove any extra in-page tabs... Profile page content is minimal." */}
                    <OutsetaProfileWidget tab="profile" />
                </div>
            </div>
        </Gate>
    );
}
