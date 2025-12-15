"use client";

import { useEffect, useRef } from "react";

interface PlanChangeModalProps {
    open: boolean;
    url: string | null;
    planName?: string | null;
    onClose: () => void;
}

export function PlanChangeModal({ open, url, planName, onClose }: PlanChangeModalProps) {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;

        previousFocusRef.current = document.activeElement as HTMLElement | null;

        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        const focusableArray = focusable ? Array.from(focusable) : [];

        if (focusableArray[0]) {
            focusableArray[0].focus();
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key === "Tab" && focusableArray.length > 0) {
                const first = focusableArray[0];
                const last = focusableArray[focusableArray.length - 1];
                const active = document.activeElement as HTMLElement | null;

                if (!event.shiftKey && active === last) {
                    event.preventDefault();
                    first.focus();
                }

                if (event.shiftKey && active === first) {
                    event.preventDefault();
                    last.focus();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        };
    }, [open, onClose]);

    if (!open || !url) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Change membership plan"
        >
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div
                ref={dialogRef}
                className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-4 shadow-2xl shadow-black/30"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Plan change</p>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {planName ? `Switch to ${planName}` : "Update your plan"}
                        </h2>
                        <p className="text-sm text-gray-600">
                            Complete the secure Outseta checkout without leaving the hub.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                        aria-label="Close plan change modal"
                    >
                        Close
                    </button>
                </div>

                <div className="mt-4 aspect-[16/10] w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <iframe
                        src={url}
                        title={planName ? `${planName} plan change` : "Plan change"}
                        className="h-full w-full border-0"
                    />
                </div>
            </div>
        </div>
    );
}
