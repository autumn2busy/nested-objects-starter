import Link from "next/link";
import { Search, FileText, UserCircle, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIONS = [
    {
        label: "Find Firms",
        href: "/hiring-firms",
        icon: Search,
        description: "Research firms and their requirements",
        color: "bg-blue-50 text-blue-600",
    },
    {
        label: "Job Board",
        href: "/jobs",
        icon: FileText,
        description: "Explore available listings",
        color: "bg-orange-50 text-orange-600",
    },
    {
        label: "Update Profile",
        href: "/profile",
        icon: UserCircle,
        description: "Manage your private profile",
        color: "bg-purple-50 text-purple-600",
    },
    {
        label: "Tools Preview",
        href: "/tools",
        icon: Wrench,
        description: "See planned workflows",
        color: "bg-indigo-50 text-indigo-600",
    },
];

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                        >
                            <div className={`p-2 rounded-md ${action.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-slate-900">{action.label}</h3>
                                <p className="text-xs text-slate-500">{action.description}</p>
                            </div>
                        </Link>
                    );
                })}
            </CardContent>
        </Card>
    );
}
