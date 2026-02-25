"use client";

import { Sidebar } from "@/components/Sidebar";
import { ContentProtection } from "@/components/ContentProtection";

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <ContentProtection />
            <div className="hidden md:block w-64 flex-shrink-0">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
