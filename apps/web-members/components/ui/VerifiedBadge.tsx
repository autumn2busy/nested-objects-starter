import { ShieldCheck } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type VerifiedBadgeProps = {
    date?: string | null;
    className?: string;
};

export function VerifiedBadge({ date, className = "" }: VerifiedBadgeProps) {
    if (!date) return null;

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200 cursor-help ${className}`}>
                        <ShieldCheck className="h-3.5 w-3.5 fill-emerald-500/20" />
                        <span>Verified</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-slate-900 text-slate-50 border-slate-700">
                    <p className="font-semibold mb-1">Identity Verified</p>
                    <p className="text-xs text-slate-300">
                        This member has submitted valid government ID and proof of insurance (COI) verified on {new Date(date).toLocaleDateString()}.
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
