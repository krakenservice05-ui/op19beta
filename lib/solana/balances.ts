/**
 * Balance fetching utilities — lib/solana/balances.ts
 *
 * CLIENT-SIDE ONLY. Fetches SOL, USDT, USDC balances for a given wallet address.
 *
 * Token identification is ALWAYS by mint address, never by name or symbol.
 * Mint addresses are sourced from lib/solana/constants.ts.
 *
 * RPC endpoint priority:
 *   1. NEXT_PUBLIC_SOLANA_RPC_URL (custom endpoint, highest priority)
 *   2. Public mainnet/devnet endpoint (fallback)
 *
 * Uses the same endpoint as SolanaProvider so wallet-adapter and
 * balance fetching are consistent.
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  SOLANA_ASSETS,
  getMintAddress,
  RPC_DEVNET,
  RPC_MAINNET,
  SOL_DECIMALS,
} from "./constants";
import type { SolanaAssetSymbol, SolanaNetwork } from "./constants";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AssetBalance {
  symbol:        SolanaAssetSymbol;
  label:         string;
  /** Human-readable balance — never rounds small non-zero values to zero */
  balance:       string;
  /** Raw decimal balance for arithmetic (e.g. 1.5 for 1.5 SOL) */
  balanceRaw:    number;
  decimals:      number;
  /** Mint address used for identification (null for SOL) */
  mintAddress:   string | null;
  /** Whether the token account exists on-chain (always true for SOL) */
  accountExists: boolean;
}

export interface WalletBalances {
  sol:  AssetBalance;
  usdt: AssetBalance;
  usdc: AssetBalance;
}

export type BalanceFetchStatus = "idle" | "loading" | "success" | "error";

// ── RPC connection ────────────────────────────────────────────────────────────

/**
 * Creates a Connection using the configured RPC endpoint.
 * Respects NEXT_PUBLIC_SOLANA_RPC_URL so custom RPC nodes (Helius, QuickNode)
 * are used for balance fetching — same as the wallet-adapter connection.
 */
export function getClientConnection(network: SolanaNetwork): Connection {
  // Connection requires a full http(s):// URL.
  // On the client, build an absolute URL from window.location.origin so the
  // Helius API key stays server-side and never appears in browser requests.
  let endpoint: string;
  if (typeof window !== "undefined") {
    endpoint = window.location.origin + "/api/rpc";
  } else {
    endpoint = process.env.SOLANA_RPC_URL ??
      (network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET);
  }

  return new Connection(endpoint, {
    commitment: "confirmed",
    disableRetryOnRateLimit: true,
  });
}

// ── Balance formatters ────────────────────────────────────────────────────────

/**
 * Format a raw lamport/micro-token integer to a human-readable string.
 * - Exact zero → "0"
 * - Very small non-zero → full precision (never rounded to "0.000000")
 * - Normal amounts → up to 6 decimal places, trailing zeros trimmed
 */
function formatBalance(raw: number, decimals: number): string {
  if (raw === 0) return "0";
  const divisor = Math.pow(10, decimals);
  const value   = raw / divisor;

  // Show full precision for sub-micro amounts (e.g. 1 lamport = 0.000000001 SOL)
  if (value > 0 && value < 0.000001) {
    return value.toFixed(decimals);
  }

  // Up to 6 decimal places, trim trailing zeros (keep minimum 2 for readability)
  const fixed = value.toFixed(Math.min(decimals, 6));
  return fixed.replace(/(\.\d{2,}?)0+$/, "$1");
}

// ── SOL balance ───────────────────────────────────────────────────────────────

async function fetchSolBalance(
  connection: Connection,
  walletAddress: string
): Promise<AssetBalance> {
  const cfg      = SOLANA_ASSETS.SOL;
  const pubkey   = new PublicKey(walletAddress);
  const lamports = await connection.getBalance(pubkey, "confirmed");

  return {
    symbol:        "SOL",
    label:         cfg.label,
    balance:       formatBalance(lamports, SOL_DECIMALS),
    balanceRaw:    lamports / LAMPORTS_PER_SOL,
    decimals:      SOL_DECIMALS,
    mintAddress:   null,
    accountExists: true,
  };
}

// ── SPL token balance ─────────────────────────────────────────────────────────

async function fetchSplBalance(
  connection: Connection,
  walletAddress: string,
  symbol: "USDT" | "USDC",
  network: SolanaNetwork
): Promise<AssetBalance> {
  const cfg         = SOLANA_ASSETS[symbol];
  const mintAddress = getMintAddress(symbol, network);

  if (!mintAddress) {
    return {
      symbol,
      label:         cfg.label,
      balance:       "0",
      balanceRaw:    0,
      decimals:      cfg.decimals,
      mintAddress:   null,
      accountExists: false,
    };
  }

  const walletPubkey = new PublicKey(walletAddress);
  const mintPubkey   = new PublicKey(mintAddress);

  // Derive the ATA for this wallet + mint
  const ata = getAssociatedTokenAddressSync(
    mintPubkey,
    walletPubkey,
    false,
    TOKEN_PROGRAM_ID
  );

  try {
    const tokenAccount = await getAccount(connection, ata, "confirmed", TOKEN_PROGRAM_ID);
    const rawAmount    = Number(tokenAccount.amount);

    return {
      symbol,
      label:         cfg.label,
      balance:       formatBalance(rawAmount, cfg.decimals),
      balanceRaw:    rawAmount / Math.pow(10, cfg.decimals),
      decimals:      cfg.decimals,
      mintAddress,
      accountExists: true,
    };
  } catch (err: unknown) {
    // Account does not exist — wallet has never held this token
    const isNotFound =
      err instanceof Error &&
      (err.message.includes("could not find account") ||
       err.message.includes("TokenAccountNotFoundError") ||
       err.message.includes("Invalid account owner") ||
       err.name === "TokenAccountNotFoundError");

    if (isNotFound) {
      return {
        symbol,
        label:         cfg.label,
        balance:       "0",
        balanceRaw:    0,
        decimals:      cfg.decimals,
        mintAddress,
        accountExists: false,
      };
    }

    // Genuine RPC or deserialization error — propagate
    throw err;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Fetch SOL, USDT, and USDC balances for a wallet address.
 * All three are fetched in parallel using independent RPC calls.
 *
 * @param walletAddress  Base58-encoded public key
 * @param network        "mainnet-beta" | "devnet" | "testnet"
 * @param existingConnection  Optional: pass the wallet-adapter Connection to
 *                            reuse the same RPC endpoint and avoid creating
 *                            a second connection.
 */
export async function fetchWalletBalances(
  walletAddress: string,
  network: SolanaNetwork,
  existingConnection?: Connection
): Promise<WalletBalances> {
  if (!walletAddress) {
    throw new Error("No wallet address provided");
  }

  // Validate address
  let pubkey: PublicKey;
  try {
    pubkey = new PublicKey(walletAddress);
    if (!PublicKey.isOnCurve(pubkey)) {
      throw new Error("Address is not on the Ed25519 curve");
    }
  } catch {
    throw new Error(`Invalid Solana wallet address: ${walletAddress}`);
  }

  // Use provided connection (from wallet-adapter) or create a fresh one
  const connection = existingConnection ?? getClientConnection(network);

  // Fetch all three in parallel — independent RPC calls
  const [sol, usdt, usdc] = await Promise.all([
    fetchSolBalance(connection, walletAddress),
    fetchSplBalance(connection, walletAddress, "USDT", network),
    fetchSplBalance(connection, walletAddress, "USDC", network),
  ]);

  return { sol, usdt, usdc };
}
