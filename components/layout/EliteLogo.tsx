"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface EliteLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { box: 28, elite: "text-[15px]", games: "text-[7px]", gap: "gap-2" },
  md: { box: 34, elite: "text-[19px]", games: "text-[8px]", gap: "gap-2.5" },
  lg: { box: 42, elite: "text-[24px]", games: "text-[10px]", gap: "gap-3" },
};

export function EliteLogo({ className, size = "md" }: EliteLogoProps) {
  const { box, elite, games, gap } = SIZE_MAP[size];

  return (
    <Link
      href="/"
      className={cn("flex items-center group no-select select-none", gap, className)}
      aria-label="Elite Games — Home"
    >
      {/* Icon mark */}
      <svg
        width={box}
        height={box}
        viewBox="0 0 42 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="flex-shrink-0"
      >
        {/* Background rounded square */}
        <rect width="42" height="42" rx="9" fill="url(#lg1)" />

        {/* Subtle inner shine */}
        <rect width="42" height="21" rx="9" fill="url(#lg2)" opacity="0.18" />

        {/* Bold E letterform */}
        <path
          d="M10 9.5h22v5.5H16.5V19H23v5h-6.5v4.5H32V34H10V9.5z"
          fill="white"
        />

        {/* Thin accent bar on right edge */}
        <rect x="31" y="9.5" width="1.5" height="25" rx="0.75" fill="white" opacity="0.3" />

        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-black text-white group-hover:text-blue-400 transition-colors duration-150",
            elite
          )}
          style={{ letterSpacing: "-0.02em" }}
        >
          ELITE
        </span>
        <span
          className={cn(
            "font-medium tracking-[0.25em] text-[#6b7280] uppercase group-hover:text-[#9ca3af] transition-colors duration-150",
            games
          )}
        >
          GAMES
        </span>
      </div>
    </Link>
  );
}
