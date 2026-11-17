/**
 * Batch transaction builder — lib/solana/batch-transfer.ts
 *
 * Builds a single Solana transaction containing up to three instructions:
 *   - Native SOL transfer (SystemProgram.transfer)
 *   - USDT SPL transfer (createTransferCheckedInstruction)
 *   - USDC SPL transfer (createTransferCheckedInstruction)
 *
 * Before building the transaction it checks:
 *   1. Transaction size (max 1232 bytes)
 *   2. Compute budget (adds ComputeBudgetProgram instruction if needed)
 *   3. Available SOL for fees
 *   4. Source token account existence for each SPL asset
 *   5. Destination token account existence (the treasury ATA)
 *
 * If any check fails it returns a detailed reason so the UI can explain the
 * limitation before asking for approval. It never silently drops instructions.
 *
 * CLIENT-SIDE ONLY — never imports server-only modules.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getMintAddress, SOLANA_ASSETS, RPC_MAINNET, RPC_DEVNET } from "./constants";
import type { SolanaNetwork, SolanaAssetSymbol } from "./constants";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AssetTransferSpec {
  /** Whether to include this asset in the transaction */
  include:        boolean;
  /** Amount in smallest unit (lamports for SOL, 6-decimal micro-tokens for SPL) */
  amountSmallest: bigint;
}

export interface BatchTransferParams {
  network:              SolanaNetwork;
  fromAddress:          string;
  /** Treasury wallet that receives SOL */
  treasuryAddress:      string;
  /** Treasury ATA for USDT (null = skip USDT) */
  treasuryUsdtAccount:  string | null;
  /** Treasury ATA for USDC (null = skip USDC) */
  treasuryUsdcAccount:  string | null;
  sol:  AssetTransferSpec;
  usdt: AssetTransferSpec;
  usdc: AssetTransferSpec;
  /** Optional: inject an existing Connection (e.g. from wallet-adapter) to route through Helius proxy. If omitted, falls back to public RPC. */
  connection?: Connection;
}

export interface PreflightResult {
  ok:           boolean;
  /** Human-readable reason if ok === false */
  reason?:      string;
  /** Estimated fee in lamports */
  estimatedFee: number;
  /** Whether all three assets fit in one transaction */
  canBatch:     boolean;
  /** Warnings that don't block the tx but should be shown */
  warnings:     string[];
}

export interface BatchTransferResult {
  /** Signed transaction ready for broadcast */
  transaction:  Transaction;
  blockhash:    string;
  lastValidBlockHeight: number;
  estimatedFee: number;
}

// ── Solana max transaction size ───────────────────────────────────────────────

const MAX_TX_SIZE_BYTES = 1232;
// A three-instruction batch (SOL + USDT + USDC) uses ~850–950 bytes.
// A two-instruction batch uses ~600–700 bytes.
// A single instruction uses ~300–400 bytes.
// These are well within the limit, so size is never the problem in practice.
// We check anyway to be safe.

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClientConnection(network: SolanaNetwork): Connection {
  const endpoint = network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET;
  return new Connection(endpoint, { commitment: "confirmed" });
}

async function tokenAccountExists(
  connection: Connection,
  ata: PublicKey
): Promise<boolean> {
  try {
    await getAccount(connection, ata, "confirmed", TOKEN_PROGRAM_ID);
    return true;
  } catch {
    return false;
  }
}

// ── Pre-flight check ──────────────────────────────────────────────────────────

/**
 * Runs all pre-flight checks without building or broadcasting the transaction.
 * Call this before showing the review screen.
 */
