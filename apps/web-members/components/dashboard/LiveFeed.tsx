import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export function LiveFeed() {
    const activities = [
        {
            id: 1,
            text: "New job posted: Residential Inspector in Atlanta, GA",
            time: "2 hours ago",
            type: "job",
        },
        {
            id: 2,
            text: "Peachtree Field Services viewed your profile",
            time: "4 hours ago",
            type: "view",
        },
        {
            id: 3,
            text: "System: Your trust score increased to 98",
            time: "1 day ago",
            type: "system",
        },
        {
            id: 4,
            text: "New resource added: Field Inspection 101 Guide",
            time: "2 days ago",
            type: "resource",
        },
    ];

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-copper" />
                    Live Intelligence
                </CardTitle>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    Real-time
                </span>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {activities.map((activity) => (
                        <div key={activity.id} className="relative pl-6 border-l-2 border-slate-100 last:border-0">
                            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-white" />
                            <p className="text-sm font-medium text-slate-800">{activity.text}</p>
                            <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
