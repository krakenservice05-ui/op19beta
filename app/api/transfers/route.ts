/**
 * POST /api/transfers
 *
 * Issues a signed payment intent for the standalone /transfer page.
 * No database required — same HMAC-signed intent architecture as /api/orders.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { issuePaymentIntent } from "@/lib/payment-intent";

const CreateTransferSchema = z.object({
  fromAddress:   z.string().min(32).max(44),
  network:       z.enum(["mainnet-beta", "devnet", "testnet"]),
  solAmount:     z.string().optional(),
  usdtAmount:    z.string().optional(),
  usdcAmount:    z.string().optional(),
  email:         z.string().email().optional().default("transfer@elitegames.local"),
});

const rl = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const r   = rl.get(ip);
  if (!r || now > r.resetAt) { rl.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (r.count >= 10) return false;
  r.count++; return true;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const parsed = CreateTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { network, solAmount, usdtAmount, usdcAmount, email } = parsed.data;

  if (!solAmount && !usdtAmount && !usdcAmount) {
    return NextResponse.json({ error: "At least one asset must be included." }, { status: 400 });
  }

  // For multi-asset transfers, issue one intent per asset (batched tx verified separately)
  // Determine primary asset for the intent
  const asset = solAmount ? "SOL" : usdtAmount ? "USDT" : "USDC";
  const amount = solAmount ?? usdtAmount ?? usdcAmount ?? "0";

  try {
    const intentToken = issuePaymentIntent({
      email,
      asset,
      amountSmallest:       amount,
      amountDisplay:        amount,
      usdRate:              1,
      totalUsd:             0,
      treasuryAddress:      env.TREASURY_WALLET_ADDRESS,
      treasuryTokenAccount:
        asset === "USDT" ? env.TREASURY_USDT_TOKEN_ACCOUNT
        : asset === "USDC" ? env.TREASURY_USDC_TOKEN_ACCOUNT
        : null,
      network,
      orderNumber:          `TR-${Date.now().toString(36).toUpperCase()}`,
      items:                [],
    });

    return NextResponse.json({ transferId: intentToken });
  } catch (err) {
    console.error("[transfers] intent failed:", err);
    return NextResponse.json({ error: "Transfer system configuration error." }, { status: 500 });
  }
}
