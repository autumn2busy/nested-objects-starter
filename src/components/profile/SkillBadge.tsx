import { cn } from "@/lib/utils";

interface BadgeProps {
    label: string;
    level?: "Basic" | "Advanced" | "Expert";
    verified?: boolean;
}

export function SkillBadge({ label, level, verified }: BadgeProps) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-default group">
            <span className="text-sm font-medium text-white/90">{label}</span>
            {level && (
                <span className={cn(
                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                    level === "Expert" ? "bg-gold-500/20 text-gold-500" : "bg-white/10 text-white/60"
                )}>
                    {level}
                </span>
            )}
        </div>
    )
}
