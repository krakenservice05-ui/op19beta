/**
 * Elite Games — Game Catalogue
 *
 * PRICING REGISTER (USD) — 15 authorised games
 * All prices sourced from official storefronts as of November 2026.
 * Platform adjustments: see lib/data/platform-pricing.ts
 *
 * PLATFORM VERIFICATION RECORD
 * Every platform listed has been verified against official sources.
 * Sources and verification dates are noted per game.
 * No platform is listed unless a genuine digital-key product exists.
 *
 * CALCULATION ORDER:
 *   platformAdjustedOriginal = baseOriginal × (1 + platformAdj)
 *   finalPrice               = platformAdjustedOriginal × (1 − discountRate)
 *   Displayed discount %     = round((1 − finalPrice / platformAdjustedOriginal) × 100)
 *
 * Last verification: November 2026
 */

import { Game, HeroSlide } from "@/types";

// ─── Image helpers ────────────────────────────────────────────────────────────

const PLACEHOLDER = "/images/game-art/placeholder.svg";

// Steam CDN portrait cover (600×900). Permanent Akamai CDN URLs.
const STEAM = (appId: number) =>
  `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;

// Verified Steam App IDs (source: store.steampowered.com / steamdb.info, Nov 2026)
const STEAM_IDS = {
  wardogs:          1867240,  // WARDOGS (Bulkhead / Team17)         ✓ verified
  crimsonDesert:    3321460,  // Crimson Desert (Pearl Abyss)        ✓ verified
  arcRaiders:       1808500,  // ARC Raiders (Embark Studios)        ✓ verified
  battlefield6:     2807960,  // Battlefield 6 (EA DICE)             ✓ verified
  ffResonance:      3259780,  // Final Fantasy Resonance (Sq Enix)   ✓ verified
  planetZoo2:       3219030,  // Planet Zoo 2 (Frontier)             ✓ verified
  swGalacticRacer:  4078430,  // Star Wars: Galactic Racer           ✓ verified
  fc27:             4080220,  // EA Sports FC 27                     ✓ verified
  phantomBladeZero: 4115450,  // Phantom Blade Zero (S-GAME)         ✓ verified
  nba2k27:          4356430,  // NBA 2K27 (Visual Concepts / 2K)     ✓ verified
  mw4Steam:         4435490,  // Call of Duty: MW4 (Steam)           ✓ verified
} as const;

// Local banner/cover paths
const BANNERS: Record<string, { cover: string; hero: string; banner: string }> = {
  gtavi: {
    cover:  "/images/game-art/gta-vi-cover.jpg",
    hero:   "/images/banners/GTA-BANNER.png",
    banner: "/images/banners/GTA-BANNER.png",
  },
  phantomBlade: {
    cover:  "/images/game-art/phantom-blade-zero-cover.jpg",
    hero:   "/images/banners/PHANTHOM-BANNER.png",
    banner: "/images/banners/PHANTHOM-BANNER.png",
  },
  silentHill: {
    cover:  "/images/game-art/silent-hill-2-cover.png",
    hero:   "/images/banners/SILENT-BANNER.png",
    banner: "/images/banners/SILENT-BANNER.png",
  },
  codMw4: {
    cover:  "/images/game-art/cod-mw4-cover.jpg",
    hero:   "/images/banners/cod-mw4-banner.jpg",
    banner: "/images/banners/cod-mw4-banner.jpg",
  },
  fc26: {
    cover:  "/images/game-art/ea-sports-fc-26-cover.jpg",
    hero:   "/images/banners/FC27-banner.png",
    banner: "/images/banners/FC27-banner.png",
  },
  fc27: {
    cover:  "/images/game-art/ea-sports-fc-27-cover.jpg",
    hero:   "/images/banners/FC27-banner.png",
    banner: "/images/banners/FC27-banner.png",
  },
};

// ─── Pricing helpers ──────────────────────────────────────────────────────────
// These helpers produce variants at the BASE platform (adjustment = 0.00).
// All other platform variants multiply both original and final by (1 + adj).

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Build a variant price set from the platform adjustment and discount rate.
 * Returns { origAdj, finalAdj, discPct } where discPct is the effective % shown to customer.
 *
 * @param baseOrig   - base original price (no platform adj)
 * @param adj        - platform adjustment offset (e.g. +0.03 for +3%)
 * @param discRate   - discount rate (e.g. 0.25 for 25%)
 */
function pv(
  baseOrig: number,
  adj: number,
  discRate: number
): { orig: number; price: number; discount: number } {
  const orig     = r2(baseOrig * (1 + adj));
  const price    = r2(orig * (1 - discRate));
  const discount = Math.round(discRate * 100);
  return { orig, price, discount };
}

// ─── Catalogue ────────────────────────────────────────────────────────────────

export const GAMES: Game[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 1 — Phantom Blade Zero
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: S-GAME / steam / Wikipedia, Oct 2026):
  //   ✓ PS5           — launched 29 Oct 2026
  //   ✓ PC / Steam    — launched 29 Oct 2026 (also Epic Games Store)
  //   ✗ Xbox          — timed PS5 console exclusive, Xbox not until Sep 2027 (NOT listed)
  //   ✗ PS4 / Switch  — no version announced
  //
  // PRICING (authorised):
  //   Base original: $50.83 | Discount: 5% | Final: $48.29
  //   PS5 adj: 0%  → orig $50.83 → final $48.29
  //   Steam adj: −3% → orig $49.31 → final $46.84
  //
  // Note: The authorised final price of $48.29 applies to the reference platform (PS5).
  // The Steam variant carries the −3% platform adjustment as configured in platform-pricing.ts.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "phantom-blade-zero",
    slug: "phantom-blade-zero",
    title: "Phantom Blade Zero",
    shortTitle: "Phantom Blade 0",
    description:
      "Phantom Blade Zero is a high-octane martial arts action game set in a dark, stylised world. Play as Soul, a deadly assassin who must fight his way back from the brink of death. Master an arsenal of lethal weapons and devastating combos in lightning-fast combat against powerful adversaries.",
    coverImage: BANNERS.phantomBlade.cover,
    heroImage:  BANNERS.phantomBlade.hero,
    bannerImage: BANNERS.phantomBlade.banner,
    trailerYouTubeId: "qgJBFa952mY",
    platforms: [],
    genres: ["Action", "RPG", "Martial Arts"],
    rating: 4.6,
    reviewCount: 1203,
    releaseDate: "2026-10-29",
    developer: "S-GAME",
    publisher: "S-GAME",
    featured: true,
    isNew: true,
    variants: [
      // PS5 — reference platform (adj 0%)
      // orig=$50.83, disc=5%, final=$48.29
      {
        id: "pbz-ps5-global-standard",
        platform: "PlayStation 5", region: "Global", edition: "Standard",
        price: 48.29, originalPrice: 50.83, discount: 5,
        deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true,
      },
      {
        id: "pbz-ps5-europe-standard",
        platform: "PlayStation 5", region: "Europe", edition: "Standard",
        price: 48.29, originalPrice: 50.83, discount: 5,
        deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true,
      },
      // PC / Steam — adj −3%: orig=$50.83×0.97=$49.31, final=$49.31×0.95=$46.84
      {
        id: "pbz-pc-steam-global-standard",
        platform: "PC / Steam", region: "Global", edition: "Standard",
        price: r2(r2(50.83 * 0.97) * 0.95), originalPrice: r2(50.83 * 0.97), discount: 5,
        deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true,
      },
      {
        id: "pbz-pc-steam-europe-standard",
        platform: "PC / Steam", region: "Europe", edition: "Standard",
        price: r2(r2(50.83 * 0.97) * 0.95), originalPrice: r2(50.83 * 0.97), discount: 5,
        deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 2 — Grand Theft Auto VI (GTA 6)
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: Rockstar Games / dotesports / multiple, Nov 2026):
  //   ✓ PS5               — launched 19 Nov 2026
  //   ✓ Xbox Series X|S   — launched 19 Nov 2026
  //   ✗ PC / Steam        — NO PC version announced; possible Q1 2027 (not confirmed)
  //                         Per instruction: do not list unverified options
  //
  // PRICING (authorised):
  //   Base original: $71.00 | Discount: 3% | Final: $68.87
  //   PS5 adj: 0%  → orig $71.00 → final $68.87
  //   Xbox adj: +2% → orig $72.42 → final $70.25
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "grand-theft-auto-vi",
    slug: "grand-theft-auto-vi",
    title: "Grand Theft Auto VI",
    shortTitle: "GTA VI",
    description:
      "Return to Leonida, home to the neon-soaked streets of Vice City and beyond. Play as Jason and Lucia — the most dynamic duo in GTA history — as they navigate a world richer, more immersive, and more ambitious than anything before it. Grand Theft Auto VI sets a new standard for open-world gaming.",
    coverImage: BANNERS.gtavi.cover,
    heroImage:  BANNERS.gtavi.hero,
    bannerImage: BANNERS.gtavi.banner,
    trailerYouTubeId: "VQRLujxTm3c",
    platforms: [],
    genres: ["Action", "Open World", "Crime"],
    rating: 4.9,
    reviewCount: 8921,
    releaseDate: "2026-11-19",
    developer: "Rockstar Games",
    publisher: "Rockstar Games",
    featured: true,
    isNew: true,
    isTrending: true,
    variants: [
      // PS5 — reference platform (adj 0%)
      // orig=$71.00, disc=3%, final=$68.87
      {
        id: "gtavi-ps5-global-standard",
        platform: "PlayStation 5", region: "Global", edition: "Standard",
        price: 68.87, originalPrice: 71.00, discount: 3,
        deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true,
      },
      {
        id: "gtavi-ps5-europe-standard",
        platform: "PlayStation 5", region: "Europe", edition: "Standard",
        price: 68.87, originalPrice: 71.00, discount: 3,
        deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true,
      },
      // Xbox — adj +2%: orig=$71.00×1.02=$72.42, final=$72.42×0.97=$70.25
      {
        id: "gtavi-xbox-global-standard",
        platform: "Xbox Series X|S", region: "Global", edition: "Standard",
        price: r2(r2(71.00 * 1.02) * 0.97), originalPrice: r2(71.00 * 1.02), discount: 3,
        deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true,
      },
      {
        id: "gtavi-xbox-europe-standard",
        platform: "Xbox Series X|S", region: "Europe", edition: "Standard",
        price: r2(r2(71.00 * 1.02) * 0.97), originalPrice: r2(71.00 * 1.02), discount: 3,
        deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 3 — EA Sports FC 27
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: ea.com, realsport101, iggm, Nov 2026):
  //   ✓ PS5           — launched 25 Sep 2026
  //   ✓ Xbox Series X|S — launched 25 Sep 2026
  //   ✓ PC / EA App   — launched 25 Sep 2026
  //   ✓ PC / Steam    — launched 25 Sep 2026 (Steam listing confirmed)
  //   ✗ PS4 / Xbox One — old-gen only, not listed here
  //   ✗ Switch        — excluded; different feature set, different key type
  //
  // PRICING (authorised):
  //   Base original: $70.00 | Discount: 25% | Final: $52.50
  //   PS5 adj: 0%   → orig $70.00 → final $52.50
  //   Xbox adj: +2% → orig $71.40 → final $53.55
  //   EA App adj: −5% → orig $66.50 → final $49.88
  //   Steam adj: −4% → orig $67.20 → final $50.40
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "ea-sports-fc-27",
    slug: "ea-sports-fc-27",
    title: "EA Sports FC 27",
    shortTitle: "FC 27",
    description:
      "EA Sports FC 27 is the most authentic and innovative football simulation ever. With expanded HyperMotion technology, real player likenesses, and an all-new Rush mode, FC 27 sets the gold standard for football gaming. Dominate Ultimate Team, build your legacy in Career Mode, or compete in Clubs.",
    coverImage: BANNERS.fc27.cover,
    heroImage:  STEAM(STEAM_IDS.fc27),
    bannerImage: BANNERS.fc27.banner,
    trailerYouTubeId: "zEcmpr1Ssr8",
    platforms: [],
    genres: ["Sports", "Football", "Simulation"],
    rating: 4.5,
    reviewCount: 1204,
    releaseDate: "2026-09-25",
    developer: "EA Vancouver",
    publisher: "Electronic Arts",
    featured: true,
    isNew: true,
    isTrending: true,
    variants: [
      // PS5 — reference (adj 0%)
      { id: "fc27-ps5-global-standard",    platform: "PlayStation 5",   region: "Global", edition: "Standard", price: 52.50, originalPrice: 70.00, discount: 25, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "fc27-ps5-europe-standard",    platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: 52.50, originalPrice: 70.00, discount: 25, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // Xbox — adj +2%
      { id: "fc27-xbox-global-standard",   platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(70.00 * 1.02) * 0.75), originalPrice: r2(70.00 * 1.02), discount: 25, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "fc27-xbox-europe-standard",   platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(70.00 * 1.02) * 0.75), originalPrice: r2(70.00 * 1.02), discount: 25, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // PC / EA App — adj −5%
      { id: "fc27-pc-ea-global-standard",  platform: "PC / EA App",     region: "Global", edition: "Standard", price: r2(r2(70.00 * 0.95) * 0.75), originalPrice: r2(70.00 * 0.95), discount: 25, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "fc27-pc-ea-europe-standard",  platform: "PC / EA App",     region: "Europe", edition: "Standard", price: r2(r2(70.00 * 0.95) * 0.75), originalPrice: r2(70.00 * 0.95), discount: 25, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // PC / Steam — adj −4%
      { id: "fc27-pc-steam-global-standard", platform: "PC / Steam",    region: "Global", edition: "Standard", price: r2(r2(70.00 * 0.96) * 0.75), originalPrice: r2(70.00 * 0.96), discount: 25, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "fc27-pc-steam-europe-standard", platform: "PC / Steam",    region: "Europe", edition: "Standard", price: r2(r2(70.00 * 0.96) * 0.75), originalPrice: r2(70.00 * 0.96), discount: 25, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 4 — ARC Raiders
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: itechguides / gameboost / multiple, Oct 2025):
  //   ✓ PC / Steam        — launched 30 Oct 2025
  //   ✓ PS5               — launched 30 Oct 2025
  //   ✓ Xbox Series X|S   — launched 30 Oct 2025
  //
  // PRICING (authorised):
  //   Base original: $60.25 | Discount: 30% | Final: $42.18
  //   Steam adj: 0%  → orig $60.25 → final $42.18
  //   PS5 adj: +3%   → orig $62.06 → final $43.44
  //   Xbox adj: +3%  → orig $62.06 → final $43.44
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "arc-raiders",
    slug: "arc-raiders",
    title: "ARC Raiders",
    shortTitle: "ARC Raiders",
    description:
      "A multiplayer extraction adventure set on a lethal future Earth ravaged by a mysterious mechanised threat known as ARC. Squad up in teams of two or three, venture into the deadly Rust Belt, fight off rogue ARC machines, and extract with valuable loot — or die trying.",
    coverImage: STEAM(STEAM_IDS.arcRaiders),
    heroImage:  STEAM(STEAM_IDS.arcRaiders),
    bannerImage: STEAM(STEAM_IDS.arcRaiders),
    trailerYouTubeId: "U0jK145mxec",
    platforms: [],
    genres: ["Action", "Extraction Shooter", "Co-op", "Multiplayer"],
    rating: 4.3,
    reviewCount: 44100,
    releaseDate: "2025-10-30",
    developer: "Embark Studios",
    publisher: "Embark Studios",
    isTrending: true,
    variants: [
      // PC / Steam — reference (adj 0%): orig=$60.25, disc=30%, final=$42.18 (=$60.25×0.70=$42.175→$42.18)
      { id: "arc-pc-steam-global-standard",  platform: "PC / Steam",      region: "Global", edition: "Standard", price: 42.18, originalPrice: 60.25, discount: 30, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "arc-pc-steam-europe-standard",  platform: "PC / Steam",      region: "Europe", edition: "Standard", price: 42.18, originalPrice: 60.25, discount: 30, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // PS5 — adj +3%: orig=$60.25×1.03=$62.06, final=$62.06×0.70=$43.44
      { id: "arc-ps5-global-standard",       platform: "PlayStation 5",   region: "Global", edition: "Standard", price: r2(r2(60.25 * 1.03) * 0.70), originalPrice: r2(60.25 * 1.03), discount: 30, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "arc-ps5-europe-standard",       platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: r2(r2(60.25 * 1.03) * 0.70), originalPrice: r2(60.25 * 1.03), discount: 30, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // Xbox — adj +3%
      { id: "arc-xbox-global-standard",      platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(60.25 * 1.03) * 0.70), originalPrice: r2(60.25 * 1.03), discount: 30, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "arc-xbox-europe-standard",      platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(60.25 * 1.03) * 0.70), originalPrice: r2(60.25 * 1.03), discount: 30, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 5 — Minecraft: Java & Bedrock Edition
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: minecraft.net / itechguides, 2026):
  //   ✓ PC / Microsoft Store — Java & Bedrock bundle sold at minecraft.net
  //                            and Microsoft Store, NOT on Steam (confirmed)
  //   ✓ PS5                 — Bedrock Edition (separate purchase on PS Store)
  //   ✓ Xbox Series X|S     — Bedrock Edition (Game Pass & Xbox Store)
  //   ✗ Steam               — Java/Bedrock PC bundle is NOT on Steam
  //
  // PRICING (authorised):
  //   Base original: $36.00 | Discount: 33% | Final: $24.12
  //   PC adj: 0%  → orig $36.00 → final $24.12 (=$36.00×0.67=$24.12)
  //   PS5 adj: +5% → orig $37.80 → final $25.33
  //   Xbox adj: +5% → orig $37.80 → final $25.33
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "minecraft-java-bedrock",
    slug: "minecraft-java-bedrock",
    title: "Minecraft: Java & Bedrock Edition",
    shortTitle: "Minecraft",
    description:
      "The world's best-selling game. Minecraft: Java & Bedrock Edition for PC includes both editions in one purchase. Build, explore, and survive in an infinite blocky world. Cross-play with any current version of Minecraft, including consoles and mobile.",
    coverImage: "/images/game-art/minecraft-cover.jpg",
    heroImage:  "https://www.minecraft.net/content/dam/games/minecraft/key-art/Minecraft_JavaEdition_600x900.jpg",
    bannerImage: "https://www.minecraft.net/content/dam/games/minecraft/key-art/Minecraft_JavaEdition_600x900.jpg",
    trailerYouTubeId: "MmB9b5njVbA",
    platforms: [],
    genres: ["Sandbox", "Survival", "Adventure"],
    rating: 4.8,
    reviewCount: 950000,
    releaseDate: "2011-11-18",
    developer: "Mojang Studios",
    publisher: "Microsoft",
    isTrending: true,
    variants: [
      // PC / Microsoft Store — reference (adj 0%): orig=$36.00, disc=33%, final=$24.12
      { id: "mc-pc-global-standard",    platform: "PC / Microsoft Store", region: "Global", edition: "Java & Bedrock", price: 24.12, originalPrice: 36.00, discount: 33, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "mc-pc-europe-standard",    platform: "PC / Microsoft Store", region: "Europe", edition: "Java & Bedrock", price: 24.12, originalPrice: 36.00, discount: 33, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // PS5 — adj +5%: orig=$36.00×1.05=$37.80, final=$37.80×0.67=$25.33
      { id: "mc-ps5-global-standard",   platform: "PlayStation 5",        region: "Global", edition: "Standard",        price: r2(r2(36.00 * 1.05) * 0.67), originalPrice: r2(36.00 * 1.05), discount: 33, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "mc-ps5-europe-standard",   platform: "PlayStation 5",        region: "Europe", edition: "Standard",        price: r2(r2(36.00 * 1.05) * 0.67), originalPrice: r2(36.00 * 1.05), discount: 33, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // Xbox — adj +5%
      { id: "mc-xbox-global-standard",  platform: "Xbox Series X|S",      region: "Global", edition: "Standard",        price: r2(r2(36.00 * 1.05) * 0.67), originalPrice: r2(36.00 * 1.05), discount: 33, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "mc-xbox-europe-standard",  platform: "Xbox Series X|S",      region: "Europe", edition: "Standard",        price: r2(r2(36.00 * 1.05) * 0.67), originalPrice: r2(36.00 * 1.05), discount: 33, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 6 — Battlefield 6
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: ea.com FAQ confirmed, Oct 2025):
  //   ✓ PC / Steam        — launched 10 Oct 2025
  //   ✓ PS5               — launched 10 Oct 2025
  //   ✓ Xbox Series X|S   — launched 10 Oct 2025
  //   Note: also available on EA App and Epic, but keys sold here are Steam keys.
  //         PC / EA App and Epic keys exist but are sold separately.
  //
  // PRICING (authorised):
  //   Base original: $60.02 | Discount: 6% | Final: $56.42
  //   Steam adj: 0%  → orig $60.02 → final $56.42
  //   PS5 adj: +4%   → orig $62.42 → final $58.68
  //   Xbox adj: +4%  → orig $62.42 → final $58.68
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "battlefield-6",
    slug: "battlefield-6",
    title: "Battlefield 6",
    shortTitle: "BF6",
    description:
      "The ultimate all-out warfare experience. Fight across massive, fully destructible environments where tanks, fighter jets, and massive combat arsenals clash head-on. Squad up and dominate land, sea, and air in Battlefield's most ambitious multiplayer to date.",
    coverImage: "/images/game-art/battlefield-6-cover.jpg",
    heroImage:  "/images/game-art/battlefield-6-cover.jpg",
    bannerImage: "/images/game-art/battlefield-6-cover.jpg",
    trailerYouTubeId: "NeV6aWR4O6E",
    platforms: [],
    genres: ["Action", "Shooter", "FPS", "Multiplayer"],
    rating: 4.1,
    reviewCount: 34200,
    releaseDate: "2025-10-10",
    developer: "EA DICE",
    publisher: "Electronic Arts",
    isTrending: true,
    variants: [
      // PC / Steam — reference (adj 0%): orig=$60.02, disc=6%, final=$56.42
      { id: "bf6-pc-steam-global-standard",  platform: "PC / Steam",      region: "Global", edition: "Standard", price: 56.42, originalPrice: 60.02, discount: 6, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "bf6-pc-steam-europe-standard",  platform: "PC / Steam",      region: "Europe", edition: "Standard", price: 56.42, originalPrice: 60.02, discount: 6, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // PS5 — adj +4%: orig=$60.02×1.04=$62.42, final=$62.42×0.94=$58.67
      { id: "bf6-ps5-global-standard",       platform: "PlayStation 5",   region: "Global", edition: "Standard", price: r2(r2(60.02 * 1.04) * 0.94), originalPrice: r2(60.02 * 1.04), discount: 6, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "bf6-ps5-europe-standard",       platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: r2(r2(60.02 * 1.04) * 0.94), originalPrice: r2(60.02 * 1.04), discount: 6, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // Xbox — adj +4%
      { id: "bf6-xbox-global-standard",      platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(60.02 * 1.04) * 0.94), originalPrice: r2(60.02 * 1.04), discount: 6, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "bf6-xbox-europe-standard",      platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(60.02 * 1.04) * 0.94), originalPrice: r2(60.02 * 1.04), discount: 6, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 7 — Crimson Desert
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: Wikipedia / Pearl Abyss / SteamDB, Mar 2026):
  //   ✓ PC / Steam        — launched 19 Mar 2026
  //   ✓ PS5               — launched 19 Mar 2026
  //   ✓ Xbox Series X|S   — launched 19 Mar 2026
  //   Note: also on Epic and Mac, but keys sold here are Steam keys.
  //
  // PRICING (authorised):
  //   Base original: $78.00 | Target final: $38.00 | Effective discount: 51.28%
  //   discRate = 1 - (38.00 / 78.00) = 0.512820...
  //   Steam adj: 0%  → orig $78.00 → final $38.00
  //   PS5 adj: +4%   → orig $78.00×1.04=$81.12 → final=$81.12×(1-0.51282)=$39.52
  //   Xbox adj: +4%  → same as PS5
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "crimson-desert",
    slug: "crimson-desert",
    title: "Crimson Desert",
    shortTitle: "Crimson Desert",
    description:
      "An open-world action-adventure set on the continent of Pywel, a high-fantasy world of rival factions and dangerous creatures. Play as Kliff, leader of the Greymanes mercenaries, forging your path through brutal combat, vast wilderness, sprawling cities, and the mysterious Abyss.",
    coverImage: STEAM(STEAM_IDS.crimsonDesert),
    heroImage:  STEAM(STEAM_IDS.crimsonDesert),
    bannerImage: STEAM(STEAM_IDS.crimsonDesert),
    trailerYouTubeId: "VWIw_f8e9Pg",
    platforms: [],
    genres: ["Action", "RPG", "Open World", "Fantasy"],
    rating: 4.5,
    reviewCount: 28400,
    releaseDate: "2026-03-19",
    developer: "Pearl Abyss",
    publisher: "Pearl Abyss",
    featured: true,
    isNew: true,
    isTrending: true,
    variants: (() => {
      // discRate = 1 - 38/78 = 0.512820...  (kept at full precision for calc)
      const discRate = 1 - (38.00 / 78.00);
      const discPct  = Math.round(discRate * 100); // 51%
      return [
        // PC / Steam — reference (adj 0%): orig=$78.00, final=$38.00
        { id: "cd-pc-steam-global-standard",  platform: "PC / Steam",      region: "Global", edition: "Standard", price: 38.00, originalPrice: 78.00, discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "cd-pc-steam-europe-standard",  platform: "PC / Steam",      region: "Europe", edition: "Standard", price: 38.00, originalPrice: 78.00, discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        // PS5 — adj +4%
        { id: "cd-ps5-global-standard",       platform: "PlayStation 5",   region: "Global", edition: "Standard", price: r2(r2(78.00 * 1.04) * (1 - discRate)), originalPrice: r2(78.00 * 1.04), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "cd-ps5-europe-standard",       platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: r2(r2(78.00 * 1.04) * (1 - discRate)), originalPrice: r2(78.00 * 1.04), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        // Xbox — adj +4%
        { id: "cd-xbox-global-standard",      platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(78.00 * 1.04) * (1 - discRate)), originalPrice: r2(78.00 * 1.04), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "cd-xbox-europe-standard",      platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(78.00 * 1.04) * (1 - discRate)), originalPrice: r2(78.00 * 1.04), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
      ];
    })(),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 8 — WARDOGS
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: Wikipedia / gameboost / supercraft, Sep 2026):
  //   ✓ PC / Steam   — Steam Early Access from 10 Sep 2026
  //   ✗ PS5          — planned for 2028; NOT listed
  //   ✗ Xbox         — planned for 2028; NOT listed
  //   Product type: Steam Digital Key (confirmed per catalogue)
  //
  // PRICING (authorised):
  //   Base original: $21.02 | Discount: 3% | Final: $20.39
  //   Steam adj: 0% → orig $21.02 → final $21.02×0.97=$20.39
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "wardogs",
    slug: "wardogs",
    title: "WARDOGS",
    shortTitle: "WARDOGS",
    description:
      "A tactical all-out warfare FPS where 100 players split across three teams fight for control zones. Set in the derelict industrial mountains of Eastern Europe on a fully destructible 256 km² battlefield. Combine infantry, armour, and air support. Teamwork pays. Cash is king.",
    coverImage: "/images/game-art/wardogs-cover.jpg",
    heroImage:  STEAM(STEAM_IDS.wardogs),
    bannerImage: STEAM(STEAM_IDS.wardogs),
    trailerYouTubeId: "6NSRm5FNbjs",
    platforms: [],
    genres: ["Action", "Shooter", "FPS", "Tactical"],
    rating: 4.0,
    reviewCount: 7800,
    releaseDate: "2026-09-10",
    developer: "Bulkhead",
    publisher: "Team17",
    isNew: true,
    variants: [
      // PC / Steam only — adj 0%: orig=$21.02, disc=3%, final=$20.39
      { id: "wardogs-pc-steam-global-standard", platform: "PC / Steam", region: "Global", edition: "Standard", price: 20.39, originalPrice: 21.02, discount: 3, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "wardogs-pc-steam-europe-standard", platform: "PC / Steam", region: "Europe", edition: "Standard", price: 20.39, originalPrice: 21.02, discount: 3, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 9 — EA Sports FC 26
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: ea.com / g2a, Sep 2025):
  //   ✓ PS5           — launched 26 Sep 2025
  //   ✓ Xbox Series X|S — launched 26 Sep 2025
  //   ✓ PC / EA App   — launched 26 Sep 2025 (primary PC storefront)
  //   ✓ PC / Steam    — launched 26 Sep 2025 (Steam keys confirmed by eneba)
  //   ✗ PS4 / Xbox One / Switch — old-gen / different key type, not listed
  //
  // PRICING (authorised):
  //   Base original: $58.00 | Discount: 54.41% | Target final: $26.44
  //   discRate = 1 - 26.44/58.00 = 0.5441...
  //   PS5 adj: 0%   → orig $58.00 → final $26.44
  //   Xbox adj: +2% → orig $59.16 → final $26.97
  //   EA App adj: −5% → orig $55.10 → final $25.12
  //   Steam adj: −4% → orig $55.68 → final $25.39
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "ea-sports-fc-26",
    slug: "ea-sports-fc-26",
    title: "EA Sports FC 26",
    shortTitle: "FC 26",
    description:
      "EA Sports FC 26 delivers the most authentic football simulation ever created. With HyperMotion3 technology, real-world motion data from thousands of professional players brings every match to life. Build your ultimate squad in Ultimate Team, manage your club in Career Mode, or compete online in Clubs.",
    coverImage: BANNERS.fc26.cover,
    heroImage:  BANNERS.fc26.hero,
    bannerImage: BANNERS.fc26.banner,
    trailerYouTubeId: "TSi0iJYSQ24",
    platforms: [],
    genres: ["Sports", "Football", "Simulation"],
    rating: 4.3,
    reviewCount: 2841,
    releaseDate: "2025-09-26",
    developer: "EA Vancouver",
    publisher: "Electronic Arts",
    featured: true,
    isTrending: true,
    variants: (() => {
      const discRate = 1 - (26.44 / 58.00);
      const discPct  = Math.round(discRate * 100); // 54%
      return [
        // PS5 — reference (adj 0%): orig=$58.00, final=$26.44
        { id: "fc26-ps5-global-standard",    platform: "PlayStation 5",   region: "Global", edition: "Standard", price: 26.44, originalPrice: 58.00, discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "fc26-ps5-europe-standard",    platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: 26.44, originalPrice: 58.00, discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        // Xbox — adj +2%
        { id: "fc26-xbox-global-standard",   platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(58.00 * 1.02) * (1 - discRate)), originalPrice: r2(58.00 * 1.02), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "fc26-xbox-europe-standard",   platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(58.00 * 1.02) * (1 - discRate)), originalPrice: r2(58.00 * 1.02), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        // EA App — adj −5%
        { id: "fc26-pc-ea-global-standard",  platform: "PC / EA App",     region: "Global", edition: "Standard", price: r2(r2(58.00 * 0.95) * (1 - discRate)), originalPrice: r2(58.00 * 0.95), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "fc26-pc-ea-europe-standard",  platform: "PC / EA App",     region: "Europe", edition: "Standard", price: r2(r2(58.00 * 0.95) * (1 - discRate)), originalPrice: r2(58.00 * 0.95), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        // Steam — adj −4%
        { id: "fc26-pc-steam-global-standard", platform: "PC / Steam",    region: "Global", edition: "Standard", price: r2(r2(58.00 * 0.96) * (1 - discRate)), originalPrice: r2(58.00 * 0.96), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "fc26-pc-steam-europe-standard", platform: "PC / Steam",    region: "Europe", edition: "Standard", price: r2(r2(58.00 * 0.96) * (1 - discRate)), originalPrice: r2(58.00 * 0.96), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
      ];
    })(),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 10 — Silent Hill 2 (2024 Remake)
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: Konami / Wikipedia / game8, Oct 2024 & Nov 2025):
  //   ✓ PS5               — launched 8 Oct 2024
  //   ✓ PC / Steam        — launched 8 Oct 2024
  //   ✓ Xbox Series X|S   — launched 21 Nov 2025 (delayed port confirmed by Konami)
  //
  // PRICING (authorised):
  //   Base original: $55.00 | Discount: 35% | Final: $35.75
  //   PS5 adj: 0%  → orig $55.00 → final $35.75
  //   Steam adj: −3% → orig $53.35 → final $34.68
  //   Xbox adj: +2% → orig $56.10 → final $36.47
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "silent-hill-2-remake",
    slug: "silent-hill-2",
    title: "Silent Hill 2",
    shortTitle: "Silent Hill 2",
    description:
      "The definitive psychological horror experience, rebuilt from the ground up. Return to Silent Hill as James Sunderland searches for his deceased wife in a fog-covered town filled with grotesque monsters and terrifying revelations. Bloober Team's remake delivers modern graphics and refined gameplay while honouring the iconic original.",
    coverImage: BANNERS.silentHill.cover,
    heroImage:  BANNERS.silentHill.hero,
    bannerImage: BANNERS.silentHill.banner,
    trailerYouTubeId: "rGGegvMwQGI",
    platforms: [],
    genres: ["Horror", "Survival", "Psychological"],
    rating: 4.7,
    reviewCount: 3124,
    releaseDate: "2024-10-08",
    developer: "Bloober Team",
    publisher: "Konami",
    featured: true,
    variants: [
      // PS5 — reference (adj 0%): orig=$55.00, disc=35%, final=$35.75
      { id: "sh2-ps5-global-standard",         platform: "PlayStation 5",   region: "Global", edition: "Standard", price: 35.75, originalPrice: 55.00, discount: 35, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "sh2-ps5-europe-standard",         platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: 35.75, originalPrice: 55.00, discount: 35, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // PC / Steam — adj −3%: orig=$55.00×0.97=$53.35, final=$53.35×0.65=$34.68
      { id: "sh2-pc-steam-global-standard",    platform: "PC / Steam",      region: "Global", edition: "Standard", price: r2(r2(55.00 * 0.97) * 0.65), originalPrice: r2(55.00 * 0.97), discount: 35, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "sh2-pc-steam-europe-standard",    platform: "PC / Steam",      region: "Europe", edition: "Standard", price: r2(r2(55.00 * 0.97) * 0.65), originalPrice: r2(55.00 * 0.97), discount: 35, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // Xbox — adj +2%: orig=$55.00×1.02=$56.10, final=$56.10×0.65=$36.47
      { id: "sh2-xbox-global-standard",        platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(55.00 * 1.02) * 0.65), originalPrice: r2(55.00 * 1.02), discount: 35, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "sh2-xbox-europe-standard",        platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(55.00 * 1.02) * 0.65), originalPrice: r2(55.00 * 1.02), discount: 35, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 11 — Call of Duty: Modern Warfare 4
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: callofduty.com / xbox.com / Wikipedia, Oct 2026):
  //   ✓ PC / Steam        — launched 23 Oct 2026
  //   ✓ PC / Battle.net   — launched 23 Oct 2026
  //   ✓ PS5               — launched 23 Oct 2026
  //   ✓ Xbox Series X|S   — launched 23 Oct 2026 (Xbox Play Anywhere title)
  //   Note: This catalogue lists the Steam key and PS5 key products.
  //         Battle.net keys exist but are sold separately on that storefront.
  //
  // PRICING (authorised):
  //   Base original: $66.00 | Discount: 15% | Final: $56.10
  //   Steam adj: 0%  → orig $66.00 → final $56.10
  //   PS5 adj: +5%   → orig $69.30 → final $58.91
  //   Xbox adj: +3%  → orig $67.98 → final $57.78
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "call-of-duty-mw4",
    slug: "call-of-duty-modern-warfare-4",
    title: "Call of Duty: Modern Warfare 4",
    shortTitle: "MW4",
    description:
      "Call of Duty: Modern Warfare 4 returns with an explosive campaign, refined multiplayer, and an expanded Warzone experience. Experience next-generation warfare across iconic global locations with best-in-class gunplay and deeply rewarding progression systems.",
    coverImage: BANNERS.codMw4.cover,
    heroImage:  BANNERS.codMw4.hero,
    bannerImage: BANNERS.codMw4.banner,
    trailerYouTubeId: "a8AjZBCRdKU",
    platforms: [],
    genres: ["Action", "Shooter", "FPS"],
    rating: 4.4,
    reviewCount: 5672,
    releaseDate: "2026-10-23",
    developer: "Infinity Ward",
    publisher: "Activision",
    featured: true,
    isTrending: true,
    variants: [
      // PC / Steam — reference (adj 0%): orig=$66.00, disc=15%, final=$56.10
      { id: "mw4-pc-steam-global-standard",  platform: "PC / Steam",      region: "Global", edition: "Standard", price: 56.10, originalPrice: 66.00, discount: 15, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "mw4-pc-steam-europe-standard",  platform: "PC / Steam",      region: "Europe", edition: "Standard", price: 56.10, originalPrice: 66.00, discount: 15, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // PS5 — adj +5%: orig=$66.00×1.05=$69.30, final=$69.30×0.85=$58.91
      { id: "mw4-ps5-global-standard",       platform: "PlayStation 5",   region: "Global", edition: "Standard", price: r2(r2(66.00 * 1.05) * 0.85), originalPrice: r2(66.00 * 1.05), discount: 15, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "mw4-ps5-europe-standard",       platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: r2(r2(66.00 * 1.05) * 0.85), originalPrice: r2(66.00 * 1.05), discount: 15, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // Xbox — adj +3%: orig=$66.00×1.03=$67.98, final=$67.98×0.85=$57.78
      { id: "mw4-xbox-global-standard",      platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(66.00 * 1.03) * 0.85), originalPrice: r2(66.00 * 1.03), discount: 15, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "mw4-xbox-europe-standard",      platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(66.00 * 1.03) * 0.85), originalPrice: r2(66.00 * 1.03), discount: 15, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 12 — NBA 2K27
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: 2k.com / nba.2k.com / gematsu, Sep 2026):
  //   ✓ PS5               — launched 4 Sep 2026
  //   ✓ Xbox Series X|S   — launched 4 Sep 2026
  //   ✓ PC / Steam        — launched 4 Sep 2026
  //   Note: also on Switch 2, but different key type; not listed here.
  //
  // PRICING (authorised):
  //   Base original: $62.00 | Discount: 26% | Final: $45.88
  //   PS5 adj: 0%  → orig $62.00 → final $45.88 (=$62.00×0.74=$45.88)
  //   Xbox adj: +2% → orig $63.24 → final $46.80
  //   Steam adj: −4% → orig $59.52 → final $44.04
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "nba-2k27",
    slug: "nba-2k27",
    title: "NBA 2K27",
    shortTitle: "NBA 2K27",
    description:
      "Ball over everything. Chase greatness around the clock in MyCAREER, MyTEAM, and MyNBA. Put The City on your back and lead the next generation of MyPLAYERs. For the first time in MyCAREER, play through NBA history and compete against legends from five iconic eras.",
    coverImage: "/images/game-art/nba-2k27-cover.jpg",
    heroImage:  STEAM(STEAM_IDS.nba2k27),
    bannerImage: STEAM(STEAM_IDS.nba2k27),
    trailerYouTubeId: "vQ2jNNbh1TU",
    platforms: [],
    genres: ["Sports", "Basketball", "Simulation"],
    rating: 4.3,
    reviewCount: 21000,
    releaseDate: "2026-09-04",
    developer: "Visual Concepts",
    publisher: "2K Sports",
    isTrending: true,
    variants: [
      // PS5 — reference (adj 0%): orig=$62.00, disc=26%, final=$45.88
      { id: "nba2k27-ps5-global-standard",       platform: "PlayStation 5",   region: "Global", edition: "Standard", price: 45.88, originalPrice: 62.00, discount: 26, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "nba2k27-ps5-europe-standard",       platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: 45.88, originalPrice: 62.00, discount: 26, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // Xbox — adj +2%: orig=$62.00×1.02=$63.24, final=$63.24×0.74=$46.80
      { id: "nba2k27-xbox-global-standard",      platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(62.00 * 1.02) * 0.74), originalPrice: r2(62.00 * 1.02), discount: 26, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "nba2k27-xbox-europe-standard",      platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(62.00 * 1.02) * 0.74), originalPrice: r2(62.00 * 1.02), discount: 26, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // PC / Steam — adj −4%: orig=$62.00×0.96=$59.52, final=$59.52×0.74=$44.04
      { id: "nba2k27-pc-steam-global-standard",  platform: "PC / Steam",      region: "Global", edition: "Standard", price: r2(r2(62.00 * 0.96) * 0.74), originalPrice: r2(62.00 * 0.96), discount: 26, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "nba2k27-pc-steam-europe-standard",  platform: "PC / Steam",      region: "Europe", edition: "Standard", price: r2(r2(62.00 * 0.96) * 0.74), originalPrice: r2(62.00 * 0.96), discount: 26, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 13 — Star Wars: Galactic Racer
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: wearesecretmode.com / gematsu / dotesports, Oct 2026):
  //   ✓ PC / Steam        — launched 6 Oct 2026
  //   ✓ PS5               — launched 6 Oct 2026
  //   ✓ Xbox Series X|S   — launched 6 Oct 2026
  //   Note: "Star Wars Racer" in instructions = "Star Wars: Galactic Racer"
  //         (Fuse Games / Secret Mode / Lucasfilm Games, 2026 release confirmed)
  //
  // PRICING (authorised):
  //   Base original: $56.00 | Target final: $53.00 | Effective discount: 5.36%
  //   discRate = 1 - 53/56 = 0.053571...
  //   Steam adj: 0%  → orig $56.00 → final $53.00
  //   PS5 adj: +5%   → orig $56.00×1.05=$58.80 → final=$58.80×0.946429=$55.65
  //   Xbox adj: +4%  → orig $56.00×1.04=$58.24 → final=$58.24×0.946429=$55.12
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "star-wars-galactic-racer",
    slug: "star-wars-galactic-racer",
    title: "Star Wars: Galactic Racer",
    shortTitle: "SW: Galactic Racer",
    description:
      "A runs-based, high-stakes reinvention of racing born in the lawless Outer Rim. With the Empire gone and the galaxy rebuilding, the Galactic League is created: an underground, unsanctioned circuit where syndicates bankroll chaos and champions are forged. Race podracers, repulsorcraft, landspeeders and more.",
    coverImage: "/images/game-art/sw-galactic-racer-cover.jpg",
    heroImage:  STEAM(STEAM_IDS.swGalacticRacer),
    bannerImage: STEAM(STEAM_IDS.swGalacticRacer),
    trailerYouTubeId: "pR-V3j-sc7s",
    platforms: [],
    genres: ["Racing", "Action", "Sci-Fi"],
    rating: 4.2,
    reviewCount: 9800,
    releaseDate: "2026-10-06",
    developer: "Fuse Games",
    publisher: "Secret Mode",
    isNew: true,
    isTrending: true,
    variants: (() => {
      const discRate = 1 - (53.00 / 56.00);
      const discPct  = Math.round(discRate * 100); // 5%
      return [
        // PC / Steam — reference (adj 0%): orig=$56.00, final=$53.00
        { id: "swgr-pc-steam-global-standard",  platform: "PC / Steam",      region: "Global", edition: "Standard", price: 53.00, originalPrice: 56.00, discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "swgr-pc-steam-europe-standard",  platform: "PC / Steam",      region: "Europe", edition: "Standard", price: 53.00, originalPrice: 56.00, discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        // PS5 — adj +5%
        { id: "swgr-ps5-global-standard",       platform: "PlayStation 5",   region: "Global", edition: "Standard", price: r2(r2(56.00 * 1.05) * (1 - discRate)), originalPrice: r2(56.00 * 1.05), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "swgr-ps5-europe-standard",       platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: r2(r2(56.00 * 1.05) * (1 - discRate)), originalPrice: r2(56.00 * 1.05), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        // Xbox — adj +4%
        { id: "swgr-xbox-global-standard",      platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(56.00 * 1.04) * (1 - discRate)), originalPrice: r2(56.00 * 1.04), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "swgr-xbox-europe-standard",      platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(56.00 * 1.04) * (1 - discRate)), originalPrice: r2(56.00 * 1.04), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
      ];
    })(),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 14 — Final Fantasy Resonance
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: square-enix.com press release / finalfantasy.com, Oct 2026):
  //   ✓ PC / Steam        — launched 22 Oct 2026
  //   ✓ PS5               — launched 22 Oct 2026
  //   ✓ Xbox Series X|S   — launched 22 Oct 2026
  //   Note: also on Switch and Switch 2 — different key type, not listed here.
  //         Official title: "FINAL FANTASY RESONANCE" (Square Enix / LANCARSE)
  //
  // PRICING (authorised):
  //   Base original: $105.00 | Target final: $99.00 | Effective discount: 5.71%
  //   discRate = 1 - 99/105 = 0.057142...
  //   Steam adj: 0%  → orig $105.00 → final $99.00
  //   PS5 adj: +6%   → orig $105.00×1.06=$111.30 → final=$111.30×0.942857=$104.98
  //   Xbox adj: +4%  → orig $105.00×1.04=$109.20 → final=$109.20×0.942857=$102.96
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "final-fantasy-resonance",
    slug: "final-fantasy-resonance",
    title: "Final Fantasy Resonance",
    shortTitle: "FF Resonance",
    description:
      "The first HD-2D Final Fantasy game, based on the first story arc of Final Fantasy Brave Exvius. Travel with companions bound by fate and call on Visions to aid you in battle to uncover the truth behind a force that threatens to bring everything to ruin.",
    coverImage: "/images/game-art/ff-resonance-cover.jpg",
    heroImage:  STEAM(STEAM_IDS.ffResonance),
    bannerImage: STEAM(STEAM_IDS.ffResonance),
    trailerYouTubeId: "DaBVsTL8TNE",
    platforms: [],
    genres: ["RPG", "Turn-Based", "Fantasy"],
    rating: 4.4,
    reviewCount: 5200,
    releaseDate: "2026-10-22",
    developer: "Square Enix & Lancarse",
    publisher: "Square Enix",
    isNew: true,
    isTrending: true,
    variants: (() => {
      const discRate = 1 - (99.00 / 105.00);
      const discPct  = Math.round(discRate * 100); // 6%
      return [
        // PC / Steam — reference (adj 0%): orig=$105.00, final=$99.00
        { id: "ffr-pc-steam-global-standard",  platform: "PC / Steam",      region: "Global", edition: "Standard", price: 99.00, originalPrice: 105.00, discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "ffr-pc-steam-europe-standard",  platform: "PC / Steam",      region: "Europe", edition: "Standard", price: 99.00, originalPrice: 105.00, discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        // PS5 — adj +6%
        { id: "ffr-ps5-global-standard",       platform: "PlayStation 5",   region: "Global", edition: "Standard", price: r2(r2(105.00 * 1.06) * (1 - discRate)), originalPrice: r2(105.00 * 1.06), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "ffr-ps5-europe-standard",       platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: r2(r2(105.00 * 1.06) * (1 - discRate)), originalPrice: r2(105.00 * 1.06), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        // Xbox — adj +4%
        { id: "ffr-xbox-global-standard",      platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(105.00 * 1.04) * (1 - discRate)), originalPrice: r2(105.00 * 1.04), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
        { id: "ffr-xbox-europe-standard",      platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(105.00 * 1.04) * (1 - discRate)), originalPrice: r2(105.00 * 1.04), discount: discPct, deliveryType: "DIGITAL_CODE" as const, availability: "IN_STOCK" as const, inStock: true },
      ];
    })(),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME 15 — Planet Zoo 2
  // ───────────────────────────────────────────────────────────────────────────
  // VERIFIED PLATFORMS (source: planetzoogame.com / Wikipedia / Forbes, Oct 2026):
  //   ✓ PC / Steam        — launched 13 Oct 2026
  //   ✓ PS5               — launched 13 Oct 2026
  //   ✓ Xbox Series X|S   — launched 13 Oct 2026
  //
  // PRICING (authorised):
  //   Base original: $72.00 | Discount: 66% | Final: $24.48
  //   Steam adj: 0%  → orig $72.00 → final $72.00×0.34=$24.48
  //   PS5 adj: +7%   → orig $72.00×1.07=$77.04 → final=$77.04×0.34=$26.19
  //   Xbox adj: +7%  → same as PS5
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "planet-zoo-2",
    slug: "planet-zoo-2",
    title: "Planet Zoo 2",
    shortTitle: "Planet Zoo 2",
    description:
      "Build a wilder world. Create distinctive zoos around the globe filled with awe-inspiring animals, including fully aquatic and flying species. Design habitats, manage welfare, and release animals into expansive Wildlife Reserves in the ultimate zoo simulation.",
    coverImage: "/images/game-art/planet-zoo-2-cover.jpg",
    heroImage:  STEAM(STEAM_IDS.planetZoo2),
    bannerImage: STEAM(STEAM_IDS.planetZoo2),
    trailerYouTubeId: "_zqLJeOiFbE",
    platforms: [],
    genres: ["Simulation", "Management", "Building"],
    rating: 4.5,
    reviewCount: 15600,
    releaseDate: "2026-10-13",
    developer: "Frontier Developments",
    publisher: "Frontier Developments",
    isNew: true,
    variants: [
      // PC / Steam — reference (adj 0%): orig=$72.00, disc=66%, final=$24.48
      { id: "pz2-pc-steam-global-standard",  platform: "PC / Steam",      region: "Global", edition: "Standard", price: 24.48, originalPrice: 72.00, discount: 66, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "pz2-pc-steam-europe-standard",  platform: "PC / Steam",      region: "Europe", edition: "Standard", price: 24.48, originalPrice: 72.00, discount: 66, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // PS5 — adj +7%: orig=$72.00×1.07=$77.04, final=$77.04×0.34=$26.19
      { id: "pz2-ps5-global-standard",       platform: "PlayStation 5",   region: "Global", edition: "Standard", price: r2(r2(72.00 * 1.07) * 0.34), originalPrice: r2(72.00 * 1.07), discount: 66, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "pz2-ps5-europe-standard",       platform: "PlayStation 5",   region: "Europe", edition: "Standard", price: r2(r2(72.00 * 1.07) * 0.34), originalPrice: r2(72.00 * 1.07), discount: 66, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      // Xbox — adj +7%
      { id: "pz2-xbox-global-standard",      platform: "Xbox Series X|S", region: "Global", edition: "Standard", price: r2(r2(72.00 * 1.07) * 0.34), originalPrice: r2(72.00 * 1.07), discount: 66, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
      { id: "pz2-xbox-europe-standard",      platform: "Xbox Series X|S", region: "Europe", edition: "Standard", price: r2(r2(72.00 * 1.07) * 0.34), originalPrice: r2(72.00 * 1.07), discount: 66, deliveryType: "DIGITAL_CODE", availability: "IN_STOCK", inStock: true },
    ],
  },

];

// ─── Hero Slides ─────────────────────────────────────────────────────────────

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "hero-gtavi",
    gameSlug: "grand-theft-auto-vi",
    title: "GRAND THEFT AUTO VI",
    subtitle: "OUT NOW",
    tagline: "Return to Leonida.",
    heroImage: "/images/banners/GTA-BANNER.png",
    ctaText: "BUY NOW",
    ctaLink: "/games/grand-theft-auto-vi",
    accentColor: "#c026d3",
    imagePosition: "center center",
    hideOverlayText: true,
  },
  {
    id: "hero-fc27",
    gameSlug: "ea-sports-fc-27",
    title: "EA SPORTS FC 27",
    subtitle: "THE NEXT LEVEL",
    tagline: "Feel every moment.",
    heroImage: "/images/banners/FC27-banner.png",
    ctaText: "BUY NOW",
    ctaLink: "/games/ea-sports-fc-27",
    accentColor: "#10b981",
    imagePosition: "center top",
    containImage: false,
  },
  {
    id: "hero-pbz",
    gameSlug: "phantom-blade-zero",
    title: "PHANTOM BLADE ZERO",
    subtitle: "MARTIAL FURY",
    tagline: "Master the blade. Defy death.",
    heroImage: "/images/banners/PHANTHOM-BANNER.png",
    ctaText: "BUY NOW",
    ctaLink: "/games/phantom-blade-zero",
    accentColor: "#3b82f6",
    imagePosition: "65% center",
  },
  {
    id: "hero-sh2",
    gameSlug: "silent-hill-2",
    title: "SILENT HILL 2",
    subtitle: "HORROR REMADE",
    tagline: "The fog calls you back.",
    heroImage: "/images/banners/SILENT-BANNER.png",
    ctaText: "BUY NOW",
    ctaLink: "/games/silent-hill-2",
    accentColor: "#dc2626",
    imagePosition: "center center",
  },
  {
    id: "hero-mw4",
    gameSlug: "call-of-duty-modern-warfare-4",
    title: "MODERN WARFARE 4",
    subtitle: "THE NEXT OPERATION",
    tagline: "Fight the war others can't.",
    heroImage: "/images/banners/cod-mw4-banner.jpg",
    ctaText: "BUY NOW",
    ctaLink: "/games/call-of-duty-modern-warfare-4",
    accentColor: "#f59e0b",
    imagePosition: "center center",
  },
];

// ─── Query helpers ────────────────────────────────────────────────────────────

export function getGameBySlug(slug: string): Game | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export function getFeaturedGames(): Game[] {
  return GAMES.filter((g) => g.featured);
}

export function getTrendingGames(): Game[] {
  return GAMES.filter((g) => g.isTrending);
}

export function getLowestPrice(game: Game): number {
  if (!game.variants.length) return 0;
  return Math.min(...game.variants.map((v) => v.price));
}

export function getBestDiscount(game: Game): number {
  if (!game.variants.length) return 0;
  return Math.max(...game.variants.map((v) => v.discount ?? 0));
}
