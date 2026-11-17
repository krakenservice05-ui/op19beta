"use client";

import Image from "next/image";
import { Platform } from "@/types";
import { cn } from "@/lib/utils";

interface PlatformScrollerProps {
  platforms: Platform[];
}

const ICON_SIZES: Record<string, { w: number; h: number }> = {
  steam:       { w: 130, h: 42 },
  xbox:        { w: 52,  h: 52 },
  playstation: { w: 48,  h: 48 },
  nintendo:    { w: 160, h: 48 },
  gog:         { w: 56,  h: 56 },
  rockstar:    { w: 56,  h: 56 },
  epic:        { w: 52,  h: 56 },
  "ea-play":   { w: 42,  h: 42 },
};

function PlatformTile({ platform }: { platform: Platform }) {
  const size = ICON_SIZES[platform.id] ?? { w: 110, h: 44 };
  const isEaPlay = platform.id === "ea-play";

  return (
    // Non-interactive — purely decorative/informational
    <div
      className={cn(
        "relative flex-shrink-0 flex items-center justify-center",
        "rounded-2xl overflow-hidden select-none",
        "w-[200px] h-[120px]",
        "transition-all duration-300",
        "hover:scale-[1.04] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]",
        "hover:brightness-110 cursor-default"
      )}
      style={{ background: platform.gradient }}
      role="img"
      aria-label={platform.name}
    >
      <div className="relative z-10 flex items-center justify-center gap-3 px-5 py-4">
        <Image
          src={platform.icon}
          alt={platform.name}
          width={size.w}
          height={size.h}
          className="object-contain transition-transform duration-300"
          style={{ width: size.w, height: size.h, maxWidth: "100%", maxHeight: "62px" }}
          unoptimized
        />
        {isEaPlay && (
          <span
            className="font-black text-white leading-none"
            style={{ fontSize: "34px", letterSpacing: "-1px" }}
            aria-hidden="true"
          >
            Play
          </span>
        )}
      </div>
      {/* Shine overlay */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 55%)" }}
      />
    </div>
  );
}

export function PlatformScroller({ platforms }: PlatformScrollerProps) {
  const tripled = [...platforms, ...platforms, ...platforms];
  const durationSeconds = platforms.length * 8;

  return (
    <div
      className="relative w-full overflow-hidden py-2"
      role="region"
      aria-label="Supported gaming platforms"
    >
      {/* Edge fades */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #0a0a0f, transparent)" }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #0a0a0f, transparent)" }}
      />

      {/* Scrolling track */}
      <div
        className="flex items-center gap-4"
        style={{
          width: "max-content",
          animation: `platformScroll ${durationSeconds}s linear infinite`,
          willChange: "transform",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.animationPlayState = "paused";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.animationPlayState = "running";
        }}
      >
        {tripled.map((platform, i) => (
          <PlatformTile key={`${platform.id}-${i}`} platform={platform} />
        ))}
      </div>

      <style>{`
        @keyframes platformScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-100% / 3)); }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="platformScroll"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
