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
    { label: "Dashboard", href: "/inspector-dashboard", icon: LayoutDashboard },
    { label: "Directory", href: "/hiring-firms", icon: Map },
    { label: "Jobs", href: "/jobs", icon: Briefcase },
    { label: "Training", href: "/challenges", icon: BookOpen },
    { label: "Tools", href: "/tools", icon: Wrench },
    { label: "Concierge", href: "/tools/ai-concierge", icon: MessageSquare },
    { label: "Industry News", href: "/inspector-resource-center/industry-news", icon: Newspaper },
    { label: "Firm Intel", href: "/inspector-resource-center/firm-intel", icon: Building2 },
    { label: "Profile", href: "/profile", icon: UserCircle },
];

export const BOTTOM_NAV_ITEMS = [
    { label: "Support", href: "/contact-us", icon: HelpCircle },
];
