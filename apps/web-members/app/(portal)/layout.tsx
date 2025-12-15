"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/components/auth-provider";

export default function PortalLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { isAuthenticated, isLoading, login } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-600">
                Checking your membership access…
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-gray-900">Sign in to access your hub</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        The dashboard and profile tools are available to authenticated members.
                    </p>
                    <div className="mt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={login}
                            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
                        >
                            Login to continue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <div className="hidden md:block w-64 flex-shrink-0">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
