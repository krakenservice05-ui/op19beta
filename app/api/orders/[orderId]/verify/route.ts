/**
 * POST /api/orders/[orderId]/verify
 *
 * Verifies a Solana transaction against a server-signed payment intent.
 * No database required.
 *
 * Security model:
 * 1. Verify the HMAC signature on the payment intent — rejects any tampered token
 * 2. Verify the intent is not expired (15-minute window)
 * 3. Verify the nonce has not already been used (single-use)
 * 4. Fetch the transaction independently from Solana RPC
 * 5. Verify recipient, mint (for SPL), and exact amount
 * 6. Only after all checks pass: return success
 *
 * The [orderId] path segment is kept for URL compatibility with CheckoutView
 * but the actual order reference comes from the signed intent token.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { solanaConnection } from "@/lib/solana/rpc";
import { verifyTransactionExact } from "@/lib/solana/verify";
import { verifyPaymentIntent } from "@/lib/payment-intent";
import { env } from "@/lib/env";
import type { SolanaNetwork } from "@/lib/solana/constants";
import type { SolanaAsset } from "@/types/checkout";

// ── Schema ────────────────────────────────────────────────────────────────────

const VerifySchema = z.object({
  signature: z
    .string()
    .min(80)
    .max(100)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Signature must be base58"),
  intentToken: z.string().min(50),
});

// ── Rate limit ────────────────────────────────────────────────────────────────

const rl = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const r   = rl.get(ip);
  if (!r || now > r.resetAt) { rl.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (r.count >= 20) return false;
  r.count++; return true;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // orderId is kept for URL compatibility but not used — intent token is authoritative
  await params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const { signature, intentToken } = parsed.data;

  // ── 1. Verify the payment intent ─────────────────────────────────────────

  const intentResult = verifyPaymentIntent(intentToken);
  if (!intentResult.ok) {
    return NextResponse.json({ error: intentResult.reason }, { status: 422 });
  }

  const intent = intentResult.payload;

  // ── 2. Verify treasury addresses match current env config ─────────────────
  // Extra safety: reject if the intent's treasury doesn't match current config
  if (intent.treasuryAddress !== env.TREASURY_WALLET_ADDRESS) {
    return NextResponse.json(
      { error: "Treasury address mismatch. Please restart checkout." },
      { status: 422 }
    );
  }

  // ── 3. Verify on-chain transaction ────────────────────────────────────────

  const network = env.SOLANA_NETWORK as SolanaNetwork;

  const verifyResult = await verifyTransactionExact({
    connection:             solanaConnection,
    signature,
    asset:                  intent.asset as SolanaAsset,
    network,
    expectedAmountSmallest: BigInt(intent.amountSmallest),
    expectedRecipient:      intent.treasuryAddress,
    expectedTokenAccount:   intent.treasuryTokenAccount,
  });

  if (!verifyResult.ok) {
    return NextResponse.json(
      { error: verifyResult.message ?? "Transaction verification failed.", code: verifyResult.errorCode },
      { status: 422 }
    );
  }

  // ── 4. All checks passed ──────────────────────────────────────────────────
  // The intent nonce was consumed in verifyPaymentIntent — cannot be reused.

  return NextResponse.json({
    success:     true,
    orderNumber: intent.orderNumber,
    // Return enough for the success screen and future email receipt
    email:       intent.email,
    asset:       intent.asset,
    amountDisplay: intent.amountDisplay,
    totalUsd:    intent.totalUsd,
    items:       intent.items,
    signature,
    slot:        verifyResult.slot,
  });
}
