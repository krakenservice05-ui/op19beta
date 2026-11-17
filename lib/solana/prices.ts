/**
 * Price oracle — lib/solana/prices.ts
 *
 * Fetches live USD prices for SOL, USDT, USDC from CoinGecko's free public API.
 * Used server-side when creating an order to lock the exchange rate.
 *
 * SERVER-SIDE ONLY — imported by API routes, never by client components.
 */

import "server-only";
import type { SolanaAsset } from "@/types/checkout";

export interface AssetPrice {
  asset:    SolanaAsset;
  usdPrice: number;
  /** Unix timestamp (ms) when this price was fetched */
  fetchedAt: number;
}

// CoinGecko IDs for each asset
const COINGECKO_IDS: Record<SolanaAsset, string> = {
  SOL:  "solana",
  USDT: "tether",
  USDC: "usd-coin",
};

// Stablecoins are always $1 — only fetch SOL dynamically
const STABLECOIN_PRICE = 1.0;

/**
 * Fetch the current USD price for a given asset.
 * Falls back gracefully: stablecoins return 1.0 without a network call.
 * SOL fetches from CoinGecko with a 10s timeout.
 */
export async function fetchAssetPrice(asset: SolanaAsset): Promise<AssetPrice> {
  // Stablecoins: price is always $1 by design
  if (asset === "USDT" || asset === "USDC") {
    return { asset, usdPrice: STABLECOIN_PRICE, fetchedAt: Date.now() };
  }

  const id = COINGECKO_IDS[asset];
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/json" },
      // No-store: always want the freshest price at order creation
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`CoinGecko responded with ${res.status}`);
    }

    const data = (await res.json()) as Record<string, { usd?: number }>;
    const usdPrice = data[id]?.usd;

    if (!usdPrice || usdPrice <= 0) {
      throw new Error(`Invalid price data for ${asset}: ${JSON.stringify(data)}`);
    }

    return { asset, usdPrice, fetchedAt: Date.now() };
  } catch (err) {
    throw new Error(
      `Failed to fetch price for ${asset}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Convert a USD amount to the asset's smallest unit.
 *
 * For SOL:        result is in lamports  (1 SOL = 1_000_000_000 lamports)
 * For USDT/USDC:  result is in micro-tokens (1 USDT = 1_000_000 micro-USDT, 6 decimals)
 *
 * Returns a BigInt to avoid floating-point precision loss.
 */
export function usdToSmallestUnit(
  usdAmount: number,
  asset: SolanaAsset,
  usdPrice: number
): bigint {
  const decimals = asset === "SOL" ? 9 : 6;
  const assetAmount = usdAmount / usdPrice;
  // Multiply by 10^decimals and round to nearest integer
  const smallestUnit = Math.round(assetAmount * Math.pow(10, decimals));
  return BigInt(smallestUnit);
}

/**
 * Format a smallest-unit amount back to a human-readable string.
 * e.g. 745_300_000 lamports → "0.7453" SOL
 */
export function formatSmallestUnit(
  amount: bigint,
  asset: SolanaAsset
): string {
  const decimals = asset === "SOL" ? 9 : 6;
  const divisor = BigInt(Math.pow(10, decimals));
  const whole = amount / divisor;
  const frac  = amount % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "") || "0";
  return `${whole}.${fracStr}`;
}
