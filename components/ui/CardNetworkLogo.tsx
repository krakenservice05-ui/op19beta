"use client";

import { cn } from "@/lib/utils";
import { CardScheme } from "@/app/api/verify-card/route";

// ── Inline SVG card network logos ─────────────────────────────────────────────
// All rendered as React inline SVG — no image files, no loading, crisp at any size.
// Colours match the official brand standards.

function VisaLogo({ w, h }: { w: number; h: number }) {
  // Official Visa wordmark — deep blue letters, white background card
  return (
    <svg width={w} height={h} viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa" role="img">
      {/* VISA wordmark in classic Visa blue — works on both dark and light bg */}
      <path
        d="M24.57 1.08L16.09 18.9H10.86L6.7 5.26C6.45 4.3 6.22 3.97 5.5 3.6 4.32 2.97 2.4 2.37 .68 2L.8 1.08H9.37c1.14 0 2.17.76 2.43 2.07L14.03 14.5 19.37 1.08h5.2zm20.5 11.9c.02-5.07-7.02-5.35-6.97-7.62.01-.69.67-1.42 2.1-1.6.71-.09 2.66-.16 4.88.86l.87-4.07C45.1.63 43.47.3 41.5.3c-5.03 0-8.57 2.67-8.6 6.5-.03 2.83 2.52 4.41 4.44 5.35 1.98.96 2.64 1.57 2.63 2.43-.01 1.31-1.57 1.89-3.02 1.91-2.54.04-4.02-.68-5.2-1.23l-.92 4.29c1.18.54 3.36 1.02 5.62 1.04 5.3 0 8.77-2.62 8.79-6.68zm13.19 5.9H63l-3.98-17.8H54.98c-.95 0-1.75.56-2.1 1.42L45.7 18.88h5.3l1.06-2.93h6.47l.6 2.93zm-6.4-6.97l2.65-7.3 1.52 7.3h-4.17zM29.2 1.08L25.02 18.9H20.1L24.3 1.08h4.9z"
        fill="white"
      />
    </svg>
  );
}

