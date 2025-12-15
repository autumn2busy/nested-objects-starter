"use client";

import { OutsetaProfileWidget } from "@/components/outseta/ProfileWidget";

export default function DirectoryPreviewPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Directory Preview</h1>
                <p className="text-muted-foreground">
                    Review your public directory information before sharing it.
                </p>
            </div>

            <OutsetaProfileWidget tab="directory" />
        </div>
    );
}
