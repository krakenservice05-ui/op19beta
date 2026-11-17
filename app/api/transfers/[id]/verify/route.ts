/**
 * POST /api/transfers/[id]/verify
 *
 * Verifies a Solana transaction for the standalone /transfer page.
 * No database required — uses the same HMAC-signed intent architecture.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { solanaConnection } from "@/lib/solana/rpc";
import { verifyTransactionExact } from "@/lib/solana/verify";
import { verifyPaymentIntent } from "@/lib/payment-intent";
import { env } from "@/lib/env";
import type { SolanaNetwork } from "@/lib/solana/constants";
import type { SolanaAsset } from "@/types/checkout";

const VerifySchema = z.object({
  signature:   z.string().min(80).max(100).regex(/^[1-9A-HJ-NP-Za-km-z]+$/),
  intentToken: z.string().min(50),
});

const rl = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const r   = rl.get(ip);
  if (!r || now > r.resetAt) { rl.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (r.count >= 20) return false;
  r.count++; return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  await params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { signature, intentToken } = parsed.data;

  const intentResult = verifyPaymentIntent(intentToken);
  if (!intentResult.ok) {
    return NextResponse.json({ error: intentResult.reason }, { status: 422 });
  }

  const intent  = intentResult.payload;
  const network = env.SOLANA_NETWORK as SolanaNetwork;

  const result = await verifyTransactionExact({
    connection:             solanaConnection,
    signature,
    asset:                  intent.asset as SolanaAsset,
    network,
    expectedAmountSmallest: BigInt(intent.amountSmallest),
    expectedRecipient:      intent.treasuryAddress,
    expectedTokenAccount:   intent.treasuryTokenAccount,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Verification failed.", code: result.errorCode }, { status: 422 });
  }

  return NextResponse.json({ success: true });
}
