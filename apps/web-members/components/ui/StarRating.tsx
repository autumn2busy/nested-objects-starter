import { Star, StarHalf } from "lucide-react";

type StarRatingProps = {
    rating: number;      // 0.0 to 5.0
    count?: number;      // Number of reviews
    size?: "sm" | "md";  // Icon size
    showCount?: boolean; // Whether to show (120) text
    className?: string;
};

export function StarRating({
    rating,
    count,
    size = "sm",
    showCount = true,
    className = ""
}: StarRatingProps) {
    // Clamp rating between 0 and 5
    const validRating = Math.max(0, Math.min(5, rating));

    // Icon sizing
    const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

    // Render logic for 5 stars
    const renderStars = () => {
        const stars = [];

        for (let i = 1; i <= 5; i++) {
            const isFull = validRating >= i;
            const isHalf = validRating >= i - 0.5 && validRating < i;

            if (isFull) {
                stars.push(
                    <Star key={i} className={`${iconClass} fill-amber-400 text-amber-500`} />
                );
            } else if (isHalf) {
                stars.push(
                    <div key={i} className="relative">
                        {/* Empty background star */}
                        <Star className={`${iconClass} text-slate-200`} />
                        {/* Half filled overlay */}
                        <div className="absolute inset-0 overflow-hidden w-[50%]">
                            <Star className={`${iconClass} fill-amber-400 text-amber-500`} />
                        </div>
                    </div>
                );
            } else {
                stars.push(
                    <Star key={i} className={`${iconClass} text-slate-200`} />
                );
            }
        }
        return stars;
    };

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <div className="flex items-center gap-0.5" aria-label={`Rated ${validRating} out of 5 stars`}>
                {renderStars()}
            </div>
            {(count !== undefined && showCount) && (
                <span className="text-xs text-slate-500 font-medium">
                    ({count})
                </span>
            )}
        </div>
    );
}
