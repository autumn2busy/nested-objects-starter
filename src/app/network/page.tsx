"use client";

import { useState } from "react";
import { Search, MapPin, Star, Building2, Filter, Bookmark, ArrowRight, BookmarkCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MOCK_FIRMS = [
    {
        id: 1,
        name: "Seeker Inspections",
        type: "National Firm",
        location: "Florida (Statewide)",
        rating: 4.9,
        jobs: 12,
        tags: ["Residential", "Commercial", "Drone"],
        verified: true,
    },
    {
        id: 2,
        name: "Coastal Claims Corp",
        type: "Regional Carrier",
        location: "Jacksonville, FL",
        rating: 4.7,
        jobs: 5,
        tags: ["High Net Worth", "Complex Claims"],
        verified: true,
    },
    {
        id: 3,
        name: "Axis Adjusters",
        type: "IA Firm",
        location: "Tampa, FL",
        rating: 4.5,
        jobs: 3,
        tags: ["Auto", "Property"],
        verified: false,
    },
];

export default function DirectoryPage() {
    const [saved, setSaved] = useState<number[]>([]);

    const toggleSave = (id: number) => {
        setSaved(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Network Intelligence</h1>
                    <p className="text-muted-foreground mt-1">
                        Access verified firms, carriers, and hiring partners.
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gold-600 border border-gold-500 rounded-lg text-black text-sm font-bold hover:bg-gold-500 transition-colors">
                        <MapPin className="w-4 h-4" /> Map View
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                    type="text"
                    placeholder="Search by firm name, location, or certification requirements..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
                />
            </div>

            {/* Listings */}
            <div className="grid gap-4">
                {MOCK_FIRMS.map((firm) => (
                    <Card key={firm.id} variant="glass" className="hover:border-white/20 transition-all group">
                        <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
                            {/* Logo/Avatar */}
                            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-8 h-8 text-white/20" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            {firm.name}
                                            {firm.verified && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Verified Partner" />}
                                        </h3>
                                        <p className="text-sm text-white/50 flex items-center gap-2 mt-1">
                                            {firm.type} • <span className="flex items-center gap-1 text-white/40"><MapPin className="w-3 h-3" /> {firm.location}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-gold-500 bg-gold-500/10 px-2 py-1 rounded text-xs font-bold">
                                        <Star className="w-3 h-3 fill-current" />
                                        {firm.rating}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {firm.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-white/60">
                                            {tag}
                                        </span>
                                    ))}
                                    {firm.jobs > 0 && (
                                        <span className="px-2 py-1 bg-green-900/20 border border-green-500/20 rounded text-xs text-green-400 font-medium">
                                            {firm.jobs} Open Roles
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex md:flex-col gap-3 md:border-l md:border-white/5 md:pl-6 md:ml-2">
                                <button className="flex-1 md:flex-none px-6 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                                    View Firm
                                </button>
                                <button
                                    onClick={() => toggleSave(firm.id)}
                                    className={cn(
                                        "p-2 rounded-lg border transition-colors flex items-center justify-center",
                                        saved.includes(firm.id)
                                            ? "bg-gold-500/10 border-gold-500/30 text-gold-500"
                                            : "bg-transparent border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    {saved.includes(firm.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