function MastercardLogo({ w, h }: { w: number; h: number }) {
  // Full-colour Mastercard — official red + yellow/orange overlapping circles
  return (
    <svg width={w} height={h} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard" role="img">
      {/* Left red circle */}
      <circle cx="19" cy="16" r="14" fill="#EB001B" />
      {/* Right yellow/orange circle */}
      <circle cx="31" cy="16" r="14" fill="#F79E1B" />
      {/* Overlap — orange blend in the centre */}
      <path
        d="M25 5.667A14 14 0 0 1 30.333 16 14 14 0 0 1 25 26.333 14 14 0 0 1 19.667 16 14 14 0 0 1 25 5.667z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function AmexLogo({ w, h }: { w: number; h: number }) {
  // American Express — blue background card with AMEX wordmark
  return (
    <svg width={w} height={h} viewBox="0 0 60 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="American Express" role="img">
      {/* Blue card background */}
      <rect width="60" height="36" rx="5" fill="#016FD0" />
      {/* AMEX wordmark in white */}
      <text
        x="30"
        y="23"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="14"
        fill="white"
        letterSpacing="1"
      >
        AMEX
      </text>
    </svg>
  );
}

function MaestroLogo({ w, h }: { w: number; h: number }) {
  // Maestro — red + blue overlapping circles (similar to Mastercard but blue right circle)
  return (
    <svg width={w} height={h} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Maestro" role="img">
      {/* Left red circle */}
      <circle cx="19" cy="16" r="14" fill="#EB001B" />
      {/* Right blue circle */}
      <circle cx="31" cy="16" r="14" fill="#0099DF" />
      {/* Overlap — purple blend */}
      <path
        d="M25 5.667A14 14 0 0 1 30.333 16 14 14 0 0 1 25 26.333 14 14 0 0 1 19.667 16 14 14 0 0 1 25 5.667z"
        fill="#7B1FA2"
        opacity="0.8"
      />
      {/* Maestro wordmark */}
      <text x="25" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="5" fill="white" opacity="0.9">maestro</text>
    </svg>
  );
}

function DiscoverLogo({ w, h }: { w: number; h: number }) {
  // Discover — white card with orange disc + wordmark
  return (
    <svg width={w} height={h} viewBox="0 0 70 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Discover" role="img">
      {/* White card background */}
      <rect width="70" height="36" rx="5" fill="white" />
      {/* Orange circle disc on the right */}
      <circle cx="52" cy="18" r="13" fill="#F76F20" />
      {/* DISCOVER wordmark in dark */}
      <text
        x="8"
        y="21"
        fontFamily="Arial, sans-serif"
        fontWeight="800"
        fontSize="8.5"
        fill="#231F20"
        letterSpacing="0.5"
      >
        DISCOVER
      </text>
    </svg>
  );
}

// ── Config ─────────────────────────────────────────────────────────────────────

type SchemeKey = Exclude<CardScheme, "unknown">;

interface SchemeConfig {
  label: string;
  aspectW: number;
  aspectH: number;
  Component: (props: { w: number; h: number }) => React.ReactElement;
  // Badge bg — used when shown inside the card number input field
  badgeBg: string;
  // Whether logo needs a light bg pill in the accepted-networks row
  needsBg: boolean;
}

const CONFIGS: Record<SchemeKey, SchemeConfig> = {
  visa: {
    label: "Visa",
    aspectW: 60, aspectH: 20,
    Component: VisaLogo,
    badgeBg: "bg-[#1a1f71]",
    needsBg: false,
  },
  mastercard: {
    label: "Mastercard",
    aspectW: 50, aspectH: 32,
    Component: MastercardLogo,
    badgeBg: "bg-[#111]",
    needsBg: false,
  },
  amex: {
    label: "American Express",
    aspectW: 60, aspectH: 36,
    Component: AmexLogo,
    badgeBg: "bg-[#016FD0]",
    needsBg: false, // has its own blue bg built in
  },
  maestro: {
    label: "Maestro",
    aspectW: 50, aspectH: 32,
    Component: MaestroLogo,
    badgeBg: "bg-[#111]",
    needsBg: false,
  },
  discover: {
    label: "Discover",
    aspectW: 70, aspectH: 36,
    Component: DiscoverLogo,
    badgeBg: "bg-white",
    needsBg: false, // has its own white bg built in
  },
};

// ── CardNetworkLogo ────────────────────────────────────────────────────────────

interface CardNetworkLogoProps {
  scheme: CardScheme | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CardNetworkLogo({ scheme, size = "md", className }: CardNetworkLogoProps) {
  if (!scheme || scheme === "unknown") return null;
  const config = CONFIGS[scheme as SchemeKey];
  if (!config) return null;

  const hMap = { sm: 14, md: 20, lg: 28 };
  const h = hMap[size];
  const w = Math.round(h * (config.aspectW / config.aspectH));

  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      <config.Component w={w} h={h} />
    </span>
  );
}

// ── CardNetworkBadge ───────────────────────────────────────────────────────────
// Shown inside the card number input field when scheme is detected

export function CardNetworkBadge({ scheme }: { scheme: CardScheme | null | undefined }) {
  if (!scheme || scheme === "unknown") return null;
  const config = CONFIGS[scheme as SchemeKey];
  if (!config) return null;

  const h = 18;
  const w = Math.round(h * (config.aspectW / config.aspectH));

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-white/10 overflow-hidden flex-shrink-0",
        config.badgeBg
      )}
      style={{ height: 24, width: w + 8, minWidth: 36 }}
      aria-label={config.label}
      title={config.label}
    >
      <config.Component w={w} h={h} />
    </span>
  );
}

// ── AcceptedNetworksRow ────────────────────────────────────────────────────────
// Row of all accepted card network logos shown at the top of the card form

export function AcceptedNetworksRow() {
  const schemes: SchemeKey[] = ["visa", "mastercard", "amex", "maestro", "discover"];

  return (
    <div className="flex items-center gap-2 flex-wrap" aria-label="Accepted card networks">
      {schemes.map((s) => {
        const config = CONFIGS[s];
        const h = 20;
        const w = Math.round(h * (config.aspectW / config.aspectH));

        return (
          <span
            key={s}
            className="inline-flex items-center justify-center rounded-lg border border-[#252535] overflow-hidden bg-[#1c1c28]"
            style={{ height: 34, width: w + 16, minWidth: 52 }}
            title={config.label}
            aria-label={config.label}
          >
            <config.Component w={w} h={h} />
          </span>
        );
      })}
    </div>
  );
}
