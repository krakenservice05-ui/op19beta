"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "discount" | "new" | "trending" | "platform" | "region" | "edition" | "default";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-semibold text-xs rounded px-1.5 py-0.5 tracking-wide no-select",
        {
          "bg-red-500 text-white": variant === "discount",
          "bg-blue-500 text-white": variant === "new",
          "bg-purple-500 text-white": variant === "trending",
      "bg-[#1b2838] text-[#9ca3af] border border-[#2a2a3a]": variant === "platform",
          "bg-[#1e1e2e] text-[#9ca3af] border border-[#2a2a3a]":
            variant === "region" || variant === "edition" || variant === "default",
        },
        className
      )}
    >
      {children}
    </span>
  );
}

interface DiscountBadgeProps {
  discount: number;
  className?: string;
}

export function DiscountBadge({ discount, className }: DiscountBadgeProps) {
  if (!discount || discount <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center bg-red-500 text-white font-bold text-xs rounded px-1.5 py-0.5 tracking-wide no-select",
        className
      )}
    >
      -{discount}%
    </span>
  );
}
