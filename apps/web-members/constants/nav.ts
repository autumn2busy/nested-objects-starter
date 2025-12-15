import type { LucideIcon } from "lucide-react";
import {
    LayoutDashboard,
    Map,
    UserCircle,
    MessageSquare,
    Briefcase,
    Settings,
    HelpCircle,
    LogOut,
    Shield,
    Eye,
} from "lucide-react";

export type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    requiresAuth?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requiresAuth: true },
    { label: "Directory", href: "/directory", icon: Map, requiresAuth: true },
    { label: "Profile", href: "/profile", icon: UserCircle, requiresAuth: true },
    { label: "Security", href: "/security", icon: Shield, requiresAuth: true },
    { label: "Directory Preview", href: "/directory-preview", icon: Eye, requiresAuth: true },
    { label: "Concierge", href: "/concierge", icon: MessageSquare, requiresAuth: true },
    { label: "Jobs", href: "/jobs", icon: Briefcase, requiresAuth: true },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
    { label: "Settings", href: "/settings", icon: Settings, requiresAuth: true },
    { label: "Support", href: "/support", icon: HelpCircle, requiresAuth: true },
    { label: "Sign Out", href: "#logout", icon: LogOut, requiresAuth: true },
];
