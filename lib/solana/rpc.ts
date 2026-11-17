/**
 * Solana RPC connection — lib/solana/rpc.ts
 *
 * SERVER-SIDE ONLY. This module creates a Connection using the private
 * RPC URL from environment variables. Never import this in client components.
 *
 * Client-side balance fetching uses a separate lightweight approach
 * via the public NEXT_PUBLIC_SOLANA_NETWORK variable only.
 */

import "server-only";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import type { Commitment } from "@solana/web3.js";
import { RPC_MAINNET, RPC_DEVNET } from "./constants";
import type { SolanaNetwork } from "./constants";

// ── Singleton connection (server-side) ────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __solanaConnection: Connection | undefined;
}

function buildConnection(): Connection {
  const rpcUrl  = process.env.SOLANA_RPC_URL;
  const network = (process.env.SOLANA_NETWORK ?? "devnet") as SolanaNetwork;

  // Prefer the explicit RPC URL from env; fall back to public endpoints.
  const endpoint = rpcUrl && !rpcUrl.includes("YOUR_")
    ? rpcUrl
    : network === "mainnet-beta"
      ? RPC_MAINNET
      : RPC_DEVNET;

  const commitment: Commitment = "confirmed";
  return new Connection(endpoint, { commitment, disableRetryOnRateLimit: false });
}

export const solanaConnection: Connection =
  globalThis.__solanaConnection ?? buildConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__solanaConnection = solanaConnection;
}

// ── Helpers re-exported for server-side callers ───────────────────────────────

export { clusterApiUrl };
export type { SolanaNetwork };
