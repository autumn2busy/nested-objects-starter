"use client";

import { Card, CardContent } from "@/components/ui/card";
import { OutsetaProfileWidget } from "@/components/outseta/ProfileWidget";
import { useState } from "react";
import { User, CreditCard, Shield, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
    { id: "account", label: "Profile", icon: User },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
    { id: "directory", label: "Directory preview", icon: Eye },
];

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("account");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Member Profile</h1>
                <p className="text-muted-foreground">
                    Control center for your membership.
                </p>
            </div>

            <div className="border-b border-gray-200">
                <nav className="flex gap-8">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <Card>
                <CardContent className="p-0">
                    <OutsetaProfileWidget tab={activeTab} />
                </CardContent>
            </Card>
        </div>
    );
}
