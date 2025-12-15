"use client";

import { useEffect } from "react";

export function OutsetaProfileWidget({ tab = "account" }: { tab?: string }) {
    useEffect(() => {
        // Ensure Outseta script is loaded before rendering widget
        if (typeof window !== 'undefined' && (window as any).Outseta) {
            console.log('Outseta loaded successfully');
            // Force re-scan for widgets (SPA fix)
            const o = (window as any).Outseta;
            if (o.c && o.c.parse) {
                o.c.parse();
            }
        }
    }, [tab]);

    return (
        <div
            data-o-profile="1"
            data-tab={tab}
            data-mode="embed"
            className="w-full min-h-[600px]"
        />
    );
}
