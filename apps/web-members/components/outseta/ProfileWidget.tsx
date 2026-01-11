"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function OutsetaProfileWidget({ tab, planUid }: { tab?: string; planUid?: string }) {
    const { isAuthenticated } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isParsed, setIsParsed] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;
        if (!containerRef.current) return;

        // Function to attempt parsing
        const parseWidget = () => {
            if (window.Outseta && window.Outseta.c && window.Outseta.c.parse) {
                try {
                    window.Outseta.c.parse(containerRef.current);
                    setIsParsed(true);
                } catch (e) {
                    console.warn("Outseta parse failed, retrying global parse", e);
                    try {
                        window.Outseta.c.parse(); // Fallback
                        setIsParsed(true);
                    } catch (err) {
                        console.error("Outseta global parse failed", err);
                    }
                }
            }
        };

        // 1. Try immediately
        parseWidget();

        // 2. Observer for script loading (if not present yet)
        const observer = new MutationObserver((mutations) => {
            if (window.Outseta?.c?.parse && !isParsed) {
                parseWidget();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // 3. Backup poll (gentle)
        const interval = setInterval(() => {
            if (isParsed) clearInterval(interval);
            else parseWidget();
        }, 500);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, [isAuthenticated, isParsed, tab, planUid]);

    if (!isAuthenticated) return null;

    return (
        <div
            ref={containerRef}
            data-o-profile="1"
            data-tab={tab || "profile"}
            data-plan-uid={planUid}
            data-mode="embed"
            className="w-full min-h-[600px] bg-white relative"
        >
        </div>
    );
}
