import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "glass" | "outline"
}

export function Card({ className, variant = "default", ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border transition-all duration-300",
                variant === "default" && "bg-white border-gray-200 shadow-sm",
                variant === "glass" && "bg-white/5 backdrop-blur-md border-white/10",
                variant === "outline" && "bg-transparent border-dashed border-gray-300",
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pt-0", className)} {...props} />;
}
