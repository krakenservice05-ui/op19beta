/**
 * Solana constants — lib/solana/constants.ts
 *
 * Token mint addresses are verified against official sources:
 *   USDT: https://solscan.io/token/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
 *   USDC: https://solscan.io/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
 *
 * These addresses are IMMUTABLE on-chain. They never change.
 * All token identification in this codebase uses mint addresses, never names.
 *
 * Safe to import in both client and server code — no secrets here.
 */

// ── Token mint addresses ───────────────────────────────────────────────────────

/** USDT (Tether USD) on Solana Mainnet — official mint */
export const USDT_MINT_MAINNET = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

/** USDC (USD Coin) on Solana Mainnet — official Circle mint */
export const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/**
 * Devnet USDC — Circle's official devnet USDC mint.
 * Used for testing. Faucet: https://faucet.circle.com
 */
export const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

/**
 * Devnet USDT — there is no official Tether devnet mint.
 * We use a well-known community test USDT mint for dev testing.
 * Replace with your own if you deploy a test mint.
 */
export const USDT_MINT_DEVNET = "BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4";

// ── Token decimals ─────────────────────────────────────────────────────────────

/** SOL has 9 decimal places (1 SOL = 1,000,000,000 lamports) */
export const SOL_DECIMALS = 9;

/** Both USDT and USDC on Solana use 6 decimal places */
export const USDT_DECIMALS = 6;
export const USDC_DECIMALS = 6;

// ── RPC endpoints ─────────────────────────────────────────────────────────────

export const RPC_MAINNET = "https://api.mainnet-beta.solana.com";
export const RPC_DEVNET  = "https://api.devnet.solana.com";

// ── Supported assets ──────────────────────────────────────────────────────────

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";
export type SolanaAssetSymbol = "SOL" | "USDT" | "USDC";

export interface SolanaAssetConfig {
  symbol:   SolanaAssetSymbol;
  label:    string;
  decimals: number;
  /** Mint address for this asset on the given network. null for native SOL. */
  mintMainnet: string | null;
  mintDevnet:  string | null;
}

export const SOLANA_ASSETS: Record<SolanaAssetSymbol, SolanaAssetConfig> = {
  SOL: {
    symbol:      "SOL",
    label:       "Solana",
    decimals:    SOL_DECIMALS,
    mintMainnet: null,
    mintDevnet:  null,
  },
  USDT: {
    symbol:      "USDT",
    label:       "Tether USD",
    decimals:    USDT_DECIMALS,
    mintMainnet: USDT_MINT_MAINNET,
    mintDevnet:  USDT_MINT_DEVNET,
  },
  USDC: {
    symbol:      "USDC",
    label:       "USD Coin",
    decimals:    USDC_DECIMALS,
    mintMainnet: USDC_MINT_MAINNET,
    mintDevnet:  USDC_MINT_DEVNET,
  },
};

/**
 * Returns the correct mint address for a given asset and network.
 * Returns null for SOL (native asset, no mint).
 */
export function getMintAddress(
  asset: SolanaAssetSymbol,
  network: SolanaNetwork
): string | null {
  const cfg = SOLANA_ASSETS[asset];
  return network === "mainnet-beta" ? cfg.mintMainnet : cfg.mintDevnet;
}
