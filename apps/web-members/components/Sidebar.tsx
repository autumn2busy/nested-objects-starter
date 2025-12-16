"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from "@/constants/nav";

export function Sidebar() {
    const pathname = usePathname();
    const { isAuthenticated, user } = useAuth();
    // Helper to safely get display name
    const localUser = user ? {
        name: (user.Name || user.name || user.email || 'Member').split(' ')[0]
    } : null;

    return (
        <aside className="w-64 h-screen border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-40 hidden md:flex">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <span className="font-bold text-lg tracking-tight text-white">
                    Nested<span className="text-white/40">Objects</span>
                </span>
            </div>

            {/* Main Nav */}
            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    // Filter out auth-only items if not logged in
                    if (!isAuthenticated && ['/profile', '/security', '/directory-preview'].includes(item.href)) {
                        return null;
                    }

                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative overflow-hidden",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-white/50 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold-500 rounded-r-full shadow-[0_0_12px_rgba(234,179,8,0.5)]" />
                            )}
                            <Icon className={cn("w-4 h-4", isActive ? "text-gold-500" : "group-hover:text-white")} />
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-white/5">

                {BOTTOM_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-white transition-colors"
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </div>
        </aside>
    );
}
