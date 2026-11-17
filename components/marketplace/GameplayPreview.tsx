"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ExternalLink, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameplayPreviewProps {
  youtubeId: string;
  gameSlug: string;
  gameTitle: string;
  tagline: string;
  description: string;
  platform: string;
  price: string;
  thumbnailImage?: string;
  accentColor?: string;
  publisherLabel?: string;        // shown top-right of thumbnail (e.g. "EA SPORTS")
}

export function GameplayPreview({
  youtubeId,
  gameSlug,
  gameTitle,
  tagline,
  description,
  platform,
  price,
  thumbnailImage,
  accentColor = "#f59e0b",
  publisherLabel,
}: GameplayPreviewProps) {
  const [playing, setPlaying] = useState(false);

  // YouTube thumbnail as fallback
  const thumbUrl =
    thumbnailImage ?? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  return (
    <section
      className="relative bg-[#0e0e18] border-y border-[#1e1e2a] overflow-hidden"
      aria-label={`${gameTitle} gameplay preview`}
    >
      {/* Subtle background glow behind video */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${accentColor} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-14 lg:py-20">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="h-5 w-1 rounded-full"
            style={{ background: accentColor }}
            aria-hidden="true"
          />
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: accentColor }}
          >
            Gameplay Preview
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 xl:gap-16 items-center">

          {/* ── Video player ─────────────────────────────── */}
          <div className="order-1 lg:order-1">
            <div
              className={cn(
                "relative w-full rounded-2xl overflow-hidden border border-[#2a2a3a] shadow-2xl group",
                "bg-[#111118]"
              )}
              style={{ aspectRatio: "16/9" }}
            >
              {!playing ? (
                /* Thumbnail + play button */
                <>
                  <Image
                    src={thumbUrl}
                    alt={`${gameTitle} gameplay trailer`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    unoptimized={!thumbnailImage}
                    quality={85}
                    priority
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  {/* Publisher label — top right */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                    <span className="text-xs font-bold text-white/70 tracking-wide">
                      {publisherLabel ?? "OFFICIAL TRAILER"}
                    </span>
                  </div>
                  {/* Play button */}
                  <button
                    onClick={() => setPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center group/btn"
                    aria-label={`Play ${gameTitle} gameplay trailer`}
                  >
                    <div
                      className={cn(
                        "relative flex items-center justify-center w-20 h-20 rounded-full",
                        "bg-white/10 backdrop-blur-sm border-2 border-white/30",
                        "transition-all duration-300",
                        "group-hover/btn:scale-110 group-hover/btn:bg-white/20 group-hover/btn:border-white/60",
                        "shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                      )}
                    >
                      {/* Outer pulse ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
                      <Play
                        size={28}
                        className="text-white ml-1.5"
                        fill="white"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                  {/* Duration / label bar at bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs text-white/60 font-medium">
                      ▶ Official Gameplay Trailer · YouTube
                    </p>
                  </div>
                </>
              ) : (
                /* Embedded YouTube iframe */
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&color=white`}
                  title={`${gameTitle} Official Gameplay Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              )}
            </div>

            {/* Video label row */}
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-sm text-[#6b7280]">
                <span className="text-white font-medium">{gameTitle}</span>
                {" "}— Official Gameplay Reveal
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#4b5563] hover:text-[#9ca3af] transition-colors"
                aria-label="Watch on YouTube"
              >
                <ExternalLink size={12} />
                Watch on YouTube
              </a>
            </div>
          </div>

          {/* ── Game info panel ───────────────────────────── */}
          <div className="order-2 lg:order-2 flex flex-col gap-5">
            {/* Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: `${accentColor}20`,
                  color: accentColor,
                  border: `1px solid ${accentColor}40`,
                }}
              >
                NOW AVAILABLE
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1c1c26] text-[#9ca3af] border border-[#2a2a3a]">
                {platform}
              </span>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                {gameTitle}
              </h2>
              <p
                className="text-base font-semibold mt-1"
                style={{ color: accentColor }}
              >
                {tagline}
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-[#9ca3af] leading-relaxed">
              {description}
            </p>

            {/* Features list */}
            <ul className="space-y-2.5">
              {[
                "Open-world Leonida — the most detailed map ever built",
                "Play as Jason & Lucia across a stunning crime epic",
                "Next-generation AI, physics, and world simulation",
                "Instant digital delivery to your email",
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-sm">
                  <span
                    className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black"
                    style={{ background: `${accentColor}25`, color: accentColor }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-[#9ca3af]">{feat}</span>
                </li>
              ))}
            </ul>

            {/* Price + CTA */}
            <div className="border-t border-[#2a2a3a] pt-5 flex flex-col gap-3">
              <div>
                <p className="text-xs text-[#6b7280] mb-1">Starting from</p>
                <p className="text-3xl font-black text-white">{price}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link
                  href={`/games/${gameSlug}`}
                  className="flex items-center justify-center gap-2 flex-1 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all"
                  style={{ background: accentColor }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.filter = "brightness(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.filter = "brightness(1)")
                  }
                >
                  <ShoppingCart size={16} />
                  Buy Now
                </Link>
                <Link
                  href={`/games/${gameSlug}`}
                  className="flex items-center justify-center gap-2 flex-1 px-5 py-3 rounded-xl font-bold text-sm text-white bg-[#1c1c26] border border-[#2a2a3a] hover:border-[#353548] hover:bg-[#222230] transition-all"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
