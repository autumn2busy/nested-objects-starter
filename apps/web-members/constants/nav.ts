import {
    LayoutDashboard,
    Map,
    UserCircle,
    MessageSquare,
    Briefcase,
    Settings,
    HelpCircle,
    LogOut,
    ShieldCheck,
    Eye,
    BookOpen,
    Wrench,
} from "lucide-react";

export const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Training", href: "/training", icon: BookOpen },
    { label: "Tools", href: "/tools", icon: Wrench },
    { label: "Directory", href: "/directory", icon: Map },
    { label: "Profile", href: "/profile", icon: UserCircle },
    { label: "Jobs", href: "/jobs", icon: Briefcase },
    { label: "Concierge", href: "/concierge", icon: MessageSquare },
];

export const BOTTOM_NAV_ITEMS = [
    { label: "Support", href: "/contact", icon: HelpCircle },
];
