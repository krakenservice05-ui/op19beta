// Precise inline SVG logos matching the reference card images exactly
// Each logo is white on transparent — the card background provides the color

export const PlatformLogos: Record<string, React.FC<{ className?: string }>> = {

  // ── Steam ───────────────────────────────────────────────────────────────────
  // White gear icon + "STEAM" wordmark — matches dark-teal card
  steam: ({ className }) => (
    <svg viewBox="0 0 200 60" fill="none" className={className} aria-hidden="true">
      {/* Steam circle/gear mark */}
      <circle cx="30" cy="30" r="27" fill="white" />
      <circle cx="30" cy="30" r="18" fill="#17567a" />
      <circle cx="30" cy="30" r="10" fill="white" />
      {/* Gear teeth via stroke-dasharray */}
      <circle cx="30" cy="30" r="23" fill="none" stroke="white" strokeWidth="6" strokeDasharray="7.5 5.2" />
      {/* Chain / arrow going lower-left */}
      <line x1="23" y1="38" x2="8" y2="53" stroke="#17567a" strokeWidth="8" strokeLinecap="round" />
      <circle cx="8" cy="53" r="5" fill="white" />
      {/* STEAM text */}
      <text x="66" y="40" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="25" fill="white" letterSpacing="1.5">STEAM</text>
      <text x="183" y="22" fontFamily="Arial, sans-serif" fontSize="11" fill="white" opacity="0.85">®</text>
    </svg>
  ),

  // ── Xbox ────────────────────────────────────────────────────────────────────
  // White sphere with green-tinted X curves + XBOX wordmark
  xbox: ({ className }) => (
    <svg viewBox="0 0 190 60" fill="none" className={className} aria-hidden="true">
      {/* White sphere */}
      <circle cx="30" cy="30" r="27" fill="white" />
      {/* X curves in Xbox green */}
      <path d="M12 10 Q30 30 12 50" stroke="#107c10" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M48 10 Q30 30 48 50" stroke="#107c10" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M15 8 Q30 16 45 8"  stroke="#107c10" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M15 52 Q30 44 45 52" stroke="#107c10" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* XBOX wordmark */}
      <text x="66" y="41" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="27" fill="white" letterSpacing="1">XBOX</text>
    </svg>
  ),

  // ── PlayStation ─────────────────────────────────────────────────────────────
  // PS symbol (three descending pillars with top arch) + PlayStation wordmark
  playstation: ({ className }) => (
    <svg viewBox="0 0 210 60" fill="none" className={className} aria-hidden="true">
      {/* PS mark — 3 descending columns */}
      <rect x="2"  y="2"  width="10" height="52" rx="2" fill="white" />
      <rect x="22" y="16" width="10" height="38" rx="2" fill="white" />
      <rect x="42" y="28" width="10" height="26" rx="2" fill="white" />
      {/* Arch connecting col 1 top to col 2 */}
      <path d="M12 2 Q12 16 12 16 Q12 26 22 26 L22 16 Q16 16 16 8 L16 2 Z" fill="white" />
      {/* PlayStation wordmark */}
      <text x="62" y="40" fontFamily="'Arial', sans-serif" fontWeight="400" fontSize="20" fill="white" letterSpacing="0.3">PlayStation</text>
      {/* dot / registered */}
      <text x="197" y="27" fontFamily="Arial, sans-serif" fontSize="10" fill="white" opacity="0.75">®</text>
    </svg>
  ),

  // ── Nintendo ─────────────────────────────────────────────────────────────────
  // White pill outline with Nintendo text — matches red card
  nintendo: ({ className }) => (
    <svg viewBox="0 0 200 62" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4" width="194" height="54" rx="27" fill="none" stroke="white" strokeWidth="4" />
      <text x="100" y="38" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="22" fill="white" letterSpacing="0.8">Nintendo</text>
      <text x="186" y="22" fontFamily="Arial, sans-serif" fontSize="11" fill="white" opacity="0.85">®</text>
    </svg>
  ),

  // ── GOG ──────────────────────────────────────────────────────────────────────
  // White rounded-square outline with gog / .com stacked inside
  gog: ({ className }) => (
    <svg viewBox="0 0 80 68" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="4" width="72" height="60" rx="12" fill="none" stroke="white" strokeWidth="4.5" />
      <text x="40" y="34" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="20" fill="white" letterSpacing="-0.5">gog</text>
      <text x="40" y="51" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="600" fontSize="13" fill="white" opacity="0.95">.com</text>
    </svg>
  ),

  // ── Rockstar ─────────────────────────────────────────────────────────────────
  // Yellow rounded-square badge with R★ — matches dark gradient card
  rockstar: ({ className }) => (
    <svg viewBox="0 0 72 72" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="2" width="68" height="68" rx="14" fill="#fcb816" />
      {/* R */}
      <text x="20" y="44" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="40" fill="#111">R</text>
      {/* Star — positioned to the right of R, slightly lower */}
      <text x="44" y="52" fontFamily="Arial, sans-serif" fontSize="28" fill="#111">★</text>
    </svg>
  ),

  // ── Epic Games ───────────────────────────────────────────────────────────────
  // White shield with EPIC / GAMES text inside — centred on dark-navy card
  epic: ({ className }) => (
    <svg viewBox="0 0 110 96" fill="none" className={className} aria-hidden="true">
      {/* Shield: flat top, tapers to bottom point */}
      <path d="M55 4 L104 18 L104 55 Q104 80 55 94 Q6 80 6 55 L6 18 Z" fill="white" />
      <text x="55" y="50" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="22" fill="#1a1a4e" letterSpacing="-0.5">EPIC</text>
      <text x="55" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="10" fill="#1a1a4e" letterSpacing="2.5">GAMES</text>
    </svg>
  ),

  // ── EA Play ──────────────────────────────────────────────────────────────────
  // White circle with red EA text + white "Play" wordmark — coral card
  "ea-play": ({ className }) => (
    <svg viewBox="0 0 180 68" fill="none" className={className} aria-hidden="true">
      {/* White circle badge */}
      <circle cx="34" cy="34" r="30" fill="white" />
      {/* EA in red inside circle */}
      <text x="34" y="42" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="22" fill="#e63c1e" letterSpacing="-1">EA</text>
      {/* Play wordmark */}
      <text x="78" y="48" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="36" fill="white" letterSpacing="-1">Play</text>
    </svg>
  ),
};
