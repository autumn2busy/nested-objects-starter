"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function OutsetaProfileWidget({ tab }: { tab?: string }) {
    const { isAuthenticated } = useAuth();
    const [outsetaReady, setOutsetaReady] = useState(false);

    useEffect(() => {
        let attempts = 0;
        let timeoutId: NodeJS.Timeout;

        const checkOutseta = () => {
            if (typeof window !== 'undefined' && window.Outseta) {
                setOutsetaReady(true);
                // Trigger parse if available to render widget immediately
                if (window.Outseta.c && window.Outseta.c.parse) {
                    window.Outseta.c.parse();
                }
            } else if (attempts < 15) { // 15 attempts * 150ms = 2.25s
                attempts++;
                timeoutId = setTimeout(checkOutseta, 150);
            }
        };

        checkOutseta();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []); // Run once on mount to start checking

    // Re-trigger parse when tab changes if already ready
    useEffect(() => {
        if (outsetaReady && window.Outseta?.c?.parse) {
            window.Outseta.c.parse();
        }
    }, [outsetaReady, tab]);

    if (!isAuthenticated) return null;
    if (!outsetaReady) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl animate-pulse">
                <span className="text-slate-400 text-sm">Loading secure profile...</span>
            </div>
        );
    }

    return (
        <div
            data-o-profile="1"
            data-tab={tab || "profile"}
            data-mode="embed"
            className="w-full min-h-[600px] bg-white"
        />
    );
}
