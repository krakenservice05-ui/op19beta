/**
 * Server-side environment variable validation — lib/env.ts
 *
 * Centralises all environment variable access and validates at startup.
 * Import this instead of reading process.env directly in server code.
 *
 * SERVER-ONLY. Never import in client components.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const rpc = env.SOLANA_RPC_URL;
 */

import "server-only";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "" || value.includes("YOUR_") || value.startsWith("REPLACE_")) {
    throw new Error(
      `[Elite Games] Missing or unconfigured environment variable: ${key}\n` +
        `Add ${key}=<value> to your .env.local file. See .env.example for guidance.`
    );
  }
  return value.trim();
}

function optionalEnv(key: string, fallback: string | null): string | null {
  const value = process.env[key];
  if (!value || value.trim() === "" || value.includes("YOUR_") || value.startsWith("REPLACE_")) return fallback;
  return value.trim();
}

export const env = {
  // ── Payment intent signing ──────────────────────────────────────────────────
  // Used to sign and verify payment intents. Must be at least 32 chars.
  // Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  PAYMENT_SECRET: requireEnv("PAYMENT_SECRET"),

  // ── Solana RPC ─────────────────────────────────────────────────────────────
  SOLANA_RPC_URL: requireEnv("SOLANA_RPC_URL"),

  // ── Solana Network ─────────────────────────────────────────────────────────
  SOLANA_NETWORK: optionalEnv("SOLANA_NETWORK", "mainnet-beta") as
    | "mainnet-beta"
    | "devnet"
    | "testnet",

  // ── Treasury Wallet ────────────────────────────────────────────────────────
  // Elite Games receiving wallet: 2zjwht9zxHA7zeM2kXtcKH6wcbF3KG7Ep6FKzzjyKcLj
  // Valid Ed25519 pubkey, verified on Solana Mainnet.
  // NOTE: Wallet not yet funded on-chain — must receive SOL before ATAs can be created.
  TREASURY_WALLET_ADDRESS: requireEnv("TREASURY_WALLET_ADDRESS"),

  // ── Treasury SPL Token Accounts ────────────────────────────────────────────
  // Set to null when not configured — the transfer code skips USDT/USDC
  // gracefully when these are absent (SOL-only mode).
  TREASURY_USDT_TOKEN_ACCOUNT: optionalEnv(
    "TREASURY_USDT_TOKEN_ACCOUNT",
    null
  ),
  TREASURY_USDC_TOKEN_ACCOUNT: optionalEnv(
    "TREASURY_USDC_TOKEN_ACCOUNT",
    null
  ),
} as const;

export type Env = typeof env;