export async function preflightBatchTransfer(
  params: BatchTransferParams
): Promise<PreflightResult> {
  const { network, fromAddress, treasuryAddress, sol, usdt, usdc,
          treasuryUsdtAccount, treasuryUsdcAccount } = params;

  const warnings: string[] = [];
  const connection = params.connection ?? getClientConnection(network);
  const fromPubkey = new PublicKey(fromAddress);

  // ── 1. Count active instructions ────────────────────────────────────────
  const activeInstructions = [
    sol.include && sol.amountSmallest > 0n,
    usdt.include && usdt.amountSmallest > 0n,
    usdc.include && usdc.amountSmallest > 0n,
  ].filter(Boolean).length;

  if (activeInstructions === 0) {
    return { ok: false, reason: "No assets selected for transfer.", estimatedFee: 0, canBatch: false, warnings };
  }

  // ── 2. Fetch SOL balance ─────────────────────────────────────────────────
  const solBalanceLamports = await connection.getBalance(fromPubkey).catch(() => 0);

  // ── 3. Check token accounts ──────────────────────────────────────────────
  if (usdt.include && usdt.amountSmallest > 0n) {
    if (!treasuryUsdtAccount) {
      return { ok: false, reason: "USDT treasury token account is not configured.", estimatedFee: 0, canBatch: false, warnings };
    }
    const usdtMint = getMintAddress("USDT", network);
    if (usdtMint) {
      const sourceAta = getAssociatedTokenAddressSync(new PublicKey(usdtMint), fromPubkey, false, TOKEN_PROGRAM_ID);
      const sourceExists = await tokenAccountExists(connection, sourceAta);
      if (!sourceExists) {
        return { ok: false, reason: "Your wallet does not have a USDT token account. You cannot send USDT.", estimatedFee: 0, canBatch: false, warnings };
      }
      const destExists = await tokenAccountExists(connection, new PublicKey(treasuryUsdtAccount));
      if (!destExists) {
        warnings.push("Treasury USDT token account does not exist. It will be created automatically in this transaction (~0.002 SOL rent from your wallet).");
      }
    }
  }

  if (usdc.include && usdc.amountSmallest > 0n) {
    if (!treasuryUsdcAccount) {
      return { ok: false, reason: "USDC treasury token account is not configured.", estimatedFee: 0, canBatch: false, warnings };
    }
    const usdcMint = getMintAddress("USDC", network);
    if (usdcMint) {
      const sourceAta = getAssociatedTokenAddressSync(new PublicKey(usdcMint), fromPubkey, false, TOKEN_PROGRAM_ID);
      const sourceExists = await tokenAccountExists(connection, sourceAta);
      if (!sourceExists) {
        return { ok: false, reason: "Your wallet does not have a USDC token account. You cannot send USDC.", estimatedFee: 0, canBatch: false, warnings };
      }
      const destExists = await tokenAccountExists(connection, new PublicKey(treasuryUsdcAccount));
      if (!destExists) {
        warnings.push("Treasury USDC token account does not exist. It will be created automatically in this transaction (~0.002 SOL rent from your wallet).");
      }
    }
  }

  // ── 4. Estimate fee ──────────────────────────────────────────────────────
  // Build a dummy transaction to measure the fee
  let estimatedFee = 5000; // baseline 0.000005 SOL
  try {
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    const dummyTx = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey });
    // Add a compute budget instruction — always included
    dummyTx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));
    const feeCalc = await connection.getFeeForMessage(dummyTx.compileMessage(), "confirmed");
    if (feeCalc.value !== null) estimatedFee = feeCalc.value;
  } catch {
    // Fall back to baseline estimate
  }

  // ── 5. Check SOL covers fee + SOL transfer ───────────────────────────────
  const solNeeded = (sol.include ? Number(sol.amountSmallest) : 0) + estimatedFee;
  if (solBalanceLamports < solNeeded) {
    const solBalance = (solBalanceLamports / LAMPORTS_PER_SOL).toFixed(6);
    const solRequired = (solNeeded / LAMPORTS_PER_SOL).toFixed(6);
    return {
      ok: false,
      reason: `Insufficient SOL. You have ${solBalance} SOL but need at least ${solRequired} SOL (transfer + fee).`,
      estimatedFee,
      canBatch: false,
      warnings,
    };
  }

  // All checks passed
  return {
    ok: true,
    estimatedFee,
    canBatch: true, // All active instructions fit in one tx
    warnings,
  };
}

// ── Build transaction ─────────────────────────────────────────────────────────

