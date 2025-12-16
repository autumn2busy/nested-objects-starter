"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function OutsetaProfileWidget({ tab }: { tab?: string }) {
    const { isAuthenticated } = useAuth();
    const [outsetaReady, setOutsetaReady] = useState(false);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let attempts = 0;
        const MAX_ATTEMPTS = 50; // 50 * 200ms = 10 seconds

        const initOutseta = () => {
            if (typeof window !== 'undefined' && window.Outseta) {
                setOutsetaReady(true);
                // Force a parse call to render the widget
                if (window.Outseta.c && window.Outseta.c.parse) {
                    window.Outseta.c.parse();
                }
                return true;
            }
            return false;
        };

        // Try immediately
        if (!initOutseta()) {
            // Poll for script availability
            intervalId = setInterval(() => {
                attempts++;
                if (initOutseta() || attempts >= MAX_ATTEMPTS) {
                    clearInterval(intervalId);
                }
            }, 200);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    // Re-trigger parse when tab changes
    useEffect(() => {
        if (outsetaReady && window.Outseta?.c?.parse) {
            // Small delay to ensure DOM is ready for the new tab data
            const timer = setTimeout(() => {
                window.Outseta.c.parse();
            }, 50);
            return () => clearTimeout(timer);
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
