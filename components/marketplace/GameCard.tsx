"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Game } from "@/types";
import { formatPrice, getLowestPrice, getBestDiscount } from "@/lib/utils-game";
import { DiscountBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: Game;
  className?: string;
  compact?: boolean;
}

function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    "PC / Steam":           { label: "Steam", bg: "#1b2838", text: "#c7d5e0" },
    "PC / EA App":          { label: "EA",    bg: "#ff4500", text: "#fff" },
    "PC / Epic":            { label: "Epic",  bg: "#2d2d2d", text: "#fff" },
    "PC / Microsoft Store": { label: "PC",    bg: "#0078d4", text: "#fff" },
    "PlayStation 5":        { label: "PS5",   bg: "#003087", text: "#fff" },
    "PlayStation 4":        { label: "PS4",   bg: "#003087", text: "#fff" },
    "Xbox Series X|S":      { label: "XBX",   bg: "#107c10", text: "#fff" },
  };
  const info = map[platform] ?? { label: "PC", bg: "#1e3a5f", text: "#fff" };
  return (
    <span
      className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
      style={{ background: info.bg, color: info.text }}
      aria-label={platform}
    >
      {info.label}
    </span>
  );
}

function resolveCardImage(game: Game): { src: string; isLandscape: boolean } {
  if (game.coverImage && !game.coverImage.endsWith("placeholder.svg")) {
    return { src: game.coverImage, isLandscape: false };
  }
  if (game.heroImage && !game.heroImage.endsWith("placeholder.svg")) {
    return { src: game.heroImage, isLandscape: true };
  }
  return { src: "/images/game-art/placeholder.svg", isLandscape: false };
}

// Trailer iframe shown on hover.
// Uses youtube-nocookie.com for privacy + minimal UI.
// autoplay=1 mute=1 so it starts silently without user gesture issues.
// controls=0 disableKB=1 for a clean cinematic preview feel.
function TrailerOverlay({ youtubeId, visible }: { youtubeId: string; visible: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-hidden="true"
    >
      {visible && (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&disablekb=1&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
          allow="autoplay; encrypted-media"
          className="w-full h-full"
          style={{ border: "none", pointerEvents: "none" }}
          title="Trailer preview"
        />
      )}
      {/* Gradient scrim so badges remain readable over the video */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      {/* Small TRAILER label */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
        <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow">
          TRAILER
        </span>
      </div>
    </div>
  );
}

export function GameCard({ game, className, compact = false }: GameCardProps) {
  const lowestPrice = getLowestPrice(game);
  const bestDiscount = getBestDiscount(game);
  const defaultVariant = game.variants[0];

  const { src: imgSrc, isLandscape } = resolveCardImage(game);
  const [imgError, setImgError] = useState(false);

  // Trailer hover state — only activate when the game has a YouTube ID
  const hasTrailer = !!game.trailerYouTubeId;
  const [trailerActive, setTrailerActive] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delay activation by 600ms so quick mouse-overs don't flash the video
  const handleMouseEnter = useCallback(() => {
    if (!hasTrailer) return;
    hoverTimer.current = setTimeout(() => setTrailerActive(true), 600);
  }, [hasTrailer]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setTrailerActive(false);
  }, []);

  if (!defaultVariant) return null;

  return (
    <article
      className={cn(
        "game-card group relative bg-[#16161e] border border-[#2a2a3a] rounded-xl overflow-hidden flex flex-col",
        "hover:border-[#353548]",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cover image + trailer area — always 3:4 aspect */}
      <Link
        href={`/games/${game.slug}`}
        className="relative block overflow-hidden flex-shrink-0"
        style={{ aspectRatio: "3/4" }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {/* Static cover image */}
        <Image
          src={imgError ? "/images/game-art/placeholder.svg" : imgSrc}
          alt={game.title}
          fill
          className={cn(
            "object-cover transition-all duration-300",
            trailerActive ? "scale-105 opacity-0" : "group-hover:scale-105 opacity-100"
          )}
          style={{ objectPosition: isLandscape ? "center top" : "center center" }}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          onError={() => setImgError(true)}
        />

        {/* Trailer overlay — mounts only while hovered after delay */}
        {hasTrailer && (
          <TrailerOverlay
            youtubeId={game.trailerYouTubeId!}
            visible={trailerActive}
          />
        )}

        {/* Badges — top left (always above trailer) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-30">
          {game.isNew && (
            <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">
              NEW
            </span>
          )}
          {game.isTrending && !game.isNew && (
            <span className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">
              TRENDING
            </span>
          )}
        </div>

        {/* Discount — top right */}
        {bestDiscount > 0 && (
          <div className="absolute top-2 right-2 z-30">
            <DiscountBadge discount={bestDiscount} />
          </div>
        )}


        {/* Static gradient scrim (hidden when trailer active) */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none transition-opacity duration-300",
            trailerActive ? "opacity-0" : "opacity-100"
          )}
        />
      </Link>

      {/* Card body */}
      <div className={cn("flex flex-col flex-1 p-3.5", compact && "p-3")}>
        <Link
          href={`/games/${game.slug}`}
          className="text-sm font-semibold text-white hover:text-blue-400 transition-colors line-clamp-2 leading-snug"
        >
          {game.title}
        </Link>

        <div className="flex items-center gap-1.5 mt-auto pt-2">
          <span className="text-xs text-[#6b7280]">{defaultVariant.region}</span>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex flex-col leading-tight">
            {defaultVariant.originalPrice && defaultVariant.originalPrice > lowestPrice && (
              <span className="text-[11px] text-[#4b5563] line-through">
                {formatPrice(defaultVariant.originalPrice)}
              </span>
            )}
            <span className="text-sm font-bold text-white">
              from {formatPrice(lowestPrice)}
            </span>
          </div>
          <Link
            href={`/games/${game.slug}`}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all flex-shrink-0"
            aria-label={`Buy ${game.title}`}
          >
            <ShoppingCart size={14} className="text-white" />
          </Link>
        </div>
      </div>
    </article>
  );
}
