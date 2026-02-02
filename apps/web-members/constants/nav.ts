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
    Newspaper,
    Building2,
} from "lucide-react";

export const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Directory", href: "/directory", icon: Map },
    { label: "Jobs", href: "/jobs", icon: Briefcase },
    { label: "Training", href: "/training", icon: BookOpen },
    { label: "Tools", href: "/tools", icon: Wrench },
    { label: "Concierge", href: "/concierge", icon: MessageSquare },
    { label: "Industry News", href: "/resources/industry-news", icon: Newspaper },
    { label: "Firm Intel", href: "/resources/firm-intel", icon: Building2 },
    { label: "Profile", href: "/profile", icon: UserCircle },
];

export const BOTTOM_NAV_ITEMS = [
    { label: "Support", href: "/contact", icon: HelpCircle },
];