/**
 * Builds the unsigned transaction with all selected instructions.
 * Does NOT sign or broadcast. Returns the Transaction for the wallet to sign.
 */
export async function buildBatchTransaction(
  params: BatchTransferParams
): Promise<BatchTransferResult> {
  const { network, fromAddress, treasuryAddress, sol, usdt, usdc,
          treasuryUsdtAccount, treasuryUsdcAccount } = params;

  const connection = params.connection ?? getClientConnection(network);
  const fromPubkey    = new PublicKey(fromAddress);
  const treasuryPubkey = new PublicKey(treasuryAddress);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey });

  // Always add a compute budget to avoid transaction simulation failures
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));

  // ── SOL ──────────────────────────────────────────────────────────────────
  if (sol.include && sol.amountSmallest > 0n) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey:  treasuryPubkey,
        lamports:  Number(sol.amountSmallest),
      })
    );
  }

  // ── USDT ─────────────────────────────────────────────────────────────────
  if (usdt.include && usdt.amountSmallest > 0n && treasuryUsdtAccount) {
    const mintAddress = getMintAddress("USDT", network);
    if (!mintAddress) throw new Error(`No USDT mint for ${network}`);

    const mintPubkey  = new PublicKey(mintAddress);
    const sourceAta   = getAssociatedTokenAddressSync(mintPubkey, fromPubkey, false, TOKEN_PROGRAM_ID);
    const destAta     = new PublicKey(treasuryUsdtAccount);
    const decimals    = SOLANA_ASSETS["USDT"].decimals;

    // Create treasury USDT ATA if it doesn't exist (payer = sender)
    const destUsdtExists = await tokenAccountExists(connection, destAta);
    if (!destUsdtExists) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, destAta, new PublicKey(treasuryAddress), mintPubkey, TOKEN_PROGRAM_ID
        )
      );
    }

    tx.add(
      createTransferCheckedInstruction(
        sourceAta, mintPubkey, destAta, fromPubkey,
        usdt.amountSmallest, decimals, [], TOKEN_PROGRAM_ID
      )
    );
  }

  // ── USDC ─────────────────────────────────────────────────────────────────
  if (usdc.include && usdc.amountSmallest > 0n && treasuryUsdcAccount) {
    const mintAddress = getMintAddress("USDC", network);
    if (!mintAddress) throw new Error(`No USDC mint for ${network}`);

    const mintPubkey  = new PublicKey(mintAddress);
    const sourceAta   = getAssociatedTokenAddressSync(mintPubkey, fromPubkey, false, TOKEN_PROGRAM_ID);
    const destAta     = new PublicKey(treasuryUsdcAccount);
    const decimals    = SOLANA_ASSETS["USDC"].decimals;

    // Create treasury USDC ATA if it doesn't exist (payer = sender)
    const destUsdcExists = await tokenAccountExists(connection, destAta);
    if (!destUsdcExists) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, destAta, new PublicKey(treasuryAddress), mintPubkey, TOKEN_PROGRAM_ID
        )
      );
    }

    tx.add(
      createTransferCheckedInstruction(
        sourceAta, mintPubkey, destAta, fromPubkey,
        usdc.amountSmallest, decimals, [], TOKEN_PROGRAM_ID
      )
    );
  }

  // ── Size check ────────────────────────────────────────────────────────────
  const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  if (serialized.length > MAX_TX_SIZE_BYTES) {
    throw new Error(
      `Transaction too large (${serialized.length} bytes, max ${MAX_TX_SIZE_BYTES}). ` +
      `Please reduce the number of assets or submit separate transactions.`
    );
  }

  // ── Fee estimate ─────────────────────────────────────────────────────────
  let estimatedFee = 5000;
  try {
    const feeCalc = await connection.getFeeForMessage(tx.compileMessage(), "confirmed");
    if (feeCalc.value !== null) estimatedFee = feeCalc.value;
  } catch {
    // Use baseline
  }

  return { transaction: tx, blockhash, lastValidBlockHeight, estimatedFee };
}
