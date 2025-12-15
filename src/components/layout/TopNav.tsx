"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TOP_NAV_LINKS = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Directory", href: "/network" },
    { label: "Jobs", href: "/jobs" },
    { label: "AI tools", href: "/concierge" },
    { label: "Resources", href: "/resources" },
    { label: "Membership", href: "/membership" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
];

export function TopNav() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <nav className="container flex h-16 items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <img src="/logo.png" alt="Nested Objects" className="h-8 w-auto object-contain" />
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-6">
                    {TOP_NAV_LINKS.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    isActive
                                        ? "text-primary"
                                        : "text-gray-600"
                                )}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center space-x-4">
                    <button className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                        Login
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors">
                        Join free
                    </button>
                </div>
            </nav>
        </header>
    );
}
