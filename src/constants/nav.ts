import { LayoutDashboard, User, MessageSquare, Globe, BookOpen, ShoppingBag, Settings, LogOut } from "lucide-react";

export const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Profile", href: "/profile", icon: User },
    { label: "Concierge", href: "/concierge", icon: MessageSquare },
    { label: "Network", href: "/network", icon: Globe },
    { label: "Training", href: "/learn", icon: BookOpen },
    { label: "Store", href: "/store", icon: ShoppingBag },
];

export const BOTTOM_NAV_ITEMS = [
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Log Out", href: "/", icon: LogOut },
];
