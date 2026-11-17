/**
 * Server-side transaction verifier — lib/solana/verify.ts
 *
 * Independently verifies a Solana transaction signature on-chain.
 * Never trusts the client. Always re-fetches the transaction from RPC.
 *
 * SERVER-SIDE ONLY.
 */

import "server-only";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  ParsedTransactionWithMeta,
} from "@solana/web3.js";
import type { SolanaAsset } from "@/types/checkout";
import { getMintAddress } from "./constants";
import type { SolanaNetwork } from "./constants";

export interface VerifyResult {
  ok:        boolean;
  errorCode?: "NOT_FOUND" | "NOT_CONFIRMED" | "WRONG_RECIPIENT" | "WRONG_AMOUNT" | "WRONG_MINT" | "WRONG_SENDER" | "EXPIRED" | "RPC_ERROR";
  message?:  string;
  /** Actual amount transferred in smallest units (for audit) */
  actualAmountSmallest?: bigint;
  slot?: number;
}

/**
 * Maximum age of a transaction we'll accept (5 minutes).
 * Prevents replay of old transactions.
 */
const MAX_TX_AGE_MS = 5 * 60 * 1000;

/**
 * Allowed tolerance on amount: 0 — exact matching required.
 * Amount is computed server-side from confirmed decimals and locked in the
 * signed payment intent. No rounding discrepancy is expected or accepted.
 */
const AMOUNT_TOLERANCE_BPS = 0; // exact match required

/**
 * verifyTransactionExact — exact-match wrapper for use with payment intents.
 * Identical interface to verifyTransaction but enforces zero tolerance.
 * Exported for use by /api/orders/[orderId]/verify.
 */
export async function verifyTransactionExact(params: Parameters<typeof verifyTransaction>[0]) {
  return verifyTransaction(params);
}

