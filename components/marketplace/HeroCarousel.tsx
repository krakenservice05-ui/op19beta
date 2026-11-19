"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroSlide } from "@/types";
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (animating || index === current) return;
      setAnimating(true);
      setCurrent(index);
      setTimeout(() => setAnimating(false), 500);
    },
    [animating, current]
  );

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, slides.length, goTo]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, slides.length, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next]);

  const slide = slides[current];

  return (
    <section
      className="relative w-full overflow-hidden bg-[#0a0a0f] cursor-pointer"
      style={{ height: "clamp(320px, 42vw, 540px)" }}
      aria-label="Featured games carousel"
      aria-roledescription="carousel"
    >
      {/* ── Slide backgrounds ──────────────────────────── */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={i !== current}
        >
          <Link href={s.ctaLink} className="absolute inset-0 z-0" tabIndex={-1} aria-hidden="true" />
          {s.containImage ? (
            /* Small image — split layout: styled bg + image right + text left */
            <>
              {/* Styled background */}
              <div
                className="absolute inset-0"
                style={{ background: s.containBg ?? "linear-gradient(135deg, #0d1f14 0%, #0a2a1a 100%)" }}
              />
              {/* Subtle field texture lines */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)",
                }}
              />
              {/* Image — right side, 60% width, natural aspect */}
              <div className="absolute right-0 top-0 bottom-0 w-[55%] flex items-center justify-end pr-6 lg:pr-10">
                <Image
                  src={s.heroImage}
                  alt={s.title}
                  width={460}
                  height={215}
                  className="w-auto object-contain drop-shadow-2xl"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "75%",
                    imageRendering: "auto",
                    filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.6))",
                  }}
                  priority={i === 0}
                  quality={100}
                />
              </div>
              {/* Right-side fade so image blends */}
              <div className="absolute inset-0"
                style={{
                  background: "linear-gradient(to right, rgba(10,42,26,1) 0%, rgba(10,42,26,0.8) 30%, rgba(10,42,26,0.1) 55%, transparent 75%)"
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
            </>
          ) : (
            /* Full-bleed cover image */
            <>
              <Image
                src={s.heroImage}
                alt=""
                fill
                className="object-cover"
                style={{ objectPosition: s.imagePosition ?? "center center" }}
                priority={i === 0}
                sizes="100vw"
              />
              {s.hideOverlayText ? (
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/30 to-transparent" />
              ) : (
                <>
                  <div className="absolute inset-0 hero-gradient" />
                  <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                </>
              )}
            </>
          )}
        </div>
      ))}

      {/* ── Text overlay — cinematic slides only ───────── */}
      {!slide.hideOverlayText && (
        <div className="relative z-10 h-full flex items-center pointer-events-none">
          <div className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-16 xl:px-20">
            <div
              className={cn(
                "max-w-xl transition-all duration-500 pointer-events-auto",
                animating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
              )}
            >
              {slide.tagline && (
                <p className="text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-[0.2em] mb-3">
                  {slide.tagline}
                </p>
              )}

              <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-white leading-[1.05] tracking-tight drop-shadow-2xl">
                {slide.title}
              </h2>

              {slide.subtitle && (
                <div
                  className="inline-flex items-center mt-4 mb-6 px-5 py-2 font-black text-base sm:text-lg text-white tracking-widest uppercase shadow-lg"
                  style={{
                    background: slide.accentColor ?? "#3b82f6",
                    clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                  }}
                >
                  {slide.subtitle}
                </div>
              )}

              <div className="flex items-center gap-3 mt-2">
                <Link
                  href={slide.ctaLink}
                  className="inline-flex items-center justify-center px-7 py-3 bg-white text-[#0a0a0f] font-bold text-sm rounded-lg hover:bg-gray-100 active:scale-95 transition-all shadow-xl no-select"
                >
                  {slide.ctaText}
                </Link>
                <Link
                  href={slide.ctaLink}
                  className="inline-flex items-center gap-1 text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  Details
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pre-designed banner — bottom-left CTA only ─── */}
      {slide.hideOverlayText && (
        <div className="relative z-10 h-full flex items-end pb-8 pointer-events-none">
          <div className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-16 xl:px-20">
            <div
              className={cn(
                "pointer-events-auto transition-all duration-500",
                animating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
              )}
            >
              <Link
                href={slide.ctaLink}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 font-black text-sm rounded-lg transition-all shadow-2xl no-select active:scale-95 hover:brightness-110"
                style={{
                  background: slide.accentColor ?? "#f59e0b",
                  color: "#fff",
                  boxShadow: `0 0 20px ${slide.accentColor ?? "#f59e0b"}99, 0 4px 15px rgba(0,0,0,0.4)`,
                  letterSpacing: "0.08em",
                }}
              >
                {slide.ctaText}
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Prev / Next arrows ─────────────────────────── */}
      <button
        onClick={prev}
        className="absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10 transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10 transition-all"
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* ── Slide dots ─────────────────────────────────── */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
        role="tablist"
        aria-label="Slide indicators"
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}: ${s.title}`}
            className={cn(
              "h-1 rounded-full transition-all duration-300 no-select",
              i === current ? "w-8 bg-white" : "w-2 bg-white/30 hover:bg-white/60"
            )}
          />
        ))}
      </div>
    </section>
  );
}
