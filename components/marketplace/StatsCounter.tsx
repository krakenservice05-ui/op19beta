"use client";

import { useEffect, useRef, useState } from "react";

// Easing: fast start, slow finish — same feel as the reference
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function useCountUp(target: number, duration = 2200, start = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setValue(target);
    }

    requestAnimationFrame(tick);
  }, [start, target, duration]);

  return value;
}

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

interface StatItemProps {
  value: string;
  label: string;
  sub?: string;
  started: boolean;
}

function StatItem({ value, label, sub, started }: StatItemProps) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
        {value}
      </p>
      <p className="text-xs font-bold text-white/50 uppercase tracking-[0.18em] mt-1">
        {label}
      </p>
      {sub && (
        <p className="text-[10px] text-white/30 tracking-widest uppercase">{sub}</p>
      )}
    </div>
  );
}

export function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  // Trigger animation when section scrolls into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Main sold counter
  const soldCount = useCountUp(17_432_891, 2400, started);
  // Rating shown as fixed decimal
  const ratingRaw = useCountUp(45, 1600, started); // 45 → "4.5"
  const rating = started ? (ratingRaw / 10).toFixed(1) : "0.0";
  // Users
  const usersRaw = useCountUp(6, 1800, started);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[#0a0a0f] border-y border-[#1a1a2a] py-16 lg:py-20"
      aria-label="Elite Games platform statistics"
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, #1e1b4b 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 flex flex-col items-center gap-10">

        {/* Label */}
        <div className="flex items-center gap-3 self-start">
          <p className="text-sm font-black text-white/70 uppercase tracking-[0.25em]">
            Items Sold
          </p>
        </div>

        {/* BIG counter */}
        <div className="text-center leading-none -mt-2">
          <p
            className="font-black text-white select-none"
            style={{
              fontSize: "clamp(3.5rem, 11vw, 9rem)",
              letterSpacing: "-0.03em",
              textShadow: "0 0 80px rgba(99,102,241,0.25)",
            }}
            aria-live="polite"
            aria-label={`${formatCount(soldCount)} items sold`}
          >
            {formatCount(soldCount)}
          </p>
        </div>

        {/* Sub-stats row */}
        <div className="flex items-start justify-center gap-12 sm:gap-20 md:gap-28 mt-2">
          <StatItem
            value={`${rating}/5`}
            label="Platform Rating"
            sub="22K+ Reviews"
            started={started}
          />
          <div className="w-px h-12 bg-white/10 self-center" aria-hidden="true" />
          <StatItem
            value={`${started ? usersRaw : 0}M+`}
            label="Happy Customers"
            sub="Worldwide"
            started={started}
          />
          <div className="w-px h-12 bg-white/10 self-center hidden sm:block" aria-hidden="true" />
          <div className="hidden sm:block">
            <StatItem
              value="150+"
              label="Publishers"
              sub="Authorized Partners"
              started={started}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
