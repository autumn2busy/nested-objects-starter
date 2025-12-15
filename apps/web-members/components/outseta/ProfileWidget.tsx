"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

import { useAuth } from "../auth-provider";

type OutsetaProfileWidgetProps = {
    tab?: string;
};

export function OutsetaProfileWidget({ tab = "account" }: OutsetaProfileWidgetProps) {
    const { isAuthenticated } = useAuth();
    const [outsetaReady, setOutsetaReady] = useState(false);
    const attemptsRef = useRef(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setOutsetaReady(false);
            return;
        }

        attemptsRef.current = 0;
        let cancelled = false;

        const ensureOutseta = () => {
            if (cancelled || typeof window === "undefined") return;

            const Outseta = (window as any).Outseta;
            if (Outseta?.c?.parse) {
                setOutsetaReady(true);
                Outseta.c.parse();
                return;
            }

            if (attemptsRef.current < 10) {
                attemptsRef.current += 1;
                setTimeout(ensureOutseta, 150);
            }
        };

        ensureOutseta();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated || !outsetaReady) return;

        const Outseta = (window as any).Outseta;
        if (Outseta?.c?.parse) {
            Outseta.c.parse();
        }
    }, [isAuthenticated, outsetaReady, tab]);

    if (!isAuthenticated) {
        return (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white/80 p-6 text-center text-sm text-gray-600">
                Sign in to manage your profile.
            </div>
        );
    }

    return (
        <>
            <Script
                id="outseta-profile-inline-loader"
                src="https://cdn.outseta.com/outseta.min.js"
                strategy="afterInteractive"
                data-options="o_options"
                onLoad={() => {
                    if (typeof window !== "undefined" && (window as any).Outseta?.c?.parse) {
                        (window as any).Outseta.c.parse();
                    }
                }}
            />
            {outsetaReady ? (
                <div
                    ref={containerRef}
                    data-o-profile="1"
                    data-tab={tab}
                    data-mode="embed"
                    className="w-full min-h-[600px]"
                />
            ) : (
                <div className="flex h-[320px] items-center justify-center rounded-lg border border-gray-200 bg-white/80 text-sm text-gray-500">
                    Loading your membership profile…
                </div>
            )}
        </>
    );
}
