/**
 * POST /api/orders
 *
 * Issues a signed payment intent before the customer's wallet opens.
 * No database required. All payment details are locked in a server-signed
 * HMAC-SHA256 token that expires in 15 minutes.
 *
 * The token binds: items, amount (server-calculated), asset, network,
 * treasury address, and a one-time nonce. The browser receives an opaque
 * string it cannot modify without invalidating the signature.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { fetchAssetPrice, usdToSmallestUnit, formatSmallestUnit } from "@/lib/solana/prices";
import { issuePaymentIntent } from "@/lib/payment-intent";
import type { SolanaAsset } from "@/types/checkout";

// ── Request schema ────────────────────────────────────────────────────────────

const CreateOrderSchema = z.object({
  email:     z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  country:   z.string().length(2),
  asset:     z.enum(["SOL", "USDT", "USDC"]),
  totalUsd:  z.number().positive().max(10_000),
  savingsUsd: z.number().min(0).default(0),
  items: z.array(z.object({
    title:        z.string().min(1),
    platform:     z.string().min(1),
    region:       z.string().min(1),
    edition:      z.string().min(1),
    deliveryType: z.string().min(1),
    price:        z.number().positive(),
    originalPrice: z.number().positive().optional(),
    discountPct:   z.number().int().min(0).max(100).optional(),
    quantity:      z.number().int().positive().default(1),
  })).min(1),
});

// ── Rate limit (in-memory) ────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const r   = rateLimitMap.get(ip);
  if (!r || now > r.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (r.count >= 10) return false;
  r.count++; return true;
}

// ── Order number ──────────────────────────────────────────────────────────────

function generateOrderNumber(): string {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EG-${ts}-${rand}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const data   = parsed.data;
  const asset  = data.asset as SolanaAsset;
  const network = env.SOLANA_NETWORK;

  // ── Fetch live price (server-side — never trust client amounts) ────────────

  let priceData: Awaited<ReturnType<typeof fetchAssetPrice>>;
  try {
    priceData = await fetchAssetPrice(asset);
  } catch (err) {
    console.error("[orders] Price fetch failed:", err);
    return NextResponse.json(
      { error: "Unable to fetch current exchange rate. Please try again." },
      { status: 503 }
    );
  }

  const amountSmallest = usdToSmallestUnit(data.totalUsd, asset, priceData.usdPrice);
  const amountDisplay  = formatSmallestUnit(amountSmallest, asset);

  // ── Treasury addresses (from env — never from client) ─────────────────────

  const treasuryAddress = env.TREASURY_WALLET_ADDRESS;
  const treasuryTokenAccount =
    asset === "USDT" ? env.TREASURY_USDT_TOKEN_ACCOUNT
    : asset === "USDC" ? env.TREASURY_USDC_TOKEN_ACCOUNT
    : null;

  // ── Issue signed payment intent ───────────────────────────────────────────

  const orderNumber = generateOrderNumber();

  let intentToken: string;
  try {
    intentToken = issuePaymentIntent({
      email:                data.email,
      asset,
      amountSmallest:       amountSmallest.toString(),
      amountDisplay,
      usdRate:              priceData.usdPrice,
      totalUsd:             data.totalUsd,
      treasuryAddress,
      treasuryTokenAccount,
      network,
      orderNumber,
      items: data.items.map((item) => ({
        title:        item.title,
        platform:     item.platform,
        region:       item.region,
        edition:      item.edition,
        deliveryType: item.deliveryType,
        price:        item.price,
      })),
    });
  } catch (err) {
    console.error("[orders] Payment intent failed:", err);
    return NextResponse.json(
      { error: "Payment system configuration error. Please contact support." },
      { status: 500 }
    );
  }

  // Return the opaque token + display data to the client
  // The client cannot read or modify the token without breaking the HMAC
  return NextResponse.json({
    // orderId — used in the verify URL /api/orders/[orderId]/verify
    // Not a database ID; the intent token is the authoritative payload
    orderId: orderNumber,
    // Opaque signed token — the client posts this back to /verify
    intentToken,
    // Display values only — not trusted by the server during verification
    orderNumber,
    asset,
    amountDisplay,
    usdRate:              priceData.usdPrice,
    treasuryAddress,
    treasuryTokenAccount,
    // amountSmallest is returned for transaction construction
    amountSmallest: amountSmallest.toString(),
  });
}
