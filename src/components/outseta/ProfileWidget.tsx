"use client";

import { useEffect } from "react";

export function OutsetaProfileWidget({ tab = "account" }: { tab?: string }) {
    useEffect(() => {
        // Ensure Outseta script is loaded before rendering widget
        if (typeof window !== 'undefined' && (window as any).Outseta) {
            console.log('Outseta loaded successfully');
        }
    }, []);

    return (
        <div
            data-o-profile="1"
            data-tab={tab}
            data-mode="embed"
            className="w-full min-h-[600px]"
        />
    );
}
