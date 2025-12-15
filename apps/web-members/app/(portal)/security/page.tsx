"use client";

import { OutsetaProfileWidget } from "@/components/outseta/ProfileWidget";

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Security</h1>
                <p className="text-muted-foreground">
                    Manage authentication, passwords, and recovery options.
                </p>
            </div>

            <OutsetaProfileWidget tab="security" />
        </div>
    );
}
