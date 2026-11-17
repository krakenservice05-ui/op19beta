"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export function PromoBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="promo-bar relative flex items-center justify-center min-h-[44px] px-4 py-2">
      <Link
        href="/games"
        className="flex items-center gap-3 group"
        aria-label="View current deals"
      >
        <span className="text-xs sm:text-sm font-semibold text-white tracking-wide group-hover:underline">
          🎮 EXCLUSIVE DEALS — Save up to 45% on top titles
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-bold px-2.5 py-1 rounded">
          SHOP NOW →
        </span>
      </Link>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-1 rounded"
        aria-label="Dismiss promotion"
      >
        <X size={14} />
      </button>
    </div>
  );
}
