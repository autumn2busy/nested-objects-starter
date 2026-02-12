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

                {isAuthenticated && user && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                        <div className="h-9 w-9 bg-white/10 rounded-full flex items-center justify-center text-white font-medium">
                            {localUser?.name?.charAt(0) || 'M'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                                {localUser?.name}
                            </div>
                            <div className="text-xs text-white/40 truncate">
                                Member
                            </div>
                        </div>
                        <button
                            onClick={() => (window as any).Outseta?.auth?.logout()}
                            className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
