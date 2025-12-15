import {
    LayoutDashboard,
    Map,
    UserCircle,
    MessageSquare,
    Briefcase,
    Settings,
    HelpCircle,
    LogOut,
} from "lucide-react";

export const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Directory", href: "/directory", icon: Map },
    { label: "Profile", href: "/profile", icon: UserCircle },
    { label: "Concierge", href: "/concierge", icon: MessageSquare },
    { label: "Jobs", href: "/jobs", icon: Briefcase },
];

export const BOTTOM_NAV_ITEMS = [
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Support", href: "/support", icon: HelpCircle },
    { label: "Sign Out", href: "/auth/signout", icon: LogOut },
];