export async function verifyTransaction(params: {
  connection:            Connection;
  signature:             string;
  asset:                 SolanaAsset;
  network:               SolanaNetwork;
  expectedAmountSmallest: bigint;
  expectedRecipient:     string;
  expectedTokenAccount:  string | null;
  /** If provided, the transaction's fee payer / first signer must match */
  expectedSender?:       string;
}): Promise<VerifyResult> {
  const {
    connection, signature, asset, network,
    expectedAmountSmallest, expectedRecipient, expectedTokenAccount,
    expectedSender,
  } = params;

  let tx: ParsedTransactionWithMeta | null;

  try {
    tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
  } catch (err) {
    return {
      ok: false,
      errorCode: "RPC_ERROR",
      message: `RPC error fetching transaction: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!tx) {
    return { ok: false, errorCode: "NOT_FOUND", message: "Transaction not found on-chain." };
  }

  if (tx.meta?.err) {
    return { ok: false, errorCode: "NOT_CONFIRMED", message: "Transaction failed on-chain." };
  }

  // Age check
  if (tx.blockTime) {
    const ageMs = Date.now() - tx.blockTime * 1000;
    if (ageMs > MAX_TX_AGE_MS) {
      return {
        ok: false,
        errorCode: "EXPIRED",
        message: `Transaction is too old (${Math.round(ageMs / 1000)}s). Max allowed: ${MAX_TX_AGE_MS / 1000}s.`,
      };
    }
  }

  // Sender check — verify the fee payer is the expected admin wallet
  if (expectedSender) {
    const feePayer = tx.transaction.message.accountKeys[0]?.pubkey?.toBase58();
    if (!feePayer || feePayer !== expectedSender) {
      return {
        ok: false,
        errorCode: "WRONG_SENDER",
        message: `Transaction sender mismatch. Expected ${expectedSender}, got ${feePayer ?? "unknown"}.`,
      };
    }
  }

  // ── SOL native transfer ───────────────────────────────────────────────────
  if (asset === "SOL") {
    return verifySolTransfer({
      tx, expectedAmountSmallest, expectedRecipient,
    });
  }

  // ── SPL token transfer ────────────────────────────────────────────────────
  return verifySplTransfer({
    tx, asset, network, expectedAmountSmallest, expectedTokenAccount,
  });
}

// ── SOL transfer verification ─────────────────────────────────────────────────

function verifySolTransfer(params: {
  tx:                     ParsedTransactionWithMeta;
  expectedAmountSmallest: bigint;
  expectedRecipient:      string;
}): VerifyResult {
  const { tx, expectedAmountSmallest, expectedRecipient } = params;

  const instructions = tx.transaction.message.instructions;
  let found = false;
  let actualLamports = BigInt(0);

  for (const ix of instructions) {
    if (!("parsed" in ix)) continue;
    const parsed = ix.parsed as {
      type: string;
      info: { destination: string; lamports: number; source: string };
    };

    if (
      parsed.type === "transfer" &&
      parsed.info.destination === expectedRecipient
    ) {
      actualLamports = BigInt(parsed.info.lamports);
      found = true;
      break;
    }
  }

  if (!found) {
    return {
      ok: false,
      errorCode: "WRONG_RECIPIENT",
      message: `No SOL transfer to expected treasury address ${expectedRecipient} found in transaction.`,
    };
  }

  // Amount check with tolerance
  if (!isWithinTolerance(actualLamports, expectedAmountSmallest)) {
    return {
      ok: false,
      errorCode: "WRONG_AMOUNT",
      message: `SOL amount mismatch. Expected ~${expectedAmountSmallest} lamports, got ${actualLamports}.`,
      actualAmountSmallest: actualLamports,
    };
  }

  return { ok: true, actualAmountSmallest: actualLamports, slot: tx.slot };
}

// ── SPL token transfer verification ──────────────────────────────────────────

function verifySplTransfer(params: {
  tx:                     ParsedTransactionWithMeta;
  asset:                  SolanaAsset;
  network:                SolanaNetwork;
  expectedAmountSmallest: bigint;
  expectedTokenAccount:   string | null;
}): VerifyResult {
  const { tx, asset, network, expectedAmountSmallest, expectedTokenAccount } = params;

  if (!expectedTokenAccount) {
    return { ok: false, errorCode: "WRONG_RECIPIENT", message: "No treasury token account configured." };
  }

  const expectedMint = getMintAddress(asset, network);
  if (!expectedMint) {
    return { ok: false, errorCode: "WRONG_MINT", message: `No mint configured for ${asset} on ${network}.` };
  }

  const instructions = tx.transaction.message.instructions;
  let found = false;
  let actualAmount = BigInt(0);

  for (const ix of instructions) {
    if (!("parsed" in ix)) continue;
    const parsed = ix.parsed as {
      type: string;
      info: {
        destination?: string;
        mint?:        string;
        tokenAmount?: { amount: string };
        // transferChecked uses slightly different fields
        source?: string;
      };
    };

    const isTransfer =
      parsed.type === "transfer" || parsed.type === "transferChecked";

    if (!isTransfer) continue;

    // Verify destination token account
    if (parsed.info.destination !== expectedTokenAccount) continue;

    // Verify mint (transferChecked always includes it; transfer may not)
    if (parsed.info.mint && parsed.info.mint !== expectedMint) {
      return {
        ok: false,
        errorCode: "WRONG_MINT",
        message: `Wrong token mint. Expected ${expectedMint}, got ${parsed.info.mint}.`,
      };
    }

    actualAmount = BigInt(parsed.info.tokenAmount?.amount ?? "0");
    found = true;
    break;
  }

  if (!found) {
    return {
      ok: false,
      errorCode: "WRONG_RECIPIENT",
      message: `No ${asset} transfer to expected token account ${expectedTokenAccount} found.`,
    };
  }

  if (!isWithinTolerance(actualAmount, expectedAmountSmallest)) {
    return {
      ok: false,
      errorCode: "WRONG_AMOUNT",
      message: `${asset} amount mismatch. Expected ~${expectedAmountSmallest}, got ${actualAmount}.`,
      actualAmountSmallest: actualAmount,
    };
  }

  return { ok: true, actualAmountSmallest: actualAmount, slot: tx.slot };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isWithinTolerance(actual: bigint, expected: bigint): boolean {
  if (actual >= expected) return true; // over-payment is fine
  const diff = expected - actual;
  // Allow up to AMOUNT_TOLERANCE_BPS basis points under
  const tolerance = (expected * BigInt(AMOUNT_TOLERANCE_BPS)) / BigInt(10_000);
  return diff <= tolerance;
}
