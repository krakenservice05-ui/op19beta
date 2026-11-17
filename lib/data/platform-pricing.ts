/**
 * Platform Price Adjustments
 *
 * These are FIXED, DETERMINISTIC adjustments applied per game/platform combination.
 * They are stored here as the authoritative server-side configuration.
 *
 * Rules:
 * - Adjustments are expressed as a decimal multiplier offset: e.g. +0.03 means +3%.
 * - Range: -0.07 to +0.07 (−7% to +7%) per the pricing specification.
 * - 0.00 means the reference price is used without adjustment.
 * - These values are fixed and must never be randomized.
 *
 * Calculation order (per spec):
 *   Platform-adjusted original price = baseOriginalPrice × (1 + adjustment)
 *   Final selling price = platformAdjustedOriginalPrice × (1 − discountRate)
 *
 * Key: `${gameId}::${platformString}`
 */

export const PLATFORM_ADJUSTMENTS: Record<string, number> = {
  // ── GAME 1: Phantom Blade Zero ──────────────────────────────────────────
  "phantom-blade-zero::PlayStation 5":   0.00,  // reference platform (PS5 launch)
  "phantom-blade-zero::PC / Steam":     -0.03,  // PC keys typically 3% lower than console

  // ── GAME 2: GTA 6 ───────────────────────────────────────────────────────
  "grand-theft-auto-vi::PlayStation 5":  0.00,  // reference platform
  "grand-theft-auto-vi::Xbox Series X|S": +0.02, // slight premium on Xbox (+2%)

  // ── GAME 3: EA Sports FC 27 ─────────────────────────────────────────────
  "ea-sports-fc-27::PlayStation 5":      0.00,  // reference platform
  "ea-sports-fc-27::Xbox Series X|S":   +0.02,  // +2%
  "ea-sports-fc-27::PC / EA App":       -0.05,  // PC EA App typically cheaper (−5%)
  "ea-sports-fc-27::PC / Steam":        -0.04,  // PC Steam (−4%)

  // ── GAME 4: ARC Raiders ─────────────────────────────────────────────────
  "arc-raiders::PC / Steam":             0.00,  // reference platform (PC launch)
  "arc-raiders::PlayStation 5":         +0.03,  // console premium (+3%)
  "arc-raiders::Xbox Series X|S":       +0.03,  // console premium (+3%)

  // ── GAME 5: Minecraft ───────────────────────────────────────────────────
  "minecraft-java-bedrock::PC / Microsoft Store": 0.00, // reference (PC bundle)
  "minecraft-java-bedrock::PlayStation 5":        +0.05, // console (+5%)
  "minecraft-java-bedrock::Xbox Series X|S":      +0.05, // console (+5%)

  // ── GAME 6: Battlefield 6 ───────────────────────────────────────────────
  "battlefield-6::PC / Steam":           0.00,  // reference platform
  "battlefield-6::PlayStation 5":       +0.04,  // console premium (+4%)
  "battlefield-6::Xbox Series X|S":     +0.04,  // console premium (+4%)

  // ── GAME 7: Crimson Desert ──────────────────────────────────────────────
  "crimson-desert::PC / Steam":          0.00,  // reference platform
  "crimson-desert::PlayStation 5":      +0.04,  // console (+4%)
  "crimson-desert::Xbox Series X|S":    +0.04,  // console (+4%)

  // ── GAME 8: WARDOGS ─────────────────────────────────────────────────────
  "wardogs::PC / Steam":                 0.00,  // only platform available

  // ── GAME 9: EA Sports FC 26 ─────────────────────────────────────────────
  "ea-sports-fc-26::PlayStation 5":      0.00,  // reference platform
  "ea-sports-fc-26::Xbox Series X|S":   +0.02,  // +2%
  "ea-sports-fc-26::PC / EA App":       -0.05,  // PC EA App (−5%)
  "ea-sports-fc-26::PC / Steam":        -0.04,  // PC Steam (−4%)

  // ── GAME 10: Silent Hill 2 ──────────────────────────────────────────────
  "silent-hill-2-remake::PlayStation 5":     0.00, // reference platform
  "silent-hill-2-remake::PC / Steam":       -0.03, // PC (−3%)
  "silent-hill-2-remake::Xbox Series X|S":  +0.02, // Xbox (later port, +2%)

  // ── GAME 11: Call of Duty: Modern Warfare 4 ─────────────────────────────
  "call-of-duty-mw4::PC / Steam":        0.00,  // reference platform
  "call-of-duty-mw4::PC / Battle.net":   0.00,  // same price
  "call-of-duty-mw4::PlayStation 5":    +0.05,  // console premium (+5%)
  "call-of-duty-mw4::Xbox Series X|S":  +0.03,  // Xbox (+3%)

  // ── GAME 12: NBA 2K27 ───────────────────────────────────────────────────
  "nba-2k27::PlayStation 5":             0.00,  // reference platform
  "nba-2k27::Xbox Series X|S":          +0.02,  // +2%
  "nba-2k27::PC / Steam":               -0.04,  // PC (−4%)

  // ── GAME 13: Star Wars: Galactic Racer ──────────────────────────────────
  "star-wars-galactic-racer::PC / Steam":        0.00, // reference platform
  "star-wars-galactic-racer::PlayStation 5":    +0.05, // console (+5%)
  "star-wars-galactic-racer::Xbox Series X|S":  +0.04, // Xbox (+4%)

  // ── GAME 14: Final Fantasy Resonance ────────────────────────────────────
  "final-fantasy-resonance::PC / Steam":         0.00, // reference platform
  "final-fantasy-resonance::PlayStation 5":     +0.06, // console premium (+6%)
  "final-fantasy-resonance::Xbox Series X|S":   +0.04, // Xbox (+4%)

  // ── GAME 15: Planet Zoo 2 ───────────────────────────────────────────────
  "planet-zoo-2::PC / Steam":            0.00,  // reference platform (PC-first title)
  "planet-zoo-2::PlayStation 5":        +0.07,  // console premium (+7%)
  "planet-zoo-2::Xbox Series X|S":      +0.07,  // console premium (+7%)
};

/**
 * Returns the platform adjustment multiplier offset for a given game/platform.
 * Falls back to 0.00 (no adjustment) if not configured.
 */
export function getPlatformAdjustment(gameId: string, platform: string): number {
  const key = `${gameId}::${platform}`;
  return PLATFORM_ADJUSTMENTS[key] ?? 0.00;
}

/**
 * Calculates the platform-adjusted original price.
 * platformAdjustedOriginal = baseOriginal × (1 + adjustment)
 */
export function getPlatformAdjustedOriginal(
  baseOriginalPrice: number,
  adjustment: number
): number {
  return Math.round(baseOriginalPrice * (1 + adjustment) * 100) / 100;
}

/**
 * Calculates the final selling price after platform adjustment and game discount.
 * finalPrice = platformAdjustedOriginal × (1 − discountRate)
 */
export function getPlatformFinalPrice(
  baseOriginalPrice: number,
  adjustment: number,
  discountRate: number  // e.g. 0.25 for 25%
): number {
  const adjustedOriginal = getPlatformAdjustedOriginal(baseOriginalPrice, adjustment);
  return Math.round(adjustedOriginal * (1 - discountRate) * 100) / 100;
}
