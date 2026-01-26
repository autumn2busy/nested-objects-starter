"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth-provider";

export function OutsetaProfileWidget({ tab, planUid, accessToken }: { tab?: string; planUid?: string; accessToken?: string | null }) {
    const { isAuthenticated } = useAuth();
    const [outsetaReady, setOutsetaReady] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let attempts = 0;
        const MAX_ATTEMPTS = 50;

        const initOutseta = () => {
            if (typeof window !== 'undefined' && window.Outseta) {
                // If we have an explicit token, ensure it is set before parsing
                if (accessToken && window.Outseta.setAccessToken) {
                    window.Outseta.setAccessToken(accessToken);
                }

                setOutsetaReady(true);
                // Only parse if we have the container
                if (containerRef.current && window.Outseta.c && window.Outseta.c.parse) {
                    try {
                        window.Outseta.c.parse(containerRef.current);
                    } catch (e) {
                        // Fallback global parse
                        window.Outseta.c.parse();
                    }
                }
                return true;
            }
            return false;
        };

        // Attempt sequence
        initOutseta();

        const intervalId = setInterval(() => {
            attempts++;
            if (initOutseta() || attempts >= MAX_ATTEMPTS) {
                clearInterval(intervalId);
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, [accessToken]); // dependency on accessToken to re-init if it changes logic

    // Re-trigger parse when tab or readiness changes
    useEffect(() => {
        if (outsetaReady && window.Outseta?.c?.parse) {
            // Multi-stage retry to ensure iframe injection happens even if React is slow to commit
            const timers = [0, 100, 500, 1000].map(delay =>
                setTimeout(() => {
                    if (containerRef.current) {
                        try {
                            // Some versions of Outseta script accept a node, otherwise global
                            window.Outseta.c.parse(containerRef.current);
                        } catch (e) {
                            window.Outseta.c.parse();
                        }
                    }
                }, delay)
            );
            return () => timers.forEach(clearTimeout);
        }
    }, [outsetaReady, tab]);

    if (!isAuthenticated) return null;

    return (
        <div
            ref={containerRef}
            data-o-profile="1"
            data-tab={tab || "profile"}
            data-plan-uid={planUid}
            data-mode="embed"
            className="w-full min-h-[600px] bg-white relative" // relative for positioning if needed
        >
            {/* Optional loading state if needed within the container, 
                 but Outseta usually clears content. */}
        </div>
    );
}
