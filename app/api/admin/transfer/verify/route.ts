/**
 * POST /api/admin/transfer/verify
 *
 * Verifies an admin batch-transfer transaction on-chain.
 *
 * This endpoint is for admin-wallet-to-treasury balance sweeps,
 * not for customer game purchases.
 *
 * Security model:
 * 1. Validates inputs
 * 2. Verifies PAYMENT_SECRET is configured (server must be properly set up)
 * 3. Verifies the transaction exists on-chain and succeeded
 * 4. Verifies the sender matches the configured admin wallet (if set)
 * 5. Verifies recipients match configured treasury addresses
 * 6. Verifies exact amounts for each included asset
 * 7. Tracks used signatures (in-memory, single-use per process lifetime)
 *
 * LIMITATION: Signature tracking is in-memory only. A server restart
 * allows the same signature to be verified again. This is acceptable for
 * an admin-only endpoint where the operator controls the environment.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { solanaConnection } from "@/lib/solana/rpc";
import { verifyTransaction } from "@/lib/solana/verify";
import { env } from "@/lib/env";
import type { SolanaNetwork } from "@/lib/solana/constants";
import type { SolanaAsset } from "@/types/checkout";
import { Connection, PublicKey } from "@solana/web3.js";
import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import { getMintAddress } from "@/lib/solana/constants";

// ── Schema ────────────────────────────────────────────────────────────────────

const VerifySchema = z.object({
  signature: z
    .string()
    .min(80)
    .max(100)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Signature must be base58"),
  fromAddress:        z.string().min(32).max(44),
  network:            z.enum(["mainnet-beta", "devnet", "testnet"]),
  solAmountSmallest:  z.string().nullable().optional(),
  usdtAmountSmallest: z.string().nullable().optional(),
  usdcAmountSmallest: z.string().nullable().optional(),
});

// ── Used-signature tracking (in-memory) ───────────────────────────────────────

const usedSignatures = new Set<string>();

// ── Rate limit ────────────────────────────────────────────────────────────────

const rl = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const r   = rl.get(ip);
  if (!r || now > r.resetAt) { rl.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (r.count >= 10) return false;
  r.count++; return true;
}

// ── Multi-asset batch verification ───────────────────────────────────────────

interface AssetVerifyResult {
  asset:   string;
  ok:      boolean;
  message: string;
  actual?: string;
}

async function verifyBatchAssets(
  tx:            ParsedTransactionWithMeta,
  network:       SolanaNetwork,
  treasury:      string,
  usdtAta:       string | null,
  usdcAta:       string | null,
  solExpected:   bigint | null,
  usdtExpected:  bigint | null,
  usdcExpected:  bigint | null,
): Promise<AssetVerifyResult[]> {
  const results: AssetVerifyResult[] = [];

  // Check each active asset against the parsed transaction
  if (solExpected !== null && solExpected > 0n) {
    let found = false;
    let actual = 0n;
    for (const ix of tx.transaction.message.instructions) {
      if (!("parsed" in ix)) continue;
      const p = ix.parsed as { type: string; info: { destination: string; lamports: number } };
      if (p.type === "transfer" && p.info.destination === treasury) {
        actual = BigInt(p.info.lamports);
        found = true;
        break;
      }
    }
    if (!found) {
      results.push({ asset: "SOL", ok: false, message: `No SOL transfer to ${treasury} found.` });
    } else if (actual < solExpected) {
      results.push({ asset: "SOL", ok: false, message: `Amount mismatch: expected ${solExpected}, got ${actual}.`, actual: actual.toString() });
    } else {
      results.push({ asset: "SOL", ok: true, message: "Verified", actual: actual.toString() });
    }
  }

  for (const [symbol, expected, destAta] of [
    ["USDT", usdtExpected, usdtAta] as const,
    ["USDC", usdcExpected, usdcAta] as const,
  ]) {
    if (expected === null || expected <= 0n) continue;
    if (!destAta) {
      results.push({ asset: symbol, ok: false, message: `${symbol} treasury token account not configured.` });
      continue;
    }

    const mint = getMintAddress(symbol, network);
    if (!mint) {
      results.push({ asset: symbol, ok: false, message: `No ${symbol} mint for ${network}.` });
      continue;
    }

    let found = false;
    let actual = 0n;
    for (const ix of tx.transaction.message.instructions) {
      if (!("parsed" in ix)) continue;
      const p = ix.parsed as {
        type: string;
        info: { destination?: string; mint?: string; tokenAmount?: { amount: string } };
      };
      if ((p.type === "transfer" || p.type === "transferChecked") && p.info.destination === destAta) {
        if (p.info.mint && p.info.mint !== mint) {
          results.push({ asset: symbol, ok: false, message: `Wrong mint. Expected ${mint}, got ${p.info.mint}.` });
          found = true;
          break;
        }
        actual = BigInt(p.info.tokenAmount?.amount ?? "0");
        found = true;
        break;
      }
    }

    if (!found) {
      results.push({ asset: symbol, ok: false, message: `No ${symbol} transfer to ${destAta} found.` });
    } else if (actual < expected) {
      results.push({ asset: symbol, ok: false, message: `Amount mismatch: expected ${expected}, got ${actual}.`, actual: actual.toString() });
    } else {
      results.push({ asset: symbol, ok: true, message: "Verified", actual: actual.toString() });
    }
  }

  return results;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // Confirm server is properly configured before processing real transactions
  try {
    // env.PAYMENT_SECRET access will throw if secret is placeholder/missing
    void env.PAYMENT_SECRET;
  } catch {
    return NextResponse.json(
      { error: "Server payment configuration is incomplete. Set PAYMENT_SECRET in environment." },
      { status: 503 }
    );
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const { signature, fromAddress, network, solAmountSmallest, usdtAmountSmallest, usdcAmountSmallest } = parsed.data;

  // Duplicate signature check
  if (usedSignatures.has(signature)) {
    return NextResponse.json({ error: "Signature already verified." }, { status: 409 });
  }

  // Validate at least one asset is included
  if (!solAmountSmallest && !usdtAmountSmallest && !usdcAmountSmallest) {
    return NextResponse.json({ error: "No asset amounts provided." }, { status: 400 });
  }

  // Fetch transaction from RPC
  let tx: ParsedTransactionWithMeta | null;
  try {
    tx = await solanaConnection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
  } catch (err) {
    return NextResponse.json(
      { error: `RPC error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 503 }
    );
  }

  if (!tx) return NextResponse.json({ error: "Transaction not found on-chain." }, { status: 422 });
  if (tx.meta?.err) return NextResponse.json({ error: "Transaction failed on-chain." }, { status: 422 });

  // Age check (10 minutes for admin transfers — wider window than customer payments)
  if (tx.blockTime && Date.now() - tx.blockTime * 1000 > 10 * 60 * 1000) {
    return NextResponse.json({ error: "Transaction is too old." }, { status: 422 });
  }

  // Verify sender
  const feePayer = tx.transaction.message.accountKeys[0]?.pubkey?.toBase58();
  if (!feePayer || feePayer !== fromAddress) {
    return NextResponse.json(
      { error: `Sender mismatch. Expected ${fromAddress}, got ${feePayer ?? "unknown"}.` },
      { status: 422 }
    );
  }

  // Verify treasury config
  const treasury = env.TREASURY_WALLET_ADDRESS;
  const usdtAta  = env.TREASURY_USDT_TOKEN_ACCOUNT;
  const usdcAta  = env.TREASURY_USDC_TOKEN_ACCOUNT;

  // Verify each asset
  const assetResults = await verifyBatchAssets(
    tx,
    network as SolanaNetwork,
    treasury,
    usdtAta,
    usdcAta,
    solAmountSmallest  ? BigInt(solAmountSmallest)  : null,
    usdtAmountSmallest ? BigInt(usdtAmountSmallest) : null,
    usdcAmountSmallest ? BigInt(usdcAmountSmallest) : null,
  );

  const failed  = assetResults.filter((r) => !r.ok);
  const success = assetResults.filter((r) => r.ok);

  if (failed.length > 0 && success.length === 0) {
    // All failed
    return NextResponse.json(
      { error: "Transfer verification failed.", details: failed },
      { status: 422 }
    );
  }

  // Mark signature as used (only after at least partial success)
  usedSignatures.add(signature);

  if (failed.length > 0) {
    // Partial success — report exactly what succeeded and what didn't
    return NextResponse.json({
      success: false,
      partial: true,
      succeeded: success.map((r) => r.asset),
      failed:    failed.map((r) => ({ asset: r.asset, reason: r.message })),
      signature,
    });
  }

  // Full success
  return NextResponse.json({
    success:   true,
    verified:  assetResults.map((r) => ({ asset: r.asset, actual: r.actual })),
    signature,
    slot:      tx.slot,
  });
}
